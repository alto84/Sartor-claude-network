"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import {
  FileQuestion,
  Inbox,
  Search,
  FolderOpen,
  Users,
  Calendar,
  MessageCircle,
  ShoppingCart,
  Heart,
  Star,
  Bell,
  Mail,
  Image,
  File,
  Database,
  Cloud,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  bounceInVariants,
  staggerContainerVariants,
  staggerItemVariants,
  defaultTransition,
} from "@/lib/animations";

// ============================================
// EMPTY STATE ICONS
// ============================================

const iconMap: Record<string, LucideIcon> = {
  default: FileQuestion,
  inbox: Inbox,
  search: Search,
  folder: FolderOpen,
  users: Users,
  calendar: Calendar,
  chat: MessageCircle,
  cart: ShoppingCart,
  favorites: Heart,
  starred: Star,
  notifications: Bell,
  email: Mail,
  images: Image,
  files: File,
  data: Database,
  cloud: Cloud,
  online: Wifi,
  offline: WifiOff,
  error: AlertCircle,
  success: CheckCircle,
  failed: XCircle,
};

// ============================================
// BASE EMPTY STATE
// ============================================

interface EmptyStateProps extends HTMLMotionProps<"div"> {
  icon?: keyof typeof iconMap | LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: "default" | "secondary" | "outline" | "ghost";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  animate?: boolean;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  className,
  icon = "default",
  title,
  description,
  action,
  secondaryAction,
  animate = true,
  size = "md",
  ...props
}: EmptyStateProps) {
  const IconComponent = typeof icon === "string" ? iconMap[icon] : icon;

  const sizeClasses = {
    sm: {
      container: "py-8 px-4",
      icon: "w-12 h-12",
      iconWrapper: "w-20 h-20",
      title: "text-lg",
      description: "text-sm",
    },
    md: {
      container: "py-12 px-6",
      icon: "w-16 h-16",
      iconWrapper: "w-28 h-28",
      title: "text-xl",
      description: "text-base",
    },
    lg: {
      container: "py-16 px-8",
      icon: "w-20 h-20",
      iconWrapper: "w-36 h-36",
      title: "text-2xl",
      description: "text-lg",
    },
  };

  const sizes = sizeClasses[size];

  const content = (
    <>
      <motion.div
        variants={animate ? bounceInVariants : undefined}
        initial={animate ? "initial" : false}
        animate={animate ? "animate" : false}
        className={cn(
          "rounded-full bg-muted flex items-center justify-center",
          sizes.iconWrapper
        )}
      >
        <IconComponent
          className={cn("text-muted-foreground", sizes.icon)}
          strokeWidth={1.5}
        />
      </motion.div>

      <motion.div
        variants={animate ? staggerContainerVariants : undefined}
        initial={animate ? "initial" : false}
        animate={animate ? "animate" : false}
        className="text-center space-y-2"
      >
        <motion.h3
          variants={animate ? staggerItemVariants : undefined}
          className={cn("font-semibold text-foreground", sizes.title)}
        >
          {title}
        </motion.h3>
        {description && (
          <motion.p
            variants={animate ? staggerItemVariants : undefined}
            className={cn("text-muted-foreground max-w-md", sizes.description)}
          >
            {description}
          </motion.p>
        )}
      </motion.div>

      {(action || secondaryAction) && (
        <motion.div
          initial={animate ? { opacity: 0, y: 10 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ ...defaultTransition, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              className="gap-2"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </>
  );

  return (
    <motion.div
      initial={animate ? { opacity: 0 } : false}
      animate={animate ? { opacity: 1 } : false}
      transition={defaultTransition}
      className={cn(
        "flex flex-col items-center justify-center gap-6",
        sizes.container,
        className
      )}
      {...props}
    >
      {content}
    </motion.div>
  );
}

// ============================================
// EMPTY SEARCH STATE
// ============================================

interface EmptySearchStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  query?: string;
  onClear?: () => void;
}

export function EmptySearchState({
  query,
  onClear,
  description,
  ...props
}: EmptySearchStateProps) {
  return (
    <EmptyState
      icon="search"
      title={query ? `No results for "${query}"` : "No results found"}
      description={
        description ||
        "Try adjusting your search or filters to find what you're looking for."
      }
      action={
        onClear
          ? {
              label: "Clear search",
              onClick: onClear,
              variant: "outline",
            }
          : undefined
      }
      {...props}
    />
  );
}

// ============================================
// EMPTY LIST STATE
// ============================================

interface EmptyListStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  itemName?: string;
  onAdd?: () => void;
}

export function EmptyListState({
  itemName = "items",
  onAdd,
  description,
  ...props
}: EmptyListStateProps) {
  return (
    <EmptyState
      icon="inbox"
      title={`No ${itemName} yet`}
      description={
        description || `Get started by creating your first ${itemName.slice(0, -1) || "item"}.`
      }
      action={
        onAdd
          ? {
              label: `Add ${itemName.slice(0, -1) || "item"}`,
              onClick: onAdd,
              icon: Plus,
            }
          : undefined
      }
      {...props}
    />
  );
}

// ============================================
// EMPTY INBOX STATE
// ============================================

interface EmptyInboxStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  type?: "email" | "notifications" | "messages";
}

export function EmptyInboxState({
  type = "email",
  description,
  ...props
}: EmptyInboxStateProps) {
  const typeConfig = {
    email: {
      icon: "email" as const,
      title: "Your inbox is empty",
      description: "No emails to display. New messages will appear here.",
    },
    notifications: {
      icon: "notifications" as const,
      title: "No notifications",
      description: "You're all caught up! Check back later for updates.",
    },
    messages: {
      icon: "chat" as const,
      title: "No messages",
      description: "Start a conversation to see messages here.",
    },
  };

  const config = typeConfig[type];

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={description || config.description}
      {...props}
    />
  );
}

