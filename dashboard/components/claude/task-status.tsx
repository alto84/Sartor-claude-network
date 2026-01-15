'use client';

/**
 * Task Status Component
 *
 * Displays the status of Claude Code background tasks with
 * real-time updates, progress indicators, and results.
 *
 * @module components/claude/task-status
 */

import * as React from 'react';
import { cn, formatTimestamp } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  FolderTree,
  FileText,
  Sparkles,
  MessageCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import type { ClaudeTask, ClaudeTaskType, ClaudeTaskStatus } from '@/lib/claude-code';

// ============================================================================
// TYPES
// ============================================================================

interface TaskStatusProps {
  tasks: ClaudeTask[];
  onRetry?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
  className?: string;
  showCompleted?: boolean;
  maxVisible?: number;
}

interface TaskItemProps {
  task: ClaudeTask;
  onRetry?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
  defaultExpanded?: boolean;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const TaskTypeIcon: React.FC<{ type: ClaudeTaskType; className?: string }> = ({
  type,
  className,
}) => {
  const icons: Record<ClaudeTaskType, React.ElementType> = {
    analyze: BarChart3,
    organize: FolderTree,
    summarize: FileText,
    generate: Sparkles,
    answer: MessageCircle,
  };

  const Icon = icons[type];
  return <Icon className={cn('h-4 w-4', className)} />;
};

const StatusIcon: React.FC<{ status: ClaudeTaskStatus; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'pending':
      return <Clock className={cn('h-4 w-4 text-yellow-600', className)} />;
    case 'running':
      return <Loader2 className={cn('h-4 w-4 text-blue-600 animate-spin', className)} />;
    case 'complete':
      return <CheckCircle2 className={cn('h-4 w-4 text-green-600', className)} />;
    case 'error':
      return <XCircle className={cn('h-4 w-4 text-red-600', className)} />;
    default:
      return null;
  }
};

const StatusBadge: React.FC<{ status: ClaudeTaskStatus }> = ({ status }) => {
  const variants: Record<ClaudeTaskStatus, 'warning' | 'info' | 'success' | 'destructive'> = {
    pending: 'warning',
    running: 'info',
    complete: 'success',
    error: 'destructive',
  };

  const labels: Record<ClaudeTaskStatus, string> = {
    pending: 'Pending',
    running: 'Running',
    complete: 'Complete',
    error: 'Failed',
  };

  return (
    <Badge variant={variants[status]} className="text-xs">
      <StatusIcon status={status} className="h-3 w-3 mr-1" />
      {labels[status]}
    </Badge>
  );
};

// ============================================================================
// TASK ITEM COMPONENT
// ============================================================================

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onRetry,
  onCancel,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const typeLabels: Record<ClaudeTaskType, string> = {
    analyze: 'Analysis',
    organize: 'Organization',
    summarize: 'Summary',
    generate: 'Generation',
    answer: 'Answer',
  };

  const truncatedPrompt = task.prompt.length > 60
    ? task.prompt.substring(0, 60) + '...'
    : task.prompt;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all',
        task.status === 'running' && 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20',
        task.status === 'error' && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20',
        task.status === 'complete' && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            <TaskTypeIcon type={task.type} className="text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {typeLabels[task.type]}
              </span>
              <StatusBadge status={task.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              {expanded ? task.prompt : truncatedPrompt}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatTimestamp(task.createdAt)}
              {task.metadata?.actualDuration && (
                <span className="ml-2">
                  Duration: {task.metadata.actualDuration}s
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.status === 'pending' && onCancel && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onCancel(task.id)}
              title="Cancel task"
            >
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          {task.status === 'error' && onRetry && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onRetry(task.id)}
              title="Retry task"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          {(task.result || task.error || task.prompt.length > 60) && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t">
          {task.status === 'running' && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Claude is working on this...</span>
            </div>
          )}

          {task.result && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3">
                {task.result}
              </div>
            </div>
          )}

          {task.error && (
            <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-950/20 rounded-md p-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{task.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TaskStatus({
  tasks,
  onRetry,
  onCancel,
  className,
  showCompleted = true,
  maxVisible = 10,
}: TaskStatusProps) {
  const [showAll, setShowAll] = React.useState(false);

  // Separate tasks by status
  const runningTasks = tasks.filter(t => t.status === 'running');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'complete');
  const errorTasks = tasks.filter(t => t.status === 'error');

  // Combine and limit visible tasks
  const visibleTasks = showAll
    ? tasks
    : [
        ...runningTasks,
        ...pendingTasks,
        ...errorTasks,
        ...(showCompleted ? completedTasks : []),
      ].slice(0, maxVisible);

  const hasMore = tasks.length > maxVisible;

  if (tasks.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs mt-1">
              Ask Claude to analyze, summarize, or generate content
            </p>
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
            Claude Tasks
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {runningTasks.length > 0 && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                {runningTasks.length} running
              </span>
            )}
            {pendingTasks.length > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-yellow-600" />
                {pendingTasks.length} pending
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onRetry={onRetry}
            onCancel={onCancel}
            defaultExpanded={task.status === 'running'}
          />
        ))}

        {hasMore && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowAll(true)}
          >
            Show {tasks.length - maxVisible} more tasks
          </Button>
        )}

        {showAll && hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowAll(false)}
          >
            Show less
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT TASK STATUS (for sidebar/header)
// ============================================================================

interface CompactTaskStatusProps {
  tasks: ClaudeTask[];
  onClick?: () => void;
  className?: string;
}

export function CompactTaskStatus({
  tasks,
  onClick,
  className,
}: CompactTaskStatusProps) {
  const runningCount = tasks.filter(t => t.status === 'running').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const errorCount = tasks.filter(t => t.status === 'error').length;

  if (runningCount === 0 && pendingCount === 0 && errorCount === 0) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('gap-2', className)}
    >
      {runningCount > 0 && (
        <span className="flex items-center gap-1 text-blue-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          {runningCount}
        </span>
      )}
      {pendingCount > 0 && (
        <span className="flex items-center gap-1 text-yellow-600">
          <Clock className="h-3 w-3" />
          {pendingCount}
        </span>
      )}
      {errorCount > 0 && (
        <span className="flex items-center gap-1 text-red-600">
          <XCircle className="h-3 w-3" />
          {errorCount}
        </span>
      )}
    </Button>
  );
}

// ============================================================================
// TASK SUMMARY STATS
// ============================================================================

interface TaskSummaryProps {
  stats: {
    pending: number;
    running: number;
    completed: number;
    errors: number;
    totalToday: number;
    averageDuration: number;
  };
  className?: string;
}

export function TaskSummary({ stats, className }: TaskSummaryProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <div>
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-2xl font-bold">{stats.running}</p>
            <p className="text-xs text-muted-foreground">Running</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <div>
            <p className="text-2xl font-bold">{stats.totalToday}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
