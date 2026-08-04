import type { PlatformInfo } from '@/types';

export const API_BASE_URL = '/api';

export const PLATFORMS: PlatformInfo[] = [
  {
    key: 'CODEFORCES',
    name: 'Codeforces',
    color: '#FF6B5E',
    icon: 'Code2',
    gradient: '',
  },
  {
    key: 'LEETCODE',
    name: 'LeetCode',
    color: '#F5A623',
    icon: 'Terminal',
    gradient: '',
  },
  {
    key: 'ATCODER',
    name: 'AtCoder',
    color: '#2EC4B6',
    icon: 'Triangle',
    gradient: '',
  },
  {
    key: 'CODECHEF',
    name: 'CodeChef',
    color: '#A78BFA',
    icon: 'Hexagon',
    gradient: '',
  },
];

export const PLATFORM_MAP = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p])
) as Record<string, PlatformInfo>;

/** CF rating-tier colors for division/difficulty tags */
export const DIV_COLORS: Record<string, string> = {
  'Div. 1': '#FF6B5E',
  'Div. 2': '#4C8DFF',
  'Div. 3': '#2EC4B6',
  'Div. 4': '#7C8698',
  'Div 1': '#FF6B5E',
  'Div 2': '#4C8DFF',
  'Div 3': '#2EC4B6',
  'Div 4': '#7C8698',
  div1: '#FF6B5E',
  div2: '#4C8DFF',
  div3: '#2EC4B6',
  div4: '#7C8698',
};
