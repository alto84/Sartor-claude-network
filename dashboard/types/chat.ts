// Chat message types for Claude-to-family communication

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userAvatar?: string;
  metadata?: {
    toolCalls?: ToolCall[];
    suggestions?: string[];
    isStreaming?: boolean;
    error?: string;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface ChatSession {
  id: string;
  title: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    topic?: string;
    summary?: string;
  };
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'family' | 'claude';
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface SendMessageRequest {
  content: string;
  userId: string;
  userName: string;
  sessionId?: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  suggestions?: string[];
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentSessionId: string | null;
}

// Utility type for optimistic updates
export type OptimisticMessage = Omit<ChatMessage, 'id'> & {
  id?: string;
  isPending?: boolean;
};
