'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, AlertCircle } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

// Format timestamp to relative time
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Simple markdown renderer for Claude's responses
function renderMarkdown(content: string) {
  // Handle bold text
  let result = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Handle inline code
  result = result.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>'
  );
  // Handle line breaks
  result = result.replace(/\n/g, '<br />');
  // Handle checkboxes
  result = result.replace(
    /\[ \]/g,
    '<span class="inline-block w-4 h-4 border rounded mr-1 align-middle"></span>'
  );
  result = result.replace(
    /\[x\]/g,
    '<span class="inline-block w-4 h-4 border rounded mr-1 align-middle bg-primary text-primary-foreground text-center text-xs leading-4">&#10003;</span>'
  );

  return <span dangerouslySetInnerHTML={{ __html: result }} />;
}

export function MessageBubble({
  message,
  isCurrentUser = false,
  showAvatar = true,
  showTimestamp = true,
  onSuggestionClick,
}: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant';
  const hasError = message.metadata?.error;
  const suggestions = message.metadata?.suggestions || [];

  return (
    <div
      className={cn(
        'flex gap-3',
        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          {isAssistant ? (
            <>
              <AvatarImage src="" alt="Claude" />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage src={message.userAvatar} alt={message.userName} />
              <AvatarFallback className="bg-blue-500 text-white">
                {message.userName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </>
          )}
        </Avatar>
      )}

      <div className={cn('flex flex-col gap-2 max-w-[80%]')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isAssistant
              ? 'bg-muted'
              : 'bg-primary text-primary-foreground',
            hasError && 'border border-destructive'
          )}
        >
          <div className="text-sm">
            {isAssistant ? renderMarkdown(message.content) : message.content}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {showTimestamp && (
              <p
                className={cn(
                  'text-xs',
                  isCurrentUser
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                )}
                suppressHydrationWarning
              >
                {formatTimestamp(new Date(message.timestamp))}
              </p>
            )}
            {hasError && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {message.metadata?.error || 'Failed to send'}
              </span>
            )}
          </div>
        </div>

        {/* Suggestion buttons */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
