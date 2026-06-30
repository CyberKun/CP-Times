import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Platform, ContestPhase } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Retry wrapper: retries a function up to `maxRetries` times with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 2,
  delayMs = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < maxRetries) {
        console.warn(`[${label}] Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`, err);
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
      } else {
        console.error(`[${label}] All ${maxRetries + 1} attempts failed.`, err);
        throw err;
      }
    }
  }
  throw new Error(`[${label}] Unreachable`);
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    
    // Protect the cron route with a simple secret (you can define CRON_SECRET in .env)
    const expectedSecret = process.env.CRON_SECRET || 'cp-aggregator-cron-secret';
    if (
      authHeader !== `Bearer ${expectedSecret}` &&
      secret !== expectedSecret &&
      process.env.NODE_ENV === 'production'
    ) {
      return NextResponse.json({ message: 'Unauthorized cron request' }, { status: 401 });
    }

    const contestsOnly = url.searchParams.get('contestsOnly') === 'true';

    console.log('Starting sync...');
    const results: Record<string, string> = {};

    let tasks: Array<[string, () => Promise<void>]> = [
      ['Codeforces Contests', syncCodeforcesContests],
      ['LeetCode Contests', syncLeetCodeContests],
      ['AtCoder Contests', syncAtCoderContests],
      ['CodeChef Contests', syncCodeChefContests],
    ];

    if (!contestsOnly) {
      tasks.push(
        ['Codeforces Problems', syncCodeforcesProblems],
        ['LeetCode Problems', syncLeetCodeProblems],
        ['AtCoder Problems', syncAtCoderProblems],
        ['CodeChef Problems', syncCodeChefProblems]
      );
    }

    for (const [name, fn] of tasks) {
      try {
        await withRetry(fn, name);
        results[name] = 'OK';
      } catch (err: any) {
        results[name] = `FAILED: ${err.message || String(err)}`;
      }
    }

    console.log('Sync completed.', results);
    return NextResponse.json({ message: 'Sync completed', results });
  } catch (error) {
    console.error('Cron sync error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// ---- CODEFORCES ----
// Shared headers & rate-limiter for all Codeforces API calls.
const CF_HEADERS = {
  'User-Agent': 'CP-Aggregator/1.0 (contest-sync; +https://github.com/cp-aggregator)',
};
const CF_RATE_LIMIT_MS = 2000; // Codeforces hard-blocks IPs that burst faster than ~1 req/2s
let cfLastRequestTime = 0;

async function cfFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - cfLastRequestTime;
  if (elapsed < CF_RATE_LIMIT_MS) {
    await new Promise(r => setTimeout(r, CF_RATE_LIMIT_MS - elapsed));
  }
  cfLastRequestTime = Date.now();
  const res = await fetch(url, { headers: CF_HEADERS });
  if (!res.ok) {
    throw new Error(`Codeforces API ${url} returned ${res.status}`);
  }
  return res;
}

// ---- CODEFORCES CONTESTS ----
async function syncCodeforcesContests() {
  try {
    const res = await cfFetch('https://codeforces.com/api/contest.list');
    const data = await res.json();
    if (data.status !== 'OK') throw new Error(`Codeforces API returned status ${data.status}`);

    const contests = data.result;
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    for (const c of contests) {
      // Codeforces returns startTimeSeconds
      const startTime = new Date(c.startTimeSeconds * 1000);
      const endTime = new Date((c.startTimeSeconds + c.durationSeconds) * 1000);
      
      // Skip old finished contests to save time and prevent timeout.
      // Only sync upcoming, live, and contests that finished within the last 3 days.
      if (c.phase === 'FINISHED' && endTime < threeDaysAgo) {
        continue;
      }
      
      // Map Codeforces phase string to our Prisma enum.
      // The API returns 'BEFORE' for upcoming contests — this is the critical case
      // that must be preserved so the frontend can show the "Upcoming" tab correctly.
      let phase: ContestPhase;
      switch (c.phase) {
        case 'BEFORE':              phase = ContestPhase.BEFORE; break;
        case 'CODING':              phase = ContestPhase.CODING; break;
        case 'PENDING_SYSTEM_TEST': phase = ContestPhase.PENDING_SYSTEM_TEST; break;
        case 'SYSTEM_TEST':         phase = ContestPhase.SYSTEM_TEST; break;
        case 'FINISHED':            phase = ContestPhase.FINISHED; break;
        default:
          // Unknown phases (e.g. future CF API additions) → treat as BEFORE
          // so they surface in the upcoming list rather than silently vanishing.
          console.warn(`[CF] Unknown contest phase "${c.phase}" for contest ${c.id}, defaulting to BEFORE`);
          phase = ContestPhase.BEFORE;
      }

      await prisma.contest.upsert({
        where: { platform_externalId: { platform: Platform.CODEFORCES, externalId: c.id.toString() } },
        update: { name: c.name, startTime, endTime, phase },
        create: {
          platform: Platform.CODEFORCES,
          externalId: c.id.toString(),
          name: c.name,
          url: `https://codeforces.com/contest/${c.id}`,
          startTime,
          endTime,
          phase,
        }
      });
    }
  } catch (err) {
    console.error('Error syncing Codeforces contests', err);
    throw err; // re-throw so withRetry can catch and retry
  }
}

// ---- LEETCODE CONTESTS ----
async function syncLeetCodeContests() {
  try {
    const q = { query: '{ allContests { title titleSlug startTime duration } }' };
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q)
    });
    const data = await res.json();
    
    if (!data?.data?.allContests) throw new Error('LeetCode API returned invalid data format');
    const contests = data.data.allContests;

    // We only care about contests around now (past few years + future)
    // No need to insert 700+ contests if we only show upcoming/recent
    for (const c of contests) {
      const startTime = new Date(c.startTime * 1000);
      const endTime = new Date((c.startTime + c.duration) * 1000);
      const now = new Date();
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      
      if (endTime < threeDaysAgo) continue;
      
      let phase: ContestPhase = ContestPhase.BEFORE;
      if (now >= startTime && now <= endTime) phase = ContestPhase.CODING;
      else if (now > endTime) phase = ContestPhase.FINISHED;

      const externalId = c.titleSlug;

      await prisma.contest.upsert({
        where: { platform_externalId: { platform: Platform.LEETCODE, externalId } },
        update: { name: c.title, startTime, endTime, phase },
        create: {
          platform: Platform.LEETCODE,
          externalId,
          name: c.title,
          url: `https://leetcode.com/contest/${c.titleSlug}`,
          startTime,
          endTime,
          phase,
        }
      });
    }
  } catch (err) {
    console.error('Error syncing LeetCode contests', err);
    throw err;
  }
}

