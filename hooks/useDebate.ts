import { useCallback, useEffect, useRef } from 'react';

import { sendMessage as apiSendMessage } from '@/services/api';
import { DebateSSE } from '@/services/sse';
import { useDebateStore } from '@/store/debateStore';
import type { DebateMessage, DifficultyLevel, ScoreResult } from '@/store/debateStore';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseDebateReturn {
  messages: DebateMessage[];
  isStreaming: boolean;
  currentTurn: number;
  maxTurns: number;
  topic: string;
  difficulty: DifficultyLevel;
  isDebateOver: boolean;
  score: ScoreResult | null;
  sendMessage: (content: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDebate(): UseDebateReturn {
  const {
    debateId,
    topic,
    difficulty,
    messages,
    isStreaming,
    currentTurn,
    maxTurns,
    isDebateOver,
    score,
    addMessage,
    updateStreamingContent,
    finalizeStreamingMessage,
    endDebate,
  } = useDebateStore();

  // One SSE instance per hook lifetime — recreated on each send
  const sseRef = useRef<DebateSSE>(new DebateSSE());

  // Disconnect SSE when the component using this hook unmounts
  useEffect(() => {
    const sse = sseRef.current;
    return () => {
      sse.disconnect();
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (debateId === null) {
        throw new Error('No active debate. Call setDebate before sending messages.');
      }

      if (isStreaming) {
        // Guard: don't allow a second send while the AI is still responding
        return;
      }

      // 1. Optimistically add the user message
      const userMessage: DebateMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      // 2. Add an empty streaming placeholder for the AI reply
      const placeholderId = `ai-${Date.now()}`;
      const aiPlaceholder: DebateMessage = {
        id: placeholderId,
        role: 'ai',
        content: '',
        isStreaming: true,
        timestamp: new Date(),
      };
      addMessage(aiPlaceholder);

      // 3. Connect SSE FIRST — so we don't miss any tokens
      sseRef.current.connect(
        debateId,

        // onToken — append each incoming fragment
        (token) => {
          if (token.type === 'token' && token.content !== undefined) {
            updateStreamingContent(token.content);
          }
        },

        // onError — clear the streaming flag so the UI unlocks
        (_error) => {
          finalizeStreamingMessage(placeholderId);
        },

        // onDone — commit the accumulated content, attach per-message score
        (_doneMessageId, score) => {
          finalizeStreamingMessage(placeholderId, score);

          // Check if the debate has reached its turn limit
          const state = useDebateStore.getState();
          if (state.currentTurn >= state.maxTurns) {
            endDebate();
          }
        },
      );

      // 4. THEN send the message to the backend (triggers Celery → Claude → Redis pub/sub)
      await apiSendMessage(debateId, content);
    },
    [
      debateId,
      isStreaming,
      addMessage,
      updateStreamingContent,
      finalizeStreamingMessage,
      endDebate,
    ],
  );

  return {
    messages,
    isStreaming,
    currentTurn,
    maxTurns,
    topic,
    difficulty,
    isDebateOver,
    score,
    sendMessage,
  };
}
