'use client';

import React, { useState, useMemo } from 'react';
import { useContests } from '@/hooks/useContests';
import { PlatformFilter } from './PlatformFilter';
import { TimelineContestRow } from './TimelineContestRow';
import { PLATFORMS } from '@/lib/constants';
import { Contest } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { checkClashes } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Telescope } from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────── */

function getLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateLabel(dateKey: string): { label: string; isToday: boolean } {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return { label: 'Today', isToday: true };
  if (diffDays === 1) return { label: 'Tomorrow', isToday: false };
  if (diffDays === -1) return { label: 'Yesterday', isToday: false };

  return {
    label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    isToday: false,
  };
}

function groupContestsByDate(
  contests: Contest[],
  descending = false,
): [string, Contest[]][] {
  const groups: Record<string, Contest[]> = {};

  for (const c of contests) {
    const key = getLocalDateKey(c.startTime);
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }

  // sort each group internally by start time ascending
  for (const key in groups) {
    groups[key].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  }

  const entries = Object.entries(groups);
  entries.sort(([a], [b]) => {
    const diff = new Date(a).getTime() - new Date(b).getTime();
    return descending ? -diff : diff;
  });

  return entries;
}

/* ── component ───────────────────────────────────────────── */

export function ContestCalendar() {
  const {
    live,
    upcoming,
    past,
    selectedPlatforms,
    togglePlatform,
    toggleAllPlatforms,
    isLoading,
    error,
    attemptedContestIds,
  } = useContests();

  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'past'>('upcoming');
  const [attemptedFilter, setAttemptedFilter] = useState<'all' | 'attempted' | 'not_attempted'>('not_attempted');

  const [pastPage, setPastPage] = useState(0);
  const pastPageSize = 20;

  const filteredPast = useMemo(() => {
    return past.filter((c) => {
      if (attemptedFilter === 'all') return true;
      const isAttempted = attemptedContestIds?.has(String(c.externalId)) ?? false;
      return attemptedFilter === 'attempted' ? isAttempted : !isAttempted;
    });
  }, [past, attemptedFilter, attemptedContestIds]);

  const totalPastPages = Math.ceil(filteredPast.length / pastPageSize);
  const currentPastContests = filteredPast.slice(
    pastPage * pastPageSize,
    (pastPage + 1) * pastPageSize,
  );

  const clashesMap = useMemo(() => checkClashes(upcoming), [upcoming]);

  // Per-platform breakdown for sidebar
  const platformCounts = useMemo(() => {
    const source =
      activeTab === 'upcoming' ? upcoming : activeTab === 'live' ? live : filteredPast;
    return PLATFORMS.filter((p) => selectedPlatforms.has(p.key)).map((p) => ({
      key: p.key,
      name: p.name,
      color: p.color,
      count: source.filter((c) => c.platform === p.key).length,
    }));
  }, [activeTab, upcoming, live, filteredPast, selectedPlatforms]);

  const totalCount =
    activeTab === 'past'
      ? filteredPast.length
      : activeTab === 'live'
        ? live.length
        : upcoming.length;

  /* ── error state ─────────────── */
  if (error) {
    return (
      <div className="p-6 rounded-xl border border-red-500/10 bg-red-500/5 text-red-400">
        <h3 className="text-base font-semibold mb-1">Failed to load contests</h3>
        <p className="text-sm text-red-400/70">{error}</p>
      </div>
    );
  }

  /* ── tabs config ─────────────── */
  const tabs = [
    { key: 'live' as const, label: 'Live' },
    { key: 'upcoming' as const, label: 'Upcoming' },
    { key: 'past' as const, label: 'Past' },
  ];

  /* ── timeline renderer ───────── */
  const renderTimeline = (
    contests: Contest[],
    showClashes = false,
    descending = false,
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-8">
          {[1, 2, 3].map((g) => (
            <div key={g}>
              <div className="h-3 w-24 bg-white/[0.04] rounded animate-pulse mb-4" />
              {[1, 2].map((r) => (
                <div key={r} className="pl-6 pb-6 relative">
                  <div className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full bg-white/[0.06] animate-pulse" />
                  {!((g === 3 && r === 2)) && (
                    <div className="absolute left-[3px] top-[14px] bottom-0 w-px bg-white/[0.04]" />
                  )}
                  <div className="h-4 w-3/4 bg-white/[0.04] rounded animate-pulse mb-2" />
                  <div className="h-3 w-1/2 bg-white/[0.03] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (contests.length === 0) return null;

    const groups = groupContestsByDate(contests, descending);
    let globalIndex = 0;

    return (
      <div className="flex flex-col">
        {groups.map(([dateKey, dayContests]) => {
          const { label, isToday } = getDateLabel(dateKey);
          return (
            <div key={dateKey} className="mb-8 last:mb-0">
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <h3
                  className={`text-xs font-semibold tracking-wide ${
                    isToday ? 'text-indigo-400' : 'text-zinc-500'
                  }`}
                >
                  {label}
                </h3>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="font-mono text-[10px] text-zinc-600">
                  {dayContests.length}
                </span>
              </div>

              {/* Timeline entries */}
              <div className="ml-1">
                {dayContests.map((contest, i) => {
                  const row = (
                    <TimelineContestRow
                      key={`${contest.platform}-${contest.externalId}`}
                      contest={contest}
                      index={globalIndex}
                      clashingWith={
                        showClashes ? clashesMap[contest.externalId] : undefined
                      }
                      isLast={i === dayContests.length - 1}
                    />
                  );
                  globalIndex++;
                  return row;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ── JSX ─────────────────────── */
  return (
    <div className="w-full">
      {/* Platform Filter */}
      <div className="pt-2">
        <PlatformFilter
          selectedPlatforms={selectedPlatforms}
          onToggle={togglePlatform}
          onToggleAll={toggleAllPlatforms}
        />
      </div>

      {/* Tabs */}
      <div className="sticky top-[56px] z-40 bg-[#080808]/80 backdrop-blur-xl mt-4 pt-3 pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-px">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === 'past') setPastPage(0);
                }}
                className={`relative pb-3 px-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {activeTab === 'past' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="flex items-center gap-0.5 bg-[#111111] rounded-lg p-1 border border-white/[0.08] mb-2"
              >
                {[
                  { key: 'all' as const, label: 'All' },
                  { key: 'not_attempted' as const, label: 'Unattempted' },
                  { key: 'attempted' as const, label: 'Attempted' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setAttemptedFilter(f.key);
                      setPastPage(0);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      attemptedFilter === f.key
                        ? 'bg-white/[0.06] text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main content: timeline + sidebar */}
      <div className="flex gap-8 mt-6">
        {/* ── Timeline ── */}
        <div className="flex-1 min-w-0">
          {/* Live tab */}
          {activeTab === 'live' && (
            <>
              {live.length > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-zinc-300">Live Now</span>
                  <span className="font-mono text-xs text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                    {live.length}
                  </span>
                </div>
              )}
              {renderTimeline(live)}
            </>
          )}

          {/* Upcoming tab */}
          {activeTab === 'upcoming' && renderTimeline(upcoming, true)}

          {/* Past tab */}
          {activeTab === 'past' && (
            <>
              {renderTimeline(currentPastContests, false, true)}

              {/* Pagination */}
              {totalPastPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center gap-1 bg-[#111111] p-1.5 rounded-xl border border-white/[0.08]">
                    <button
                      onClick={() => setPastPage((p) => Math.max(0, p - 1))}
                      disabled={pastPage === 0}
                      className="p-1.5 rounded-lg hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-zinc-500" />
                    </button>

                    <div className="flex gap-0.5 px-1">
                      {Array.from({ length: Math.min(5, totalPastPages) }).map(
                        (_, i) => {
                          let pageNum: number;
                          if (pastPage < 2) pageNum = i;
                          else if (pastPage > totalPastPages - 3)
                            pageNum = totalPastPages - 5 + i;
                          else pageNum = pastPage - 2 + i;

                          if (pageNum < 0 || pageNum >= totalPastPages) return null;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPastPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                pastPage === pageNum
                                  ? 'bg-zinc-100 text-zinc-900'
                                  : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                              }`}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        },
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setPastPage((p) => Math.min(totalPastPages - 1, p + 1))
                      }
                      disabled={pastPage === totalPastPages - 1}
                      className="p-1.5 rounded-lg hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading &&
            ((activeTab === 'live' && live.length === 0) ||
              (activeTab === 'upcoming' && upcoming.length === 0) ||
              (activeTab === 'past' && filteredPast.length === 0)) && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex items-center justify-center mb-5">
                  <Telescope className="w-7 h-7 text-zinc-600" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2 tracking-tight">
                  No contests found
                </h3>
                <p className="text-zinc-500 max-w-sm mx-auto text-sm">
                  No{' '}
                  {activeTab === 'past'
                    ? attemptedFilter.replace('_', ' ')
                    : activeTab}{' '}
                  contests match your current filters.
                </p>
              </div>
            )}
        </div>

        {/* ── Sidebar: platform breakdown ── */}
        <div className="hidden lg:flex flex-col gap-4 w-[240px] shrink-0 self-start sticky top-[100px]">
          {/* Stats card */}
          <div className="bg-[#111111] rounded-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            <div className="p-4 relative z-10">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
                Breakdown
              </h3>
              <div className="flex flex-col gap-2.5">
                {platformCounts.map((p) => (
                  <div key={p.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-xs text-zinc-400">{p.name}</span>
                    </div>
                    <span className="font-mono text-xs font-medium text-zinc-300">
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                  Total
                </span>
                <span className="font-mono text-sm font-semibold text-zinc-200">
                  {totalCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