// ---- CODEFORCES PROBLEMS ----
async function syncCodeforcesProblems() {
  try {
    const res = await cfFetch('https://codeforces.com/api/problemset.problems');
    const data = await res.json();
    if (data.status !== 'OK') throw new Error(`Codeforces API returned status ${data.status}`);

    const problems = data.result.problems;
    const statistics = data.result.problemStatistics;

    // We might not want to insert 9000 problems sequentially as it's slow.
    // Let's do it in chunks, only processing the newest 300 problems to prevent timeout.
    const chunkSize = 100;
    const maxProblems = Math.min(problems.length, 300);
    for (let i = 0; i < maxProblems; i += chunkSize) {
      const chunk = problems.slice(i, i + chunkSize);
      
      for (const p of chunk) {
        const idx = chunk.indexOf(p);
        const stat = statistics[i + idx];
        const externalId = `${p.contestId}${p.index}`;
        
        await prisma.problem.upsert({
          where: { platform_externalId: { platform: Platform.CODEFORCES, externalId } },
          update: { 
            rating: p.rating || null,
            solvedCount: stat ? stat.solvedCount : 0,
            tags: p.tags || []
          },
          create: {
            platform: Platform.CODEFORCES,
            externalId,
            name: p.name,
            url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
            rating: p.rating || null,
            difficulty: p.rating ? p.rating.toString() : null,
            solvedCount: stat ? stat.solvedCount : 0,
            tags: p.tags || []
          }
        });
      }
    }
  } catch (err) {
    console.error('Error syncing Codeforces problems', err);
    throw err;
  }
}

