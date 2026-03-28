import { useCallback, useEffect, useRef, useState } from 'react';

import { sendMessage as apiSendMessage, getDebate } from '@/services/api';
import { DebateSSE } from '@/services/sse';
import { useDebateStore } from '@/store/debateStore';
import type { DebateMessage, DifficultyLevel, ScoreResult } from '@/store/debateStore';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseDebateReturn {
  messages: DebateMessage[];
  isStreaming: boolean;
  isLoading: boolean;
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

export function useDebate(routeDebateId?: string): UseDebateReturn {
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
    loadDebate,
    addMessage,
    updateStreamingContent,
    finalizeStreamingMessage,
    endDebate,
  } = useDebateStore();

  const [isLoading, setIsLoading] = useState(false);

  // Auto-fetch debate from API if route ID doesn't match store
  useEffect(() => {
    if (!routeDebateId || routeDebateId === debateId) return;
    let cancelled = false;
    setIsLoading(true);
    getDebate(routeDebateId)
      .then((data) => {
        if (!cancelled) {
          loadDebate(data);
          // If the loaded debate has no messages (freshly created), add intro
          if (data.messages.length === 0) {
            const { addMessage } = useDebateStore.getState();
            addMessage({
              id: 'ai-intro',
              role: 'ai',
              content: `Le sujet est : « ${data.topic_text} ».\n\nVeuillez prendre position — pour ou contre — et défendez votre point de vue. Je prendrai automatiquement le camp opposé. Que le débat commence.`,
              timestamp: new Date(),
            });
          }
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.error('[useDebate] Failed to load debate:', e.message);
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeDebateId]);

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
    isLoading,
    currentTurn,
    maxTurns,
    topic,
    difficulty,
    isDebateOver,
    score,
    sendMessage,
  };
}
