"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Briefcase,
  Heart,
  Settings,
  Users,
  Target,
  Clock,
  GraduationCap,
  DollarSign,
  Home,
  Palette,
  Calendar,
  StickyNote,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { PersonalProfile, ProfileCategory } from "@/hooks/use-profile";

// ============================================================================
// ICON MAPPING
// ============================================================================

const CATEGORY_ICONS: Record<ProfileCategory, React.ComponentType<{ className?: string }>> = {
  bio: User,
  work: Briefcase,
  health: Heart,
  preferences: Settings,
  contacts: Users,
  goals: Target,
  history: Clock,
  education: GraduationCap,
  financial: DollarSign,
  family: Home,
  hobbies: Palette,
  routines: Calendar,
  notes: StickyNote,
};

const CATEGORY_COLORS: Record<ProfileCategory, string> = {
  bio: "text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400",
  work: "text-slate-600 bg-slate-100 dark:bg-slate-950 dark:text-slate-400",
  health: "text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400",
  preferences: "text-purple-600 bg-purple-100 dark:bg-purple-950 dark:text-purple-400",
  contacts: "text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400",
  goals: "text-orange-600 bg-orange-100 dark:bg-orange-950 dark:text-orange-400",
  history: "text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400",
  education: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400",
  financial: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400",
  family: "text-pink-600 bg-pink-100 dark:bg-pink-950 dark:text-pink-400",
  hobbies: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-400",
  routines: "text-teal-600 bg-teal-100 dark:bg-teal-950 dark:text-teal-400",
  notes: "text-yellow-600 bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400",
};

const CATEGORY_LABELS: Record<ProfileCategory, string> = {
  bio: "Biography",
  work: "Work",
  health: "Health",
  preferences: "Preferences",
  contacts: "Contacts",
  goals: "Goals",
  history: "History",
  education: "Education",
  financial: "Financial",
  family: "Family",
  hobbies: "Hobbies",
  routines: "Routines",
  notes: "Notes",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getImportanceLevel(importance: number): {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }> | null;
} {
  if (importance >= 0.9) {
    return {
      label: "Critical",
      color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      icon: AlertTriangle,
    };
  }
  if (importance >= 0.7) {
    return {
      label: "High",
      color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
      icon: Star,
    };
  }
  if (importance >= 0.4) {
    return {
      label: "Medium",
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      icon: null,
    };
  }
  return {
    label: "Low",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    icon: null,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

interface InfoCardProps {
  profile: PersonalProfile;
  onEdit?: (profile: PersonalProfile) => void;
  onDelete?: (profile: PersonalProfile) => void;
  onTogglePrivacy?: (profile: PersonalProfile) => void;
  onClick?: (profile: PersonalProfile) => void;
  className?: string;
  compact?: boolean;
}

export function InfoCard({
  profile,
  onEdit,
  onDelete,
  onTogglePrivacy,
  onClick,
  className,
  compact = false,
}: InfoCardProps) {
  const Icon = CATEGORY_ICONS[profile.category];
  const iconColor = CATEGORY_COLORS[profile.category];
  const importanceInfo = getImportanceLevel(profile.importance);

  if (compact) {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-all cursor-pointer",
          profile.private && "border-dashed",
          className
        )}
        onClick={() => onClick?.(profile)}
      >
        <div className={cn("p-2 rounded-md flex-shrink-0", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{profile.title}</span>
            {profile.private && (
              <EyeOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
            {profile.verified && (
              <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
            )}
            {importanceInfo.icon && (
              <importanceInfo.icon className="h-3 w-3 text-orange-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{CATEGORY_LABELS[profile.category]}</span>
            <span>-</span>
            <span>{formatDate(profile.updatedAt)}</span>
          </div>
        </div>

        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit?.(profile)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete?.(profile)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-all duration-200 cursor-pointer",
        profile.private && "border-dashed",
        profile.importance >= 0.9 && "ring-2 ring-orange-200 dark:ring-orange-900",
        className
      )}
      onClick={() => onClick?.(profile)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn("p-3 rounded-lg flex-shrink-0", iconColor)}>
            <Icon className="h-6 w-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {/* Title and Status Icons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{profile.title}</h3>
                  {profile.private && (
                    <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  {profile.verified && (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                </div>

                {/* Content Preview */}
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {profile.content}
                </p>

                {/* Category and Importance Badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORY_LABELS[profile.category]}
                  </Badge>
                  {profile.importance >= 0.4 && (
                    <Badge
                      className={cn("text-xs flex items-center gap-1", importanceInfo.color)}
                    >
                      {importanceInfo.icon && <importanceInfo.icon className="h-3 w-3" />}
                      {importanceInfo.label}
                    </Badge>
                  )}
                  {profile.source === "claude" && (
                    <Badge variant="outline" className="text-xs">
                      AI Added
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {profile.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {profile.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    {profile.tags.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{profile.tags.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onTogglePrivacy?.(profile)}
                  title={profile.private ? "Make public" : "Make private"}
                >
                  {profile.private ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(profile)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTogglePrivacy?.(profile)}>
                      {profile.private ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Make Public
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Make Private
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete?.(profile)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {formatDate(profile.updatedAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CATEGORY CARD (for category overview)
// ============================================================================

interface CategoryCardProps {
  category: ProfileCategory;
  count: number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryCard({
  category,
  count,
  isSelected,
  onClick,
  className,
}: CategoryCardProps) {
  const Icon = CATEGORY_ICONS[category];
  const iconColor = CATEGORY_COLORS[category];

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all",
        isSelected
          ? "ring-2 ring-primary shadow-md"
          : "hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className={cn("p-2 rounded-lg mb-2", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="font-medium text-sm">{CATEGORY_LABELS[category]}</p>
        <p className="text-xs text-muted-foreground">{count} entries</p>
      </CardContent>
    </Card>
  );
}

export { CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_LABELS };
