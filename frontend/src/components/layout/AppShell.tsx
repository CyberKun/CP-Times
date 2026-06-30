'use client';

import React from 'react';
import { Topbar } from './Topbar';
import { motion } from 'framer-motion';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 flex flex-col font-sans">
      <Topbar />
      
      <main className="flex-1 w-full relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="w-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
