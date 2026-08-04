import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/problems/unsolved?contestId=<id>
 *
 * Returns problems from a given contest where the authenticated user's
 * verdict is not "OK" (i.e. unsolved / wrong-answer).  Each result
 * includes a `has_embedding` flag so the UI can show / hide the
 * "Find similar" button.
 *
 * Requires Bearer auth.  Codeforces-only auto-surface flow (Phase 4a).
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get('contestId');

    if (!contestId) {
      return NextResponse.json({ error: 'Missing required query parameter: contestId' }, { status: 400 });
    }

    // Fetch attempts where verdict != OK for this user + contest
    const attempts = await prisma.userAttempt.findMany({
      where: {
        userId: user.sub,
        contestId,
        verdict: { not: 'OK' },
      },
      include: {
        problem: {
          select: {
            id: true,
            externalId: true,
            platform: true,
            name: true,
            url: true,
            rating: true,
            tags: true,
            solvedCount: true,
            indexed_at: true,  // non-null ⇒ has embedding
          },
        },
      },
    });

    const problems = attempts.map((a) => ({
      id: a.problem.id,
      externalId: a.problem.externalId,
      platform: a.problem.platform,
      name: a.problem.name,
      url: a.problem.url,
      rating: a.problem.rating,
      tags: a.problem.tags,
      solvedCount: a.problem.solvedCount,
      verdict: a.verdict,
      has_embedding: a.problem.indexed_at !== null,
    }));

    return NextResponse.json({ problems });
  } catch (error) {
    console.error('Unsolved problems error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
