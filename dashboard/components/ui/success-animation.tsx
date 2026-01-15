"use client";

import * as React from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, PartyPopper, Sparkles, Trophy, Star, Heart, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  checkmarkVariants,
  successCircleVariants,
  celebrationVariants,
  bounceInVariants,
  confettiConfig,
  springTransition,
  defaultTransition,
} from "@/lib/animations";

// ============================================
// CONFETTI UTILITIES
// ============================================

export const fireConfetti = (type: keyof typeof confettiConfig = "default") => {
  const config = confettiConfig[type];
  confetti({ ...config });
};

export const fireConfettiFromElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x, y },
    colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
  });
};

export const fireFireworks = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

export const fireSchoolPride = () => {
  const end = Date.now() + 3000;
  const colors = ["#10b981", "#3b82f6"];

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};

// ============================================
// ANIMATED CHECKMARK
// ============================================

interface AnimatedCheckmarkProps extends HTMLMotionProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "success" | "white";
  strokeWidth?: number;
  delay?: number;
}

export function AnimatedCheckmark({
  className,
  size = "md",
  color = "success",
  strokeWidth = 3,
  delay = 0,
  ...props
}: AnimatedCheckmarkProps) {
  const sizeMap = {
    sm: { container: "w-8 h-8", icon: 16 },
    md: { container: "w-12 h-12", icon: 24 },
    lg: { container: "w-16 h-16", icon: 32 },
    xl: { container: "w-24 h-24", icon: 48 },
  };

  const colorMap = {
    primary: "stroke-primary",
    success: "stroke-green-500",
    white: "stroke-white",
  };

  const bgColorMap = {
    primary: "bg-primary/10",
    success: "bg-green-500/10",
    white: "bg-white/10",
  };

  const sizes = sizeMap[size];

  return (
    <motion.div
      variants={successCircleVariants}
      initial="initial"
      animate="animate"
      transition={{ ...springTransition, delay }}
      className={cn(
        "rounded-full flex items-center justify-center",
        bgColorMap[color],
        sizes.container,
        className
      )}
      {...props}
    >
      <motion.svg
        width={sizes.icon}
        height={sizes.icon}
        viewBox="0 0 24 24"
        fill="none"
        className={colorMap[color]}
      >
        <motion.path
          d="M5 13l4 4L19 7"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={checkmarkVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: delay + 0.2 }}
        />
      </motion.svg>
    </motion.div>
  );
}

// ============================================
// SUCCESS CIRCLE
// ============================================

interface SuccessCircleProps extends HTMLMotionProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl";
  showRing?: boolean;
  pulseRing?: boolean;
}

export function SuccessCircle({
  className,
  size = "md",
  showRing = true,
  pulseRing = true,
  ...props
}: SuccessCircleProps) {
  const sizeMap = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const iconSizeMap = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div className={cn("relative", sizeMap[size], className)}>
      {showRing && (
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={
            pulseRing
              ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }
              : { scale: 1, opacity: 0.5 }
          }
          transition={{
            duration: 2,
            repeat: pulseRing ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
      )}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full bg-green-500 flex items-center justify-center"
        )}
        variants={successCircleVariants}
        initial="initial"
        animate="animate"
        {...props}
      >
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...springTransition, delay: 0.2 }}
        >
          <Check className={cn("text-white", iconSizeMap[size])} strokeWidth={3} />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================
// CELEBRATION ICON
// ============================================

interface CelebrationIconProps extends HTMLMotionProps<"div"> {
  icon?: "party" | "sparkles" | "trophy" | "star" | "heart" | "thumbsUp";
  size?: "sm" | "md" | "lg";
  color?: string;
  withConfetti?: boolean;
}