// ---- LEETCODE PROBLEMS ----
async function syncLeetCodeProblems() {
  try {
    // 1. Fetch total ACs from old API
    const res = await fetch('https://leetcode.com/api/problems/algorithms/');
    const data = await res.json();
    if (!data.stat_status_pairs) throw new Error('LeetCode API returned invalid data format for problems');
    
    const acsMap = new Map<string, number>();
    for (const p of data.stat_status_pairs) {
      acsMap.set(p.stat.question__title_slug, p.stat.total_acs || 0);
    }

    // 2. Fetch tags and metadata from GraphQL with pagination
    let allQuestions: any[] = [];
    let skip = 0;
    const limit = 100;
    
    // Only fetch the newest 300 questions to prevent timeout
    while (skip < 300) {
      const query = `
        query problemsetQuestionList {
          problemsetQuestionList: questionList(categorySlug: "", limit: ${limit}, skip: ${skip}, filters: {}) {
            questions: data {
              title
              titleSlug
              difficulty
              topicTags { slug }
            }
          }
        }
      `;

      const gqlRes = await fetch('https://leetcode.com/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const gqlData = await gqlRes.json();
      const questions = gqlData?.data?.problemsetQuestionList?.questions;
      
      if (!questions || questions.length === 0) break;
      allQuestions.push(...questions);
      skip += limit;
    }
    
    if (allQuestions.length === 0) throw new Error('No LeetCode questions fetched from GraphQL');

    const chunkSize = 200;
    for (let i = 0; i < allQuestions.length; i += chunkSize) {
      const chunk = allQuestions.slice(i, i + chunkSize);
      
      for (const p of chunk) {
        const externalId = p.titleSlug;
        const difficulty = p.difficulty; // "Easy", "Medium", "Hard"
        const tags = p.topicTags ? p.topicTags.map((t: any) => t.slug) : [];
        const solvedCount = acsMap.get(externalId) || 0;
        
        await prisma.problem.upsert({
          where: { platform_externalId: { platform: Platform.LEETCODE, externalId } },
          update: { 
            difficulty,
            solvedCount,
            tags
          },
          create: {
            platform: Platform.LEETCODE,
            externalId,
            name: p.title,
            url: `https://leetcode.com/problems/${externalId}`,
            difficulty,
            solvedCount,
            tags
          }
        });
      }
    }
  } catch (err) {
    console.error('Error syncing LeetCode problems', err);
    throw err;
  }
}

// ---- ATCODER CONTESTS ----
// The kenkoooo.com aggregator (resources/contests.json) is frequently stale or
// returns 502/503.  We bypass it entirely and scrape AtCoder's official contest
// listing page which has a well-structured <div id="contest-table-upcoming">
// table plus a "Recent Contests" table.
async function syncAtCoderContests() {
  try {
    const res = await fetch('https://atcoder.jp/contests/', {
      headers: {
        'User-Agent': 'CP-Aggregator/1.0 (contest-sync)',
        'Accept-Language': 'en',  // force English titles
      },
    });
    if (!res.ok) throw new Error(`AtCoder returned ${res.status}`);
    const html = await res.text();

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // --- parse helper --------------------------------------------------
    // Each contest row in AtCoder's tables looks like:
    //   <tr> <td …><time …>2026-06-21 21:00:00+0900</time></td>
    //        <td …><a href="/contests/abc123">AtCoder Beginner Contest 123</a></td>
    //        <td …>01:40</td> … </tr>
    function parseContestRows(tableHtml: string): Array<{
      id: string; name: string; startTime: Date; endTime: Date;
    }> {
      const results: Array<{ id: string; name: string; startTime: Date; endTime: Date }> = [];
      // Match each <tr>…</tr>
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch: RegExpExecArray | null;
      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const row = rowMatch[1];

        // 1. Start time from <time> tag
        const timeMatch = row.match(/<time[^>]*>([^<]+)<\/time>/);
        if (!timeMatch) continue;
        const startTime = new Date(timeMatch[1].trim());
        if (isNaN(startTime.getTime())) continue;

        // 2. Contest link  →  /contests/<id>
        const linkMatch = row.match(/<a\s+href="\/contests\/([^"]+)"[^>]*>([^<]+)<\/a>/);
        if (!linkMatch) continue;
        const id = linkMatch[1];
        const name = linkMatch[2].trim();

        // 3. Duration cell  →  HH:MM
        const durationMatch = row.match(/<td[^>]*>(\d{2,}):(\d{2})<\/td>/);
        if (!durationMatch) continue;
        const durationSec = parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60;
        const endTime = new Date(startTime.getTime() + durationSec * 1000);

        results.push({ id, name, startTime, endTime });
      }
      return results;
    }

    // --- extract the two relevant tables --------------------------------
    // Upcoming: <div id="contest-table-upcoming"> … </div>
    // Recent:   <div id="contest-table-recent">   … </div>   (not always present)
    const sections = [
      { tag: 'contest-table-upcoming', phase: ContestPhase.BEFORE as ContestPhase },
      { tag: 'contest-table-action',   phase: ContestPhase.CODING as ContestPhase },
      { tag: 'contest-table-recent',   phase: ContestPhase.FINISHED as ContestPhase },
    ];

    let synced = 0;
    for (const section of sections) {
      const divRegex = new RegExp(
        `<div[^>]*id="${section.tag}"[^>]*>([\\s\\S]*?)(?=<div[^>]*id="contest-table-|$)`,
        'i'
      );
      const divMatch = html.match(divRegex);
      if (!divMatch) continue;

      const contests = parseContestRows(divMatch[1]);

      for (const c of contests) {
        // Skip very old finished contests
        if (c.endTime < threeDaysAgo) continue;
        // Filter out practice/long-running contests (>30 days)
        if (c.endTime.getTime() - c.startTime.getTime() > 30 * 24 * 60 * 60 * 1000) continue;

        // Re-compute phase from real timestamps (more reliable than table position)
        let phase: ContestPhase = section.phase;
        if (now < c.startTime) phase = ContestPhase.BEFORE;
        else if (now >= c.startTime && now <= c.endTime) phase = ContestPhase.CODING;
        else if (now > c.endTime) phase = ContestPhase.FINISHED;

        await prisma.contest.upsert({
          where: { platform_externalId: { platform: Platform.ATCODER, externalId: c.id } },
          update: { name: c.name, startTime: c.startTime, endTime: c.endTime, phase },
          create: {
            platform: Platform.ATCODER,
            externalId: c.id,
            name: c.name,
            url: `https://atcoder.jp/contests/${c.id}`,
            startTime: c.startTime,
            endTime: c.endTime,
            phase,
          }
        });
        synced++;
      }
    }

    console.log(`Synced ${synced} AtCoder contests (direct HTML scrape)`);
  } catch (err) {
    console.error('Error syncing AtCoder contests', err);
    throw err; // re-throw so withRetry can catch and retry
  }
}

