'use client';

/**
 * Claude Tasks Page
 *
 * Displays all Claude Code background tasks with filtering,
 * status tracking, and the ability to retry/cancel tasks.
 *
 * @module app/tasks/page
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TaskStatus,
  TaskSummary,
} from '@/components/claude/task-status';
import {
  ClaudeSuggestions,
  sampleSuggestions,
} from '@/components/claude/claude-suggestions';
import { InlineAskClaude } from '@/components/claude/ask-claude';
import { useClaude, useClaudeStats } from '@/hooks/use-claude';
import {
  Sparkles,
  Plus,
  RefreshCw,
  BarChart3,
  FolderTree,
  FileText,
  MessageCircle,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';
import type { ClaudeTaskType } from '@/lib/claude-code';

// ============================================================================
// QUICK TASK TEMPLATES
// ============================================================================

interface QuickTaskTemplate {
  type: ClaudeTaskType;
  label: string;
  prompt: string;
  icon: React.ElementType;
  color: string;
}

const quickTasks: QuickTaskTemplate[] = [
  {
    type: 'analyze',
    label: 'Analyze Schedule',
    prompt: 'Analyze my calendar for the next week and identify any scheduling conflicts or tight transitions.',
    icon: BarChart3,
    color: 'text-blue-600',
  },
  {
    type: 'summarize',
    label: 'Summarize Emails',
    prompt: 'Summarize my recent emails, highlighting action items and important dates.',
    icon: FileText,
    color: 'text-purple-600',
  },
  {
    type: 'organize',
    label: 'Organize Tasks',
    prompt: 'Review my pending tasks and suggest an optimal order based on priority and deadlines.',
    icon: FolderTree,
    color: 'text-green-600',
  },
  {
    type: 'generate',
    label: 'Weekly Report',
    prompt: 'Generate a friendly weekly family summary including completed tasks, upcoming events, and highlights.',
    icon: Sparkles,
    color: 'text-orange-600',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TasksPage() {
  const {
    tasks,
    suggestions,
    isLoading,
    isCreating,
    isFetchingSuggestions,
    error,
    runTask,
    retryTask,
    cancelTask,
    refreshTasks,
    fetchSuggestions,
    dismissSuggestion,
    clearError,
  } = useClaude({ autoFetch: true });

  const { stats, isLoading: isLoadingStats, refetch: refetchStats } = useClaudeStats();

  const [activeTab, setActiveTab] = React.useState('all');

  // Filter tasks based on active tab
  const filteredTasks = React.useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return tasks.filter(t => t.status === 'pending');
      case 'running':
        return tasks.filter(t => t.status === 'running');
      case 'completed':
        return tasks.filter(t => t.status === 'complete');
      case 'errors':
        return tasks.filter(t => t.status === 'error');
      default:
        return tasks;
    }
  }, [tasks, activeTab]);

  // Handle quick task creation
  const handleQuickTask = async (template: QuickTaskTemplate) => {
    await runTask(template.type, template.prompt, {
      priority: 'normal',
      createdBy: 'user',
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([refreshTasks(), refetchStats()]);
  };

  // Tab counts
  const tabCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'complete').length,
    errors: tasks.filter(t => t.status === 'error').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Claude Tasks
          </h1>
          <p className="text-muted-foreground">
            Background tasks powered by Claude Code
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          <XCircle className="h-4 w-4" />
          <span className="text-sm flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Stats Summary */}
      {stats && <TaskSummary stats={stats} />}

      {/* Quick Ask */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Ask Claude
          </CardTitle>
          <CardDescription>
            Ask a quick question or start a background task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InlineAskClaude placeholder="Ask Claude anything or describe a task..." />
        </CardContent>
      </Card>

      {/* Quick Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Quick Tasks
          </CardTitle>
          <CardDescription>
            Common tasks Claude can help with
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickTasks.map((template) => (
              <Button
                key={template.type}
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => handleQuickTask(template)}
                disabled={isCreating}
              >
                <template.icon className={cn('h-5 w-5', template.color)} />
                <span className="text-xs">{template.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks List */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all" className="gap-1">
                All
                {tabCounts.all > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {tabCounts.all}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="running" className="gap-1">
                <Loader2 className={cn('h-3 w-3', tabCounts.running > 0 && 'animate-spin')} />
                Running
                {tabCounts.running > 0 && (
                  <Badge variant="info" className="ml-1 h-5 px-1.5">
                    {tabCounts.running}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-1">
                <Clock className="h-3 w-3" />
                Pending
                {tabCounts.pending > 0 && (
                  <Badge variant="warning" className="ml-1 h-5 px-1.5">
                    {tabCounts.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </TabsTrigger>
              <TabsTrigger value="errors" className="gap-1">
                <XCircle className="h-3 w-3" />
                Errors
                {tabCounts.errors > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                    {tabCounts.errors}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading && tasks.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-sm">Loading tasks...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Sparkles className="h-8 w-8 opacity-50" />
                      <p className="text-sm">
                        {activeTab === 'all'
                          ? 'No tasks yet'
                          : `No ${activeTab} tasks`}
                      </p>
                      <p className="text-xs">
                        Use the quick tasks above or ask Claude something
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <TaskStatus
                  tasks={filteredTasks}
                  onRetry={retryTask}
                  onCancel={cancelTask}
                  showCompleted={true}
                  maxVisible={20}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Suggestions Sidebar */}
        <div className="space-y-4">
          <ClaudeSuggestions
            suggestions={suggestions.length > 0 ? suggestions : sampleSuggestions}
            onDismiss={dismissSuggestion}
            onRefresh={() => fetchSuggestions()}
            isLoading={isFetchingSuggestions}
            compact={true}
          />

          {/* Tips Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Analyze</strong> - Have Claude look for patterns, conflicts, or insights
              </p>
              <p>
                <strong>Summarize</strong> - Get quick summaries of emails, documents, or meetings
              </p>
              <p>
                <strong>Organize</strong> - Let Claude suggest better organization for your items
              </p>
              <p>
                <strong>Generate</strong> - Create reports, plans, or content
              </p>
            </CardContent>
          </Card>

          {/* Stats Card */}
          {stats && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Today&apos;s Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tasks Created</span>
                    <span className="font-medium">{stats.totalToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium text-green-600">
                      {stats.completed}
                    </span>
                  </div>
                  {stats.averageDuration > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg. Duration</span>
                      <span className="font-medium">
                        {stats.averageDuration}s
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
