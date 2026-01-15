'use client';

/**
 * Claude Suggestions Component
 *
 * Displays proactive suggestions from Claude based on context.
 * Shows smart recommendations like schedule analysis, reminders, etc.
 *
 * @module components/claude/claude-suggestions
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Calendar,
  Mail,
  ShoppingCart,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  X,
  RefreshCw,
  Lightbulb,
  Loader2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface Suggestion {
  id: string;
  type: 'schedule' | 'email' | 'task' | 'shopping' | 'reminder' | 'insight';
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high';
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  dismissable?: boolean;
  metadata?: {
    relatedItems?: string[];
    expiresAt?: Date;
  };
}

interface ClaudeSuggestionsProps {
  suggestions?: Suggestion[];
  onDismiss?: (id: string) => void;
  onAction?: (suggestion: Suggestion) => void;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// SAMPLE SUGGESTIONS (for demo/testing)
// ============================================================================

export const sampleSuggestions: Suggestion[] = [
  {
    id: '1',
    type: 'schedule',
    title: 'Busy afternoon ahead',
    description: "You have 3 meetings tomorrow between 1-4pm. The 2:30pm client call might conflict with school pickup at 3pm.",
    priority: 'high',
    action: {
      label: 'View schedule',
      href: '/calendar',
    },
    dismissable: true,
  },
  {
    id: '2',
    type: 'shopping',
    title: 'Grocery list needs attention',
    description: "It's been 2 weeks since your last grocery run. Based on past patterns, you might be running low on milk and bread.",
    priority: 'normal',
    action: {
      label: 'Update list',
      href: '/vault?type=shopping',
    },
    dismissable: true,
  },
  {
    id: '3',
    type: 'email',
    title: 'Important emails waiting',
    description: "You have 3 unread emails from your manager. One mentions tomorrow's presentation.",
    priority: 'high',
    action: {
      label: 'Check emails',
    },
    dismissable: true,
  },
  {
    id: '4',
    type: 'insight',
    title: 'Family dinner opportunity',
    description: "Everyone's schedules are free this Saturday evening. Perfect for a family dinner!",
    priority: 'low',
    action: {
      label: 'Plan dinner',
    },
    dismissable: true,
  },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const SuggestionIcon: React.FC<{ type: Suggestion['type']; className?: string }> = ({
  type,
  className,
}) => {
  const icons: Record<Suggestion['type'], React.ElementType> = {
    schedule: Calendar,
    email: Mail,
    task: CheckCircle2,
    shopping: ShoppingCart,
    reminder: Clock,
    insight: Lightbulb,
  };

  const colors: Record<Suggestion['type'], string> = {
    schedule: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    email: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    task: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    shopping: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    reminder: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    insight: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
  };

  const Icon = icons[type];

  return (
    <div className={cn('p-2 rounded-lg', colors[type], className)}>
      <Icon className="h-4 w-4" />
    </div>
  );
};

const PriorityIndicator: React.FC<{ priority: Suggestion['priority'] }> = ({
  priority,
}) => {
  if (priority === 'low') return null;

  return (
    <Badge
      variant={priority === 'high' ? 'destructive' : 'warning'}
      className="text-xs"
    >
      {priority === 'high' ? (
        <>
          <AlertTriangle className="h-3 w-3 mr-1" />
          Important
        </>
      ) : (
        'Suggested'
      )}
    </Badge>
  );
};

// ============================================================================
// SUGGESTION CARD
// ============================================================================

interface SuggestionCardProps {
  suggestion: Suggestion;
  onDismiss?: (id: string) => void;
  onAction?: (suggestion: Suggestion) => void;
  compact?: boolean;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onDismiss,
  onAction,
  compact = false,
}) => {
  const handleAction = () => {
    if (suggestion.action?.onClick) {
      suggestion.action.onClick();
    }
    onAction?.(suggestion);
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer',
          suggestion.priority === 'high' && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
        )}
        onClick={handleAction}
      >
        <SuggestionIcon type={suggestion.type} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{suggestion.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {suggestion.description}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all',
        suggestion.priority === 'high' && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
      )}
    >
      <div className="flex items-start gap-3">
        <SuggestionIcon type={suggestion.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{suggestion.title}</h4>
            <PriorityIndicator priority={suggestion.priority} />
          </div>
          <p className="text-sm text-muted-foreground">
            {suggestion.description}
          </p>
          {suggestion.action && (
            <div className="mt-3 flex items-center gap-2">
              {suggestion.action.href ? (
                <Button asChild size="sm" variant="outline">
                  <a href={suggestion.action.href}>
                    {suggestion.action.label}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleAction}>
                  {suggestion.action.label}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
        {suggestion.dismissable && onDismiss && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDismiss(suggestion.id)}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClaudeSuggestions({
  suggestions = [],
  onDismiss,
  onAction,
  onRefresh,
  isLoading = false,
  className,
  compact = false,
}: ClaudeSuggestionsProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sort by priority
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Claude is analyzing your day...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Sparkles className="h-8 w-8 opacity-50" />
            <p className="text-sm">No suggestions right now</p>
            <p className="text-xs">
              Claude will offer helpful tips as they become relevant
            </p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check for suggestions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Claude&apos;s Suggestions
          </CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4 text-muted-foreground',
                  isRefreshing && 'animate-spin'
                )}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onDismiss={onDismiss}
            onAction={onAction}
            compact={compact}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// INLINE SUGGESTIONS (for embedding in other components)
// ============================================================================

interface InlineSuggestionProps {
  suggestion: Suggestion;
  onDismiss?: () => void;
  onAction?: () => void;
  className?: string;
}

export function InlineSuggestion({
  suggestion,
  onDismiss,
  onAction,
  className,
}: InlineSuggestionProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200/50 dark:border-purple-800/50',
        className
      )}
    >
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">Claude suggests: </span>
          {suggestion.description}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {suggestion.action && (
          <Button size="sm" onClick={onAction}>
            {suggestion.action.label}
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="icon-sm" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUGGESTION BANNER (for top of page)
// ============================================================================

interface SuggestionBannerProps {
  suggestion: Suggestion;
  onDismiss?: () => void;
  onAction?: () => void;
  className?: string;
}

export function SuggestionBanner({
  suggestion,
  onDismiss,
  onAction,
  className,
}: SuggestionBannerProps) {
  const priorityStyles = {
    high: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
    normal: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
    low: 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b',
        priorityStyles[suggestion.priority],
        className
      )}
    >
      <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0" />
      <p className="text-sm flex-1">
        <span className="font-medium">{suggestion.title}: </span>
        {suggestion.description}
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        {suggestion.action && (
          <Button size="sm" variant="outline" onClick={onAction}>
            {suggestion.action.label}
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="icon-sm" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
