'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  accentColor?: string;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  hoverEffect = false,
  accentColor,
  onClick,
}: BentoCardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-xl bg-[#111111] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden',
        hoverEffect && 'cursor-pointer hover:border-white/[0.15] transition-colors',
        className
      )}
      whileTap={hoverEffect ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onClick}
    >
      {/* Inner glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      {accentColor && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-xl"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
