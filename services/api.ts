import type { ScoreResult } from '@/store/debateStore';
import { useAuthStore } from '@/store/authStore';

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
  expires_at: string;
  created_at: string;
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
  full_name: string;
  initial: string;
  avatar_bg: string;
  level: string;
  total_score: number;
  total_debates: number;
  current_streak: number;
  longest_streak: number;
  subscription_tier: string;
  default_difficulty: string;
  selected_topics: string[];
  language: string;
  badges?: { badge_id: string; level: number; unlocked_at: string }[];
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
  fullName: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register/', {
    method: 'POST',
    body: { email, password, full_name: fullName },
  });
}

export async function getProfile(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/profile/');
}

export async function updateProfile(data: Partial<{
  full_name: string;
  default_difficulty: string;
  selected_topics: string[];
  language: string;
}>): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/profile/', {
    method: 'PATCH',
    body: data,
  });
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

  if (!response.ok) {
    let errorMessage = `API error ${response.status}: ${response.statusText}`;
    try {
      const errorBody = (await response.json()) as { detail?: string; message?: string };
      errorMessage = errorBody.detail ?? errorBody.message ?? errorMessage;
    } catch {
      // Ignore JSON parse errors on error responses
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export async function getTopics(category?: string, lang?: string): Promise<Topic[]> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (lang) params.set('lang', lang);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<Topic[]>(`/api/topics/${query}`);
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
  result: 'win' | 'loss';
}

export async function getDebateHistory(): Promise<DebateHistoryEntry[]> {
  return apiFetch<DebateHistoryEntry[]>('/api/debates/history/');
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

export async function getGlobalRankings(): Promise<RankingEntry[]> {
  return apiFetch<RankingEntry[]>('/api/rankings/global/');
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
  topicLabel: string;
  difficulty: string;
  status: ChallengeStatus;
  fromScore?: number;
  toScore?: number;
  fromCriteria?: ChallengeCriteria;
  toCriteria?: ChallengeCriteria;
  createdAt: string;
}

export async function getChallenges(): Promise<Challenge[]> {
  return apiFetch<Challenge[]>('/api/challenges/');
}

export async function getChallenge(id: string): Promise<Challenge> {
  return apiFetch<Challenge>(`/api/challenges/${id}/`);
}

export async function createChallenge(toUserId: string, topic: string, topicLabel: string, difficulty: string): Promise<Challenge> {
  return apiFetch<Challenge>('/api/challenges/', {
    method: 'POST',
    body: { to_user_id: toUserId, topic, topic_label: topicLabel, difficulty },
  });
}

export async function acceptChallenge(id: string): Promise<void> {
  await apiFetch(`/api/challenges/${id}/accept/`, { method: 'PATCH' });
}

export async function declineChallenge(id: string): Promise<void> {
  await apiFetch(`/api/challenges/${id}/decline/`, { method: 'PATCH' });
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

export interface ActivityEntry {
  id: string;
  initial: string;
  bg: string;
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
    title: string;
    score: number;
    rank: number;
  };
  recent_debates: PublicProfileDebate[];
  strengths: string[];
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
