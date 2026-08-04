export type Platform = 'CODEFORCES' | 'LEETCODE' | 'ATCODER' | 'CODECHEF';
export type ContestPhase = 'BEFORE' | 'CODING' | 'FINISHED';

export interface Contest {
  id: number;
  externalId: string;
  platform: Platform;
  name: string;
  url: string;
  phase: ContestPhase;
  startTime: string; // ISO 8601
  endTime: string | null;
  durationSeconds: number;
  contestType: string | null;
  frozen: boolean;
}

export interface PlatformInfo {
  key: Platform;
  name: string;
  color: string;
  icon: string; // lucide icon name
  gradient: string;
}

export interface Problem {
  id: number;
  externalId: string;
  platform: Platform;
  name: string;
  url: string;
  rating: number | null;
  difficulty: string | null;
  solvedCount: number;
  tags: string[];
  isSolved?: boolean;
  statement_text?: string | null;
  editorial_text?: string | null;
  idf_tag_weights?: Record<string, number> | null;
  constraint_fingerprint?: string | null;
}

export interface ProblemFilterRequest {
  platforms: Platform[];
  minRating?: number;
  maxRating?: number;
  difficulties?: string[];
  tags?: string[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  status?: 'all' | 'solved' | 'unsolved';
  page: number;
  size: number;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page
}

export interface PlatformLink {
  platform: Platform;
  handle: string;
  syncedAt: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  totalSolved: number;
  platforms?: PlatformLink[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface EditorialSegment {
  id: string;
  problemId: string;
  segment_text: string;
  tfidf_vector?: any;
  source: 'explicit_marker' | 'textiling_split' | 'single_fallback';
}

export interface UserAttempt {
  id: string;
  userId: string;
  problemId: string;
  contestId?: string | null;
  verdict: string;
  has_submission: boolean;
}

// ── Similar Problems types ──────────────────────────────────────────────────

export interface SimilarProblemResult {
  id: string;
  externalId: string;
  platform: Platform;
  name: string;
  url: string;
  rating: number | null;
  tags: string[];
  solvedCount: number | null;
}

export interface SimilarBucket {
  label: string;
  ratingRange: [number, number];
  problems: SimilarProblemResult[];
  limited_data: boolean;
}

export interface SimilarProblemsResponse {
  seed_problem: SimilarProblemResult;
  not_indexed: boolean;
  buckets: {
    implementation: SimilarBucket | null;
    understanding: SimilarBucket | null;
    variations: SimilarBucket | null;
  };
}

export interface ProblemLookupResult {
  id?: string;
  name?: string;
  platform?: Platform;
  externalId?: string;
  rating?: number | null;
  tags?: string[];
  has_embedding?: boolean;
  not_indexed?: boolean;
  message?: string;
}

export interface UnsolvedProblem {
  id: string;
  externalId: string;
  platform: Platform;
  name: string;
  url: string;
  rating: number | null;
  tags: string[];
  solvedCount: number | null;
  verdict: string;
  has_embedding: boolean;
}

