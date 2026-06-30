'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Contest } from '@/types';
import { getPlatformColor } from '@/lib/utils';
import { PLATFORM_MAP } from '@/lib/constants';

interface WeekTimelineProps {
  contests: Contest[];
}

function getDayLabel(date: Date, today: Date): string {
  const diff = Math.floor((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function WeekTimeline({ contests }: WeekTimelineProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Filter to next 7 days and group by date
  const weekContests = contests
    .filter(c => {
      const start = new Date(c.startTime);
      return start >= today && start <= weekEnd;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const grouped: Record<string, Contest[]> = {};
  weekContests.forEach(c => {
    const dateKey = new Date(c.startTime).toLocaleDateString('en-US');
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(c);
  });

  const days = Object.entries(grouped);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.1 }}
      className="relative bg-[#111111] rounded-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden hover:border-white/[0.15] transition-colors"
    >
      {/* Inner glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative z-10 p-4">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-4">This Week</h3>
        
        {days.length === 0 ? (
          <p className="text-xs text-zinc-600">No contests this week</p>
        ) : (
          <div className="flex flex-col gap-4">
            {days.map(([dateKey, dayContests]) => {
              const date = new Date(dateKey);
              const isToday = date.toLocaleDateString('en-US') === new Date().toLocaleDateString('en-US');
              
              return (
                <div key={dateKey}>
                  <div className={`text-[11px] font-medium mb-2 ${
                    isToday ? 'text-indigo-400' : 'text-zinc-500'
                  }`}>
                    {getDayLabel(date, today)}
                  </div>
                  <div className="flex flex-col gap-1.5 pl-3 border-l border-white/[0.06]">
                    {dayContests.map(c => (
                      <a
                        key={`${c.platform}-${c.externalId}`}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-2 hover:bg-white/[0.02] rounded-md px-2 py-1 -ml-2 transition-colors"
                      >
                        <div 
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" 
                          style={{ backgroundColor: getPlatformColor(c.platform) }} 
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-zinc-300 group-hover:text-zinc-100 truncate transition-colors">
                            {c.name}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-600">
                            {new Date(c.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
