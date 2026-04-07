import type { ScoreResult } from '@/store/debateStore';
import { useAuthStore } from '@/store/authStore';
import { captureError, addBreadcrumb } from '@/services/errorReporting';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.contra-app.cloud';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface Topic {
  id: string;
  label: string;
  question: string;
  description: string;
  icon: string;
  category: string;
  category_label: string;
  category_emoji: string;
  is_active: boolean;
  is_topic_of_day: boolean;
  participant_count: number;
  is_public: boolean;
  created_by_name: string | null;
  expires_at: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface RankingEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  title: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  pseudo: string;
  initial: string;
  avatar_bg: string;
  avatar_url: string;
  level: string;
  total_score: number;
  total_debates: number;
  current_streak: number;
  longest_streak: number;
  subscription_tier: string;
  trial_expires_at: string | null;
  has_used_trial: boolean;
  default_difficulty: string;
  selected_topics: string[];
  language: string;
  badges?: { badge_id: string; level: number; unlocked_at: string }[];
}

/** Returns true if the user has no active access (free tier or expired trial). */
export function isTrialExpired(user: AuthUser | null): boolean {
  if (!user) return false;
  // Free tier = same restrictions as expired trial
  if (user.subscription_tier === 'free') return true;
  if (user.subscription_tier !== 'trial') return false;
  if (!user.trial_expires_at) return false;
  return new Date(user.trial_expires_at) < new Date();
}

/** Returns true if the user has an active subscription or an active trial. */
export function hasActiveAccess(user: AuthUser | null): boolean {
  if (!user) return false;
  return !isTrialExpired(user);
}

export async function startTrial(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/start-trial/', { method: 'POST' });
}

interface AuthResponse {
  user: AuthUser;
  token: string;
  refresh: string;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login/', {
    method: 'POST',
    body: { email, password },
  });
}

export async function apiRegister(
  email: string,
  password: string,
  pseudo: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register/', {
    method: 'POST',
    body: { email, password, pseudo },
  });
}

export async function checkExists(field: 'email' | 'pseudo', value: string): Promise<boolean> {
  const params = `field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`;
  const res = await apiFetch<{ exists: boolean }>(`/api/auth/check-exists/?${params}`);
  return res.exists;
}

export async function sendRegisterOtp(email: string): Promise<string | null> {
  const res = await apiFetch<{ detail: string; code?: string }>('/api/auth/send-register-otp/', {
    method: 'POST',
    body: { email },
  });
  return res.code ?? null;
}

export async function verifyRegisterOtp(email: string, code: string): Promise<{ verified: boolean }> {
  return apiFetch('/api/auth/verify-register-otp/', {
    method: 'POST',
    body: { email, code },
  });
}

export async function getProfile(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/profile/');
}

export async function updateProfile(data: Partial<{
  pseudo: string;
  default_difficulty: string;
  selected_topics: string[];
  language: string;
}>): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/profile/', {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteAccount(): Promise<void> {
  await apiFetch<void>('/api/auth/delete-account/', { method: 'DELETE' });
}

export async function uploadAvatar(uri: string): Promise<{ avatar_url: string }> {
  const token = getAuthToken();
  const formData = new FormData();
  const filename = uri.split('/').pop() ?? 'avatar.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpeg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  formData.append('avatar', {
    uri,
    name: filename,
    type: mimeType,
  } as any);

  const response = await fetch(`${BASE_URL}/api/auth/avatar/`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Generic fetch helper
// ---------------------------------------------------------------------------

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
  _isRetry = false,
  _retryCount = 0,
): Promise<T> {
  const { method = 'GET', body } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = getAuthToken();
  if (token !== null) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // Auto-refresh on 401 (expired token) — retry once
  if (response.status === 401 && !_isRetry && token) {
    const newToken = await useAuthStore.getState().refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, true, _retryCount);
    }
  }

  // Retry transient server errors with exponential backoff (1s, 2s, 4s)
  if ([502, 503, 504].includes(response.status) && _retryCount < 3) {
    await new Promise(res => setTimeout(res, Math.pow(2, _retryCount) * 1000));
    return apiFetch<T>(path, options, _isRetry, _retryCount + 1);
  }

  if (!response.ok) {
    let errorMessage = `API error ${response.status}: ${response.statusText}`;
    let errorCode = '';
    try {
      const errorBody = (await response.json()) as { detail?: string; message?: string; code?: string };
      errorMessage = errorBody.detail ?? errorBody.message ?? errorMessage;
      errorCode = errorBody.code ?? '';
    } catch {
      // Ignore JSON parse errors on error responses
    }
    const err = new Error(errorMessage) as Error & { code?: string };
    err.code = errorCode;
    // Report 4xx/5xx to Sentry (skip 401 which is handled by token refresh)
    if (response.status !== 401) {
      captureError(err, { action: `${method} ${path}`, extra: { status: response.status, code: errorCode } });
    }
    throw err;
  }

  // 204 No Content — no body to parse
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export interface TopicFilters {
  category?: string;
  search?: string;
  lang?: string;
  limit?: number;
  offset?: number;
}

