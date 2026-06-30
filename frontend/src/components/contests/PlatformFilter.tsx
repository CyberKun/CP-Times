'use client';

import React from 'react';
import { PLATFORMS } from '@/lib/constants';
import { Platform } from '@/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { PlatformIcon } from '@/components/ui/PlatformIcon';

interface PlatformFilterProps {
  selectedPlatforms: Set<Platform>;
  onToggle: (platform: Platform) => void;
  onToggleAll: () => void;
}

export function PlatformFilter({ selectedPlatforms, onToggle, onToggleAll }: PlatformFilterProps) {
  const allSelected = selectedPlatforms.size === PLATFORMS.length;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <button
        onClick={onToggleAll}
        className={cn(
          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
          allSelected 
            ? "border-indigo-500/30 text-zinc-200 bg-indigo-500/[0.06]" 
            : "border-white/[0.08] text-zinc-500 bg-transparent hover:border-white/[0.12] hover:text-zinc-300"
        )}
      >
        <span className="flex items-center gap-1.5">
          {allSelected && <Check className="w-3.5 h-3.5" />}
          All Platforms
        </span>
      </button>

      {PLATFORMS.map((platform) => {
        const isSelected = selectedPlatforms.has(platform.key);
        
        return (
          <button
            key={platform.key}
            onClick={() => onToggle(platform.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
              isSelected 
                ? "border-indigo-500/30 text-zinc-200 bg-indigo-500/[0.06]" 
                : "border-white/[0.08] text-zinc-500 bg-transparent hover:border-white/[0.12] hover:text-zinc-300"
            )}
          >
            <span className="flex items-center gap-2">
              <PlatformIcon 
                platform={platform.key} 
                color={platform.color} 
                className="w-4 h-4 mr-0.5"
              />
              {platform.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
