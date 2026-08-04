import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Platform } from '@prisma/client';

// Rate limiting map (in-memory for simple rate limiting)
const rateLimitMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const lastRequest = rateLimitMap.get(ip) || 0;
    
    // 5 seconds debounce/rate limit per IP
    if (now - lastRequest < 5000) {
      return NextResponse.json({ message: 'Too many requests. Please wait a few seconds.' }, { status: 429 });
    }
    rateLimitMap.set(ip, now);

    const body = await req.json();
    const { url, lookup_only: lookupOnly } = body;
    if (!url) {
      return NextResponse.json({ message: 'URL is required' }, { status: 400 });
    }

    let platform: Platform | null = null;
    let externalId: string | null = null;

    // 1. Parse URL
    // Codeforces: /contest/(\d+)/problem/(\w+) or /problemset/problem/(\d+)/(\w+)
    const cfMatch = url.match(/(?:contest|problemset\/problem)\/(\d+)(?:\/problem)?\/([A-Za-z0-9]+)/);
    if (cfMatch) {
      platform = 'CODEFORCES';
      externalId = `${cfMatch[1]}${cfMatch[2]}`; // e.g. "1553A"
    }

    // LeetCode: /problems/([a-z0-9-]+)/
    const lcMatch = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/);
    if (lcMatch && !platform) {
      platform = 'LEETCODE';
      externalId = lcMatch[1];
    }

    // CodeChef: /problems/([A-Z0-9_]+)
    const ccMatch = url.match(/codechef\.com\/(?:[a-zA-Z0-9-]+\/)?problems\/([A-Z0-9_]+)/);
    if (ccMatch && !platform) {
      platform = 'CODECHEF';
      externalId = ccMatch[1];
    }

    // AtCoder: /contests/([\w-]+)/tasks/([\w-]+)
    const acMatch = url.match(/atcoder\.jp\/contests\/[\w-]+\/tasks\/([\w-]+)/);
    if (acMatch && !platform) {
      platform = 'ATCODER';
      externalId = acMatch[1];
    }

    if (!platform || !externalId) {
      return NextResponse.json({ 
        message: 'Invalid URL. Please provide a valid Codeforces, LeetCode, CodeChef, or AtCoder problem URL.' 
      }, { status: 400 });
    }

    // 2. Check if exists
    const existing = await prisma.problem.findUnique({
      where: { platform_externalId: { platform, externalId } },
      select: {
        id: true,
        name: true,
        platform: true,
        externalId: true,
        rating: true,
        tags: true,
        indexed_at: true,
      },
    });

    if (existing) {
      return NextResponse.json({ 
        id: existing.id, 
        isNew: false,
        name: existing.name,
        platform: existing.platform,
        externalId: existing.externalId,
        rating: existing.rating,
        tags: existing.tags,
        has_embedding: existing.indexed_at !== null,
      });
    }

    if (lookupOnly) {
      return NextResponse.json({
        not_indexed: true,
        platform,
        externalId,
        message: 'This problem is not yet indexed. The corpus is refreshed periodically.',
      });
    }

    // 3. Not found, trigger on-demand fetch
    // Since we don't have real scrapers, we'll mock the fetch and indexing.
    // In a real scenario, we would call the platform API, parse statement, tags, rating.
    
    // MOCK FETCH:
    const mockProblem = await prisma.problem.create({
      data: {
        platform,
        externalId,
        name: `Newly Indexed Problem ${externalId}`,
        url: url,
        rating: 1500, // mock
        tags: ['implementation'], // mock
        statement_text: `This is a mocked statement for ${externalId}. n <= 1000`, // mock statement
        // For Phase 1/2 per-problem indexing steps (mocked):
        constraint_fingerprint: 'quadratic_cubic', // based on 1000
        idf_tag_weights: { 'implementation': 1.0 },
      }
    });

    // Mock an editorial segment
    await prisma.editorialSegment.create({
      data: {
        problemId: mockProblem.id,
        segment_text: mockProblem.statement_text || '',
        source: 'single_fallback',
        tfidf_vector: { 'mocked': 0.5, 'statement': 0.5 } // mock tf-idf
      }
    });

    return NextResponse.json({ 
      id: mockProblem.id, 
      isNew: true,
      name: mockProblem.name,
      platform: mockProblem.platform,
      externalId: mockProblem.externalId
    });

  } catch (error) {
    console.error('URL parse/index error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
