"""
Ingest precomputed CPRet embeddings into the CP-Times database.

Run manually by developer, locally or on Colab — needs ~16-32GB RAM
depending on model, not run by the deployed app or by this agent.

Prerequisites (pip install):
    psycopg2-binary  numpy  huggingface_hub

Usage:
    DATABASE_URL="postgresql://..." python scripts/ingest_cpret_embeddings.py

Data source:
    HuggingFace dataset  coldchair16/CPRet-Embeddings
    Files: probs_2606.jsonl  +  probs_2606_embs.npy
    Model: CPRetriever-Prob-Qwen3-4B-2510  (NeurIPS 2025)
"""

import os
import sys
import json
import uuid
from datetime import datetime, timezone

import numpy as np
import psycopg2
from psycopg2.extras import execute_batch
from huggingface_hub import hf_hub_download

# ── constants ────────────────────────────────────────────────────────────────

REPO_ID = "coldchair16/CPRet-Embeddings"
JSONL_FILE = "probs_2606.jsonl"
NPY_FILE = "probs_2606_embs.npy"

BATCH_SIZE = 500
EMBEDDING_SOURCE = "CPRetriever-Prob-Qwen3-4B-2510"

ALLOWED_PLATFORMS = {"codeforces", "atcoder", "leetcode", "codechef"}

# Lowercase dataset value → Prisma Platform enum value
PLATFORM_ENUM = {
    "codeforces": "CODEFORCES",
    "atcoder":    "ATCODER",
    "leetcode":   "LEETCODE",
    "codechef":   "CODECHEF",
}

# ── helpers ──────────────────────────────────────────────────────────────────

def gen_cuid() -> str:
    """Generate a cuid-compatible ID (starts with 'c', 25 chars)."""
    return "c" + uuid.uuid4().hex[:24]


def construct_url(platform: str, external_id: str) -> str:
    """Build a canonical problem URL when the dataset row lacks one."""
    if platform == "CODEFORCES":
        # external_id like "1553A" → contest=1553, problem=A
        digits = ""
        for i, ch in enumerate(external_id):
            if ch.isdigit():
                digits += ch
            else:
                return f"https://codeforces.com/contest/{digits}/problem/{external_id[i:]}"
        return f"https://codeforces.com/problemset/problem/{external_id}"
    if platform == "LEETCODE":
        return f"https://leetcode.com/problems/{external_id}/"
    if platform == "CODECHEF":
        return f"https://www.codechef.com/problems/{external_id}"
    if platform == "ATCODER":
        # external_id like "abc300_a" → contest=abc300, task=abc300_a
        parts = external_id.rsplit("_", 1)
        contest = parts[0] if len(parts) == 2 else external_id
        return f"https://atcoder.jp/contests/{contest}/tasks/{external_id}"
    return ""


def safe_int(val) -> int | None:
    """Coerce a value to int or None."""
    if val is None:
        return None
    try:
        n = int(float(val))
        return n if n > 0 else None
    except (ValueError, TypeError):
        return None


def safe_tags(val) -> list[str]:
    """Ensure tags is a list of non-empty strings."""
    if not isinstance(val, list):
        return []
    return [str(t).strip() for t in val if t and str(t).strip()]


# ── field extraction ─────────────────────────────────────────────────────────
# The CPRet dataset may use varying field names.  This function normalises
# a single JSONL row into the columns our schema expects.

def extract_row(row: dict, embedding: np.ndarray, now: datetime) -> dict | None:
    """
    Map one JSONL row + its embedding vector to a dict of DB column values.
    Returns None if the row should be skipped.
    """
    raw_platform = str(row.get("platform", "")).strip().lower()
    if raw_platform not in ALLOWED_PLATFORMS:
        return None

    platform = PLATFORM_ENUM[raw_platform]

    # External ID — try common field names
    external_id = (
        row.get("id")
        or row.get("external_id")
        or row.get("problem_id")
        or row.get("externalId")
        or ""
    )
    external_id = str(external_id).strip()
    if not external_id:
        return None

    name = str(
        row.get("title")
        or row.get("name")
        or row.get("problem_name")
        or f"Problem {external_id}"
    ).strip()

    url = str(row.get("url", "") or "").strip()
    if not url:
        url = construct_url(platform, external_id)

    rating = safe_int(row.get("rating") or row.get("difficulty"))
    tags = safe_tags(row.get("tags", []))
    solved_count = safe_int(row.get("solvedCount") or row.get("solved_count"))

    return {
        "id": gen_cuid(),
        "external_id": external_id,
        "platform": platform,
        "name": name,
        "url": url,
        "rating": rating,
        "solved_count": solved_count,
        "tags": tags,
        "embedding": embedding.tolist(),
        "embedding_source": EMBEDDING_SOURCE,
        "indexed_at": now,
    }


