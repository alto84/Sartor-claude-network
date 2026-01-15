"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/brand/mascot";
import {
  Trophy,
  Users,
  Archive,
  Sun,
  Star,
  Flame,
  MessageCircle,
  Calendar,
  Heart,
  Sparkles,
  Lock,
  X,
} from "lucide-react";

// Achievement definitions
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  requirement: number;
  category: "activity" | "social" | "productivity" | "special";
  secret?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Activity achievements
  {
    id: "first_login",
    name: "First Flight",
    description: "Welcome to the nest! You've taken your first step.",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    requirement: 1,
    category: "activity",
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Logged in before 7am. The early bird catches the worm!",
    icon: Sun,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    requirement: 1,
    category: "activity",
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Used the app for 7 consecutive days!",
    icon: Flame,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    requirement: 7,
    category: "activity",
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "An incredible 30-day streak! You're on fire!",
    icon: Flame,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    requirement: 30,
    category: "activity",
  },

  // Social achievements
  {
    id: "family_complete",
    name: "Full Nest",
    description: "Added all family members to your Nestly family.",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    requirement: 2,
    category: "social",
  },
  {
    id: "first_message",
    name: "First Chirp",
    description: "Sent your first message to Claude!",
    icon: MessageCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    requirement: 1,
    category: "social",
  },
  {
    id: "chat_champion",
    name: "Chat Champion",
    description: "Had 50 conversations with Claude!",
    icon: MessageCircle,
    color: "text-indigo-500",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    requirement: 50,
    category: "social",
  },

  // Productivity achievements
  {
    id: "vault_starter",
    name: "Vault Starter",
    description: "Added your first item to the vault!",
    icon: Archive,
    color: "text-teal-500",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    requirement: 1,
    category: "productivity",
  },
  {
    id: "vault_master",
    name: "Vault Master",
    description: "Stored 10+ items in your vault. Such organization!",
    icon: Archive,
    color: "text-cyan-500",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    requirement: 10,
    category: "productivity",
  },
  {
    id: "task_completer",
    name: "Task Tackler",
    description: "Completed 10 tasks. You're unstoppable!",
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    requirement: 10,
    category: "productivity",
  },
  {
    id: "calendar_pro",
    name: "Calendar Pro",
    description: "Scheduled 5 events. Master of time!",
    icon: Calendar,
    color: "text-pink-500",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    requirement: 5,
    category: "productivity",
  },

  // Special achievements
  {
    id: "konami_master",
    name: "Secret Finder",
    description: "Found the secret Konami code! You're a true gamer!",
    icon: Sparkles,
    color: "text-violet-500",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    requirement: 1,
    category: "special",
    secret: true,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Used the app past midnight. Pip is sleepy!",
    icon: Star,
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-900/30",
    requirement: 1,
    category: "special",
  },
  {
    id: "loving_family",
    name: "Loving Family",
    description: "Added 5+ family members. What a wonderful nest!",
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    requirement: 5,
    category: "social",
  },
];

// Storage key
const ACHIEVEMENTS_KEY = "nestly_achievements";

// Types for storage
interface AchievementProgress {
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
}

interface AchievementsState {
  [achievementId: string]: AchievementProgress;
}

/**
 * Hook to manage achievements
 */
export function useAchievements() {
  const [achievements, setAchievements] = useState<AchievementsState>({});
  const [newUnlock, setNewUnlock] = useState<Achievement | null>(null);

  // Load achievements from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (saved) {
      setAchievements(JSON.parse(saved));
    }

    // Check for first login achievement
    const hasFirstLogin = saved && JSON.parse(saved).first_login?.unlocked;
    if (!hasFirstLogin) {
      unlockAchievement("first_login");
    }

    // Check for early bird
    const hour = new Date().getHours();
    if (hour < 7) {
      unlockAchievement("early_bird");
    }

    // Check for night owl
    if (hour >= 0 && hour < 5) {
      unlockAchievement("night_owl");
    }
  }, []);

  // Save achievements to localStorage
  const saveAchievements = useCallback((newState: AchievementsState) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(newState));
    setAchievements(newState);
  }, []);

  // Unlock an achievement
  const unlockAchievement = useCallback(
    (achievementId: string) => {
      const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!achievement) return;

      setAchievements((prev) => {
        if (prev[achievementId]?.unlocked) return prev;

        const newState = {
          ...prev,
          [achievementId]: {
            unlocked: true,
            unlockedAt: new Date().toISOString(),
            progress: achievement.requirement,
          },
        };

        saveAchievements(newState);

        // Trigger celebration
        setNewUnlock(achievement);
        celebrateAchievement();

        return newState;
      });
    },
    [saveAchievements]
  );

  // Update progress toward an achievement
  const updateProgress = useCallback(
    (achievementId: string, progress: number) => {
      const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!achievement) return;

      setAchievements((prev) => {
        if (prev[achievementId]?.unlocked) return prev;

        const newProgress = Math.min(progress, achievement.requirement);
        const shouldUnlock = newProgress >= achievement.requirement;

        const newState = {
          ...prev,
          [achievementId]: {
            unlocked: shouldUnlock,
            unlockedAt: shouldUnlock ? new Date().toISOString() : undefined,
            progress: newProgress,
          },
        };

        saveAchievements(newState);

        if (shouldUnlock) {
          setNewUnlock(achievement);
          celebrateAchievement();
        }

        return newState;
      });
    },
    [saveAchievements]
  );

  // Clear new unlock notification
  const clearNewUnlock = useCallback(() => {
    setNewUnlock(null);
  }, []);

  // Check if achievement is unlocked
  const isUnlocked = useCallback(
    (achievementId: string) => {
      return achievements[achievementId]?.unlocked || false;
    },
    [achievements]
  );

  // Get progress for an achievement
  const getProgress = useCallback(
    (achievementId: string) => {
      return achievements[achievementId]?.progress || 0;
    },
    [achievements]
  );

  // Get all unlocked achievements
  const unlockedAchievements = ACHIEVEMENTS.filter(
    (a) => achievements[a.id]?.unlocked
  );

  return {
    achievements,
    unlockAchievement,
    updateProgress,
    isUnlocked,
    getProgress,
    unlockedAchievements,
    newUnlock,
    clearNewUnlock,
  };
}

