"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/brand/mascot";
import { Flame, Calendar, Trophy, Star } from "lucide-react";

// Storage key
const STREAK_KEY = "nestly_streak";

interface StreakData {
  count: number;
  lastVisit: string;
  longestStreak: number;
  totalDays: number;
  milestones: number[]; // Milestone days achieved
}

// Milestone definitions
const MILESTONES = [
  { days: 3, emoji: "🌱", message: "3 days! You're growing!" },
  { days: 7, emoji: "🔥", message: "1 week streak! On fire!" },
  { days: 14, emoji: "⭐", message: "2 weeks! You're a star!" },
  { days: 21, emoji: "🚀", message: "21 days! Habit formed!" },
  { days: 30, emoji: "👑", message: "1 month! Royalty status!" },
  { days: 50, emoji: "💎", message: "50 days! Diamond tier!" },
  { days: 100, emoji: "🏆", message: "100 days! LEGENDARY!" },
  { days: 365, emoji: "🌟", message: "1 YEAR! You're incredible!" },
];

/**
 * Hook to manage daily streak
 */
export function useStreak() {
  const [streakData, setStreakData] = useState<StreakData>({
    count: 0,
    lastVisit: "",
    longestStreak: 0,
    totalDays: 0,
    milestones: [],
  });
  const [newMilestone, setNewMilestone] = useState<(typeof MILESTONES)[0] | null>(null);

  // Load and update streak on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(STREAK_KEY);
    const today = new Date().toDateString();

    if (saved) {
      const data: StreakData = JSON.parse(saved);
      const lastVisit = new Date(data.lastVisit).toDateString();

      if (lastVisit === today) {
        // Already visited today
        setStreakData(data);
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastVisit === yesterday.toDateString()) {
          // Visited yesterday - streak continues!
          const newCount = data.count + 1;
          const newData: StreakData = {
            count: newCount,
            lastVisit: today,
            longestStreak: Math.max(data.longestStreak, newCount),
            totalDays: data.totalDays + 1,
            milestones: data.milestones,
          };

          // Check for new milestones
          const milestone = MILESTONES.find(
            (m) => m.days === newCount && !data.milestones.includes(m.days)
          );

          if (milestone) {
            newData.milestones = [...data.milestones, milestone.days];
            setNewMilestone(milestone);
            celebrateMilestone();
          }

          localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
          setStreakData(newData);
        } else {
          // Streak broken, start fresh
          const newData: StreakData = {
            count: 1,
            lastVisit: today,
            longestStreak: Math.max(data.longestStreak, 1),
            totalDays: data.totalDays + 1,
            milestones: data.milestones,
          };
          localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
          setStreakData(newData);
        }
      }
    } else {
      // First visit ever
      const newData: StreakData = {
        count: 1,
        lastVisit: today,
        longestStreak: 1,
        totalDays: 1,
        milestones: [],
      };
      localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
      setStreakData(newData);
    }
  }, []);

  // Clear milestone notification
  const clearMilestone = useCallback(() => {
    setNewMilestone(null);
  }, []);

  // Get next milestone
  const getNextMilestone = useCallback(() => {
    return MILESTONES.find((m) => m.days > streakData.count);
  }, [streakData.count]);

  // Get days until next milestone
  const getDaysUntilNextMilestone = useCallback(() => {
    const next = getNextMilestone();
    return next ? next.days - streakData.count : 0;
  }, [getNextMilestone, streakData.count]);

  return {
    streak: streakData.count,
    longestStreak: streakData.longestStreak,
    totalDays: streakData.totalDays,
    milestones: streakData.milestones,
    newMilestone,
    clearMilestone,
    getNextMilestone,
    getDaysUntilNextMilestone,
  };
}

/**
 * Fire celebration for milestone
 */
function celebrateMilestone() {
  const colors = ["#ef4444", "#f97316", "#fbbf24", "#22c55e", "#3b82f6"];

  // Create a fire-like effect
  const fireConfig = {
    particleCount: 100,
    spread: 100,
    origin: { y: 0.7 },
    colors,
    startVelocity: 45,
    gravity: 0.8,
  };

  confetti(fireConfig);

  setTimeout(() => {
    confetti({
      ...fireConfig,
      particleCount: 50,
      origin: { x: 0.25, y: 0.6 },
    });
    confetti({
      ...fireConfig,
      particleCount: 50,
      origin: { x: 0.75, y: 0.6 },
    });
  }, 250);
}

