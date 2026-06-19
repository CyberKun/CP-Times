import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

webpush.setVapidDetails(
  'mailto:support@cptimes.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    const testMode = url.searchParams.get('test') === 'true';

    // Basic security check to ensure it's called by cron or authorized user
    if (
      !testMode &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      secret !== process.env.CRON_SECRET &&
      process.env.NODE_ENV === 'production'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const twentyFiveMinsFromNow = new Date(now.getTime() + 25 * 60 * 1000);
    const thirtyFiveMinsFromNow = new Date(now.getTime() + 35 * 60 * 1000);

    const upcomingContests = await prisma.contest.findMany({
      where: testMode ? undefined : {
        startTime: {
          gte: twentyFiveMinsFromNow,
          lte: thirtyFiveMinsFromNow,
        },
      },
      take: testMode ? 1 : undefined
    });

    if (upcomingContests.length === 0) {
      if (testMode) {
        upcomingContests.push({
          id: 'test',
          name: 'Test Force Notification',
          platform: 'CODEFORCES',
          url: 'https://cp-cave.vercel.app',
          startTime: new Date(),
          endTime: new Date(),
          externalId: 'test',
          phase: 'BEFORE'
        } as any);
      } else {
        return NextResponse.json({ message: 'No contests starting in ~30 mins' });
      }
    }

    const subscriptions = await prisma.pushSubscription.findMany();

    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'No active subscriptions' });
    }

    let notificationsSent = 0;
    let notificationsFailed = 0;

    for (const contest of upcomingContests) {
      const payload = JSON.stringify({
        title: 'Upcoming Contest Alert!',
        body: `${contest.name} on ${contest.platform} is starting in 30 minutes!`,
        url: contest.url,
        icon: '/logo.png', // Assuming we have a logo.png in public
      });

      for (const sub of subscriptions) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          notificationsSent++;
        } catch (error: any) {
          console.error('Error sending notification, removing sub:', error);
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          notificationsFailed++;
        }
      }
    }

    return NextResponse.json({
      message: 'Notifications processed',
      sent: notificationsSent,
      failed: notificationsFailed,
    });
  } catch (error) {
    console.error('Error in notify cron:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