/**
 * Fire celebration confetti
 */
function celebrateAchievement() {
  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors,
  });

  // Second burst
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
  }, 150);

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
  }, 300);
}

/**
 * Achievement unlock notification popup
 */
export function AchievementUnlockPopup({
  achievement,
  onClose,
}: {
  achievement: Achievement | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed bottom-4 right-4 z-[100] max-w-sm"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 pr-10">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className={cn(
                  "flex-shrink-0 p-3 rounded-xl",
                  achievement.bgColor
                )}
              >
                <achievement.icon className={cn("h-8 w-8", achievement.color)} />
              </motion.div>

              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">
                    Achievement Unlocked!
                  </p>
                  <h3 className="font-bold text-gray-900 dark:text-white mt-1">
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {achievement.description}
                  </p>
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
            >
              <Mascot expression="celebrating" size="sm" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Pip is so proud of you!
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Achievement badge for display
 */
export function AchievementBadge({
  achievement,
  unlocked = false,
  progress = 0,
  size = "md",
  showProgress = true,
}: {
  achievement: Achievement;
  unlocked?: boolean;
  progress?: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
}) {
  const sizes = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-10 w-10",
  };

  return (
    <motion.div
      whileHover={unlocked ? { scale: 1.05 } : undefined}
      className={cn("relative", !unlocked && "opacity-50 grayscale")}
    >
      <div
        className={cn(
          "rounded-xl flex items-center justify-center",
          sizes[size],
          unlocked ? achievement.bgColor : "bg-gray-200 dark:bg-gray-700"
        )}
      >
        {unlocked ? (
          <achievement.icon
            className={cn(iconSizes[size], achievement.color)}
          />
        ) : (
          <Lock
            className={cn(iconSizes[size], "text-gray-400 dark:text-gray-500")}
          />
        )}
      </div>

      {/* Progress ring for partially complete */}
      {showProgress && !unlocked && progress > 0 && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-primary/30"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${(progress / achievement.requirement) * 283} 283`}
            className="text-primary"
          />
        </svg>
      )}
    </motion.div>
  );
}

/**
 * Achievement showcase - displays all achievements
 */
export function AchievementShowcase({
  className,
}: {
  className?: string;
}) {
  const { achievements, isUnlocked, getProgress } = useAchievements();

  const categories = [
    { key: "activity" as const, name: "Activity" },
    { key: "social" as const, name: "Social" },
    { key: "productivity" as const, name: "Productivity" },
    { key: "special" as const, name: "Special" },
  ];

  const unlockedCount = ACHIEVEMENTS.filter((a) => isUnlocked(a.id)).length;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Achievements
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Trophy className="h-4 w-4" />
          <span>
            {unlockedCount} / {ACHIEVEMENTS.filter((a) => !a.secret).length}
          </span>
        </div>
      </div>

      {categories.map((category) => {
        const categoryAchievements = ACHIEVEMENTS.filter(
          (a) => a.category === category.key && (!a.secret || isUnlocked(a.id))
        );

        if (categoryAchievements.length === 0) return null;

        return (
          <div key={category.key}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              {category.name}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categoryAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={cn(
                    "p-3 rounded-xl border transition-all",
                    isUnlocked(achievement.id)
                      ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                  )}
                >
                  <div className="flex flex-col items-center text-center">
                    <AchievementBadge
                      achievement={achievement}
                      unlocked={isUnlocked(achievement.id)}
                      progress={getProgress(achievement.id)}
                      size="md"
                    />
                    <h4
                      className={cn(
                        "font-medium mt-2 text-sm",
                        isUnlocked(achievement.id)
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-400 dark:text-gray-500"
                      )}
                    >
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {isUnlocked(achievement.id)
                        ? achievement.description
                        : "???"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AchievementShowcase;