export async function getTopics(filters: TopicFilters = {}): Promise<PaginatedResponse<Topic>> {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  if (filters.lang) params.set('lang', filters.lang);
  params.set('limit', String(filters.limit ?? 20));
  params.set('offset', String(filters.offset ?? 0));
  return apiFetch<PaginatedResponse<Topic>>(`/api/topics/?${params.toString()}`);
}

export async function proposeTopic(data: { question: string; category: string; description?: string; is_public: boolean }): Promise<{ id: string; question: string }> {
  return apiFetch('/api/topics/propose/', { method: 'POST', body: data });
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  order: number;
}

export async function getCategories(lang?: string): Promise<Category[]> {
  const query = lang ? `?lang=${lang}` : '';
  return apiFetch<Category[]>(`/api/topics/categories/${query}`);
}

// ---------------------------------------------------------------------------
// Debates
// ---------------------------------------------------------------------------

interface CreateDebateResponse {
  id: string;
  topic: string;
  max_turns: number;
}

export async function createDebate(
  topicIdOrText: string,
  difficulty: string,
): Promise<CreateDebateResponse> {
  // If it looks like a slug (no spaces), treat as topic_id; otherwise topic_text
  const isSlug = /^[a-z0-9-]+$/.test(topicIdOrText);
  const body = isSlug
    ? { topic_id: topicIdOrText, difficulty }
    : { topic_text: topicIdOrText, difficulty };
  return apiFetch<CreateDebateResponse>('/api/debates/', {
    method: 'POST',
    body,
  });
}

interface SendMessageResponse {
  messageId: string;
}

// Backend returns snake_case; normalise to camelCase here.
interface RawSendMessageResponse {
  message_id: string;
}

export async function sendMessage(
  debateId: string,
  content: string,
): Promise<SendMessageResponse> {
  const raw = await apiFetch<RawSendMessageResponse>(
    `/api/debates/${debateId}/messages/`,
    {
      method: 'POST',
      body: { content },
    },
  );
  return { messageId: raw.message_id };
}

export interface DebateHistoryEntry {
  id: string;
  topic: string;
  score: number;
  difficulty: string;
  date: string;
  result: 'win' | 'loss' | 'tie';
  type?: 'solo' | '1v1';
  opponent?: string;
  opponent_avatar_url?: string;
  opponent_avatar_bg?: string;
  opponent_initial?: string;
}

export interface DebateHistoryPage {
  results: DebateHistoryEntry[];
  next_cursor: string | null;
}

export async function getDebateHistory(cursor?: string): Promise<DebateHistoryPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiFetch<DebateHistoryPage>(`/api/debates/history/${query}`);
}

export interface ActiveDebate {
  id: string;
  topic_id: string | null;
  topic: string;
  difficulty: string;
  current_turn: number;
  max_turns: number;
  started_at: string;
}

export async function getActiveDebates(): Promise<ActiveDebate[]> {
  return apiFetch<ActiveDebate[]>('/api/debates/active/');
}

export async function abandonDebate(debateId: string): Promise<void> {
  await apiFetch(`/api/debates/${debateId}/abandon/`, { method: 'POST' });
}

export async function stopDebate(debateId: string): Promise<void> {
  await apiFetch(`/api/debates/${debateId}/stop/`, { method: 'POST' });
}

export interface DebateDetailMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  turn_number: number;
  score: number | null;
  created_at: string;
}

