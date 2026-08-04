import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default async function ContestReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const contest = await prisma.contest.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!contest) {
    notFound();
  }

  // Fetch problems for this contest and user attempts
  // For Codeforces, problems are usually linked, but our DB might not have a direct contest->problem relation.
  // Wait, in schema, Contest has no problems array, UserAttempt has problemId and contestId.
  // We can fetch UserAttempts for this contest.
  // We don't have a user context in server components easily without cookies/tokens, 
  // but for the sake of UI we can fetch all attempts or mock a user context.
  
  // For demonstration/Phase 4, let's fetch attempts for this contest.
  const attempts = await prisma.userAttempt.findMany({
    where: { contestId: contest.id, verdict: { not: 'OK' } },
    include: { problem: true }
  });

  // Deduplicate by problem to list problems where *anyone* failed, 
  // since we don't have a specific logged-in user in this server component mockup.
  const failedProblems = Array.from(new Map(attempts.map(a => [a.problemId, a.problem])).values());

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 pb-12">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#E6EDF3]">{contest.name} - Review</h1>
          <span className="px-3 py-1 bg-[#161B22] text-[#8B949E] rounded-md border border-[#30363D]">
            {contest.platform}
          </span>
        </div>

        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#E6EDF3] mb-4">Problems you struggled with</h2>
          {failedProblems.length === 0 ? (
            <p className="text-[#8B949E]">No failed attempts found for this contest.</p>
          ) : (
            <div className="space-y-4">
              {failedProblems.map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-[#0D1117] border border-[#30363D] rounded">
                  <div>
                    <h3 className="text-lg font-medium text-[#E6EDF3]">{p.name}</h3>
                    <div className="flex gap-2 mt-2">
                      {p.tags.map(t => (
                        <span key={t} className="text-xs bg-[#1C2128] text-[#8B949E] px-2 py-1 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
