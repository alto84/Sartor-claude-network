"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { pulseVariants, spinnerVariants, skeletonVariants } from "@/lib/animations";

// ============================================
// SKELETON LOADER
// ============================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "rectangular" | "text";
  animation?: "pulse" | "shimmer" | "wave" | "none";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "default",
  animation = "shimmer",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-none",
    text: "rounded h-4 w-full",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    shimmer: "animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
    wave: "animate-wave",
    none: "",
  };

  return (
    <div
      className={cn(
        "bg-muted",
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

// ============================================
// SKELETON CARD
// ============================================

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hasHeader?: boolean;
  hasImage?: boolean;
  hasFooter?: boolean;
  lines?: number;
}

export function SkeletonCard({
  className,
  hasHeader = true,
  hasImage = false,
  hasFooter = false,
  lines = 3,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 space-y-4",
        className
      )}
      {...props}
    >
      {hasImage && <Skeleton className="w-full h-48" />}
      {hasHeader && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: i === lines - 1 ? "80%" : "100%" }}
          />
        ))}
      </div>
      {hasFooter && (
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}
    </div>
  );
}

// ============================================
// SKELETON TABLE
// ============================================

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
}

export function SkeletonTable({
  className,
  rows = 5,
  columns = 4,
  hasHeader = true,
  ...props
}: SkeletonTableProps) {
  return (
    <div className={cn("rounded-lg border", className)} {...props}>
      {hasHeader && (
        <div className="flex gap-4 p-4 border-b bg-muted/30">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-5 flex-1" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            "flex gap-4 p-4",
            rowIndex < rows - 1 && "border-b"
          )}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================
// SKELETON LIST
// ============================================

interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number;
  hasAvatar?: boolean;
  hasAction?: boolean;
}

export function SkeletonList({
  className,
  items = 5,
  hasAvatar = true,
  hasAction = false,
  ...props
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {hasAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          {hasAction && <Skeleton className="h-8 w-8 rounded-md" />}
        </div>
      ))}
    </div>
  );
}

// ============================================
// SPINNER
// ============================================

interface SpinnerProps extends HTMLMotionProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "muted" | "white";
}

export function Spinner({
  className,
  size = "md",
  color = "primary",
  ...props
}: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const colorClasses = {
    primary: "border-primary border-t-transparent",
    secondary: "border-secondary border-t-transparent",
    muted: "border-muted-foreground border-t-transparent",
    white: "border-white border-t-transparent",
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
      className={cn(
        "rounded-full border-2",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      {...props}
    />
  );
}

// ============================================
// DOTS LOADER
// ============================================

interface DotsLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "muted";
}

export function DotsLoader({
  className,
  size = "md",
  color = "primary",
  ...props
}: DotsLoaderProps) {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    muted: "bg-muted-foreground",
  };

  return (
    <div className={cn("flex gap-1", className)} {...props}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn("rounded-full", sizeClasses[size], colorClasses[color])}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// PULSE LOADER
// ============================================

interface PulseLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "muted";
}

export function PulseLoader({
  className,
  size = "md",
  color = "primary",
  ...props
}: PulseLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    muted: "bg-muted-foreground",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)} {...props}>
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full",
          colorClasses[color]
        )}
        animate={{
          scale: [1, 2, 2, 1, 1],
          opacity: [1, 0.5, 0.5, 0.5, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          colorClasses[color]
        )}
      />
    </div>
  );
}

// ============================================
// BAR LOADER
// ============================================

interface BarLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: "primary" | "secondary" | "muted";
}

export function BarLoader({
  className,
  color = "primary",
  ...props
}: BarLoaderProps) {
  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    muted: "bg-muted-foreground",
  };

  return (
    <div
      className={cn(
        "h-1 w-full bg-muted overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <motion.div
        className={cn("h-full rounded-full", colorClasses[color])}
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ width: "50%" }}
      />
    </div>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showValue?: boolean;
  color?: "primary" | "success" | "warning" | "error";
  animate?: boolean;
}

export function ProgressBar({
  className,
  value,
  max = 100,
  showValue = false,
  color = "primary",
  animate = true,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    primary: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className={cn("space-y-1", className)} {...props}>
      <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
        <motion.div
          className={cn("h-full rounded-full", colorClasses[color])}
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.5,
            ease: [0.25, 1, 0.5, 1],
          }}
        />
      </div>
      {showValue && (
        <div className="text-xs text-muted-foreground text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

// ============================================
// LOADING OVERLAY
// ============================================

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  text?: string;
  blur?: boolean;
}

export function LoadingOverlay({
  className,
  isLoading,
  text,
  blur = true,
  children,
  ...props
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 z-50",
            blur && "backdrop-blur-sm"
          )}
        >
          <Spinner size="lg" />
          {text && (
            <p className="text-sm text-muted-foreground">{text}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// LOADING BUTTON CONTENT
// ============================================

interface LoadingButtonContentProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButtonContent({
  isLoading,
  loadingText = "Loading...",
  children,
}: LoadingButtonContentProps) {
  return (
    <>
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" color="white" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </>
  );
}

// ============================================
// SKELETON AVATAR
// ============================================

interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
}

export function SkeletonAvatar({
  className,
  size = "md",
  ...props
}: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <Skeleton
      variant="circular"
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
}

// ============================================
// SKELETON TEXT
// ============================================

interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  lastLineWidth?: string;
}

export function SkeletonText({
  className,
  lines = 3,
  lastLineWidth = "70%",
  ...props
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 ? lastLineWidth : "100%",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// PAGE LOADER
// ============================================

interface PageLoaderProps {
  text?: string;
  className?: string;
}

export function PageLoader({
  className,
  text = "Loading...",
}: PageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] gap-4",
        className
      )}
    >
      <div className="relative">
        <motion.div
          className="w-16 h-16 border-4 border-muted rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground"
      >
        {text}
      </motion.p>
    </motion.div>
  );
}
