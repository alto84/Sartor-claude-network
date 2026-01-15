"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Search, Users, Archive, Sparkles, CheckSquare, FileText, Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/brand/mascot";
import { cn } from "@/lib/utils";

// ============================================
// BASE NESTLY EMPTY STATE
// ============================================

interface NestlyEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  pipExpression?: "happy" | "thinking" | "celebrating" | "sleepy" | "surprised";
  pipMessage?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function NestlyEmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  pipExpression = "happy",
  pipMessage,
  className,
  size = "md",
}: NestlyEmptyStateProps) {
  const sizes = {
    sm: { container: "py-8", pip: "sm" as const, title: "text-lg", desc: "text-sm" },
    md: { container: "py-12", pip: "md" as const, title: "text-xl", desc: "text-base" },
    lg: { container: "py-16", pip: "lg" as const, title: "text-2xl", desc: "text-lg" },
  };

  const s = sizes[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center gap-6 text-center",
        s.container,
        className
      )}
    >
      {/* Pip with optional speech bubble */}
      <div className="relative">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Mascot expression={pipExpression} size={s.pip} animated />
        </motion.div>

        {pipMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-10"
          >
            <div className="relative bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-lg border border-gray-100 dark:border-gray-700 max-w-[180px]">
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white dark:border-r-gray-800 border-b-[6px] border-b-transparent" />
              <p className="text-xs text-gray-700 dark:text-gray-300">{pipMessage}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2 max-w-sm">
        <h3 className={cn("font-semibold text-foreground", s.title)}>
          {title}
        </h3>
        <p className={cn("text-muted-foreground", s.desc)}>
          {description}
        </p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.icon}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// EMPTY VAULT STATE
// ============================================

interface EmptyVaultStateProps {
  onAddItem?: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}

export function EmptyVaultState({
  onAddItem,
  searchQuery,
  onClearSearch,
  className,
}: EmptyVaultStateProps) {
  if (searchQuery) {
    return (
      <NestlyEmptyState
        title={`No results for "${searchQuery}"`}
        description="Try adjusting your search or check the spelling. Pip will help you find what you need!"
        pipExpression="thinking"
        pipMessage="Hmm, let me look harder..."
        action={
          onClearSearch
            ? {
                label: "Clear Search",
                onClick: onClearSearch,
                icon: <Search className="h-4 w-4" />,
              }
            : undefined
        }
        className={className}
      />
    );
  }

  return (
    <NestlyEmptyState
      title="Your vault is empty"
      description="Start organizing your family's important documents, links, and notes. Pip will keep everything safe!"
      pipExpression="happy"
      pipMessage="Let's get organized!"
      action={
        onAddItem
          ? {
              label: "Add First Item",
              onClick: onAddItem,
              icon: <Plus className="h-4 w-4" />,
            }
          : undefined
      }
      className={className}
    />
  );
}

// ============================================
// EMPTY TASKS STATE
// ============================================

interface EmptyTasksStateProps {
  onCreateTask?: () => void;
  filter?: string;
  className?: string;
}

export function EmptyTasksState({
  onCreateTask,
  filter,
  className,
}: EmptyTasksStateProps) {
  if (filter === "completed") {
    return (
      <NestlyEmptyState
        title="No completed tasks yet"
        description="Once you finish some tasks, they'll appear here. Keep up the great work!"
        pipExpression="happy"
        pipMessage="You can do it!"
        className={className}
      />
    );
  }

  if (filter === "errors") {
    return (
      <NestlyEmptyState
        title="No errors to show"
        description="Everything is running smoothly! Pip is happy to report no issues."
        pipExpression="celebrating"
        pipMessage="All clear!"
        className={className}
      />
    );
  }

  return (
    <NestlyEmptyState
      title="No tasks yet"
      description="Ask Claude to help with something, or use the quick tasks to get started. Pip is ready to assist!"
      pipExpression="happy"
      pipMessage="What shall we do today?"
      action={
        onCreateTask
          ? {
              label: "Ask Claude",
              onClick: onCreateTask,
              icon: <Sparkles className="h-4 w-4" />,
            }
          : undefined
      }
      className={className}
    />
  );
}

// ============================================
// EMPTY FAMILY STATE
// ============================================

interface EmptyFamilyStateProps {
  onAddMember?: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}

export function EmptyFamilyState({
  onAddMember,
  searchQuery,
  onClearSearch,
  className,
}: EmptyFamilyStateProps) {
  if (searchQuery) {
    return (
      <NestlyEmptyState
        title={`No family members matching "${searchQuery}"`}
        description="Try a different name or check the spelling."
        pipExpression="thinking"
        action={
          onClearSearch
            ? {
                label: "Clear Search",
                onClick: onClearSearch,
                icon: <Search className="h-4 w-4" />,
              }
            : undefined
        }
        className={className}
      />
    );
  }

  return (
    <NestlyEmptyState
      title="No family members yet"
      description="Add your family members to get started. Pip is excited to meet everyone!"
      pipExpression="happy"
      pipMessage="Who's in the nest?"
      action={
        onAddMember
          ? {
              label: "Add Family Member",
              onClick: onAddMember,
              icon: <Users className="h-4 w-4" />,
            }
          : undefined
      }
      className={className}
    />
  );
}

