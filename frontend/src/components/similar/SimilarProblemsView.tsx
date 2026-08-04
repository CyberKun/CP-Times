'use client';

import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  SimilarProblemsResponse,
  SimilarBucket,
  SimilarProblemResult,
  Platform,
} from '@/types';

/* ── platform badge colours ─────────────────────────────── */
const PLATFORM_BADGE: Record<string, { bg: string; text: string }> = {
  CODEFORCES: { bg: '#318CE7', text: '#FFFFFF' },
  LEETCODE:   { bg: '#FFA116', text: '#FFFFFF' },
  CODECHEF:   { bg: '#5B4638', text: '#FFFFFF' },
  ATCODER:    { bg: '#222222', text: '#3F51B5' },
};

/* ── platform display names ─────────────────────────────── */
const PLATFORM_NAME: Record<string, string> = {
  CODEFORCES: 'Codeforces',
  LEETCODE:   'LeetCode',
  CODECHEF:   'CodeChef',
  ATCODER:    'AtCoder',
};

/* ── props ──────────────────────────────────────────────── */
interface SimilarProblemsViewProps {
  data: SimilarProblemsResponse | null;
  isLoading: boolean;
}

/* ── bucket key → section header label ──────────────────── */
const BUCKET_META: { key: keyof SimilarProblemsResponse['buckets']; label: string }[] = [
  { key: 'implementation', label: 'IMPLEMENTATION PRACTICE' },
  { key: 'understanding',  label: 'UNDERSTANDING PRACTICE' },
  { key: 'variations',     label: 'VARIATIONS' },
];

function formatBucketHeader(label: string, range: [number, number]): string {
  if (range[1] === -1) {
    return `${label} (${range[0]}+)`;
  }
  return `${label} (${range[0]}–${range[1]})`;
}

/* ── badge helper ───────────────────────────────────────── */
function PlatformBadge({ platform }: { platform: Platform }) {
  const badge = PLATFORM_BADGE[platform] || { bg: '#8B949E', text: '#FFFFFF' };
  return (
    <span
      className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wide leading-none"
      style={{ backgroundColor: badge.bg, color: badge.text }}
    >
      {PLATFORM_NAME[platform] || platform}
    </span>
  );
}

/* ── problem row ────────────────────────────────────────── */
function ProblemRow({ problem }: { problem: SimilarProblemResult }) {
  const visibleTags = problem.tags.slice(0, 3);
  const overflow = problem.tags.length - 3;

  return (
    <div className="group flex items-center h-10 border-b border-[#30363D] hover:bg-[#1C2128] transition-colors duration-75">
      {/* Platform badge */}
      <div className="w-[88px] shrink-0 px-3">
        <PlatformBadge platform={problem.platform} />
      </div>

      {/* Problem name */}
      <div className="flex-1 min-w-0 px-2">
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-[#E6EDF3] truncate block hover:underline"
          title={problem.name}
        >
          {problem.name}
        </a>
      </div>

      {/* Rating */}
      <div className="w-[64px] shrink-0 px-2 text-right font-mono text-xs text-[#8B949E] tabular-nums">
        {problem.rating ?? '—'}
      </div>

      {/* Tags */}
      <div className="w-[200px] shrink-0 px-2 flex gap-1 overflow-hidden">
        {visibleTags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-mono text-[#8B949E] px-1 border border-[#30363D] whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
        {overflow > 0 && (
          <span className="text-[10px] font-mono text-[#8B949E] px-1 whitespace-nowrap">
            +{overflow}
          </span>
        )}
      </div>

      {/* External link */}
      <div className="w-[32px] shrink-0 flex justify-center">
        <ExternalLink className="w-3.5 h-3.5 text-[#8B949E] opacity-0 group-hover:opacity-100 transition-opacity duration-75" />
      </div>
    </div>
  );
}

/* ── bucket section ─────────────────────────────────────── */
function BucketSection({ bucket, label }: { bucket: SimilarBucket | null; label: string }) {
  if (!bucket) return null;
  if (bucket.problems.length === 0 && !bucket.limited_data) return null;

  return (
    <div className="mb-8">
      <h3 className="text-xs font-medium uppercase tracking-wider text-[#8B949E] mb-2">
        {formatBucketHeader(label, bucket.ratingRange)}
      </h3>

      {bucket.limited_data && (
        <p className="text-[11px] text-[#8B949E] italic mb-2">
          Limited data available for this rating range.
        </p>
      )}

      {bucket.problems.map((problem) => (
        <ProblemRow key={problem.id} problem={problem} />
      ))}
    </div>
  );
}

/* ── loading skeleton ───────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, sectionIdx) => (
        <div key={sectionIdx} className="mb-8">
          <div className="h-4 w-48 skeleton-shimmer mb-2" />
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <div key={rowIdx} className="h-10 w-full skeleton-shimmer mb-px" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── seed problem header ────────────────────────────────── */
function SeedHeader({ seed }: { seed: SimilarProblemResult }) {
  return (
    <div className="border-b border-[#30363D] pb-4 mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        <PlatformBadge platform={seed.platform} />
        <span className="text-base font-medium text-[#E6EDF3]">{seed.name}</span>
        {seed.rating != null && (
          <span className="font-mono text-sm text-[#8B949E]">{seed.rating}</span>
        )}
        {seed.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {seed.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-1.5 py-0.5 border border-[#30363D] text-[#8B949E]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── not-indexed state ──────────────────────────────────── */
function NotIndexedMessage() {
  return (
    <div className="flex items-start gap-3 py-6">
      <Info className="w-4 h-4 text-[#8B949E] mt-0.5 shrink-0" />
      <p className="text-sm text-[#8B949E]">
        This problem doesn&apos;t have a precomputed embedding yet. The corpus is
        refreshed periodically — check back later.
      </p>
    </div>
  );
}

/* ── main component ─────────────────────────────────────── */
export function SimilarProblemsView({ data, isLoading }: SimilarProblemsViewProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!data) return null;

  if (data.not_indexed) {
    return (
      <div>
        <SeedHeader seed={data.seed_problem} />
        <NotIndexedMessage />
      </div>
    );
  }

  return (
    <div>
      <SeedHeader seed={data.seed_problem} />

      {BUCKET_META.map(({ key, label }) => (
        <BucketSection key={key} bucket={data.buckets[key]} label={label} />
      ))}
    </div>
  );
}