export interface DebateDetail {
  id: string;
  topic_id: string | null;
  topic_text: string;
  difficulty: string;
  current_turn: number;
  max_turns: number;
  is_over: boolean;
  score_logic: number | null;
  score_rhetoric: number | null;
  score_evidence: number | null;
  score_originality: number | null;
  score_total: number | null;
  verdict: string;
  analysis: string;
  started_at: string;
  ended_at: string | null;
  messages: DebateDetailMessage[];
}

export async function getDebate(debateId: string): Promise<DebateDetail> {
  return apiFetch<DebateDetail>(`/api/debates/${debateId}/`);
}

export interface UserStats {
  total_debates: number;
  total_score: number;
  current_streak: number;
  longest_streak: number;
  level: string;
  criteria: {
    logic: number;
    rhetoric: number;
    evidence: number;
    originality: number;
  };
  daily_used: number;
  daily_limit: number | null;
}

export async function getUserStats(): Promise<UserStats> {
  return apiFetch<UserStats>('/api/debates/stats/');
}

export async function getDebateScore(debateId: string): Promise<ScoreResult> {
  return apiFetch<ScoreResult>(`/api/debates/${debateId}/score/`);
}

export interface AnalysisSection {
  title: string;
  body: string;
}

export async function getDebateAnalysis(debateId: string): Promise<{ sections: AnalysisSection[] }> {
  return apiFetch<{ sections: AnalysisSection[] }>(`/api/debates/${debateId}/analysis/`);
}

export interface CoachArgument {
  userText: string;
  aiVerdict: string;
  suggestion: string;
  scoreImpact: number;
  criterion: string;
}

export interface MissedArgument {
  title: string;
  fullText: string;
}

export interface CoachingData {
  user_arguments: CoachArgument[];
  missed_arguments: MissedArgument[];
}

export async function getDebateCoaching(debateId: string): Promise<CoachingData> {
  return apiFetch<CoachingData>(`/api/debates/${debateId}/coach/`);
}

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------

export async function getGlobalRankings(league?: string): Promise<RankingEntry[]> {
  const params = league ? `?league=${league}` : '';
  return apiFetch<RankingEntry[]>(`/api/rankings/global/${params}`);
}

export async function getFriendsRankings(): Promise<RankingEntry[]> {
  return apiFetch<RankingEntry[]>('/api/rankings/friends/');
}

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export interface Friend {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  avatarUrl: string;
  level: string;
  score: number;
}

export async function getFriends(): Promise<Friend[]> {
  return apiFetch<Friend[]>('/api/friends/');
}

export async function searchUsers(query: string): Promise<Friend[]> {
  return apiFetch<Friend[]>(`/api/users/search/?q=${encodeURIComponent(query)}`);
}

