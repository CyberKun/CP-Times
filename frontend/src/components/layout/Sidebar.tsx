'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Trophy,
  Code2,
  Terminal,
  Triangle,
  Hexagon,
  Search,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const sections: { header: string; items: NavItem[] }[] = [
  {
    header: 'OVERVIEW',
    items: [
      { icon: Calendar, label: 'Contests', href: '/contests' },
      { icon: Trophy, label: 'Past Results', href: '/results' },
    ],
  },
  {
    header: 'PLATFORMS',
    items: [
      { icon: Code2, label: 'Codeforces', href: '/platforms/codeforces' },
      { icon: Terminal, label: 'LeetCode', href: '/platforms/leetcode' },
      { icon: Triangle, label: 'AtCoder', href: '/platforms/atcoder' },
      { icon: Hexagon, label: 'CodeChef', href: '/platforms/codechef' },
    ],
  },
  {
    header: 'TOOLS',
    items: [
      { icon: Search, label: 'Find Similar', href: '/similar' },
      { icon: Settings, label: 'Settings', href: '/profile' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col"
      style={{
        width: 240,
        backgroundColor: '#131A26',
        borderRight: '1px solid #232B3A',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2"
        style={{ padding: '20px 24px' }}
      >
        <Zap size={20} style={{ color: '#4C8DFF' }} />
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 18,
            color: '#E8EAED',
          }}
        >
          CP Times
        </span>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.header}>
            <div
              style={{
                padding: '0 16px',
                marginTop: 24,
                marginBottom: 8,
                fontSize: 11,
                fontWeight: 600,
                color: '#7C8698',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {section.header}
            </div>

            {section.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center no-underline"
                  style={{
                    height: 36,
                    padding: '0 16px',
                    gap: 10,
                    borderRadius: 8,
                    margin: '0 8px',
                    backgroundColor: active ? '#1A2332' : 'transparent',
                    transition: 'background-color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#1A2332';
                      const label = e.currentTarget.querySelector(
                        '[data-label]'
                      ) as HTMLElement | null;
                      const icon = e.currentTarget.querySelector(
                        '[data-icon]'
                      ) as HTMLElement | null;
                      if (label) label.style.color = '#E8EAED';
                      if (icon) icon.style.color = '#E8EAED';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      const label = e.currentTarget.querySelector(
                        '[data-label]'
                      ) as HTMLElement | null;
                      const icon = e.currentTarget.querySelector(
                        '[data-icon]'
                      ) as HTMLElement | null;
                      if (label) label.style.color = '#7C8698';
                      if (icon) icon.style.color = '#7C8698';
                    }
                  }}
                >
                  {/* Active indicator */}
                  {active && (
                    <div
                      className="absolute left-0 top-1/2"
                      style={{
                        width: 3,
                        height: 20,
                        backgroundColor: '#4C8DFF',
                        borderRadius: 2,
                        transform: 'translateY(-50%)',
                      }}
                    />
                  )}

                  <Icon
                    data-icon
                    size={18}
                    className="shrink-0"
                    style={{ color: active ? '#E8EAED' : '#7C8698' }}
                  />

                  <span
                    data-label
                    style={{
                      fontSize: 14,
                      fontWeight: 400,
                      color: active ? '#E8EAED' : '#7C8698',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom user section */}
      <div
        style={{
          borderTop: '1px solid #232B3A',
          padding: 16,
        }}
      >
        {user ? (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: '#1A2332',
              }}
            >
              <span
                style={{
                  color: '#4C8DFF',
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {(user.username || user.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Name & email */}
            <div className="flex-1 min-w-0">
              <div
                className="truncate"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#E8EAED',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {user.username || 'User'}
              </div>
              <div
                className="truncate"
                style={{
                  fontSize: 12,
                  color: '#7C8698',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {user.email || ''}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="shrink-0 flex items-center justify-center"
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
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center no-underline"
            style={{
              height: 36,
              borderRadius: 8,
              backgroundColor: '#4C8DFF',
              color: '#E8EAED',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
