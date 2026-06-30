import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Platform } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const platformsParam = url.searchParams.get('platforms');
    const upcomingOnly = url.searchParams.get('upcoming') === 'true';

    let platforms: Platform[] = [];
    if (platformsParam) {
      platforms = platformsParam.split(',')
        .map(p => p.trim().toUpperCase())
        .filter(p => Object.values(Platform).includes(p as Platform)) as Platform[];
    } else {
      platforms = Object.values(Platform); // default all
    }

    const now = new Date();

    const whereClause: any = {
      platform: { in: platforms }
    };

    if (upcomingOnly) {
      whereClause.startTime = { gt: now };
    }

    const contests = await prisma.contest.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
    });

    // Check for stale data and auto-sync in background
    const expectedSecret = process.env.CRON_SECRET || 'cp-aggregator-cron-secret';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get('host') ? (req.headers.get('host')?.includes('localhost') ? 'http://' : 'https://') + req.headers.get('host') : 'http://localhost:3000');
    
    // Find the most recently updated contest (if there are any)
    const mostRecentUpdate = contests.reduce((max, c) => c.updatedAt > max ? c.updatedAt : max, new Date(0));
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    if (contests.length > 0 && mostRecentUpdate < twoHoursAgo) {
      console.log('Data is stale (older than 2 hours), triggering background sync...');
      fetch(`${baseUrl}/api/cron/sync?contestsOnly=true&secret=${expectedSecret}`)
        .catch(err => console.error('Background sync trigger failed:', err));
    }

    // Dynamically compute the correct phase based on current time
    // This ensures phases are always accurate regardless of when the last sync ran
    const contestsWithLivePhase = contests.map(c => {
      const start = c.startTime.getTime();
      const end = c.endTime.getTime();
      const nowMs = now.getTime();

      let computedPhase = c.phase; // default to DB value (handles CF-specific phases like SYSTEM_TEST)
      if (nowMs < start) {
        computedPhase = 'BEFORE';
      } else if (nowMs >= start && nowMs <= end) {
        computedPhase = 'CODING';
      } else if (nowMs > end) {
        computedPhase = 'FINISHED';
      }

      return { ...c, phase: computedPhase };
    });

    return NextResponse.json(contestsWithLivePhase);
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
