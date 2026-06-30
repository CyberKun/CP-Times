'use client';

import React, { useState } from 'react';
import { Platform } from '@/types';
import { PLATFORM_MAP, PLATFORMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { X, LayoutGrid, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DifficultyTier } from '@/hooks/useProblems';

interface ProblemFilterPanelProps {
  filters: {
    platforms: Platform[];
    tier: DifficultyTier;
    tags?: string[];
    status?: 'all' | 'solved' | 'unsolved';
  };
  updateFilters: (filters: Partial<ProblemFilterPanelProps['filters']>) => void;
}

export const ProblemFilterPanel: React.FC<ProblemFilterPanelProps> = ({ filters, updateFilters }) => {
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const COMMON_CF_TAGS = ['dp', 'greedy', 'math', 'implementation', 'data structures', 'graphs', 'sortings', 'binary search', 'dfs and similar', 'trees', 'strings', 'number theory', 'geometry', 'combinatorics', 'two pointers', 'bitmasks'];
  const COMMON_LC_TAGS = ['array', 'string', 'hash-table', 'dynamic-programming', 'math', 'sorting', 'greedy', 'depth-first-search', 'binary-search', 'database', 'breadth-first-search', 'tree', 'matrix', 'two-pointers'];

  const activePlatform = filters.platforms[0] || 'CODEFORCES';
  
  const suggestedTags = (activePlatform === 'CODEFORCES' ? COMMON_CF_TAGS : COMMON_LC_TAGS)
    .filter(tag => tag.includes(tagInput.toLowerCase()) && !(filters.tags || []).includes(tag))
    .slice(0, 5);

  const handlePlatformSelect = (platform: Platform) => {
    const current = filters.platforms || [];
    let newPlatforms;
    if (current.includes(platform)) {
      if (current.length === 1) return; // Prevent deselecting the last platform
      newPlatforms = current.filter(p => p !== platform);
    } else {
      newPlatforms = [...current, platform];
    }
    updateFilters({ platforms: newPlatforms });
  };

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      const currentTags = filters.tags || [];
      if (!currentTags.includes(newTag)) {
        updateFilters({ tags: [...currentTags, newTag] });
      }
      setTagInput('');
    }
  };

  const handleTagRemove = (tag: string) => {
    const currentTags = filters.tags || [];
    updateFilters({ tags: currentTags.filter((t) => t !== tag) });
  };

  const tiers: { level: DifficultyTier, label: string, color: string }[] = [
    { level: 1, label: 'Beginner', color: 'from-slate-100 to-emerald-600' },
    { level: 2, label: 'Novice', color: 'from-slate-300 to-teal-600' },
    { level: 3, label: 'Intermediate', color: 'from-blue-400 to-blue-600' },
    { level: 4, label: 'Advanced', color: 'from-slate-100 to-emerald-600' },
    { level: 5, label: 'Expert', color: 'from-purple-400 to-purple-600' },
  ];

  return (
    <div className="w-full max-w-[260px] flex-shrink-0 flex flex-col gap-6 p-5 rounded-xl bg-[#111111] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
      
      {/* TAGS SECTION */}
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
          Tags
        </h3>
        <div className="relative mb-3 z-50">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleTagAdd}
            placeholder="e.g. dp, graphs (Enter)"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
          />
          {showSuggestions && suggestedTags.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 max-h-[160px] overflow-y-auto bg-[#161616] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 z-[100] p-1">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  onMouseDown={(e) => e.preventDefault()} 
                  onClick={() => {
                    const currentTags = filters.tags || [];
                    if (!currentTags.includes(tag)) {
                      updateFilters({ tags: [...currentTags, tag] });
                    }
                    setTagInput('');
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-lg transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(filters.tags || []).map((tag) => (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
              onClick={() => handleTagRemove(tag)}
              title="Click to remove"
            >
              {tag}
              <X className="w-2.5 h-2.5 opacity-70" />
            </motion.span>
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-white/[0.06]" />

      {/* PLATFORMS SECTION */}
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-zinc-500" />
          Platforms
        </h3>
        <div className="flex flex-col gap-2">
          {PLATFORMS.map((platformInfo) => {
            const p = platformInfo.key as Platform;
            const info = PLATFORM_MAP[p];
            const isSelected = (filters.platforms || []).includes(p);
            return (
              <button
                key={p}
                onClick={() => handlePlatformSelect(p)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors text-sm font-medium tracking-wide",
                  isSelected 
                    ? "border-indigo-500/30 text-zinc-200 bg-indigo-500/[0.06]" 
                    : "border-white/[0.08] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.15]"
                )}
              >
                <div 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: info?.color }} 
                />
                {info?.name || p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-white/[0.06]" />

      {/* DIFFICULTY TIER SECTION */}
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
          <Swords className="w-3.5 h-3.5 text-zinc-500" />
          Difficulty Tier
        </h3>
        <div className="flex flex-col gap-1.5">
          {tiers.map((t) => {
            const isSelected = filters.tier === t.level;
            return (
              <button
                key={t.level}
                onClick={() => updateFilters({ tier: t.level })}
                className={cn(
                  "relative overflow-hidden flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm font-medium tracking-wide",
                  isSelected 
                    ? "bg-white/[0.04] border border-white/[0.08] text-zinc-100" 
                    : "border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                )}
              >
                {isSelected && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${t.color} opacity-[0.06]`} />
                )}
                <span className="relative z-10">{t.label}</span>
                <span className="relative z-10 text-[10px] opacity-50 font-mono text-zinc-500">T{t.level}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
