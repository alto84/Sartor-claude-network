"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Mascot } from "./mascot";
import { type MascotExpression } from "@/lib/brand";
import { getRandomLoadingMessage } from "@/lib/loading-messages";

interface PipMoodProps {
  /** Override the automatic mood */
  forcedMood?: MascotExpression;
  /** Whether tasks are completed */
  tasksCompleted?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Show speech bubble */
  showBubble?: boolean;
  /** Custom message */
  message?: string;
  /** Size of Pip */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

/**
 * Get mood based on time of day
 */
function getTimeBasedMood(): { mood: MascotExpression; message: string } {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) {
    return { mood: "happy", message: "Good morning! Ready for a great day?" };
  } else if (hour >= 8 && hour < 12) {
    return { mood: "happy", message: "Hope your morning is going well!" };
  } else if (hour >= 12 && hour < 14) {
    return { mood: "happy", message: "Lunchtime! Don't forget to take a break." };
  } else if (hour >= 14 && hour < 17) {
    return { mood: "happy", message: "Afternoon productivity mode!" };
  } else if (hour >= 17 && hour < 20) {
    return { mood: "happy", message: "Evening time! Winding down?" };
  } else if (hour >= 20 && hour < 22) {
    return { mood: "sleepy", message: "Getting late... time to relax!" };
  } else if (hour >= 22 || hour < 1) {
    return { mood: "sleepy", message: "You're up late! Pip is getting sleepy..." };
  } else {
    return { mood: "sleepy", message: "Sweet dreams... zzz" };
  }
}

/**
 * Pip with dynamic mood based on context
 */
export function PipMood({
  forcedMood,
  tasksCompleted = false,
  isLoading = false,
  showBubble = true,
  message: customMessage,
  size = "sm",
  className,
}: PipMoodProps) {
  const [currentMood, setCurrentMood] = useState<MascotExpression>("happy");
  const [currentMessage, setCurrentMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // Determine mood based on context
  useEffect(() => {
    if (forcedMood) {
      setCurrentMood(forcedMood);
      return;
    }

    if (isLoading) {
      setCurrentMood("thinking");
      setCurrentMessage(getRandomLoadingMessage());
      setShowMessage(true);
      return;
    }

    if (tasksCompleted) {
      setCurrentMood("celebrating");
      setCurrentMessage("All tasks done! Great job!");
      setShowMessage(true);
      return;
    }

    // Default to time-based mood
    const { mood, message } = getTimeBasedMood();
    setCurrentMood(mood);
    setCurrentMessage(customMessage || message);
  }, [forcedMood, tasksCompleted, isLoading, customMessage]);

  // Toggle message visibility periodically
  useEffect(() => {
    if (!showBubble) return;

    // Show message on mount with slight delay
    const showTimer = setTimeout(() => {
      setShowMessage(true);
    }, 1000);

    // Hide after 5 seconds
    const hideTimer = setTimeout(() => {
      setShowMessage(false);
    }, 6000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [showBubble, currentMessage]);

  // Handle hover to show message
  const handleMouseEnter = () => {
    if (showBubble) {
      setShowMessage(true);
    }
  };

  const handleMouseLeave = () => {
    // Don't hide immediately, let it linger
    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  return (
    <div
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
      >
        <Mascot expression={currentMood} size={size} animated />
      </motion.div>

      {/* Speech bubble */}
      <AnimatePresence>
        {showBubble && showMessage && currentMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -10 }}
            className="absolute left-full ml-2 z-50"
          >
            <div className="relative bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-lg border border-gray-100 dark:border-gray-700 max-w-[200px]">
              {/* Pointer */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white dark:border-r-gray-800 border-b-[6px] border-b-transparent" />
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {currentMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Pip for sidebar footer - compact with mood awareness
 */
export function SidebarPip() {
  const [streak, setStreak] = useState(0);
  const [tasksCompletedToday, setTasksCompletedToday] = useState(0);

  // Load streak from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('nestly_streak');
    if (saved) {
      const data = JSON.parse(saved);
      setStreak(data.count || 0);
    }
  }, []);

  const mood: MascotExpression = useMemo(() => {
    if (tasksCompletedToday >= 5) return "celebrating";
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) return "sleepy";
    return "happy";
  }, [tasksCompletedToday]);

  const message = useMemo(() => {
    if (streak >= 7) return `${streak} day streak! You're on fire!`;
    if (tasksCompletedToday >= 5) return "Wow, so productive today!";
    const { message } = getTimeBasedMood();
    return message;
  }, [streak, tasksCompletedToday]);

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <PipMood
        forcedMood={mood}
        message={message}
        size="sm"
        showBubble
      />
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1 text-xs text-orange-500 font-medium"
        >
          <span>🔥</span>
          <span>{streak}</span>
        </motion.div>
      )}
    </div>
  );
}

export default PipMood;
