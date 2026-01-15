import { Variants, Transition } from "framer-motion";

// ============================================
// EASING FUNCTIONS
// ============================================

export const easings = {
  // Smooth deceleration
  easeOutQuart: [0.25, 1, 0.5, 1] as const,
  // Smooth acceleration
  easeInQuart: [0.5, 0, 0.75, 0] as const,
  // Smooth acceleration and deceleration
  easeInOutQuart: [0.76, 0, 0.24, 1] as const,
  // Bouncy feel
  easeOutBack: [0.34, 1.56, 0.64, 1] as const,
  // Spring-like
  spring: { type: "spring", stiffness: 300, damping: 30 } as const,
  // Gentle spring
  gentleSpring: { type: "spring", stiffness: 200, damping: 25 } as const,
  // Soft bounce
  softBounce: { type: "spring", stiffness: 400, damping: 40 } as const,
};

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransition: Transition = {
  duration: 0.4,
  ease: easings.easeOutQuart,
};

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export const slideUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 30,
  },
};

export const slideInFromRightVariants: Variants = {
  initial: {
    opacity: 0,
    x: 100,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -100,
  },
};

export const slideInFromLeftVariants: Variants = {
  initial: {
    opacity: 0,
    x: -100,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 100,
  },
};

export const scaleUpVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
  },
};

// ============================================
// CARD ANIMATIONS
// ============================================

export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
  tap: {
    scale: 0.98,
    y: 0,
  },
};

export const cardPressVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.01,
  },
  tap: {
    scale: 0.97,
  },
};

export const cardRevealVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
};

// ============================================
// LIST / STAGGER ANIMATIONS
// ============================================

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerFastContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const staggerSlowContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

export const staggerScaleItemVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
  },
};

export const listItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

// ============================================
// BUTTON ANIMATIONS
// ============================================

export const buttonHoverVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
  },
  tap: {
    scale: 0.95,
  },
};

export const buttonPulseVariants: Variants = {
  rest: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

export const iconButtonVariants: Variants = {
  rest: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: 5,
  },
  tap: {
    scale: 0.9,
    rotate: 0,
  },
};

export const floatingActionButtonVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  },
  hover: {
    scale: 1.1,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
  tap: {
    scale: 0.95,
  },
};

// ============================================
// LOADING ANIMATIONS
// ============================================

export const pulseVariants: Variants = {
  initial: {
    opacity: 0.5,
  },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const shimmerVariants: Variants = {
  initial: {
    x: "-100%",
  },
  animate: {
    x: "100%",
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const dotsVariants: Variants = {
  initial: {
    opacity: 0.3,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

export const skeletonVariants: Variants = {
  initial: {
    backgroundPosition: "200% 0",
  },
  animate: {
    backgroundPosition: "-200% 0",
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// ============================================
// SUCCESS / FEEDBACK ANIMATIONS
// ============================================

export const checkmarkVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.5,
        ease: "easeInOut",
      },
      opacity: { duration: 0.2 },
    },
  },
};

export const successCircleVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

export const celebrationVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
  },
  animate: {
    scale: [0, 1.2, 1],
    rotate: 0,
    transition: {
      duration: 0.6,
      times: [0, 0.6, 1],
    },
  },
};

export const bounceInVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: [0, 1.25, 0.9, 1.1, 0.95, 1],
    opacity: 1,
    transition: {
      duration: 0.8,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
    },
  },
};

// ============================================
// MODAL / DIALOG ANIMATIONS
// ============================================

export const overlayVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
    },
  },
};

export const drawerVariants: Variants = {
  initial: {
    x: "100%",
  },
  animate: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: "100%",
    transition: {
      duration: 0.3,
    },
  },
};

// ============================================
// TOOLTIP / POPOVER ANIMATIONS
// ============================================

export const tooltipVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 5,
  },
};

export const popoverVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

// ============================================
// NAVIGATION ANIMATIONS
// ============================================

export const navItemVariants: Variants = {
  rest: {
    x: 0,
    backgroundColor: "transparent",
  },
  hover: {
    x: 4,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  active: {
    x: 0,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
};

export const menuItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

// ============================================
// UTILITY ANIMATIONS
// ============================================

export const fadeInUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};

export const fadeInDownVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};

export const expandVariants: Variants = {
  initial: {
    height: 0,
    opacity: 0,
  },
  animate: {
    height: "auto",
    opacity: 1,
  },
  exit: {
    height: 0,
    opacity: 0,
  },
};

export const collapseVariants: Variants = {
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: 0.3,
      },
    },
  },
};

// ============================================
// TRANSITION PRESETS
// ============================================

export const transitions = {
  fast: { duration: 0.15 },
  normal: { duration: 0.3 },
  slow: { duration: 0.5 },
  spring: easings.spring,
  gentle: easings.gentleSpring,
  bounce: easings.softBounce,
} as const;

// ============================================
// ANIMATION CONFIGS
// ============================================

export const defaultTransition: Transition = {
  duration: 0.3,
  ease: easings.easeOutQuart,
};

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const gentleTransition: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
};

// ============================================
// CONFETTI CONFIGS
// ============================================

export const confettiConfig = {
  default: {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  },
  celebration: {
    particleCount: 200,
    spread: 100,
    origin: { y: 0.5 },
    colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"] as string[],
  },
  subtle: {
    particleCount: 50,
    spread: 50,
    origin: { y: 0.7 },
    ticks: 100,
    gravity: 1.2,
  },
  fireworks: {
    particleCount: 150,
    spread: 180,
    startVelocity: 30,
    gravity: 0.8,
    ticks: 300,
  },
};
