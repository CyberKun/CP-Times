'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(formData);
      router.push('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="max-w-md w-full space-y-8 bg-[#111111] border border-white/[0.08] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-8 relative overflow-hidden"
      >
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-center text-2xl font-semibold text-zinc-100 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Sign in to continue your CP journey
          </p>
        </div>
        <form className="mt-8 space-y-5 relative z-10" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300">Username</label>
              <input
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="text-center text-sm relative z-10">
          <span className="text-zinc-500">Don&apos;t have an account? </span>
          <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Register here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
