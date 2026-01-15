'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import type { ChatMessage } from '@/types/chat';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  isTyping?: boolean;
  className?: string;
  onSuggestionClick?: (suggestion: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  isTyping = false,
  className,
  onSuggestionClick,
}: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toLocaleDateString(
        'en-US',
        {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }
      );

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [] });
      }

      groups[groups.length - 1].messages.push(message);
    });

    return groups;
  }, [messages]);

  // Check if today
  const isToday = (dateString: string) => {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    return dateString === today;
  };

  // Check if yesterday
  const isYesterday = (dateString: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    return dateString === yesterdayString;
  };

  const formatDateHeader = (dateString: string) => {
    if (isToday(dateString)) return 'Today';
    if (isYesterday(dateString)) return 'Yesterday';
    return dateString;
  };

  if (messages.length === 0 && !isTyping) {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center p-8',
          className
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500">
          <span className="text-2xl font-bold text-white">C</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold">Start a conversation</h3>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Hi! I'm Claude, your family assistant. <br />
          Ask me anything - I'm here to help!
        </p>
      </div>
    );
  }

  return (
    <ScrollArea
      ref={scrollRef}
      className={cn('flex-1', className)}
    >
      <div className="flex flex-col gap-4 p-4">
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center justify-center py-4">
              <div
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                suppressHydrationWarning
              >
                {formatDateHeader(group.date)}
              </div>
            </div>

            {/* Messages in this date group */}
            <div className="space-y-4">
              {group.messages.map((message, messageIndex) => {
                const prevMessage =
                  messageIndex > 0 ? group.messages[messageIndex - 1] : null;
                const showAvatar =
                  !prevMessage ||
                  prevMessage.role !== message.role ||
                  prevMessage.userId !== message.userId;

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isCurrentUser={message.userId === currentUserId}
                    showAvatar={showAvatar}
                    showTimestamp={showAvatar}
                    onSuggestionClick={onSuggestionClick}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Invisible element for auto-scroll */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
