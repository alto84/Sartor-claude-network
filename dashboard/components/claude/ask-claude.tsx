'use client';

/**
 * Ask Claude Component
 *
 * A floating button that opens a quick ask dialog for Claude.
 * Provides instant access to Claude's help from anywhere in the app.
 *
 * @module components/claude/ask-claude
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle,
  Send,
  Loader2,
  Sparkles,
  X,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface AskClaudeProps {
  onAsk?: (question: string) => Promise<{ answer: string; suggestions?: string[] }>;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

// ============================================================================
// QUICK SUGGESTIONS
// ============================================================================

const quickSuggestions = [
  "What's on my schedule today?",
  "Summarize my unread emails",
  "Any scheduling conflicts this week?",
  "What tasks are due soon?",
  "Help me plan dinner for the family",
];

// ============================================================================
// COMPONENT
// ============================================================================

export function AskClaude({
  onAsk,
  className,
  position = 'bottom-right',
}: AskClaudeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: question.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      let response: { answer: string; suggestions?: string[] };

      if (onAsk) {
        response = await onAsk(question);
      } else {
        // Default API call
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'quick-ask',
            question: question.trim(),
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to get response');
        }

        response = await res.json();
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        suggestions: response.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to ask Claude:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an issue. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  const handleClear = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

  // Position classes for the floating button
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all',
          'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
          'group',
          positionClasses[position],
          className
        )}
        size="icon"
      >
        <Sparkles className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        <span className="sr-only">Ask Claude</span>
      </Button>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 max-h-[80vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-base">Ask Claude</DialogTitle>
                  <DialogDescription className="text-xs">
                    Your helpful family assistant
                  </DialogDescription>
                </div>
              </div>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-xs text-muted-foreground"
                >
                  Clear chat
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
            {/* Quick Suggestions */}
            {showSuggestions && messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  <span>Quick suggestions</span>
                </div>
                <div className="space-y-2">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left text-sm p-3 rounded-lg border hover:bg-muted/50 transition-colors flex items-center justify-between group"
                    >
                      <span>{suggestion}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' && 'justify-end'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-lg p-3 max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Follow-up suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Want to know more?
                      </p>
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs p-2 rounded bg-background/50 hover:bg-background transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Claude is thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t flex-shrink-0">
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="min-h-[60px] max-h-[120px] pr-12 resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSubmit(input)}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// INLINE ASK CLAUDE (for embedding in pages)
// ============================================================================

interface InlineAskClaudeProps {
  onAsk?: (question: string) => Promise<{ answer: string; suggestions?: string[] }>;
  placeholder?: string;
  className?: string;
}

export function InlineAskClaude({
  onAsk,
  placeholder = "Ask Claude anything...",
  className,
}: InlineAskClaudeProps) {
  const [input, setInput] = React.useState('');
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setAnswer(null);
    setSuggestions([]);

    try {
      let response: { answer: string; suggestions?: string[] };

      if (onAsk) {
        response = await onAsk(input);
      } else {
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'quick-ask',
            question: input.trim(),
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to get response');
        }

        response = await res.json();
      }

      setAnswer(response.answer);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to ask Claude:', error);
      setAnswer("I'm sorry, I encountered an issue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </div>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-12 min-h-[60px] resize-none"
          disabled={isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Answer */}
      {answer && (
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm whitespace-pre-wrap">{answer}</p>

              {suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setInput(suggestion);
                        handleSubmit();
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setAnswer(null);
                setSuggestions([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
