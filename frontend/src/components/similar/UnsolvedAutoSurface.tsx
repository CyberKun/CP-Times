'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { similarApi } from '@/lib/api';
import { useContests } from '@/hooks/useContests';
import { cn } from '@/lib/utils';
import type { UnsolvedProblem, Contest } from '@/types';

interface UnsolvedAutoSurfaceProps {
  onFindSimilar: (problemId: string) => void;
}

export function UnsolvedAutoSurface({ onFindSimilar }: UnsolvedAutoSurfaceProps) {
  const { past, attemptedContestIds, isLoading: isContestsLoading } = useContests();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [unsolvedProblems, setUnsolvedProblems] = useState<UnsolvedProblem[]>([]);
  const [isLoadingUnsolved, setIsLoadingUnsolved] = useState(false);

  const attemptedPastContests = past.filter((c) =>
    attemptedContestIds.has(c.externalId) && c.platform === 'CODEFORCES'
  );

  useEffect(() => {
    if (selectedContestId) {
      let active = true;
      setIsLoadingUnsolved(true);
      similarApi
        .getUnsolved(selectedContestId)
        .then((res) => {
          if (active) setUnsolvedProblems(res.data.problems || []);
        })
        .catch(() => {
          if (active) setUnsolvedProblems([]);
        })
        .finally(() => {
          if (active) setIsLoadingUnsolved(false);
        });
      return () => {
        active = false;
      };
    }
  }, [selectedContestId]);

  if (isContestsLoading || attemptedPastContests.length === 0) {
    return null; // hide if loading or no attempted contests
  }

  return (
    <div className="mb-6 border border-[#30363D] bg-[#161B22]">
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1C2128] transition-colors duration-75 text-left"
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-[#8B949E]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#8B949E]" />
          )}
          <span className="text-[13px] font-medium text-[#E6EDF3] uppercase tracking-wider">
            Auto-surface Unsolved Codeforces Problems
          </span>
        </div>
        <span className="text-xs text-[#8B949E]">
          {attemptedPastContests.length} recent contest(s)
        </span>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t border-[#30363D] p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#8B949E]">Select Contest:</span>
            <select
              value={selectedContestId || ''}
              onChange={(e) => setSelectedContestId(e.target.value)}
              className="flex-1 max-w-sm h-8 px-2 bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] text-sm font-sans focus:outline-none focus:border-[#8B949E] transition-colors duration-75"
            >
              <option value="" disabled>
                -- Choose a recent contest --
              </option>
              {attemptedPastContests.slice(0, 10).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {selectedContestId && (
            <div className="mt-2 border border-[#30363D] bg-[#0D1117]">
              {isLoadingUnsolved ? (
                <div className="p-4 flex items-center justify-center gap-3 text-[#8B949E] text-sm">
                  <span className="block w-4 h-4 border-2 border-[#30363D] border-t-[#8B949E] rounded-full animate-spin" />
                  Loading unsolved problems...
                </div>
              ) : unsolvedProblems.length === 0 ? (
                <div className="p-4 text-[#8B949E] text-sm text-center">
                  No unsolved problems found for this contest.
                </div>
              ) : (
                <div className="flex flex-col">
                  {unsolvedProblems.map((prob) => (
                    <div
                      key={prob.id}
                      className="group flex items-center justify-between px-3 py-2 border-b border-[#30363D] last:border-b-0 hover:bg-[#1C2128] transition-colors duration-75"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="font-mono text-xs text-[#8B949E] w-[48px] shrink-0">
                          {prob.externalId}
                        </span>
                        <span className="text-[13px] text-[#E6EDF3] truncate pr-4">
                          {prob.name}
                        </span>
                        <span className="font-mono text-[10px] text-[#8B949E] px-1.5 py-0.5 border border-[#30363D]">
                          {prob.verdict}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => onFindSimilar(prob.id)}
                        disabled={!prob.has_embedding}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 text-xs border transition-colors duration-75 shrink-0",
                          prob.has_embedding
                            ? "border-[#30363D] text-[#E6EDF3] hover:bg-[#30363D]"
                            : "border-transparent text-[#8B949E] opacity-50 cursor-not-allowed"
                        )}
                        title={!prob.has_embedding ? 'No embedding available yet' : ''}
                      >
                        <Search className="w-3 h-3" />
                        Find Similar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
