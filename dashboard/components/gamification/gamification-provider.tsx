"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { createKonamiListener, createSecretWordListener, getSpecialOccasion } from "@/lib/easter-eggs";
import { getOccasionCelebration } from "@/lib/celebrations";
import { useAchievements, AchievementUnlockPopup } from "./achievements";
import { useStreak, MilestonePopup } from "./streak";
import { TipBubble } from "./tooltip-wisdom";
import { Mascot } from "@/components/brand/mascot";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface GamificationContextType {
  // Achievements
  unlockAchievement: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  isAchievementUnlocked: (id: string) => boolean;
  // Streak
  streak: number;
  longestStreak: number;
  // Easter eggs
  konamiActivated: boolean;
  specialOccasion: string | null;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
}

interface GamificationProviderProps {
  children: ReactNode;
  showTips?: boolean;
}

export function GamificationProvider({
  children,
  showTips = true,
}: GamificationProviderProps) {
  const [konamiActivated, setKonamiActivated] = useState(false);
  const [showKonamiCelebration, setShowKonamiCelebration] = useState(false);
  const [specialOccasion] = useState(() => getSpecialOccasion());

  // Hooks
  const achievements = useAchievements();
  const streakData = useStreak();

  // Initialize easter eggs
  useEffect(() => {
    // Konami code listener
    const cleanupKonami = createKonamiListener(() => {
      setKonamiActivated(true);
      setShowKonamiCelebration(true);
      achievements.unlockAchievement("konami_master");

      toast.success("Secret code activated!", {
        description: "You found the Konami code! Pip is celebrating!",
        duration: 5000,
      });

      // Hide celebration after 5 seconds
      setTimeout(() => {
        setShowKonamiCelebration(false);
      }, 5000);
    });

    // Secret word listener ("nestly")
    const cleanupNestly = createSecretWordListener("nestly", () => {
      toast("Pip says hello!", {
        description: "You typed the secret word!",
        icon: "🐦",
        duration: 3000,
      });
    });

    // Special occasion celebration on first load
    const occasionCelebration = getOccasionCelebration();
    if (occasionCelebration && specialOccasion) {
      setTimeout(() => {
        toast(specialOccasion, {
          icon: "🎉",
          duration: 5000,
        });
        occasionCelebration();
      }, 2000);
    }

    return () => {
      cleanupKonami();
      cleanupNestly();
    };
  }, [achievements, specialOccasion]);

  const contextValue: GamificationContextType = {
    unlockAchievement: achievements.unlockAchievement,
    updateProgress: achievements.updateProgress,
    isAchievementUnlocked: achievements.isUnlocked,
    streak: streakData.streak,
    longestStreak: streakData.longestStreak,
    konamiActivated,
    specialOccasion,
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}

      {/* Achievement unlock popup */}
      <AchievementUnlockPopup
        achievement={achievements.newUnlock}
        onClose={achievements.clearNewUnlock}
      />

      {/* Milestone popup */}
      <MilestonePopup
        milestone={streakData.newMilestone}
        streak={streakData.streak}
        onClose={streakData.clearMilestone}
      />

      {/* Tip bubble */}
      {showTips && <TipBubble autoShow showDuration={8000} />}

      {/* Konami celebration overlay */}
      <AnimatePresence>
        {showKonamiCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", damping: 10 }}
              className="pointer-events-auto"
            >
              <Mascot expression="celebrating" size="xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GamificationContext.Provider>
  );
}

export default GamificationProvider;