// ============================================
// ERROR STATE
// ============================================

interface ErrorStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading. Please try again.",
  onRetry,
  retryLabel = "Try again",
  ...props
}: ErrorStateProps) {
  return (
    <EmptyState
      icon="error"
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: retryLabel,
              onClick: onRetry,
              variant: "default",
            }
          : undefined
      }
      {...props}
    />
  );
}

// ============================================
// OFFLINE STATE
// ============================================

interface OfflineStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  onRetry?: () => void;
}

export function OfflineState({
  description = "Please check your internet connection and try again.",
  onRetry,
  ...props
}: OfflineStateProps) {
  return (
    <EmptyState
      icon="offline"
      title="You're offline"
      description={description}
      action={
        onRetry
          ? {
              label: "Retry",
              onClick: onRetry,
              variant: "outline",
            }
          : undefined
      }
      {...props}
    />
  );
}

// ============================================
// SUCCESS STATE
// ============================================

interface SuccessStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  title?: string;
  onContinue?: () => void;
  continueLabel?: string;
}

export function SuccessState({
  title = "Success!",
  description = "Your action was completed successfully.",
  onContinue,
  continueLabel = "Continue",
  ...props
}: SuccessStateProps) {
  return (
    <EmptyState
      icon="success"
      title={title}
      description={description}
      action={
        onContinue
          ? {
              label: continueLabel,
              onClick: onContinue,
              variant: "default",
            }
          : undefined
      }
      {...props}
    />
  );
}

// ============================================
// NO DATA STATE
// ============================================

interface NoDataStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  dataType?: string;
}

export function NoDataState({
  dataType = "data",
  description,
  ...props
}: NoDataStateProps) {
  return (
    <EmptyState
      icon="data"
      title={`No ${dataType} available`}
      description={
        description ||
        `There is no ${dataType} to display at this time. Check back later or try refreshing.`
      }
      {...props}
    />
  );
}

// ============================================
// EMPTY FAVORITES STATE
// ============================================

interface EmptyFavoritesStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  itemType?: string;
}

export function EmptyFavoritesState({
  itemType = "items",
  description,
  ...props
}: EmptyFavoritesStateProps) {
  return (
    <EmptyState
      icon="favorites"
      title="No favorites yet"
      description={
        description ||
        `Add ${itemType} to your favorites to quickly access them later.`
      }
      {...props}
    />
  );
}

// ============================================
// EMPTY FOLDER STATE
// ============================================

interface EmptyFolderStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  folderName?: string;
  onUpload?: () => void;
}

export function EmptyFolderState({
  folderName,
  onUpload,
  description,
  ...props
}: EmptyFolderStateProps) {
  return (
    <EmptyState
      icon="folder"
      title={folderName ? `${folderName} is empty` : "This folder is empty"}
      description={
        description || "Upload files or create new items to get started."
      }
      action={
        onUpload
          ? {
              label: "Upload files",
              onClick: onUpload,
              icon: Plus,
            }
          : undefined
      }
      {...props}
    />
  );
}

// ============================================
// EMPTY CALENDAR STATE
// ============================================

interface EmptyCalendarStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  onCreateEvent?: () => void;
}

export function EmptyCalendarState({
  onCreateEvent,
  description,
  ...props
}: EmptyCalendarStateProps) {
  return (
    <EmptyState
      icon="calendar"
      title="No events scheduled"
      description={
        description || "Your calendar is clear. Create an event to get started."
      }
      action={
        onCreateEvent
          ? {
              label: "Create event",
              onClick: onCreateEvent,
              icon: Plus,
            }
          : undefined
      }
      {...props}
    />
  );
}

// ============================================
// EMPTY USERS STATE
// ============================================

interface EmptyUsersStateProps extends Omit<EmptyStateProps, "icon" | "title"> {
  onInvite?: () => void;
}

export function EmptyUsersState({
  onInvite,
  description,
  ...props
}: EmptyUsersStateProps) {
  return (
    <EmptyState
      icon="users"
      title="No team members"
      description={
        description || "Invite team members to collaborate together."
      }
      action={
        onInvite
          ? {
              label: "Invite members",
              onClick: onInvite,
              icon: Plus,
            }
          : undefined
      }
      {...props}
    />
  );
}
