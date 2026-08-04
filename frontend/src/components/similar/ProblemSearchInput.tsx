'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── types ──────────────────────────────────────────────── */

interface AutocompleteResult {
  id: string;
  name: string;
  externalId: string;
  platform: string;
  rating: number | null;
}

interface ProblemSearchInputProps {
  onSelect: (problemId: string) => void;
  onUrlLookup: (url: string) => void;
  autocompleteResults: AutocompleteResult[];
  onQueryChange: (query: string) => void;
  isLoading?: boolean;
  urlLookupResult?: {
    not_indexed?: boolean;
    id?: string;
    name?: string;
    platform?: string;
    message?: string;
  } | null;
}

/* ── platform badge colours ─────────────────────────────── */

const PLATFORM_BADGE: Record<string, { bg: string; text: string }> = {
  CODEFORCES: { bg: '#318CE7', text: '#FFFFFF' },
  LEETCODE:   { bg: '#FFA116', text: '#FFFFFF' },
  CODECHEF:   { bg: '#5B4638', text: '#FFFFFF' },
  ATCODER:    { bg: '#222222', text: '#3F51B5' },
};

/* ── helpers ────────────────────────────────────────────── */

const URL_PATTERNS = [
  'codeforces.com',
  'leetcode.com',
  'codechef.com',
  'atcoder.jp',
] as const;

function isUrl(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return URL_PATTERNS.some((p) => lower.includes(p));
}

/* ── component ──────────────────────────────────────────── */

export function ProblemSearchInput({
  onSelect,
  onUrlLookup,
  autocompleteResults,
  onQueryChange,
  isLoading = false,
  urlLookupResult,
}: ProblemSearchInputProps) {
  const [value, setValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isUrlMode = isUrl(value);

  /* ── debounced query dispatch ─────────────────────────── */

  const dispatchQuery = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!q.trim()) {
        onQueryChange('');
        return;
      }
      debounceRef.current = setTimeout(() => {
        onQueryChange(q.trim());
      }, 300);
    },
    [onQueryChange],
  );

  /* cleanup debounce on unmount */
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /* ── close dropdown on outside click ──────────────────── */

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── show / hide dropdown when results change ─────────── */

  useEffect(() => {
    if (!isUrlMode && autocompleteResults.length > 0 && value.trim()) {
      setShowDropdown(true);
      setHighlightedIndex(-1);
    }
  }, [autocompleteResults, isUrlMode, value]);

  /* ── input handlers ───────────────────────────────────── */

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);

    if (!isUrl(next)) {
      dispatchQuery(next);
    } else {
      setShowDropdown(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (isUrlMode) {
        onUrlLookup(value.trim());
        setShowDropdown(false);
      } else if (highlightedIndex >= 0 && highlightedIndex < autocompleteResults.length) {
        handleSelect(autocompleteResults[highlightedIndex]);
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowDropdown(false);
      return;
    }

    /* keyboard navigation inside dropdown */
    if (showDropdown && autocompleteResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < autocompleteResults.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : autocompleteResults.length - 1,
        );
      }
    }
  }

  function handleBlur() {
    /* delay hide so click on dropdown registers first */
    setTimeout(() => setShowDropdown(false), 150);
  }

  function handleSelect(result: AutocompleteResult) {
    onSelect(result.id);
    setValue('');
    setShowDropdown(false);
  }

  /* ── render ───────────────────────────────────────────── */

  return (
    <div ref={containerRef} className="relative w-full">
      {/* input field */}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-[#8B949E] pointer-events-none">
          {isUrlMode ? (
            <LinkIcon className="w-3.5 h-3.5" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </span>

        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (!isUrlMode && autocompleteResults.length > 0 && value.trim()) {
              setShowDropdown(true);
            }
          }}
          placeholder="Paste a problem URL or search by name…"
          className={cn(
            'w-full h-10 pl-9 pr-3 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] placeholder:text-[#8B949E] font-sans text-sm outline-none transition-colors duration-75',
            'focus:border-[#8B949E]',
          )}
          spellCheck={false}
          autoComplete="off"
        />

        {isLoading && (
          <span className="absolute right-3 text-[#8B949E]">
            <svg
              className="w-3.5 h-3.5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </span>
        )}
      </div>

      {/* url lookup not-indexed message */}
      {urlLookupResult?.not_indexed && (
        <p className="mt-1.5 text-[#8B949E] text-xs italic">
          {urlLookupResult.message || 'This problem is not yet indexed. The corpus is refreshed periodically.'}
        </p>
      )}

      {/* autocomplete dropdown */}
      {showDropdown && autocompleteResults.length > 0 && !isUrlMode && (
        <ul className="absolute left-0 right-0 top-full mt-px bg-[#161B22] border border-[#30363D] z-50 max-h-[320px] overflow-y-auto">
          {autocompleteResults.map((result, idx) => {
            const badge = PLATFORM_BADGE[result.platform] || {
              bg: '#8B949E',
              text: '#FFFFFF',
            };

            return (
              <li
                key={result.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus, prevent blur race
                  handleSelect(result);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={cn(
                  'h-10 px-3 flex items-center gap-2 cursor-pointer border-b border-[#30363D] last:border-b-0 transition-colors duration-75',
                  highlightedIndex === idx
                    ? 'bg-[#1C2128]'
                    : 'hover:bg-[#1C2128]',
                )}
              >
                {/* platform badge */}
                <span
                  className="inline-block shrink-0 px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wide leading-none"
                  style={{ backgroundColor: badge.bg, color: badge.text }}
                >
                  {result.platform}
                </span>

                {/* problem name */}
                <span className="text-[13px] text-[#E6EDF3] truncate min-w-0">
                  {result.name}
                </span>

                {/* external id */}
                <span className="shrink-0 font-mono text-[11px] text-[#8B949E]">
                  {result.externalId}
                </span>

                {/* rating */}
                {result.rating != null && (
                  <span className="shrink-0 font-mono text-[11px] text-[#8B949E] ml-auto">
                    {result.rating}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
