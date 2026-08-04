import type { Contest, Platform, ContestPhase } from '@/types';
import { PLATFORM_MAP } from './constants';

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatRelativeTime(iso: string): string {
  const now = new Date();
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);

  const minutes = Math.floor(absDiffMs / 60000);
  const hours = Math.floor(absDiffMs / 3600000);
  const days = Math.floor(absDiffMs / 86400000);

  if (diffMs > 0) {
    if (minutes < 60) return `in ${minutes}m`;
    if (hours < 24) return `in ${hours}h ${minutes % 60}m`;
    return `in ${days}d ${hours % 24}h`;
  } else {
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}

export function buildGoogleCalendarUrl(contest: Contest): string {
  const startDate = new Date(contest.startTime);
  const endDate = contest.endTime
    ? new Date(contest.endTime)
    : new Date(startDate.getTime() + contest.durationSeconds * 1000);

  const formatGCalDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${contest.name} — ${getPlatformName(contest.platform)}`,
    dates: `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`,
    details: `Contest on ${getPlatformName(contest.platform)}\n\nLink: ${contest.url}`,
    location: contest.url,
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function getPlatformColor(platform: Platform): string {
  return PLATFORM_MAP[platform]?.color ?? '#7C8698';
}

export function getPlatformName(platform: Platform): string {
  return PLATFORM_MAP[platform]?.name ?? platform;
}

export function getPhaseLabel(phase: ContestPhase): string {
  switch (phase) {
    case 'BEFORE':
      return 'Upcoming';
    case 'CODING':
      return 'Live';
    case 'FINISHED':
      return 'Ended';
    default:
      return phase;
  }
}

export function getPhaseColor(phase: ContestPhase): string {
  switch (phase) {
    case 'BEFORE':
      return '#4C8DFF';
    case 'CODING':
      return '#22c55e';
    case 'FINISHED':
      return '#7C8698';
    default:
      return '#7C8698';
  }
}

export function checkClashes(contests: Contest[]): Record<string, string[]> {
  const clashes: Record<string, string[]> = {};
  
  for (let i = 0; i < contests.length; i++) {
    const c1 = contests[i];
    // Start and End times in ms
    const s1 = new Date(c1.startTime).getTime();
    const e1 = c1.endTime ? new Date(c1.endTime).getTime() : s1 + c1.durationSeconds * 1000;
    
    clashes[c1.externalId] = [];

    for (let j = 0; j < contests.length; j++) {
      if (i === j) continue;
      const c2 = contests[j];
      const s2 = new Date(c2.startTime).getTime();
      const e2 = c2.endTime ? new Date(c2.endTime).getTime() : s2 + c2.durationSeconds * 1000;
      
      // Buffer of 30 minutes = 1800000 ms
      const BUFFER = 30 * 60 * 1000;

      // Two intervals [s1, e1] and [s2, e2] overlap if (s1 - BUFFER) < e2 and s2 < (e1 + BUFFER)
      if (s1 - BUFFER < e2 && s2 < e1 + BUFFER) {
        clashes[c1.externalId].push(c2.name);
      }
    }
  }
  return clashes;
}

export function generateIcsFile(contest: Contest) {
  const startDate = new Date(contest.startTime);
  const endDate = contest.endTime
    ? new Date(contest.endTime)
    : new Date(startDate.getTime() + contest.durationSeconds * 1000);

  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const icsString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CP Aggregator//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${contest.name}
DTSTART:${formatIcsDate(startDate)}
DTEND:${formatIcsDate(endDate)}
DESCRIPTION:Contest on ${getPlatformName(contest.platform)}\\n\\nLink: ${contest.url}
LOCATION:${contest.url}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
DESCRIPTION:Reminder: ${contest.name}
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${contest.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
