import { create } from 'zustand';

// Re-export DIFFICULTY_LEVELS from tokens for convenience
export { DIFFICULTY_LEVELS, SCORE_CRITERIA } from '@/constants/tokens';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'brutal';

export interface DebateMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  isStreaming?: boolean;
  score?: number;
  timestamp: Date;
}

export interface ScoreResult {
  topic: string;
  logic: number;
  rhetoric: number;
  evidence: number;
  originality: number;
  total: number;
  verdict: string;
  analysis: string;
}

export interface DebateState {
  debateId: string | null;
  topicId: string | null;
  topic: string;
  difficulty: DifficultyLevel;
  messages: DebateMessage[];
  currentTurn: number;
  maxTurns: number;
  isStreaming: boolean;
  streamingContent: string;
  score: ScoreResult | null;
  isDebateOver: boolean;

  // actions
  setDebate: (
    id: string,
    topicId: string,
    topic: string,
    difficulty: DifficultyLevel,
  ) => void;
  addMessage: (message: DebateMessage) => void;
  updateStreamingContent: (content: string) => void;
  finalizeStreamingMessage: (messageId: string, score?: number) => void;
  setScore: (score: ScoreResult) => void;
  endDebate: () => void;
  reset: () => void;
}

const initialState: Omit<
  DebateState,
  | 'setDebate'
  | 'addMessage'
  | 'updateStreamingContent'
  | 'finalizeStreamingMessage'
  | 'setScore'
  | 'endDebate'
  | 'reset'
> = {
  debateId: null,
  topicId: null,
  topic: '',
  difficulty: 'medium',
  messages: [],
  currentTurn: 0,
  maxTurns: 6,
  isStreaming: false,
  streamingContent: '',
  score: null,
  isDebateOver: false,
};

export const useDebateStore = create<DebateState>()((set) => ({
  ...initialState,

  setDebate: (
    id: string,
    topicId: string,
    topic: string,
    difficulty: DifficultyLevel,
  ) =>
    set({
      debateId: id,
      topicId,
      topic,
      difficulty,
      // Preserve the maxTurns default; callers can override via reset + setDebate
    }),

  addMessage: (message: DebateMessage) =>
    set((state) => ({
      messages: [...state.messages, message],
      // Increment turn counter when a user message is added
      currentTurn:
        message.role === 'user' ? state.currentTurn + 1 : state.currentTurn,
      // Mark store as streaming when an AI streaming message is added
      isStreaming:
        message.role === 'ai' && message.isStreaming === true
          ? true
          : state.isStreaming,
      // Reset streaming buffer when a fresh streaming AI message is added
      streamingContent:
        message.role === 'ai' && message.isStreaming === true
          ? ''
          : state.streamingContent,
    })),

  /**
   * Appends an incoming SSE token to `streamingContent` and mirrors the
   * accumulated text into the last message when it is still streaming.
   */
  updateStreamingContent: (content: string) =>
    set((state) => {
      const accumulated = state.streamingContent + content;

      const updatedMessages = state.messages.map((msg, index) => {
        if (index === state.messages.length - 1 && msg.isStreaming) {
          return { ...msg, content: accumulated };
        }
        return msg;
      });

      return {
        streamingContent: accumulated,
        messages: updatedMessages,
      };
    }),

  /**
   * Closes out a streaming AI message:
   * - Writes the final accumulated content into the message with `messageId`
   * - Clears the streaming flag on that message
   * - Resets global streaming state
   */
  finalizeStreamingMessage: (messageId: string, score?: number) =>
    set((state) => {
      const finalContent = state.streamingContent;

      const updatedMessages = state.messages.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: finalContent,
            isStreaming: false,
            ...(score !== undefined ? { score } : {}),
          };
        }
        return msg;
      });

      return {
        messages: updatedMessages,
        isStreaming: false,
        streamingContent: '',
      };
    }),

  setScore: (score: ScoreResult) => set({ score }),

  endDebate: () => set({ isDebateOver: true }),

  reset: () => set({ ...initialState }),
}));
