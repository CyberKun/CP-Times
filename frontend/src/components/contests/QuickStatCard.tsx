'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface QuickStatCardProps {
  label: string;
  value: number;
  accentColor: string;
  icon?: React.ReactNode;
  delay?: number;
}

export function QuickStatCard({ label, value, accentColor, icon, delay = 0 }: QuickStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay }}
      className="relative bg-[#111111] rounded-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden hover:border-white/[0.15] transition-colors p-4"
    >
      {/* Inner glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
        </div>
        <div className="flex items-end justify-between">
          <span className="font-mono text-2xl font-semibold text-zinc-100">{value}</span>
          {icon && <div className="text-zinc-600">{icon}</div>}
        </div>
      </div>
    </motion.div>
  );
}
