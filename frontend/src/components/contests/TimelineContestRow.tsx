'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { Contest } from '@/types';
import { CountdownTimer } from './CountdownTimer';
import { CalendarSyncMenu } from './CalendarSyncMenu';
import { getPlatformColor, formatDuration } from '@/lib/utils';
import { PLATFORMS } from '@/lib/constants';

interface TimelineContestRowProps {
  contest: Contest;
  index: number;
  clashingWith?: string[];
  isLast?: boolean;
}

export function TimelineContestRow({ contest, index, clashingWith, isLast = false }: TimelineContestRowProps) {
  const platformColor = getPlatformColor(contest.platform);
  const platformInfo = PLATFORMS.find(p => p.key === contest.platform);
  const isLive = contest.phase === 'CODING';
  const isPast = contest.phase === 'FINISHED';

  const startTime = new Date(contest.startTime);
  const timeStr = startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const duration = contest.durationSeconds ||
    ((new Date(contest.endTime || contest.startTime).getTime() - new Date(contest.startTime).getTime()) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: index * 0.015 }}
      className="group relative pl-6"
    >
      {/* Vertical connecting line */}
      {!isLast && (
        <div className="absolute left-[3px] top-[14px] bottom-0 w-px bg-white/[0.06]" />
      )}

      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-[6px] w-[7px] h-[7px] rounded-full shrink-0 ${
          isLive ? 'ring-4 ring-emerald-500/20' : ''
        }`}
        style={{ backgroundColor: isLive ? '#34d399' : platformColor }}
      />

      {/* Row content */}
      <div className={`${isLast ? 'pb-2' : 'pb-6'} flex items-start justify-between gap-3`}>
        <div className="min-w-0 flex-1">
          {/* Contest name */}
          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-zinc-200 hover:text-white transition-colors leading-snug line-clamp-1"
            title={contest.name}
          >
            {contest.name}
          </a>

          {/* Meta line */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px]">
            <span className="font-mono uppercase tracking-widest text-zinc-500">
              {platformInfo?.name || contest.platform}
            </span>
            <span className="text-zinc-700">·</span>
            <span className="font-mono text-zinc-500">{timeStr}</span>
            <span className="text-zinc-700">·</span>
            <span className="font-mono text-zinc-600">{formatDuration(duration)}</span>
            {contest.contestType && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="font-mono text-zinc-600">{contest.contestType}</span>
              </>
            )}
          </div>

          {/* Status indicators */}
          {!isPast && contest.phase === 'BEFORE' && (
            <div className="mt-2">
              <CountdownTimer targetDate={contest.startTime} />
            </div>
          )}
          {isLive && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">Live Now</span>
            </div>
          )}

          {/* Clash warning */}
          {clashingWith && clashingWith.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-400/70">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="truncate">Clashes with {clashingWith.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Actions — always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {!isPast && <CalendarSyncMenu contest={contest} />}
          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-600 hover:text-zinc-300 transition-colors"
            title="Open contest"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
