import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ── types ───────────────────────────────────────────────────────────────────

interface CorpusEntry {
  id: string;
  externalId: string;
  platform: string;
  name: string;
  url: string;
  rating: number | null;
  tags: string[];
  solvedCount: number | null;
  embedding: number[];
  norm: number;
}

interface ScoredProblem {
  id: string;
  externalId: string;
  platform: string;
  name: string;
  url: string;
  rating: number | null;
  tags: string[];
  solvedCount: number | null;
  similarity: number;
}

// ── constants ───────────────────────────────────────────────────────────────

const K = 10;                     // top-K per bucket
const MIN_BUCKET_SIZE = 3;
const MAX_RELAXATION_STEPS = 3;   // ±100 per step → max ±300
const RELAXATION_STEP = 100;
const PLATFORM_SOFT_CAP = 0.6;
const CACHE_TTL_MS = 5 * 60_000;  // 5 min in-memory cache

const BUCKET_DEFS = [
  { key: 'implementation', label: 'Implementation practice (800–1100)', min: 800,  max: 1100 },
  { key: 'understanding', label: 'Deeper understanding (1200–1600)',   min: 1200, max: 1600 },
  { key: 'variations',    label: 'Variations (1600+)',                 min: 1600, max: Infinity },
] as const;

// ── in-memory corpus cache ──────────────────────────────────────────────────

let corpusCache: { entries: CorpusEntry[]; loadedAt: number } | null = null;

async function loadCorpus(): Promise<CorpusEntry[]> {
  const now = Date.now();
  if (corpusCache && now - corpusCache.loadedAt < CACHE_TTL_MS) {
    return corpusCache.entries;
  }

  const rows = await prisma.problem.findMany({
    where: { indexed_at: { not: null } },
    select: {
      id: true,
      externalId: true,
      platform: true,
      name: true,
      url: true,
      rating: true,
      tags: true,
      solvedCount: true,
      embedding: true,
    },
  });

  const entries: CorpusEntry[] = [];
  for (const r of rows) {
    if (!r.embedding || r.embedding.length === 0) continue;
    let norm = 0;
    for (let i = 0; i < r.embedding.length; i++) norm += r.embedding[i] * r.embedding[i];
    norm = Math.sqrt(norm);
    if (norm === 0) continue;
    entries.push({ ...r, norm });
  }

  corpusCache = { entries, loadedAt: now };
  return entries;
}

// ── math helpers ────────────────────────────────────────────────────────────

function cosineSim(a: number[], normA: number, b: number[], normB: number): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot / (normA * normB);
}

// ── min-heap (tracks K items with *lowest* sim at root) ─────────────────────

class MinHeap {
  private h: ScoredProblem[] = [];

  constructor(private cap: number) {}

  get size() { return this.h.length; }
  get minSim() { return this.h.length > 0 ? this.h[0].similarity : -Infinity; }

  /** Returns items sorted descending by similarity. */
  drain(): ScoredProblem[] {
    return this.h.sort((a, b) => b.similarity - a.similarity);
  }

  push(item: ScoredProblem) {
    if (this.h.length < this.cap) {
      this.h.push(item);
      this.bubbleUp(this.h.length - 1);
    } else if (item.similarity > this.h[0].similarity) {
      this.h[0] = item;
      this.sinkDown(0);
    }
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[i].similarity < this.h[p].similarity) {
        [this.h[i], this.h[p]] = [this.h[p], this.h[i]];
        i = p;
      } else break;
    }
  }

  private sinkDown(i: number) {
    const n = this.h.length;
    while (true) {
      let s = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.h[l].similarity < this.h[s].similarity) s = l;
      if (r < n && this.h[r].similarity < this.h[s].similarity) s = r;
      if (s !== i) {
        [this.h[i], this.h[s]] = [this.h[s], this.h[i]];
        i = s;
      } else break;
    }
  }
}

// ── dedup & soft-cap ────────────────────────────────────────────────────────

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Dedup by normalized title.  For duplicates, keep the version with the
 * highest solvedCount (best proxy for the "canonical" copy).
 */