// ============================================
// EMPTY PROFILE STATE
// ============================================

interface EmptyProfileStateProps {
  onAddInfo?: () => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export function EmptyProfileState({
  onAddInfo,
  hasFilters,
  onClearFilters,
  className,
}: EmptyProfileStateProps) {
  if (hasFilters) {
    return (
      <NestlyEmptyState
        title="No entries match your filters"
        description="Try adjusting your filters to see more results."
        pipExpression="thinking"
        action={
          onClearFilters
            ? {
                label: "Clear Filters",
                onClick: onClearFilters,
              }
            : undefined
        }
        className={className}
      />
    );
  }

  return (
    <NestlyEmptyState
      title="No profile information yet"
      description="Help Claude remember you better by adding personal info, preferences, and goals. Pip will keep track!"
      pipExpression="happy"
      pipMessage="Tell me about yourself!"
      action={
        onAddInfo
          ? {
              label: "Add Your First Entry",
              onClick: onAddInfo,
              icon: <Plus className="h-4 w-4" />,
            }
          : undefined
      }
      className={className}
    />
  );
}

// ============================================
// EMPTY CALENDAR STATE
// ============================================

interface EmptyCalendarStateProps {
  onCreateEvent?: () => void;
  className?: string;
}

export function EmptyCalendarState({
  onCreateEvent,
  className,
}: EmptyCalendarStateProps) {
  return (
    <NestlyEmptyState
      title="No events scheduled"
      description="Your calendar is clear! Pip thinks this is a good day to plan something fun."
      pipExpression="happy"
      pipMessage="A free day? Lucky!"
      action={
        onCreateEvent
          ? {
              label: "Create Event",
              onClick: onCreateEvent,
              icon: <Calendar className="h-4 w-4" />,
            }
          : undefined
      }
      className={className}
    />
  );
}

// ============================================
// EMPTY CHAT STATE
// ============================================

interface EmptyChatStateProps {
  onStartChat?: () => void;
  className?: string;
}

export function EmptyChatState({
  onStartChat,
  className,
}: EmptyChatStateProps) {
  return (
    <NestlyEmptyState
      title="No messages yet"
      description="Start a conversation with Claude. Ask about your schedule, get help with tasks, or just chat!"
      pipExpression="happy"
      pipMessage="Hi there! How can I help?"
      action={
        onStartChat
          ? {
              label: "Start Chatting",
              onClick: onStartChat,
              icon: <MessageCircle className="h-4 w-4" />,
            }
          : undefined
      }
      className={className}
    />
  );
}

// ============================================
// EMPTY DOCUMENTS STATE
// ============================================

interface EmptyDocumentsStateProps {
  onUpload?: () => void;
  className?: string;
}

export function EmptyDocumentsState({
  onUpload,
  className,
}: EmptyDocumentsStateProps) {
  return (
    <NestlyEmptyState
      title="No documents yet"
      description="Upload important family documents to keep them safe and organized."
      pipExpression="happy"
      pipMessage="I'll guard them!"
      action={
        onUpload
          ? {
              label: "Upload Document",
              onClick: onUpload,
              icon: <FileText className="h-4 w-4" />,
            }
          : undefined
      }
      className={className}
    />
  );
}

// ============================================
// EMPTY STARRED STATE
// ============================================

interface EmptyStarredStateProps {
  className?: string;
}

export function EmptyStarredState({ className }: EmptyStarredStateProps) {
  return (
    <NestlyEmptyState
      title="No starred items"
      description="Star your most important items for quick access. Pip will keep your favorites handy!"
      pipExpression="happy"
      pipMessage="Star the good stuff!"
      size="sm"
      className={className}
    />
  );
}

// ============================================
// OFFLINE STATE
// ============================================

interface OfflineStateProps {
  onRetry?: () => void;
  className?: string;
}

export function OfflineState({
  onRetry,
  className,
}: OfflineStateProps) {
  return (
    <NestlyEmptyState
      title="You're offline"
      description="Please check your internet connection. Pip will wait patiently!"
      pipExpression="sleepy"
      pipMessage="Waiting for signal..."
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
            }
          : undefined
      }
      className={className}
    />
  );
}

// ============================================
// COMING SOON STATE
// ============================================

interface ComingSoonStateProps {
  feature?: string;
  className?: string;
}

export function ComingSoonState({
  feature = "This feature",
  className,
}: ComingSoonStateProps) {
  return (
    <NestlyEmptyState
      title="Coming Soon!"
      description={`${feature} is still being built. Pip is working hard on it!`}
      pipExpression="thinking"
      pipMessage="Almost ready..."
      className={className}
    />
  );
}