export function CelebrationIcon({
  className,
  icon = "party",
  size = "md",
  color,
  withConfetti = false,
  ...props
}: CelebrationIconProps) {
  const iconMap = {
    party: PartyPopper,
    sparkles: Sparkles,
    trophy: Trophy,
    star: Star,
    heart: Heart,
    thumbsUp: ThumbsUp,
  };

  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const Icon = iconMap[icon];

  React.useEffect(() => {
    if (withConfetti) {
      const timer = setTimeout(() => {
        fireConfetti("celebration");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [withConfetti]);

  return (
    <motion.div
      variants={celebrationVariants}
      initial="initial"
      animate="animate"
      className={cn("text-yellow-500", className)}
      style={color ? { color } : undefined}
      {...props}
    >
      <Icon className={sizeMap[size]} />
    </motion.div>
  );
}

// ============================================
// SUCCESS MESSAGE
// ============================================

interface SuccessMessageProps extends HTMLMotionProps<"div"> {
  title: string;
  description?: string;
  icon?: "checkmark" | "party" | "sparkles" | "trophy";
  withConfetti?: boolean;
  confettiType?: keyof typeof confettiConfig;
  onAnimationComplete?: () => void;
}

export function SuccessMessage({
  className,
  title,
  description,
  icon = "checkmark",
  withConfetti = false,
  confettiType = "celebration",
  onAnimationComplete,
  ...props
}: SuccessMessageProps) {
  React.useEffect(() => {
    if (withConfetti) {
      const timer = setTimeout(() => {
        fireConfetti(confettiType);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [withConfetti, confettiType]);

  const renderIcon = () => {
    switch (icon) {
      case "checkmark":
        return <AnimatedCheckmark size="lg" />;
      case "party":
        return <CelebrationIcon icon="party" size="lg" />;
      case "sparkles":
        return <CelebrationIcon icon="sparkles" size="lg" />;
      case "trophy":
        return <CelebrationIcon icon="trophy" size="lg" />;
      default:
        return <AnimatedCheckmark size="lg" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springTransition}
      onAnimationComplete={onAnimationComplete}
      className={cn(
        "flex flex-col items-center gap-4 text-center p-8",
        className
      )}
      {...props}
    >
      {renderIcon()}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...defaultTransition, delay: 0.3 }}
        className="space-y-2"
      >
        <h3 className="text-xl font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// SUCCESS OVERLAY
// ============================================

interface SuccessOverlayProps extends HTMLMotionProps<"div"> {
  isVisible: boolean;
  title?: string;
  description?: string;
  duration?: number;
  onComplete?: () => void;
  withConfetti?: boolean;
}

export function SuccessOverlay({
  className,
  isVisible,
  title = "Success!",
  description,
  duration = 2000,
  onComplete,
  withConfetti = true,
  ...props
}: SuccessOverlayProps) {
  React.useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  React.useEffect(() => {
    if (isVisible && withConfetti) {
      fireConfetti("celebration");
    }
  }, [isVisible, withConfetti]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
            className
          )}
          {...props}
        >
          <SuccessMessage title={title} description={description} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// INLINE SUCCESS
// ============================================

interface InlineSuccessProps extends HTMLMotionProps<"span"> {
  show: boolean;
  text?: string;
}

export function InlineSuccess({
  className,
  show,
  text = "Saved!",
  ...props
}: InlineSuccessProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={defaultTransition}
          className={cn(
            "inline-flex items-center gap-1.5 text-green-600 text-sm font-medium",
            className
          )}
          {...props}
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...springTransition, delay: 0.1 }}
          >
            <Check className="w-4 h-4" />
          </motion.span>
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ============================================
// SUCCESS BADGE
// ============================================

interface SuccessBadgeProps extends HTMLMotionProps<"div"> {
  text?: string;
  icon?: "check" | "star" | "sparkles";
}

export function SuccessBadge({
  className,
  text = "Complete",
  icon = "check",
  ...props
}: SuccessBadgeProps) {
  const iconMap = {
    check: Check,
    star: Star,
    sparkles: Sparkles,
  };

  const Icon = iconMap[icon];

  return (
    <motion.div
      variants={bounceInVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium",
        className
      )}
      {...props}
    >
      <Icon className="w-4 h-4" />
      {text}
    </motion.div>
  );
}

// ============================================
// CONFETTI BUTTON WRAPPER
// ============================================

interface ConfettiButtonWrapperProps {
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
  confettiType?: keyof typeof confettiConfig;
  fireOnClick?: boolean;
}

export function ConfettiButtonWrapper({
  children,
  confettiType = "subtle",
  fireOnClick = true,
}: ConfettiButtonWrapperProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (fireOnClick && ref.current) {
      fireConfettiFromElement(ref.current);
    }
    // Call original onClick if it exists
    const originalOnClick = children.props?.onClick;
    if (originalOnClick) {
      originalOnClick(e);
    }
  };

  return (
    <div ref={ref} className="inline-block">
      {React.cloneElement(children, {
        onClick: handleClick,
      })}
    </div>
  );
}

// ============================================
// ANIMATED COUNTER
// ============================================

interface AnimatedCounterProps extends HTMLMotionProps<"span"> {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  className,
  value,
  duration = 1,
  prefix = "",
  suffix = "",
  ...props
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springTransition}
      className={className}
      {...props}
    >
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </motion.span>
  );
}

// ============================================
// REWARD ANIMATION
// ============================================

interface RewardAnimationProps extends HTMLMotionProps<"div"> {
  type: "points" | "badge" | "levelUp" | "achievement";
  value?: string | number;
  onComplete?: () => void;
}

export function RewardAnimation({
  className,
  type,
  value,
  onComplete,
  ...props
}: RewardAnimationProps) {
  const typeConfig = {
    points: {
      icon: Sparkles,
      title: `+${value} Points!`,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    badge: {
      icon: Star,
      title: "New Badge!",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    levelUp: {
      icon: Trophy,
      title: "Level Up!",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    achievement: {
      icon: PartyPopper,
      title: value?.toString() || "Achievement Unlocked!",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  React.useEffect(() => {
    fireConfetti("celebration");
    if (onComplete) {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0, y: -50 }}
      transition={springTransition}
      className={cn(
        "flex flex-col items-center gap-4 p-8 rounded-xl",
        config.bgColor,
        className
      )}
      {...props}
    >
      <motion.div
        animate={{
          rotate: [0, -10, 10, -10, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.5,
          delay: 0.3,
        }}
      >
        <Icon className={cn("w-16 h-16", config.color)} />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn("text-2xl font-bold", config.color)}
      >
        {config.title}
      </motion.h3>
    </motion.div>
  );
}