function dedup(items: ScoredProblem[]): ScoredProblem[] {
  const map = new Map<string, ScoredProblem>();
  for (const p of items) {
    const key = normalizeTitle(p.name);
    const prev = map.get(key);
    if (!prev || (p.solvedCount ?? 0) > (prev.solvedCount ?? 0)) {
      map.set(key, p);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.similarity - a.similarity);
}

/**
 * If any single platform exceeds 60 % of the bucket *and* alternatives exist,
 * trim that platform's excess entries (lowest-similarity first).
 */
function applySoftCap(items: ScoredProblem[]): ScoredProblem[] {
  if (items.length <= 1) return items;

  const maxPerPlatform = Math.max(1, Math.ceil(items.length * PLATFORM_SOFT_CAP));
  const counts: Record<string, number> = {};
  const result: ScoredProblem[] = [];

  // items are already sorted desc by similarity
  for (const p of items) {
    const c = counts[p.platform] ?? 0;
    if (c < maxPerPlatform) {
      result.push(p);
      counts[p.platform] = c + 1;
    }
  }
  return result;
}

// ── route handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get('id');

    if (!problemId) {
      return NextResponse.json({ error: 'Missing required query parameter: id' }, { status: 400 });
    }

    // 1. Fetch seed
    const seed = await prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        externalId: true,
        platform: true,
        name: true,
        url: true,
        rating: true,
        tags: true,
        solvedCount: true,
        embedding: true,
      },
    });

    if (!seed) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const seedOut = {
      id: seed.id,
      externalId: seed.externalId,
      platform: seed.platform,
      name: seed.name,
      url: seed.url,
      rating: seed.rating,
      tags: seed.tags,
      solvedCount: seed.solvedCount,
    };

    if (!seed.embedding || seed.embedding.length === 0) {
      return NextResponse.json({
        seed_problem: seedOut,
        not_indexed: true,
        buckets: { implementation: null, understanding: null, variations: null },
      });
    }

    // 2. Load corpus & compute seed norm
    const corpus = await loadCorpus();

    let seedNorm = 0;
    for (let i = 0; i < seed.embedding.length; i++) seedNorm += seed.embedding[i] * seed.embedding[i];
    seedNorm = Math.sqrt(seedNorm);

    if (seedNorm === 0) {
      return NextResponse.json({
        seed_problem: seedOut,
        not_indexed: true,
        buckets: { implementation: null, understanding: null, variations: null },
      });
    }

    // 3. Score every corpus entry (excluding seed)
    const scored: ScoredProblem[] = [];
    for (const entry of corpus) {
      if (entry.id === seed.id) continue;
      if (entry.embedding.length !== seed.embedding.length) continue;

      const sim = cosineSim(seed.embedding, seedNorm, entry.embedding, entry.norm);
      scored.push({
        id: entry.id,
        externalId: entry.externalId,
        platform: entry.platform,
        name: entry.name,
        url: entry.url,
        rating: entry.rating,
        tags: entry.tags,
        solvedCount: entry.solvedCount,
        similarity: sim,
      });
    }

    // 4. Fill each bucket with rating-band relaxation
    const buckets: Record<string, {
      label: string;
      ratingRange: [number, number];
      problems: Omit<ScoredProblem, 'similarity'>[];
      limited_data: boolean;
    }> = {};

    for (const def of BUCKET_DEFS) {
      let results: ScoredProblem[] = [];
      let limitedData = false;

      for (let step = 0; step <= MAX_RELAXATION_STEPS; step++) {
        const lo = def.min - step * RELAXATION_STEP;
        const hi = def.max === Infinity ? Infinity : def.max + step * RELAXATION_STEP;

        const heap = new MinHeap(K);
        for (const p of scored) {
          if (p.rating === null) continue;
          if (p.rating >= lo && (hi === Infinity || p.rating <= hi)) {
            heap.push(p);
          }
        }

        results = heap.drain();
        if (results.length >= MIN_BUCKET_SIZE) break;          // satisfied
        if (step === MAX_RELAXATION_STEPS && results.length < MIN_BUCKET_SIZE) {
          limitedData = true;                                   // give up
        }
      }

      // 5. Dedup  →  6. Soft-cap
      results = applySoftCap(dedup(results));

      buckets[def.key] = {
        label: def.label,
        ratingRange: [def.min, def.max === Infinity ? -1 : def.max],
        problems: results.map(({ similarity: _, ...rest }) => rest),
        limited_data: limitedData,
      };
    }

    return NextResponse.json({
      seed_problem: seedOut,
      not_indexed: false,
      buckets,
    });

  } catch (error) {
    console.error('Similar problems error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
