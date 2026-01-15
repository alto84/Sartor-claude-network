/**
 * Gamification Components Index
 *
 * Fun features that make the app delightful!
 */

// Provider
export {
  GamificationProvider,
  useGamification,
} from "./gamification-provider";

// Achievements
export {
  useAchievements,
  AchievementUnlockPopup,
  AchievementBadge,
  AchievementShowcase,
  ACHIEVEMENTS,
  type Achievement,
} from "./achievements";

// Streak
export {
  useStreak,
  StreakDisplay,
  MilestonePopup,
} from "./streak";

// Tips & Wisdom
export {
  useTips,
  TipBubble,
  TipCarousel,
  InlineTip,
  getRandomTipForCategory,
  proTips,
} from "./tooltip-wisdom";
