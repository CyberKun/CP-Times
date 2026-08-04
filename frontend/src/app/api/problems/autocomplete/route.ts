import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const indexedOnly = searchParams.get('indexed_only') === 'true';
    
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const where: any = {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { externalId: { startsWith: q, mode: 'insensitive' } }
      ]
    };

    // When used by the Similar page, only suggest problems with embeddings
    if (indexedOnly) {
      where.indexed_at = { not: null };
    }

    const problems = await prisma.problem.findMany({
      where,
      select: {
        id: true,
        name: true,
        externalId: true,
        platform: true,
        rating: true,
        indexed_at: true,
      },
      take: 10,
    });

    // Map indexed_at to has_embedding for the frontend
    const results = problems.map(({ indexed_at, ...rest }) => ({
      ...rest,
      has_embedding: indexed_at !== null,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

