'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { Contest } from '@/types';
import { formatDuration } from '@/lib/utils';
import { PLATFORM_MAP, DIV_COLORS } from '@/lib/constants';

interface ContestAgendaRowProps {
  contest: Contest;
}

/* ── platform accent color ──────────────────────────────── */
function getPlatformAccent(platform: string): string {
  const map: Record<string, string> = {
    CODEFORCES: '#FF6B5E',
    LEETCODE: '#F5A623',
    ATCODER: '#2EC4B6',
    CODECHEF: '#A78BFA',
  };
  return map[platform] || '#7C8698';
}

/* ── division tag parser ────────────────────────────────── */
function parseDivisionTag(contestType: string | null): { label: string; color: string } | null {
  if (!contestType) return null;
  for (const [pattern, color] of Object.entries(DIV_COLORS)) {
    if (
      contestType === pattern ||
      contestType.replace(/\.\s*/g, ' ').trim() === pattern.replace(/\.\s*/g, ' ').trim()
    ) {
      return { label: contestType, color };
    }
  }
  const m = contestType.match(/div\.?\s*(\d)/i);
  if (m) {
    const divKey = `Div. ${m[1]}`;
    const color = DIV_COLORS[divKey] || '#7C8698';
    return { label: contestType, color };
  }
  return { label: contestType, color: '#7C8698' };
}

/* ── main row (desktop) ────────────────────────────────── */
export function ContestAgendaRow({ contest }: ContestAgendaRowProps) {
  const platformColor = getPlatformAccent(contest.platform);
  const platformName = PLATFORM_MAP[contest.platform]?.name ?? contest.platform;
  const divTag = parseDivisionTag(contest.contestType);
  const isLive = contest.phase === 'CODING';
  const isBefore = contest.phase === 'BEFORE';

  const startDate = new Date(contest.startTime);
  const absTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const duration =
    contest.durationSeconds ||
    (new Date(contest.endTime || contest.startTime).getTime() -
      new Date(contest.startTime).getTime()) /
      1000;

  return (
    <div
      className="hidden md:flex items-center gap-4 group"
      style={{
        backgroundColor: '#131A26',
        borderRadius: 10,
        border: '1px solid #232B3A',
        borderLeft: `4px solid ${platformColor}`,
        padding: '16px 20px',
        marginBottom: 8,
        transition: 'background-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#1A2332';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#131A26';
      }}
    >
      {/* Platform name */}
      <div
        className="shrink-0"
        style={{ width: 110, fontSize: 14, fontWeight: 600, color: platformColor }}
      >
        {platformName}
      </div>

      {/* Contest info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="truncate"
            style={{ fontSize: 14, fontWeight: 400, color: '#E8EAED' }}
            title={contest.name}
          >
            {contest.name}
          </span>
          {divTag && (
            <span
              className="shrink-0"
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 8,
                border: `1px solid ${divTag.color}`,
                color: divTag.color,
                whiteSpace: 'nowrap',
              }}
            >
              {divTag.label}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#7C8698', marginTop: 2 }}>
          {absTime} · {formatDuration(duration)}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-2">
        {isLive && (
          <div className="flex items-center gap-1.5">
            <span className="agenda-pulse-dot" />
            <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Live</span>
          </div>
        )}

        {isBefore && (
          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              fontWeight: 400,
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid #232B3A',
              color: '#7C8698',
              backgroundColor: 'transparent',
              textDecoration: 'none',
              transition: 'border-color 150ms ease, color 150ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4C8DFF';
              e.currentTarget.style.color = '#4C8DFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#232B3A';
              e.currentTarget.style.color = '#7C8698';
            }}
          >
            Register
          </a>
        )}

        <a
          href={contest.url}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100"
          style={{
            padding: 4,
            color: '#7C8698',
            transition: 'color 150ms ease, opacity 150ms ease',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E8EAED';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#7C8698';
          }}
          title="Open contest"
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}

/* ── mobile row (2-line stacked) ────────────────────────── */
export function ContestAgendaRowMobile({ contest }: ContestAgendaRowProps) {
  const platformColor = getPlatformAccent(contest.platform);
  const platformName = PLATFORM_MAP[contest.platform]?.name ?? contest.platform;
  const divTag = parseDivisionTag(contest.contestType);
  const isLive = contest.phase === 'CODING';

  const startDate = new Date(contest.startTime);
  const absTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const duration =
    contest.durationSeconds ||
    (new Date(contest.endTime || contest.startTime).getTime() -
      new Date(contest.startTime).getTime()) /
      1000;

  return (
    <a
      href={contest.url}
      target="_blank"
      rel="noopener noreferrer"
      className="md:hidden flex flex-col no-underline"
      style={{
        backgroundColor: '#131A26',
        borderRadius: 10,
        border: '1px solid #232B3A',
        borderLeft: `4px solid ${platformColor}`,
        padding: '12px 16px',
        marginBottom: 8,
        textDecoration: 'none',
      }}
    >
      {/* Line 1: platform + name */}
      <div className="flex items-center gap-2 min-w-0">
        <span style={{ fontSize: 13, fontWeight: 600, color: platformColor, whiteSpace: 'nowrap' }}>
          {platformName}
        </span>
        <span
          className="truncate"
          style={{ fontSize: 13, fontWeight: 400, color: '#E8EAED' }}
          title={contest.name}
        >
          {contest.name}
        </span>
      </div>
      {/* Line 2: time + duration + div tag */}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span style={{ fontSize: 12, color: '#7C8698' }}>{absTime}</span>
        <span style={{ fontSize: 12, color: '#7C8698' }}>· {formatDuration(duration)}</span>
        {isLive && (
          <span className="flex items-center gap-1">
            <span className="agenda-pulse-dot" />
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Live</span>
          </span>
        )}
        {divTag && (
          <span
            style={{
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 8,
              border: `1px solid ${divTag.color}`,
              color: divTag.color,
            }}
          >
            {divTag.label}
          </span>
        )}
      </div>
    </a>
  );
}
