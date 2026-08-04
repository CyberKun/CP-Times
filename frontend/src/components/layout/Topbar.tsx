'use client';

import { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Topbar() {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  return (
    <header
      className="flex items-center justify-between shrink-0"
      style={{
        height: 64,
        backgroundColor: '#0A0E17',
        borderBottom: '1px solid #232B3A',
        padding: '0 32px',
      }}
    >
      {/* Left — Search */}
      <div className="relative" style={{ maxWidth: 320, width: '100%' }}>
        <Search
          size={18}
          className="absolute top-1/2 pointer-events-none"
          style={{
            left: 12,
            transform: 'translateY(-50%)',
            color: '#7C8698',
          }}
        />
        <input
          type="text"
          placeholder="Search contests..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{
            width: '100%',
            height: 40,
            backgroundColor: '#131A26',
            border: '1px solid #232B3A',
            borderRadius: 10,
            paddingLeft: 40,
            paddingRight: 16,
            fontSize: 14,
            color: '#E8EAED',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            transition: 'border-color 150ms ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#4C8DFF';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#232B3A';
          }}
        />
      </div>

      {/* Right */}
      <div className="flex items-center" style={{ gap: 20 }}>
        {/* Bell */}
        <button
          className="relative flex items-center justify-center"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: '#7C8698',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E8EAED';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#7C8698';
          }}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {/* Status dot */}
          <span
            className="absolute"
            style={{
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              backgroundColor: '#FF6B5E',
              border: '2px solid #0A0E17',
              borderRadius: 999,
            }}
          />
        </button>

        {/* Greeting */}
        {user && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: '#7C8698',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {getGreeting()}, {user.username || 'User'}
          </span>
        )}
      </div>
    </header>
  );
}