# ── upsert SQL ───────────────────────────────────────────────────────────────

UPSERT_SQL = """
INSERT INTO "Problem"
    (id, "externalId", platform, name, url, rating, "solvedCount",
     tags, embedding, embedding_source, indexed_at)
VALUES
    (%(id)s, %(external_id)s, %(platform)s::"Platform",
     %(name)s, %(url)s, %(rating)s, %(solved_count)s,
     %(tags)s::text[], %(embedding)s::double precision[],
     %(embedding_source)s, %(indexed_at)s)
ON CONFLICT (platform, "externalId") DO UPDATE SET
    embedding        = EXCLUDED.embedding,
    embedding_source = EXCLUDED.embedding_source,
    indexed_at       = EXCLUDED.indexed_at,
    name             = COALESCE(NULLIF(EXCLUDED.name, ''), "Problem".name),
    url              = COALESCE(NULLIF(EXCLUDED.url,  ''), "Problem".url),
    rating           = COALESCE(EXCLUDED.rating, "Problem".rating),
    "solvedCount"    = COALESCE(EXCLUDED."solvedCount", "Problem"."solvedCount"),
    tags             = CASE
                         WHEN array_length(EXCLUDED.tags, 1) > 0
                         THEN EXCLUDED.tags
                         ELSE "Problem".tags
                       END
"""

# ── main ─────────────────────────────────────────────────────────────────────

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: Set DATABASE_URL environment variable.", file=sys.stderr)
        sys.exit(1)

    # 1. Download dataset files from Hugging Face
    print(f"Downloading {JSONL_FILE} from {REPO_ID} ...")
    jsonl_path = hf_hub_download(
        repo_id=REPO_ID, filename=JSONL_FILE, repo_type="dataset"
    )
    print(f"Downloading {NPY_FILE} from {REPO_ID} ...")
    npy_path = hf_hub_download(
        repo_id=REPO_ID, filename=NPY_FILE, repo_type="dataset"
    )

    # 2. Load into memory
    print("Loading JSONL ...")
    with open(jsonl_path, encoding="utf-8") as f:
        problems = [json.loads(line) for line in f if line.strip()]

    print("Loading embeddings .npy ...")
    embeddings = np.load(npy_path)

    assert len(problems) == embeddings.shape[0], (
        f"Row count mismatch: {len(problems)} JSONL rows vs "
        f"{embeddings.shape[0]} embedding rows"
    )
    print(
        f"Loaded {len(problems)} problems, "
        f"embedding dim = {embeddings.shape[1]}"
    )

    # Debug: show first row's keys so field mapping can be verified
    if problems:
        print(f"Sample JSONL keys: {sorted(problems[0].keys())}")

    # 3. Extract + filter
    now = datetime.now(timezone.utc)
    rows: list[dict] = []
    skipped = 0
    for i, prob in enumerate(problems):
        row = extract_row(prob, embeddings[i], now)
        if row is None:
            skipped += 1
        else:
            rows.append(row)

    print(
        f"Filtered: {len(rows)} rows to ingest, "
        f"{skipped} skipped (unsupported platform or missing ID)"
    )

    if not rows:
        print("Nothing to ingest. Exiting.")
        return

    # 4. Connect to Postgres
    print(f"Connecting to database ...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # 5. Batch upsert
    total_batches = (len(rows) + BATCH_SIZE - 1) // BATCH_SIZE
    for batch_idx in range(total_batches):
        start = batch_idx * BATCH_SIZE
        batch = rows[start : start + BATCH_SIZE]

        execute_batch(cur, UPSERT_SQL, batch, page_size=BATCH_SIZE)
        conn.commit()

        print(
            f"  Batch {batch_idx + 1}/{total_batches}: "
            f"upserted {len(batch)} rows"
        )

    cur.close()
    conn.close()

    # 6. Summary
    counts: dict[str, int] = {}
    for r in rows:
        counts[r["platform"]] = counts.get(r["platform"], 0) + 1

    print("\n=== Ingestion complete ===")
    for platform in sorted(counts):
        print(f"  {platform}: {counts[platform]} problems")
    print(f"  Total: {sum(counts.values())} problems")


if __name__ == "__main__":
    main()
