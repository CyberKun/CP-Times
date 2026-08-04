'use client';

import React from 'react';
import { useCountdown } from '@/hooks/useCountdown';

interface CountdownTimerProps {
  targetDate: string;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) return null;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  );
  const formatted = parts.join(' ');

  return (
    <span
      className="font-mono text-sm text-[#E6EDF3] tabular-nums"
      title="Time until contest starts"
    >
      {formatted}
    </span>
  );
}