export async function removeFriend(userId: string): Promise<void> {
  await apiFetch(`/api/friends/${userId}/remove/`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Friend Requests
// ---------------------------------------------------------------------------

export type FriendRequestDirection = 'incoming' | 'outgoing';
export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  from: Friend;
  to: Friend;
  status: FriendRequestStatus;
  direction: FriendRequestDirection;
  createdAt: string;
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  return apiFetch<FriendRequest[]>('/api/friends/requests/');
}

export async function sendFriendRequest(userId: string): Promise<FriendRequest> {
  return apiFetch<FriendRequest>(`/api/friends/requests/${userId}/`, { method: 'POST' });
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await apiFetch(`/api/friends/requests/${requestId}/accept/`, { method: 'PATCH' });
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  await apiFetch(`/api/friends/requests/${requestId}/decline/`, { method: 'PATCH' });
}

/** Register a referral — called at signup when the user came from an invite link. */
export async function registerReferral(referrerId: string): Promise<void> {
  await apiFetch('/api/friends/referral/', { method: 'POST', body: { referrer_id: referrerId } });
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export interface ChallengeCriteria {
  logic: number;
  rhetoric: number;
  evidence: number;
  originality: number;
}

export interface Challenge {
  id: string;
  from: Friend;
  to: Friend;
  topic: string;
  topic_label: string;
  difficulty: string;
  status: ChallengeStatus;
  current_turn: number;
  max_turns: number;
  whose_turn_id: string | null;
  from_score?: number;
  to_score?: number;
  from_criteria?: ChallengeCriteria;
  to_criteria?: ChallengeCriteria;
  created_at: string;
}

export async function getChallenges(): Promise<Challenge[]> {
  return apiFetch<Challenge[]>('/api/challenges/');
}

export async function getChallenge(id: string): Promise<Challenge> {
  return apiFetch<Challenge>(`/api/challenges/${id}/`);
}

export async function createChallenge(toUserId: string, topic: string, topicLabel: string, maxTurns: string | number = 6): Promise<Challenge> {
  return apiFetch<Challenge>('/api/challenges/create/', {
    method: 'POST',
    body: { to_user_id: toUserId, topic, topic_label: topicLabel, max_turns: Number(maxTurns) },
  });
}

export async function acceptChallenge(id: string): Promise<void> {
  await apiFetch(`/api/challenges/${id}/accept/`, { method: 'PATCH' });
}

export async function declineChallenge(id: string): Promise<void> {
  await apiFetch(`/api/challenges/${id}/decline/`, { method: 'PATCH' });
}

export async function createChallengeDebate(challengeId: string): Promise<{ id: string; topic: string }> {
  return apiFetch<{ id: string; topic: string }>(`/api/challenges/${challengeId}/debate/`, { method: 'POST' });
}

export interface ChallengeMessageData {
  id: string;
  user: Friend;
  content: string;
  turn_number: number;
  created_at: string;
}

export interface ChallengeDetail extends Challenge {
  current_turn: number;
  max_turns: number;
  whose_turn_id: string | null;
  messages: ChallengeMessageData[];
}

export async function getChallengeDetail(challengeId: string): Promise<ChallengeDetail> {
  return apiFetch<ChallengeDetail>(`/api/challenges/${challengeId}/`);
}

export async function sendChallengeMessage(challengeId: string, content: string): Promise<ChallengeMessageData> {
  return apiFetch<ChallengeMessageData>(`/api/challenges/${challengeId}/messages/`, {
    method: 'POST',
    body: { content },
  });
}

// ---------------------------------------------------------------------------
// Challenge coaching
// ---------------------------------------------------------------------------

export interface ChallengeCoaching {
  strengths: { name: string; score: number }[];
  improvements: string[];
  tip: string;
}

export async function getChallengeCoaching(challengeId: string): Promise<ChallengeCoaching> {
  return apiFetch<ChallengeCoaching>(`/api/challenges/${challengeId}/coaching/`);
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

export interface ActivityEntry {
  id: string;
  initial: string;
  bg: string;
  avatarUrl?: string;
  name: string;
  snippet: string;
  time: string;
}

export async function getActivityFeed(): Promise<ActivityEntry[]> {
  return apiFetch<ActivityEntry[]>('/api/activity/');
}

// ---------------------------------------------------------------------------
// Public profile
// ---------------------------------------------------------------------------

export interface PublicProfileDebate {
  id: string;
  topic: string;
  score: number;
  result: 'win' | 'loss';
}

export interface PublicProfile {
  user: {
    id: string;
    name: string;
    initial: string;
    avatarBg: string;
    avatarUrl?: string;
    title: string;
    score: number;
    rank: number;
    totalDebates: number;
  };
  recent_debates: PublicProfileDebate[];
  strengths: { name: string; score: number }[];
}

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  return apiFetch<PublicProfile>(`/api/users/${userId}/profile/`);
}

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------

export async function reportBug(description: string): Promise<void> {
  await apiFetch('/api/support/report/', {
    method: 'POST',
    body: { description },
  });
}

// ---------------------------------------------------------------------------
// SSE token
// ---------------------------------------------------------------------------

/** Get a single-use SSE token (30s TTL) to pass as ?token= in stream URLs. */
export async function getSseToken(): Promise<string> {
  const { token } = await apiFetch<{ token: string }>('/api/auth/sse-token/');
  return token;
}

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------

export async function savePushToken(token: string): Promise<void> {
  await apiFetch('/api/auth/push-token/', {
    method: 'POST',
    body: { token },
  });
}

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch('/api/auth/forgot-password/', {
    method: 'POST',
    body: { email },
  });
}

export async function verifyResetCode(email: string, code: string): Promise<{ reset_token: string }> {
  return apiFetch<{ reset_token: string }>('/api/auth/verify-reset-code/', {
    method: 'POST',
    body: { email, code },
  });
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  await apiFetch('/api/auth/reset-password/', {
    method: 'POST',
    body: { reset_token: resetToken, new_password: newPassword },
  });
}