// ---- CODECHEF CONTESTS ----
async function syncCodeChefContests() {
  try {
    const res = await fetch('https://www.codechef.com/api/list/contests/all');
    const data = await res.json();
    if (data.status !== 'success') throw new Error(`CodeChef API returned status ${data.status}`);

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const allContests = [
      ...(data.present_contests || []),
      ...(data.future_contests || []),
      ...(data.past_contests || [])
    ].filter(c => {
      const endTime = new Date(c.contest_end_date_iso);
      return endTime >= threeDaysAgo;
    });

    const chunkSize = 50;
    for (let i = 0; i < allContests.length; i += chunkSize) {
      const chunk = allContests.slice(i, i + chunkSize);
      
      for (const c of chunk) {
        const startTime = new Date(c.contest_start_date_iso);
        const endTime = new Date(c.contest_end_date_iso);
        
        let phase: ContestPhase = ContestPhase.BEFORE;
        if (now >= startTime && now <= endTime) phase = ContestPhase.CODING;
        else if (now > endTime) phase = ContestPhase.FINISHED;

        await prisma.contest.upsert({
          where: { platform_externalId: { platform: Platform.CODECHEF, externalId: c.contest_code } },
          update: { name: c.contest_name, startTime, endTime, phase },
          create: {
            platform: Platform.CODECHEF,
            externalId: c.contest_code,
            name: c.contest_name,
            url: `https://www.codechef.com/${c.contest_code}`,
            startTime,
            endTime,
            phase,
          }
        });
      }
    }
    console.log(`Synced ${allContests.length} CodeChef contests`);
  } catch (err) {
    console.error('Error syncing CodeChef contests', err);
    throw err;
  }
}

