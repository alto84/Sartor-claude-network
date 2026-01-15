'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { AlertCircle } from 'lucide-react';
import type { ChatMessage, SendMessageRequest } from '@/types/chat';

interface ChatContainerProps {
  initialMessages?: ChatMessage[];
  userId: string;
  userName: string;
  userAvatar?: string;
  sessionId?: string;
  className?: string;
  onSendMessage?: (request: SendMessageRequest) => Promise<ChatMessage>;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ChatContainer({
  initialMessages = [],
  userId,
  userName,
  userAvatar,
  sessionId,
  className,
  onSendMessage,
}: ChatContainerProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError(null);

    // Create optimistic user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      userId,
      userName,
      userAvatar,
    };

    // Add user message immediately (optimistic update)
    setMessages((prev) => [...prev, userMessage]);

    try {
      if (onSendMessage) {
        // Use custom handler if provided
        const response = await onSendMessage({
          content: content.trim(),
          userId,
          userName,
          sessionId,
        });
        setMessages((prev) => [...prev, response]);
      } else {
        // Default API call
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content.trim(),
            userId,
            userName,
            sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();

        // Add Claude's response
        const assistantMessage: ChatMessage = {
          id: data.id || generateId(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(data.timestamp || Date.now()),
          userId: 'claude',
          userName: 'Claude',
          metadata: {
            suggestions: data.suggestions,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');

      // Mark the user message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? { ...msg, metadata: { ...msg.metadata, error: 'Failed to send' } }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm border-b">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto hover:opacity-70"
          >
            &times;
          </button>
        </div>
      )}

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Message list */}
        <MessageList
          messages={messages}
          currentUserId={userId}
          isTyping={isLoading}
          className="flex-1"
          onSuggestionClick={handleSuggestionClick}
        />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          placeholder="Ask Claude anything..."
        />
      </CardContent>
    </Card>
  );
}
