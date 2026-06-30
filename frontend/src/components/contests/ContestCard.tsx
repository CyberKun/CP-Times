'use client';

import React from 'react';
import { ExternalLink, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Contest } from '@/types';
import { CountdownTimer } from './CountdownTimer';
import { CalendarSyncMenu } from './CalendarSyncMenu';
import { getPlatformColor, formatDate, formatDuration } from '@/lib/utils';
import { PLATFORMS } from '@/lib/constants';

interface ContestCardProps {
  contest: Contest;
  index: number;
  clashingWith?: string[];
}

export function ContestCard({ contest, index, clashingWith }: ContestCardProps) {
  const platformColor = getPlatformColor(contest.platform);
  const platformInfo = PLATFORMS.find(p => p.key === contest.platform);
  const isLive = contest.phase === 'CODING';
  const isPast = contest.phase === 'FINISHED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: index * 0.03 }}
      layout
      className="relative bg-[#111111] rounded-xl overflow-hidden border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex flex-col h-full hover:border-white/[0.15] transition-colors"
    >
      {/* Inner glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      <div className="relative z-10 p-5 flex flex-col h-full">
        {/* Top Row: Badges & Time */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: platformColor }}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {platformInfo?.name || contest.platform}
            </span>
            {contest.contestType && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 border border-white/[0.06] px-1.5 py-0.5 rounded">
                {contest.contestType}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
            <Clock className="w-3.5 h-3.5 text-zinc-600" />
            <span>{formatDate(contest.startTime)}</span>
          </div>
        </div>

        {/* Main Content: Title */}
        <div className="flex-1 my-2 pb-5 border-b border-white/[0.08]">
          <h3 className="text-base font-semibold text-zinc-100 tracking-tight leading-snug line-clamp-2" title={contest.name}>
            {contest.name}
          </h3>
          
          {/* Clash Warning */}
          {clashingWith && clashingWith.length > 0 && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 text-amber-400/80 border border-amber-500/10 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">Clashes with:</span>
                <span>{clashingWith.join(', ')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row: Duration & Status/Actions */}
        <div className="flex items-center justify-between flex-wrap gap-y-3 pt-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-500 bg-white/[0.04] border border-white/[0.08] px-2 py-1 rounded-md">
              {formatDuration(contest.durationSeconds || ((new Date(contest.endTime || contest.startTime).getTime() - new Date(contest.startTime).getTime()) / 1000))}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-y-2 gap-x-4 justify-end">
            {!isPast && contest.phase === 'BEFORE' && (
              <CountdownTimer targetDate={contest.startTime} />
            )}
            {isLive && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Live Now</span>
              </div>
            )}
            {isPast && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">Ended</span>
            )}

            <div className="flex items-center gap-2 pl-2">
              {!isPast && <CalendarSyncMenu contest={contest} />}
              <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-300 border border-white/[0.08] transition-colors"
                title="Open Contest Page"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