// ---- ATCODER PROBLEMS ----
async function syncAtCoderProblems() {
  try {
    const [probsRes, modelsRes] = await Promise.all([
      fetch('https://kenkoooo.com/atcoder/resources/problems.json'),
      fetch('https://kenkoooo.com/atcoder/resources/problem-models.json')
    ]);
    const problems = await probsRes.json();
    const models = await modelsRes.json();
    
    if (!Array.isArray(problems)) throw new Error('AtCoder Kenkoooo API returned non-array problems data');

    // Kenkoooo problems are usually in contest chronological order, newer at the end.
    // Let's just process the last 300 to prevent timeouts.
    const recentProblems = problems.slice(-300);

    const chunkSize = 100;
    for (let i = 0; i < recentProblems.length; i += chunkSize) {
      const chunk = recentProblems.slice(i, i + chunkSize);
      
      for (const p of chunk) {
        const externalId = p.id;
        const model = models[externalId];
        const difficulty = model && model.difficulty !== undefined ? Math.round(model.difficulty) : null;
        // Negative difficulty means gray/easy, AtCoder sets min rating for display at 0 usually
        const rating = difficulty !== null ? Math.max(0, difficulty) : null;
        
        await prisma.problem.upsert({
          where: { platform_externalId: { platform: Platform.ATCODER, externalId } },
          update: { 
            rating: rating,
          },
          create: {
            platform: Platform.ATCODER,
            externalId,
            name: p.title,
            url: `https://atcoder.jp/contests/${p.contest_id}/tasks/${p.id}`,
            rating: rating,
            difficulty: rating !== null ? rating.toString() : null,
            tags: []
          }
        });
      }
    }
  } catch (err) {
    console.error('Error syncing AtCoder problems', err);
    throw err;
  }
}

// ---- CODECHEF PROBLEMS ----
async function syncCodeChefProblems() {
  try {
    // Limit to max 300 latest problems to prevent timeouts
    for (let page = 1; page <= 1; page++) {
      const res = await fetch(`https://www.codechef.com/api/list/problems?page=${page}&limit=300`);
      const data = await res.json();
      
      if (data.status !== 'success' || !data.data || data.data.length === 0) throw new Error(`CodeChef API returned status ${data.status} for problems`);

      const problems = data.data;
      const chunkSize = 200;
      
      for (let i = 0; i < problems.length; i += chunkSize) {
        const chunk = problems.slice(i, i + chunkSize);
        
        for (const p of chunk) {
          const externalId = p.code;
          const rating = parseInt(p.difficulty_rating);
          const validRating = (isNaN(rating) || rating === -1) ? null : rating;
          
          await prisma.problem.upsert({
            where: { platform_externalId: { platform: Platform.CODECHEF, externalId } },
            update: { 
              rating: validRating,
              solvedCount: parseInt(p.successful_submissions) || 0
            },
            create: {
              platform: Platform.CODECHEF,
              externalId,
              name: p.name,
              url: `https://www.codechef.com/problems/${p.code}`,
              rating: validRating,
              difficulty: validRating !== null ? validRating.toString() : null,
              solvedCount: parseInt(p.successful_submissions) || 0,
              tags: []
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('Error syncing CodeChef problems', err);
    throw err;
  }
}