/**
 * Streak display component
 */
export function StreakDisplay({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "compact" | "detailed";
}) {
  const {
    streak,
    longestStreak,
    totalDays,
    getNextMilestone,
    getDaysUntilNextMilestone,
  } = useStreak();

  const nextMilestone = getNextMilestone();
  const daysUntil = getDaysUntilNextMilestone();

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
          streak >= 7
            ? "bg-orange-100 dark:bg-orange-900/30"
            : "bg-gray-100 dark:bg-gray-800",
          className
        )}
      >
        <motion.span
          animate={streak >= 3 ? { scale: [1, 1.2, 1] } : undefined}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-base"
        >
          🔥
        </motion.span>
        <span
          className={cn(
            "text-sm font-bold",
            streak >= 7 ? "text-orange-600 dark:text-orange-400" : "text-gray-700 dark:text-gray-300"
          )}
        >
          {streak}
        </span>
      </motion.div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Main streak display */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-200 text-sm font-medium">Daily Streak</p>
              <div className="flex items-baseline gap-2 mt-1">
                <motion.span
                  key={streak}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold"
                >
                  {streak}
                </motion.span>
                <span className="text-lg text-orange-200">days</span>
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-6xl"
            >
              🔥
            </motion.div>
          </div>

          {/* Progress to next milestone */}
          {nextMilestone && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-orange-200">Next milestone</span>
                <span className="font-medium">
                  {nextMilestone.emoji} {nextMilestone.days} days
                </span>
              </div>
              <div className="h-2 bg-orange-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((streak % (nextMilestone.days - (MILESTONES.find(m => m.days < nextMilestone.days)?.days || 0))) / (nextMilestone.days - (MILESTONES.find(m => m.days < nextMilestone.days)?.days || 0))) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
              <p className="text-xs text-orange-200 mt-1 text-right">
                {daysUntil} days to go!
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
            <Calendar className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalDays}
            </p>
            <p className="text-xs text-gray-500">Total Days</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
            <Trophy className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {longestStreak}
            </p>
            <p className="text-xs text-gray-500">Best Streak</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
            <Star className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {MILESTONES.filter((m) => streak >= m.days).length}
            </p>
            <p className="text-xs text-gray-500">Milestones</p>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Milestones
          </h3>
          <div className="flex flex-wrap gap-2">
            {MILESTONES.map((milestone) => (
              <motion.div
                key={milestone.days}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
                  streak >= milestone.days
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                )}
              >
                <span>{milestone.emoji}</span>
                <span className="font-medium">{milestone.days}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-3xl"
          >
            🔥
          </motion.div>
          <div>
            <p className="text-sm text-orange-100">Daily Streak</p>
            <p className="text-2xl font-bold">{streak} days</p>
          </div>
        </div>
        {nextMilestone && (
          <div className="text-right">
            <p className="text-xs text-orange-200">Next: {nextMilestone.emoji}</p>
            <p className="text-sm font-medium">{daysUntil} days</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Milestone celebration popup
 */
export function MilestonePopup({
  milestone,
  streak,
  onClose,
}: {
  milestone: (typeof MILESTONES)[0] | null;
  streak: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (milestone) {
      const timer = setTimeout(onClose, 6000);
      return () => clearTimeout(timer);
    }
  }, [milestone, onClose]);

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", damping: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm shadow-2xl"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="text-7xl mb-4"
            >
              {milestone.emoji}
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Milestone Reached!
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              {milestone.message}
            </p>

            <div className="flex items-center justify-center gap-2 text-orange-500 font-bold text-xl mb-6">
              <Flame className="h-6 w-6" />
              <span>{streak} Day Streak!</span>
            </div>

            <div className="flex justify-center">
              <Mascot expression="celebrating" size="lg" />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
            >
              Awesome!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StreakDisplay;
