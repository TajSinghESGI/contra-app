/**
 * SSE wrapper for the CONTRA debate streaming endpoint.
 * Uses react-native-sse for EventSource support in React Native.
 */

import EventSource from 'react-native-sse';
import { useAuthStore } from '@/store/authStore';

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
// DebateSSE class
// ---------------------------------------------------------------------------

export class DebateSSE {
  private eventSource: EventSource | null = null;

  connect(
    debateId: string,
    onToken: (token: SSEToken) => void,
    onError: (error: any) => void,
    onDone: (messageId: string, score: number) => void,
  ): void {
    this.disconnect();

    const token = useAuthStore.getState().token;
    const url = `${BASE_URL}/api/debates/${debateId}/messages/stream/?token=${token}`;

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

  connect(
    challengeId: string,
    onEvent: (event: ChallengeSSEEvent) => void,
    onError: (error: unknown) => void,
  ): void {
    this.disconnect();

    const token = useAuthStore.getState().token;
    const url = `${BASE_URL}/api/challenges/${challengeId}/stream/?token=${token}`;

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
