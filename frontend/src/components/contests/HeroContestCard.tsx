'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { Contest } from '@/types';
import { CountdownTimer } from './CountdownTimer';
import { CalendarSyncMenu } from './CalendarSyncMenu';
import { getPlatformColor, formatDate, formatDuration } from '@/lib/utils';
import { PLATFORMS } from '@/lib/constants';

interface HeroContestCardProps {
  contest: Contest;
  clashingWith?: string[];
}

export function HeroContestCard({ contest, clashingWith }: HeroContestCardProps) {
  const platformColor = getPlatformColor(contest.platform);
  const platformInfo = PLATFORMS.find(p => p.key === contest.platform);
  const isLive = contest.phase === 'CODING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="col-span-1 md:col-span-2 relative bg-[#111111] rounded-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden hover:border-white/[0.15] transition-colors"
    >
      {/* Inner glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      
      {/* Faint platform color gradient in corner */}
      <div 
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.04] blur-3xl pointer-events-none"
        style={{ background: platformColor }}
      />

      <div className="relative z-10 p-6 md:p-8 flex flex-col h-full min-h-[200px]">
        {/* Top: Platform & Status */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platformColor }} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {platformInfo?.name || contest.platform}
            </span>
            {contest.contestType && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 border border-white/[0.06] px-1.5 py-0.5 rounded">
                {contest.contestType}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">Live</span>
              </div>
            )}
            {!isLive && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 border border-white/[0.06] px-2 py-0.5 rounded">Next Up</span>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-semibold text-zinc-100 tracking-tight mb-4 leading-tight">
          {contest.name}
        </h2>

        {/* Clash Warning */}
        {clashingWith && clashingWith.length > 0 && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs mb-4">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400/80" />
            <div className="flex flex-col gap-0.5 text-amber-400/80">
              <span className="font-semibold">Schedule conflict</span>
              <span className="text-amber-400/60">{clashingWith.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom: Meta & Actions */}
        <div className="flex flex-wrap items-end justify-between gap-4 pt-4 border-t border-white/[0.06]">
          <div className="flex flex-col gap-3">
            {/* Countdown */}
            {contest.phase === 'BEFORE' && (
              <CountdownTimer targetDate={contest.startTime} />
            )}
            
            {/* Date & Duration */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono text-xs">{formatDate(contest.startTime)}</span>
              </div>
              <span className="font-mono text-xs text-zinc-600 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">
                {formatDuration(contest.durationSeconds || ((new Date(contest.endTime || contest.startTime).getTime() - new Date(contest.startTime).getTime()) / 1000))}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CalendarSyncMenu contest={contest} />
            <a
              href={contest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] text-zinc-400 hover:text-zinc-100 text-sm font-medium transition-colors"
            >
              Open <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
