'use client';

import React from 'react';
import { Problem } from '@/types';
import { ExternalLink, CheckCircle2, CircleDashed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLATFORM_MAP } from '@/lib/constants';

interface ProblemGridProps {
  problems: Problem[];
  solvedIds: Set<string>;
}

export function ProblemGrid({ problems, solvedIds }: ProblemGridProps) {
  if (problems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#111111] rounded-xl border border-white/[0.08] border-dashed">
        <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4 border border-white/[0.06]">
          <span className="text-2xl opacity-50">🗡️</span>
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-1.5 tracking-tight">No Problems Found</h3>
        <p className="text-zinc-400 max-w-md text-sm">
          No problems match your current criteria. Try adjusting your platform or tier to summon new challenges.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full relative">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {problems.map((problem, index) => {
            const isSolved = solvedIds.has(problem.externalId);
            const pInfo = PLATFORM_MAP[problem.platform];
            
            return (
              <motion.a
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30, delay: index * 0.03 } }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98 }}
                key={problem.id}
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col p-5 rounded-xl bg-[#111111] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/[0.15] transition-colors overflow-hidden"
              >
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                <div className="relative z-10 flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-1.5 h-1.5 rounded-full shrink-0" 
                        style={{ backgroundColor: pInfo?.color }}
                      />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        {pInfo?.name || problem.platform}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                      {problem.externalId}
                    </span>
                  </div>
                  
                  {isSolved ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Solved
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider bg-white/[0.04] px-2 py-1 rounded border border-white/[0.06]">
                      <CircleDashed className="w-3 h-3" />
                      Unsolved
                    </div>
                  )}
                </div>

                <h4 className="relative z-10 text-sm font-semibold text-zinc-100 tracking-tight mb-2 group-hover:text-white transition-colors line-clamp-1 pr-6">
                  {problem.name}
                  <ExternalLink className="w-3.5 h-3.5 absolute right-0 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500" />
                </h4>

                <div className="relative z-10 flex flex-wrap items-center gap-1.5 mt-auto pt-3 border-t border-white/[0.06]">
                  {problem.rating && (
                    <span className="font-mono text-xs text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">
                      Rating: {problem.rating}
                    </span>
                  )}
                  {problem.difficulty && !problem.rating && (
                    <span className={`font-mono text-xs border px-2 py-0.5 rounded ${
                      problem.difficulty.toUpperCase() === 'HARD' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      problem.difficulty.toUpperCase() === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {problem.difficulty.toUpperCase()}
                    </span>
                  )}

                  {problem.tags && problem.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="font-mono text-[10px] text-zinc-600 bg-white/[0.04] border border-white/[0.06] uppercase tracking-wider px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {problem.tags && problem.tags.length > 3 && (
                    <span className="text-[10px] text-zinc-600 font-mono">
                      +{problem.tags.length - 3}
                    </span>
                  )}
                </div>
              </motion.a>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
