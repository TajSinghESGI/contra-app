/**
 * SSE wrapper for the CONTRA debate streaming endpoint.
 * Uses react-native-sse for EventSource support in React Native.
 * Includes automatic retry with exponential backoff.
 */

import EventSource from 'react-native-sse';
import { useAuthStore } from '@/store/authStore';
import { getSseToken } from '@/services/api';
import { captureError } from '@/services/errorReporting';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.contra-app.cloud';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SSEToken {
  type: 'token' | 'done' | 'error' | 'score_ready';
  content?: string;
  message_id?: string;
  score?: number;
  is_over?: boolean;
}

// ---------------------------------------------------------------------------
// DebateSSE class — with retry logic
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

export class DebateSSE {
  private eventSource: EventSource | null = null;
  private retryCount = 0;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  async connect(
    debateId: string,
    onToken: (token: SSEToken) => void,
    onError: (error: any) => void,
    onDone: (messageId: string, score: number) => void,
  ): Promise<void> {
    this.disconnect();
    this.retryCount = 0;
    await this._connect(debateId, onToken, onError, onDone);
  }

  private async _connect(
    debateId: string,
    onToken: (token: SSEToken) => void,
    onError: (error: any) => void,
    onDone: (messageId: string, score: number) => void,
  ): Promise<void> {
    let sseToken: string;
    try {
      sseToken = await getSseToken();
    } catch {
      // Fallback to JWT if token endpoint is unreachable
      sseToken = useAuthStore.getState().token ?? '';
    }
    const url = `${BASE_URL}/api/debates/${debateId}/messages/stream/?token=${sseToken}`;

    const es = new EventSource(url, {
      headers: {
        Accept: 'text/event-stream',
      },
    });
    this.eventSource = es;

    es.addEventListener('message', (event: any) => {
      if (!event.data) return;

      let parsed: SSEToken;
      try {
        parsed = JSON.parse(event.data) as SSEToken;
      } catch {
        return;
      }

      if (parsed.type === 'token') {
        // Reset retry count on successful token (connection is alive)
        this.retryCount = 0;
        onToken(parsed);
      } else if (parsed.type === 'done') {
        const messageId = parsed.message_id ?? '';
        const score = parsed.score ?? 0;
        onDone(messageId, score);
        this.disconnect();
      } else if (parsed.type === 'error') {
        onError(new Error(parsed.content ?? 'Unknown error'));
        this.disconnect();
      }
    });

    es.addEventListener('error', (error: any) => {
      this.eventSource?.close();
      this.eventSource = null;

      // Attempt retry with backoff
      if (this.retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[this.retryCount] ?? 4000;
        this.retryCount++;
        this.retryTimeout = setTimeout(() => {
          this._connect(debateId, onToken, onError, onDone);
        }, delay);
      } else {
        // All retries exhausted — report + notify caller
        captureError(error, { action: 'SSE connect', extra: { debateId, retries: MAX_RETRIES } });
        onError(error);
      }
    });
  }

  disconnect(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.eventSource !== null) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Challenge SSE (1v1 turn-by-turn)
// ---------------------------------------------------------------------------

export interface ChallengeSSEEvent {
  type: 'opponent_move' | 'ai_comment' | 'turn_change' | 'debate_over';
  content?: string;
  comment?: string;
  currentTurn?: 'me' | 'opponent';
  turnNumber?: number;
  scores?: {
    fromScore: number;
    toScore: number;
    fromCriteria: { logic: number; rhetoric: number; evidence: number; originality: number };
    toCriteria: { logic: number; rhetoric: number; evidence: number; originality: number };
  };
}

export class ChallengeSSE {
  private eventSource: EventSource | null = null;

  async connect(
    challengeId: string,
    onEvent: (event: ChallengeSSEEvent) => void,
    onError: (error: unknown) => void,
  ): Promise<void> {
    this.disconnect();

    let sseToken: string;
    try {
      sseToken = await getSseToken();
    } catch {
      sseToken = useAuthStore.getState().token ?? '';
    }
    const url = `${BASE_URL}/api/challenges/${challengeId}/stream/?token=${sseToken}`;

    const es = new EventSource(url);
    this.eventSource = es;

    es.addEventListener('message', (event: any) => {
      if (!event.data) return;
      try {
        const parsed = JSON.parse(event.data) as ChallengeSSEEvent;
        onEvent(parsed);

        if (parsed.type === 'debate_over') {
          this.disconnect();
        }
      } catch {
        // Skip malformed frames
      }
    });

    es.addEventListener('error', (error: any) => {
      onError(error);
      this.disconnect();
    });
  }

  disconnect(): void {
    if (this.eventSource !== null) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
