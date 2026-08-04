'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await register(formData);
      router.push('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        className="max-w-md w-full space-y-8 bg-[#161B22] border border-[#30363D] rounded p-8 relative overflow-hidden"
      >
        <div>
          <h2 className="text-center text-2xl font-semibold text-[#E6EDF3] tracking-tight">
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-[#8B949E]">
            Join the ultimate CP platform
          </p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#E6EDF3]">Username</label>
              <input
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-[#161B22] border border-[#30363D] rounded text-[#E6EDF3] placeholder-[#8B949E] text-sm focus:outline-none focus:border-[#E6EDF3] focus:ring-0 transition-colors duration-100"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#E6EDF3]">Email</label>
              <input
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-[#161B22] border border-[#30363D] rounded text-[#E6EDF3] placeholder-[#8B949E] text-sm focus:outline-none focus:border-[#E6EDF3] focus:ring-0 transition-colors duration-100"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#E6EDF3]">Password</label>
              <input
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-[#161B22] border border-[#30363D] rounded text-[#E6EDF3] placeholder-[#8B949E] text-sm focus:outline-none focus:border-[#E6EDF3] focus:ring-0 transition-colors duration-100"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 text-sm font-medium rounded bg-[#E6EDF3] text-[#0D1117] hover:bg-white transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>
        <div className="text-center text-sm">
          <span className="text-[#8B949E]">Already have an account? </span>
          <Link href="/login" className="font-medium text-[#8B949E] hover:text-[#E6EDF3] transition-colors duration-100">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
