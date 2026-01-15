"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mascot } from "@/components/brand/mascot";
import { Skeleton, SkeletonCard, SkeletonList } from "@/components/ui/loading-states";
import { cn } from "@/lib/utils";

// ============================================
// DASHBOARD LOADING
// ============================================

export function DashboardLoading({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Family Status Card */}
      <SkeletonCard lines={0}>
        <div className="flex flex-wrap gap-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Quote Widget */}
      <SkeletonCard lines={2} />

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard hasHeader lines={4} />
        <SkeletonCard hasHeader lines={4} />
        <SkeletonCard hasHeader lines={3} />
      </div>

      {/* Secondary Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard hasHeader lines={3} />
        <SkeletonCard hasHeader lines={3} />
        <SkeletonCard hasHeader lines={3} />
      </div>
    </div>
  );
}

// ============================================
// PROFILE LOADING
// ============================================

export function ProfileLoading({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} lines={0}>
            <div className="space-y-1">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-7">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>

      {/* Profile Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} hasHeader lines={3} hasFooter />
        ))}
      </div>
    </div>
  );
}

// ============================================
// VAULT LOADING
// ============================================

export function VaultLoading({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Categories */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonCard key={i} lines={0}>
            <div className="flex flex-col items-center text-center gap-2">
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>

      {/* Vault Items Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} hasHeader lines={2}>
            <div className="flex flex-wrap gap-1 pt-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

// ============================================
// TASKS LOADING
// ============================================

export function TasksLoading({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} lines={0}>
            <div className="space-y-1">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-20" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Ask Claude Card */}
      <SkeletonCard hasHeader lines={1}>
        <Skeleton className="h-20 w-full" />
      </SkeletonCard>

      {/* Quick Tasks */}
      <SkeletonCard hasHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </SkeletonCard>

      {/* Tasks List */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-full" />
          <SkeletonList items={5} hasAvatar hasAction />
        </div>
        <div className="space-y-4">
          <SkeletonCard hasHeader lines={4} />
          <SkeletonCard hasHeader lines={3} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// FAMILY LOADING
// ============================================

export function FamilyLoading({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Search */}
      <Skeleton className="h-10 max-w-sm" />

      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* Family Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} lines={0}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <Skeleton variant="circular" width={56} height={56} />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Overview Card */}
      <SkeletonCard hasHeader>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
              <Skeleton className="h-9 w-12 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}

// ============================================
// LOADING WITH PIP
// ============================================

interface LoadingWithPipProps {
  message?: string;
  className?: string;
}

export function LoadingWithPip({
  message = "Loading...",
  className,
}: LoadingWithPipProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12",
        className
      )}
    >
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Mascot expression="thinking" size="lg" animated />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground text-sm"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

// ============================================
// INLINE LOADING
// ============================================

interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({
  text = "Loading",
  className,
}: InlineLoadingProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <motion.span
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Mascot expression="thinking" size="sm" />
      </motion.span>
      <span className="text-muted-foreground">{text}...</span>
    </span>
  );
}

// ============================================
// SEARCHING INDICATOR
// ============================================

interface SearchingIndicatorProps {
  isSearching: boolean;
  className?: string;
}

export function SearchingIndicator({
  isSearching,
  className,
}: SearchingIndicatorProps) {
  if (!isSearching) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Mascot expression="thinking" size="sm" />
      </motion.div>
      <span>Searching...</span>
    </motion.div>
  );
}
