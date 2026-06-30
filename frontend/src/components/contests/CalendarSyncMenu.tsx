'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CalendarPlus, Calendar, Mail } from 'lucide-react';
import { Contest } from '@/types';
import { buildGoogleCalendarUrl, generateIcsFile } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarSyncMenuProps {
  contest: Contest;
}

export function CalendarSyncMenu({ contest }: CalendarSyncMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIcsDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    generateIcsFile(contest);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] transition-colors group relative flex items-center justify-center"
        title="Add to Calendar"
      >
        <CalendarPlus className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 w-48 bg-[#161616] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 flex flex-col p-1"
          >
            <a
              href={buildGoogleCalendarUrl(contest)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-lg text-sm px-3 py-2 transition-colors"
            >
              <Calendar className="w-4 h-4 text-zinc-500" />
              Google Calendar
            </a>
            
            <button
              onClick={handleIcsDownload}
              className="flex items-center gap-3 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-lg text-sm px-3 py-2 transition-colors text-left"
            >
              <Calendar className="w-4 h-4 text-zinc-500" />
              Apple Calendar
            </button>
            
            <button
              onClick={handleIcsDownload}
              className="flex items-center gap-3 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-lg text-sm px-3 py-2 transition-colors text-left"
            >
              <Mail className="w-4 h-4 text-zinc-500" />
              Outlook
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
