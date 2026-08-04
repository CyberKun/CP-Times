'use client';

import React, { useMemo } from 'react';
import { useContests } from '@/hooks/useContests';
import { ContestAgendaRow, ContestAgendaRowMobile } from './ContestAgendaRow';
import { NextContestCountdown } from './NextContestCountdown';
import type { Contest } from '@/types';
import { Telescope } from 'lucide-react';

/* ── date-based grouping ────────────────────────────────── */

interface DateGroup {
  key: string;
  label: string;
  isLive: boolean;
  contests: Contest[];
}

function groupByDate(live: Contest[], upcoming: Contest[]): DateGroup[] {
  const groups: DateGroup[] = [];

  if (live.length > 0) {
    groups.push({
      key: 'live',
      label: 'Live Now',
      isLive: true,
      contests: [...live],
    });
  }

  // Group upcoming by calendar date
  const dateMap = new Map<string, Contest[]>();
  for (const c of upcoming) {
    const d = new Date(c.startTime);
    const key = d.toISOString().split('T')[0]; // '2026-07-14'
    if (!dateMap.has(key)) dateMap.set(key, []);
    dateMap.get(key)!.push(c);
  }

  const sortedKeys = [...dateMap.keys()].sort();
  for (const key of sortedKeys) {
    const contests = dateMap.get(key)!;
    const d = new Date(key + 'T00:00:00');
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const formattedLabel = `${weekday}, ${day} ${month}`;

    groups.push({
      key,
      label: formattedLabel,
      isLive: false,
      contests,
    });
  }

  return groups;
}

/* ── skeleton card ──────────────────────────────────────── */

function SkeletonCard() {
  return <div className="skeleton-shimmer" style={{ height: 72, borderRadius: 10, marginBottom: 8 }} />;
}

/* ── component ──────────────────────────────────────────── */

export function ContestCalendar() {
  const {
    live,
    upcoming,
    isLoading,
    error,
  } = useContests();

  const groups = useMemo(() => groupByDate(live, upcoming), [live, upcoming]);
  const nextContest = upcoming.length > 0 ? upcoming[0] : null;

  /* ── error state ─────────────── */
  if (error) {
    return (
      <div
        style={{
          padding: 24,
          borderRadius: 10,
          border: '1px solid rgba(255, 107, 94, 0.2)',
          backgroundColor: 'rgba(255, 107, 94, 0.05)',
          color: '#FF6B5E',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Failed to load contests</h3>
        <p style={{ fontSize: 14, opacity: 0.7 }}>{error}</p>
      </div>
    );
  }

  /* ── loading state ───────────── */
  if (isLoading) {
    return (
      <div>
        <div className="skeleton-shimmer" style={{ height: 140, borderRadius: 10, marginBottom: 32 }} />
        <div style={{ marginBottom: 12 }}>
          <div className="skeleton-shimmer" style={{ width: 100, height: 14, borderRadius: 8 }} />
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  /* ── empty state ─────────────── */
  const totalContests = groups.reduce((acc, g) => acc + g.contests.length, 0);
  if (totalContests === 0) {
    return (
      <div>
        <div
          className="flex flex-col items-center justify-center gap-3"
          style={{ padding: '96px 0', color: '#7C8698' }}
        >
          <Telescope size={24} />
          <span style={{ fontSize: 14 }}>No upcoming contests found.</span>
        </div>
      </div>
    );
  }

  /* ── main render ─────────────── */
  return (
    <div>
      {/* Next contest countdown — the ONE gradient element */}
      <NextContestCountdown contest={nextContest} />

      {/* Date-grouped agenda list */}
      <div style={{ marginTop: nextContest ? 32 : 0 }}>
        {groups.map((group, idx) => (
          <div key={group.key}>
            {/* Date header */}
            <div
              className="flex items-center gap-2"
              style={{
                marginTop: idx === 0 ? 0 : 32,
                marginBottom: 12,
              }}
            >
              {group.isLive && <span className="agenda-pulse-dot" />}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: group.isLive ? '#22c55e' : '#7C8698',
                  textTransform: 'uppercase',
                }}
              >
                {group.label}
              </span>
              <span style={{ fontSize: 12, color: '#7C8698', opacity: 0.6 }}>
                {group.contests.length}
              </span>
            </div>

            {/* Contest cards */}
            {group.contests.map((contest) => (
              <React.Fragment key={`${contest.platform}-${contest.externalId}`}>
                <ContestAgendaRow contest={contest} />
                <ContestAgendaRowMobile contest={contest} />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
