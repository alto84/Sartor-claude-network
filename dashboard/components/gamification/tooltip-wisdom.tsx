"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lightbulb, X, ChevronRight, ChevronLeft } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";

// Pro tips collection
export const proTips = [
  // Chat tips
  {
    id: "chat_quick",
    tip: "Use the chat to quickly add tasks!",
    category: "chat",
  },
  {
    id: "chat_claude",
    tip: 'Ask Claude anything - "What\'s my schedule today?"',
    category: "chat",
  },
  {
    id: "chat_natural",
    tip: "Chat naturally - Claude understands context!",
    category: "chat",
  },
  {
    id: "chat_commands",
    tip: 'Try "remind me to..." for quick reminders!',
    category: "chat",
  },

  // Tasks tips
  {
    id: "tasks_celebrate",
    tip: "Pip celebrates every completed task!",
    category: "tasks",
  },
  {
    id: "tasks_family",
    tip: "Assign tasks to family members for teamwork!",
    category: "tasks",
  },
  {
    id: "tasks_priority",
    tip: "Star important tasks to prioritize them!",
    category: "tasks",
  },

  // Vault tips
  {
    id: "vault_organize",
    tip: "Use categories to organize your vault!",
    category: "vault",
  },
  {
    id: "vault_secure",
    tip: "Your vault is encrypted and secure!",
    category: "vault",
  },
  {
    id: "vault_share",
    tip: "Share vault items with family members!",
    category: "vault",
  },

  // Family tips
  {
    id: "family_profiles",
    tip: "Each family member gets their own profile!",
    category: "family",
  },
  {
    id: "family_avatar",
    tip: "Customize avatars for each family member!",
    category: "family",
  },

  // General tips
  {
    id: "general_streak",
    tip: "Visit daily to build your streak!",
    category: "general",
  },
  {
    id: "general_dark",
    tip: "Try dark mode for late-night planning!",
    category: "general",
  },
  {
    id: "general_konami",
    tip: "There's a secret code hidden in Nestly...",
    category: "general",
  },
  {
    id: "general_pip",
    tip: "Click on Pip for a surprise!",
    category: "general",
  },

  // Productivity tips
  {
    id: "prod_morning",
    tip: "Review your day each morning!",
    category: "productivity",
  },
  {
    id: "prod_weekly",
    tip: "Plan your week every Sunday!",
    category: "productivity",
  },
  {
    id: "prod_breaks",
    tip: "Remember to take breaks!",
    category: "productivity",
  },
];

// Storage key for seen tips
const SEEN_TIPS_KEY = "nestly_seen_tips";

/**
 * Hook to manage tips
 */
export function useTips() {
  const [seenTips, setSeenTips] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState(proTips[0]);

  // Load seen tips
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(SEEN_TIPS_KEY);
    if (saved) {
      setSeenTips(JSON.parse(saved));
    }
  }, []);

  // Get a random unseen tip, or any tip if all seen
  const getRandomTip = useCallback(() => {
    const unseenTips = proTips.filter((t) => !seenTips.includes(t.id));
    const pool = unseenTips.length > 0 ? unseenTips : proTips;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [seenTips]);

  // Mark a tip as seen
  const markAsSeen = useCallback((tipId: string) => {
    setSeenTips((prev) => {
      if (prev.includes(tipId)) return prev;
      const newSeen = [...prev, tipId];
      if (typeof window !== "undefined") {
        localStorage.setItem(SEEN_TIPS_KEY, JSON.stringify(newSeen));
      }
      return newSeen;
    });
  }, []);

  // Get next tip
  const nextTip = useCallback(() => {
    const current = proTips.findIndex((t) => t.id === currentTip.id);
    const next = (current + 1) % proTips.length;
    setCurrentTip(proTips[next]);
    markAsSeen(proTips[next].id);
  }, [currentTip, markAsSeen]);

  // Get previous tip
  const prevTip = useCallback(() => {
    const current = proTips.findIndex((t) => t.id === currentTip.id);
    const prev = current === 0 ? proTips.length - 1 : current - 1;
    setCurrentTip(proTips[prev]);
  }, [currentTip]);

  // Shuffle to random tip
  const shuffleTip = useCallback(() => {
    const tip = getRandomTip();
    setCurrentTip(tip);
    markAsSeen(tip.id);
  }, [getRandomTip, markAsSeen]);

  return {
    currentTip,
    seenTips,
    nextTip,
    prevTip,
    shuffleTip,
    markAsSeen,
    getRandomTip,
  };
}

/**
 * Floating tip bubble that appears randomly
 */
export function TipBubble({
  className,
  autoShow = true,
  showDuration = 8000,
}: {
  className?: string;
  autoShow?: boolean;
  showDuration?: number;
}) {
  const { currentTip, shuffleTip } = useTips();
  const [isVisible, setIsVisible] = useState(false);

  // Auto-show tips periodically
  useEffect(() => {
    if (!autoShow) return;

    // Show first tip after 5 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(initialTimer);
  }, [autoShow]);

  // Auto-hide after duration
  useEffect(() => {
    if (!isVisible) return;

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      // Show next tip after a delay
      setTimeout(() => {
        shuffleTip();
        setIsVisible(true);
      }, 60000); // Show every minute
    }, showDuration);

    return () => clearTimeout(hideTimer);
  }, [isVisible, showDuration, shuffleTip]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          className={cn(
            "fixed bottom-4 left-4 z-50 max-w-xs",
            className
          )}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                  Pro Tip
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {currentTip.tip}
                </p>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Tip carousel for showing multiple tips
 */
export function TipCarousel({ className }: { className?: string }) {
  const { currentTip, nextTip, prevTip, shuffleTip } = useTips();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    nextTip();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    prevTip();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Mascot expression="happy" size="sm" />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 uppercase tracking-wide flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Did you know?
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-gray-700 dark:text-gray-300 mt-1"
            >
              {currentTip.tip}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-1 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-700 dark:text-yellow-400 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-700 dark:text-yellow-400 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline tip component for tooltips
 */
export function InlineTip({
  tip,
  className,
}: {
  tip: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 p-2 rounded-lg bg-gray-50 dark:bg-gray-800",
        className
      )}
    >
      <Lightbulb className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500 mt-0.5" />
      <span>{tip}</span>
    </div>
  );
}

/**
 * Get a random tip for a specific category
 */
export function getRandomTipForCategory(
  category: "chat" | "tasks" | "vault" | "family" | "general" | "productivity"
): string {
  const categoryTips = proTips.filter((t) => t.category === category);
  if (categoryTips.length === 0) return proTips[0].tip;
  return categoryTips[Math.floor(Math.random() * categoryTips.length)].tip;
}

export default TipCarousel;
