'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/api';
import { Link as LinkIcon, RefreshCw, Trophy, Flame, Target, Hexagon, Camera, Trash2, ExternalLink } from 'lucide-react';
import { PLATFORMS, PLATFORM_MAP } from '@/lib/constants';
import { AppShell } from '@/components/layout/AppShell';
import { getPlatformIcon } from '@/components/icons/PlatformIcons';
import { getPlatformColor, cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, isAuthenticated, loading, refreshUser } = useAuth();
  const router = useRouter();
  
  const [handle, setHandle] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('CODEFORCES');
  const [isLinking, setIsLinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [profileForm, setProfileForm] = useState({ username: '', email: '', avatarUrl: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/webp', 0.8);
          setProfileForm(prev => ({ ...prev, avatarUrl: dataUrl }));
          
          setIsUpdatingProfile(true);
          userApi.updateProfile({ ...profileForm, avatarUrl: dataUrl })
            .then(() => {
              setMessage({ text: 'Avatar updated successfully!', type: 'success' });
              refreshUser();
            })
            .catch((err) => {
              setMessage({ text: err.response?.data?.message || 'Failed to update avatar', type: 'error' });
            })
            .finally(() => setIsUpdatingProfile(false));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh] w-full">
          <div className="w-10 h-10 border-2 border-[#E6EDF3] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  const handleLinkPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    setMessage({ text: '', type: '' });
    try {
      await userApi.linkPlatform({ platform: selectedPlatform, handle });
      setMessage({ text: 'Platform linked successfully!', type: 'success' });
      setHandle('');
      await refreshUser();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to link platform', type: 'error' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkPlatform = async (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to unlink ${platform}?`)) return;
    
    setMessage({ text: '', type: '' });
    try {
      await userApi.unlinkPlatform(platform);
      setMessage({ text: 'Platform unlinked successfully!', type: 'success' });
      await refreshUser();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to unlink platform', type: 'error' });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage({ text: '', type: '' });
    try {
      await userApi.syncData();
      setMessage({ text: 'Data synced successfully!', type: 'success' });
      await refreshUser();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to sync data', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setMessage({ text: '', type: '' });
    try {
      await userApi.updateProfile(profileForm);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      await refreshUser();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const openPlatformProfile = (platform: string, handle: string) => {
    let url = '';
    switch (platform) {
      case 'CODEFORCES': url = `https://codeforces.com/profile/${handle}`; break;
      case 'LEETCODE': url = `https://leetcode.com/${handle}`; break;
      case 'ATCODER': url = `https://atcoder.jp/users/${handle}`; break;
      case 'CODECHEF': url = `https://www.codechef.com/users/${handle}`; break;
    }
    if (url) window.open(url, '_blank');
  };

  return (
    <AppShell>
      <div className="w-full relative pb-20">
        {/* Banner — flat, no gradient */}
        <div className="w-full h-48 bg-[#0D1117] relative overflow-hidden border-b border-[#30363D]">
        </div>

        <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
          
          {message.text && (
            <div
              className={`mb-6 p-4 rounded border text-sm ${message.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}
            >
              {message.text}
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            accept="image/*" 
            className="hidden" 
          />

          <div
            className="bg-[#161B22] border border-[#30363D] rounded p-8 lg:p-10 relative overflow-hidden flex flex-col lg:flex-row gap-10"
          >
            {/* Left Section: User Identity & Profile Form */}
            <div className="w-full lg:w-1/3 flex flex-col gap-8">
              
              <div className="flex flex-col items-center text-center">
                <div 
                  className="relative mb-6 group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileForm.avatarUrl || user?.avatarUrl ? (
                    <img 
                      src={profileForm.avatarUrl || user?.avatarUrl} 
                      alt="Avatar" 
                      className="w-28 h-28 rounded-full bg-[#161B22] border-4 border-[#0D1117] relative z-10 object-cover group-hover:opacity-80 transition-opacity duration-100"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-[#1C2128] border-4 border-[#0D1117] relative z-10 flex items-center justify-center text-4xl font-semibold text-[#8B949E] uppercase group-hover:opacity-80 transition-opacity duration-100">
                      {user?.username?.charAt(0) || 'U'}
                    </div>
                  )}
                  
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                    <div className="bg-black/60 p-2 rounded-full">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="absolute -bottom-1.5 -right-1.5 bg-[#E6EDF3] text-[#0D1117] w-8 h-8 rounded-full border-4 border-[#0D1117] flex items-center justify-center z-30">
                    <Hexagon className="w-4 h-4 fill-current" />
                  </div>
                </div>

                <h1 className="text-xl font-semibold text-[#E6EDF3] tracking-tight mb-0.5">{user?.username}</h1>
                <p className="text-[#8B949E] text-sm mb-6 flex items-center gap-1.5 justify-center">
                  <Target className="w-3.5 h-3.5 text-[#8B949E]" /> {user?.email}
                </p>

                <div className="w-full p-4 rounded bg-[#0D1117] border border-[#30363D] flex items-center justify-between mb-6">
                  <div className="text-left">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#8B949E] mb-1">Total Solved</p>
                    <p className="text-3xl font-mono font-semibold text-[#E6EDF3]">
                      {user?.totalSolved || 0}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded bg-[#161B22] flex items-center justify-center border border-[#30363D]">
                    <Trophy className="w-5 h-5 text-[#8B949E]" />
                  </div>
                </div>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8B949E] mb-1">
                  Profile Details
                </h3>
                <div>
                  <label className="block text-xs font-medium text-[#8B949E] mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full bg-[#161B22] border border-[#30363D] rounded px-3 py-2.5 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#E6EDF3] focus:ring-0 transition-colors duration-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B949E] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-[#161B22] border border-[#30363D] rounded px-3 py-2.5 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#E6EDF3] focus:ring-0 transition-colors duration-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="mt-2 py-2.5 bg-[#161B22] border border-[#30363D] hover:bg-[#1C2128] rounded text-[#E6EDF3] text-sm font-medium tracking-wide transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                </button>
              </form>

            </div>

            {/* Right Section: Linked Platforms */}
            <div className="w-full lg:w-2/3 flex flex-col">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#E6EDF3] tracking-tight">Personal information</h2>
                  <p className="text-[#8B949E] text-sm mt-1">Manage your connected competitive programming profiles</p>
                </div>
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded bg-[#161B22] border border-[#30363D] hover:bg-[#1C2128] text-sm font-medium text-[#E6EDF3] transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#E6EDF3]' : 'text-[#8B949E] group-hover:text-[#E6EDF3] transition-colors duration-100'}`} />
                  {isSyncing ? 'Syncing...' : 'Sync All Data'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {user?.platforms && user.platforms.length > 0 ? (
                  user.platforms.map((p) => {
                    const info = PLATFORM_MAP[p.platform];
                    return (
                      <div 
                        key={p.platform} 
                        onClick={() => openPlatformProfile(p.platform, p.handle)}
                        className="group relative overflow-hidden rounded bg-[#0D1117] border border-[#30363D] hover:bg-[#1C2128] transition-colors duration-100 cursor-pointer p-5 flex flex-col h-full"
                      >
                        {/* Unlink Button */}
                        <button 
                          onClick={(e) => handleUnlinkPlatform(p.platform, e)}
                          className="absolute top-4 right-4 p-1.5 rounded hover:bg-red-500/10 text-[#8B949E] hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-100 z-10"
                          title="Unlink Platform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="absolute top-4 right-12 p-1.5 rounded text-[#8B949E] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-100 z-10">
                          <ExternalLink className="w-4 h-4" />
                        </div>

                        <div className="flex items-center gap-3.5 mb-4 mt-1">
                          <div className="w-10 h-10 rounded bg-[#161B22] flex items-center justify-center border border-[#30363D]">
                            <div style={{ color: getPlatformColor(p.platform) }}>
                              {getPlatformIcon(p.platform, "w-5 h-5")}
                            </div>
                          </div>
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-[#8B949E]">{info?.name || p.platform}</p>
                            <p className="text-sm font-semibold text-[#E6EDF3] tracking-tight">{p.handle}</p>
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-3 border-t border-[#30363D] flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8B949E]">
                            <Flame className="w-3 h-3 text-[#8B949E]" />
                            Active
                          </div>
                          {p.syncedAt && (
                            <div className="text-[10px] text-[#8B949E] font-mono">
                              {new Date(p.syncedAt).toLocaleDateString()} {new Date(p.syncedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-[#30363D] rounded bg-[#0D1117]">
                    <div className="w-14 h-14 rounded bg-[#161B22] flex items-center justify-center mb-4 text-[#8B949E] border border-[#30363D]">
                      <LinkIcon className="w-7 h-7" />
                    </div>
                    <p className="text-[#E6EDF3] font-semibold text-sm mb-1">No platforms connected</p>
                    <p className="text-[#8B949E] text-sm max-w-sm text-center">Link your coding profiles below to start aggregating your stats.</p>
                  </div>
                )}
              </div>

              <div className="relative mt-auto">
                <form onSubmit={handleLinkPlatform} className="relative p-5 rounded border border-[#30363D] bg-[#0D1117]">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8B949E] mb-4 flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5" /> Link New Platform
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative sm:w-1/3">
                      <select 
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="w-full bg-[#161B22] border border-[#30363D] rounded pl-3 pr-8 py-2.5 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#E6EDF3] focus:ring-0 appearance-none cursor-pointer transition-colors duration-100"
                      >
                        {PLATFORMS.map(p => (
                          <option key={p.key} value={p.key} className="bg-[#161B22] text-[#E6EDF3]">{p.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-[#8B949E]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                    
                    <input
                      type="text"
                      required
                      placeholder="Enter your platform handle"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="flex-1 bg-[#161B22] border border-[#30363D] rounded px-3 py-2.5 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#E6EDF3] focus:ring-0 placeholder-[#8B949E] transition-colors duration-100"
                    />
                    
                    <button
                      type="submit"
                      disabled={isLinking}
                      className="sm:w-28 py-2.5 bg-[#E6EDF3] text-[#0D1117] rounded text-sm font-medium transition-colors duration-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLinking ? 'Linking...' : 'Connect'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
