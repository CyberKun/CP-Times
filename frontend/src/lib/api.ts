import axios from 'axios';
import { API_BASE_URL } from './constants';
import type { Contest, ProblemFilterRequest, Page, Problem } from '@/types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const contestApi = {
  getAll: (platforms?: string[], phases?: string[]) =>
    api.get<Contest[]>('/contests', {
      params: {
        platforms: platforms?.join(','),
        phases: phases?.join(','),
      },
    }),

  getUpcoming: () => api.get<Contest[]>('/contests', { params: { upcoming: 'true' } }),

  getLive: () => api.get<Contest[]>('/contests'), // You can add logic for live later if needed

  refresh: () => api.get('/cron/sync?secret=cp-aggregator-cron-secret'),
};

export const problemApi = {
  search: (filters: ProblemFilterRequest) => {
    // Next.js uses standard GET params instead of POST
    const params = new URLSearchParams();
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.platforms && filters.platforms.length > 0) params.append('platform', filters.platforms[0]);
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.maxRating) params.append('maxRating', filters.maxRating.toString());
    if (filters.difficulties && filters.difficulties.length > 0) params.append('difficulty', filters.difficulties.join(','));
    if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.sortBy) params.append('sort', `${filters.sortBy},${filters.sortDir || 'asc'}`);

    return api.get<Page<Problem>>(`/problems?${params.toString()}`);
  }
};

export const authApi = {
  login: (data: any) => api.post<any>('/auth/login', data),
  register: (data: any) => api.post<any>('/auth/register', data),
};

export const userApi = {
  getMe: () => api.get<any>('/user'),
  updateProfile: (data: any) => api.put<any>('/user', data),
  updatePassword: (data: any) => api.put<any>('/user/password', data),
  linkPlatform: (data: { platform: string; handle: string }) => api.post<any>('/user/platforms', data),
  unlinkPlatform: (platform: string) => api.delete<any>(`/user/platforms?platform=${platform}`),
  syncData: () => api.post<any>('/user/sync'),
};

export const similarApi = {
  /** Phase 3: get similar problems for a seed problem ID */
  findSimilar: (problemId: string) =>
    api.get<any>(`/problems/similar?id=${encodeURIComponent(problemId)}`),

  /** Phase 4c: look up a problem by URL (no mock-create) */
  lookupUrl: (url: string) =>
    api.post<any>('/problems/index-url', { url, lookup_only: true }),

  /** Phase 4b: prefix autocomplete over all problems */
  autocomplete: (query: string) =>
    api.get<any>(`/problems/autocomplete?q=${encodeURIComponent(query)}`),

  /** Phase 4a: unsolved problems in a contest for auto-surface */
  getUnsolved: (contestId: string) =>
    api.get<any>(`/problems/unsolved?contestId=${encodeURIComponent(contestId)}`),
};

export default api;
