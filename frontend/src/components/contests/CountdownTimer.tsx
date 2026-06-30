'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountdown } from '@/hooks/useCountdown';

interface CountdownTimerProps {
  targetDate: string;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) return null;

  const timeBlocks = [
    { label: 'd', value: days },
    { label: 'h', value: hours },
    { label: 'm', value: minutes },
    { label: 's', value: seconds }
  ];

  let started = false;
  const visibleBlocks = timeBlocks.filter(block => {
    if (block.value > 0) started = true;
    return started || block.label === 's';
  });

  return (
    <div className="flex items-center gap-1.5" title="Time until contest starts">
      {visibleBlocks.map((block, idx) => (
        <React.Fragment key={block.label}>
          <div className="flex flex-col items-center bg-white/[0.04] border border-white/[0.06] rounded-md px-1.5 py-1 min-w-[28px]">
            <span className="text-sm font-bold font-mono text-zinc-100 leading-none mb-0.5">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={block.value}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block"
                >
                  {block.value.toString().padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-[10px] text-zinc-600 font-medium leading-none uppercase">{block.label}</span>
          </div>
          {idx < visibleBlocks.length - 1 && (
            <span className="text-zinc-600 font-bold text-sm">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
