"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Film,
  StickyNote,
  User,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Edit,
  ExternalLink,
  Star,
  StarOff,
  Clock,
  Tag,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react";
import { cardHoverVariants, springTransition } from "@/lib/animations";

export type VaultItemType = "document" | "link" | "note" | "contact" | "image" | "video";

export interface VaultItemTag {
  id: string;
  name: string;
  color: string;
}

export interface VaultItem {
  id: string;
  name: string;
  type: VaultItemType;
  category: string;
  dateAdded: string;
  dateModified?: string;
  starred: boolean;
  importance: "low" | "medium" | "high" | "critical";
  tags: VaultItemTag[];
  // Type-specific fields
  url?: string;
  size?: string;
  content?: string;
  email?: string;
  phone?: string;
  description?: string;
  thumbnail?: string;
}

interface VaultItemCardProps {
  item: VaultItem;
  onEdit?: (item: VaultItem) => void;
  onDelete?: (item: VaultItem) => void;
  onToggleStar?: (item: VaultItem) => void;
  onShare?: (item: VaultItem) => void;
  onOpen?: (item: VaultItem) => void;
  className?: string;
  index?: number;
}

function getItemIcon(type: VaultItemType) {
  switch (type) {
    case "document":
      return FileText;
    case "link":
      return LinkIcon;
    case "note":
      return StickyNote;
    case "contact":
      return User;
    case "image":
      return ImageIcon;
    case "video":
      return Film;
    default:
      return FileText;
  }
}

function getIconStyle(type: VaultItemType) {
  switch (type) {
    case "document":
      return "text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400";
    case "link":
      return "text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400";
    case "note":
      return "text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400";
    case "contact":
      return "text-violet-600 bg-violet-100 dark:bg-violet-950 dark:text-violet-400";
    case "image":
      return "text-pink-600 bg-pink-100 dark:bg-pink-950 dark:text-pink-400";
    case "video":
      return "text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400";
    default:
      return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
  }
}

function getImportanceStyle(importance: VaultItem["importance"]) {
  switch (importance) {
    case "critical":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    case "high":
      return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
    case "medium":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
    case "low":
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

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

export function VaultItemCard({
  item,
  onEdit,
  onDelete,
  onToggleStar,
  onShare,
  onOpen,
  className,
  index = 0,
}: VaultItemCardProps) {
  const Icon = getItemIcon(item.type);
  const iconStyle = getIconStyle(item.type);

  const handlePrimaryAction = () => {
    if (item.type === "link" && item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    } else {
      onOpen?.(item);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        ...springTransition,
        delay: index * 0.05
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card
        className={cn(
          "group hover:shadow-lg transition-all duration-200 cursor-pointer",
          item.importance === "critical" && "ring-2 ring-red-200 dark:ring-red-900",
          className
        )}
        onClick={handlePrimaryAction}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon with animation */}
            <motion.div
              className={cn("p-3 rounded-lg flex-shrink-0", iconStyle)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Icon className="h-6 w-6" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {/* Title and Star */}
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    <AnimatePresence>
                      {item.starred && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Subtitle based on type */}
                  {item.type === "contact" && (item.email || item.phone) && (
                    <motion.div
                      className="flex items-center gap-3 mt-1 text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {item.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {item.email}
                        </span>
                      )}
                      {item.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {item.phone}
                        </span>
                      )}
                    </motion.div>
                  )}

                  {item.type === "note" && item.content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.content}
                    </p>
                  )}

                  {item.type === "link" && item.url && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {item.url}
                    </p>
                  )}

                  {/* Category and Size */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <motion.span
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      whileHover={{ scale: 1.05 }}
                    >
                      {item.category}
                    </motion.span>
                    {item.size && (
                      <span className="text-xs text-muted-foreground">
                        {item.size}
                      </span>
                    )}
                    {item.importance !== "low" && (
                      <motion.span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                          getImportanceStyle(item.importance)
                        )}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {item.importance === "critical" && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >
                            <AlertTriangle className="h-3 w-3" />
                          </motion.div>
                        )}
                        {item.importance.charAt(0).toUpperCase() + item.importance.slice(1)}
                      </motion.span>
                    )}
                  </div>

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {item.tags.slice(0, 3).map((tag, tagIndex) => (
                        <motion.span
                          key={tag.id}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: tagIndex * 0.05 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {tag.name}
                        </motion.span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{item.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1 }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onToggleStar?.(item)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9, rotate: item.starred ? -20 : 20 }}
                      >
                        {item.starred ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </motion.div>
                    </Button>
                  </motion.div>
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
                    <DropdownMenuContent align="end" className="animate-scale-in">
                      {item.type === "link" ? (
                        <DropdownMenuItem
                          onClick={() =>
                            item.url && window.open(item.url, "_blank", "noopener,noreferrer")
                          }
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Link
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onOpen?.(item)}>
                          <Download className="h-4 w-4 mr-2" />
                          {item.type === "document" || item.type === "image" || item.type === "video"
                            ? "Download"
                            : "Open"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onShare?.(item)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(item)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete?.(item)}
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
                <span>Added {formatDate(item.dateAdded)}</span>
                {item.dateModified && item.dateModified !== item.dateAdded && (
                  <span className="text-muted-foreground/70">
                    (Modified {formatDate(item.dateModified)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Compact variant for list view
export function VaultItemCardCompact({
  item,
  onEdit,
  onDelete,
  onToggleStar,
  onOpen,
  className,
  index = 0,
}: VaultItemCardProps) {
  const Icon = getItemIcon(item.type);
  const iconStyle = getIconStyle(item.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        ...springTransition,
        delay: index * 0.03
      }}
      whileHover={{ x: 4, backgroundColor: "rgba(0,0,0,0.02)" }}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-all cursor-pointer",
        className
      )}
      onClick={() => onOpen?.(item)}
    >
      <motion.div
        className={cn("p-2 rounded-md flex-shrink-0", iconStyle)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon className="h-4 w-4" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{item.name}</span>
          <AnimatePresence>
            {item.starred && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
          {item.importance === "critical" && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{item.category}</span>
          <span>-</span>
          <span>{formatDate(item.dateAdded)}</span>
        </div>
      </div>

      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleStar?.(item)}
          >
            {item.starred ? (
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="h-3.5 w-3.5" />
            )}
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit?.(item)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete?.(item)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
