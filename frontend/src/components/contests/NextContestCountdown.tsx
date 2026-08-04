'use client';

import type { Contest } from '@/types';
import { useCountdown } from '@/hooks/useCountdown';
import { PLATFORM_MAP } from '@/lib/constants';

interface NextContestCountdownProps {
  contest: Contest | null;
}

export function NextContestCountdown({ contest }: NextContestCountdownProps) {
  const countdown = useCountdown(contest?.startTime ?? '');

  if (!contest) return null;

  const platformName = PLATFORM_MAP[contest.platform]?.name ?? contest.platform;

  const startDate = new Date(contest.startTime);
  const weekday = startDate.toLocaleDateString('en-US', { weekday: 'short' });
  const day = startDate.getDate();
  const month = startDate.toLocaleDateString('en-US', { month: 'short' });
  const hours = startDate.getHours().toString().padStart(2, '0');
  const minutes = startDate.getMinutes().toString().padStart(2, '0');
  const formattedTime = `${weekday}, ${day} ${month} · ${hours}:${minutes}`;

  const segments = [
    { value: countdown.days, label: 'Days' },
    { value: countdown.hours, label: 'Hrs' },
    { value: countdown.minutes, label: 'Min' },
    { value: countdown.seconds, label: 'Sec' },
  ];

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #4C8DFF, #2EC4B6)',
        borderRadius: 10,
        padding: 24,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        Next Contest
      </div>

      {/* Contest name */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: '#fff',
          marginTop: 4,
        }}
      >
        {contest.name}
      </div>

      {/* Platform + time */}
      <div
        style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.8)',
          marginTop: 4,
        }}
      >
        {platformName} · {formattedTime}
      </div>

      {/* Countdown boxes */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          marginTop: 16,
        }}
      >
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 8,
              padding: '8px 12px',
              minWidth: 60,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {String(seg.value).padStart(2, '0')}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
              }}
            >
              {seg.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
