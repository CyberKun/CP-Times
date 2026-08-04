'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CalendarPlus, Calendar, Mail } from 'lucide-react';
import { Contest } from '@/types';
import { buildGoogleCalendarUrl, generateIcsFile } from '@/lib/utils';

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded bg-[#161B22] hover:bg-[#1C2128] border border-[#30363D] transition-colors duration-100 group relative flex items-center justify-center"
        title="Add to Calendar"
      >
        <CalendarPlus className="w-4 h-4 text-[#8B949E] group-hover:text-[#E6EDF3] transition-colors duration-100" />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full right-0 mb-2 w-48 bg-[#161B22] border border-[#30363D] rounded overflow-hidden z-50 flex flex-col p-1"
        >
          <a
            href={buildGoogleCalendarUrl(contest)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128] rounded text-sm px-3 py-2 transition-colors duration-100"
          >
            <Calendar className="w-4 h-4 text-[#8B949E]" />
            Google Calendar
          </a>
          
          <button
            onClick={handleIcsDownload}
            className="flex items-center gap-3 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128] rounded text-sm px-3 py-2 transition-colors duration-100 text-left"
          >
            <Calendar className="w-4 h-4 text-[#8B949E]" />
            Apple Calendar
          </button>
          
          <button
            onClick={handleIcsDownload}
            className="flex items-center gap-3 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128] rounded text-sm px-3 py-2 transition-colors duration-100 text-left"
          >
            <Mail className="w-4 h-4 text-[#8B949E]" />
            Outlook
          </button>
        </div>
      )}
    </div>
  );
}
