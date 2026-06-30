'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { User, Menu, X, LogOut, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Topbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Contests', path: '/contests' },
    { name: 'Practice', path: '/practice' },
  ];

  return (
    <nav className="h-14 w-full bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-50 flex items-center justify-between px-4 md:px-8">
      {/* Logo Area */}
      <Link href="/" className="flex items-center gap-3 group">
        <img 
          src="/logo.png" 
          alt="CP Times Logo" 
          className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
        />
      </Link>

      {/* Center Links */}
      <div className="hidden md:flex items-center h-full gap-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          
          return (
            <Link 
              key={link.name} 
              href={link.path}
              className={cn(
                "h-full flex items-center px-4 text-sm font-medium transition-colors border-b-2",
                isActive 
                  ? "text-zinc-100 border-indigo-400" 
                  : "text-zinc-500 border-transparent hover:text-zinc-100"
              )}
            >
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-9 h-9 rounded-full bg-[#191919] border border-white/[0.08] flex items-center justify-center hover:border-white/[0.15] transition-colors text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 overflow-hidden"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-[#161616] border border-white/[0.08] rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 px-3 py-3 border-b border-white/[0.08] mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#191919] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-lg text-zinc-100">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-semibold text-zinc-100 truncate">{user?.username}</p>
                    <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setIsProfileDropdownOpen(false);
                    }} 
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="w-9 h-9 rounded-full bg-[#191919] border border-white/[0.08] flex items-center justify-center hover:border-white/[0.15] transition-colors text-zinc-400">
            <User className="w-4 h-4" />
          </Link>
        )}

        <button
          className="md:hidden p-2 text-zinc-500 hover:text-zinc-100"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-14 left-0 w-full bg-[#0c0c0c] border-b border-white/[0.06] flex flex-col md:hidden shadow-lg">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "p-4 border-b border-white/[0.06] text-sm font-medium transition-colors",
                  isActive 
                    ? "text-zinc-100 bg-[#191919]" 
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-100"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
