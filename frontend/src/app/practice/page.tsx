'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProblemFilterPanel } from '@/components/practice/ProblemFilterPanel';
import { ProblemGrid } from '@/components/practice/ProblemGrid';
import { useProblems } from '@/hooks/useProblems';
import { Shuffle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PracticePage() {
  const { problems, loading, filters, updateFilters, shuffleProblems, solvedProblemIds } = useProblems();

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 pb-12">
        <div className="flex flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100 mb-1 tracking-tight">
              Practice
            </h1>
            <p className="text-zinc-400 text-sm">
              Hone your skills across platforms
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={shuffleProblems}
            disabled={loading}
            className="group w-10 h-10 shrink-0 bg-white/[0.04] border border-white/[0.08] rounded-lg flex items-center justify-center hover:border-white/[0.15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Shuffle Problems"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
            ) : (
              <Shuffle className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
            )}
          </motion.button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-[260px] shrink-0 lg:sticky lg:top-[80px] z-20">
            <ProblemFilterPanel filters={filters} updateFilters={updateFilters} />
          </div>
          
          <div className="flex-1 w-full min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-[#111111] border border-white/[0.08] animate-pulse" />
                ))}
              </div>
            ) : (
              <ProblemGrid
                problems={problems}
                solvedIds={solvedProblemIds}
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
