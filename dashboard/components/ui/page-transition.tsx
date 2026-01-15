"use client";

import * as React from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  pageVariants,
  pageTransition,
  fadeInVariants,
  slideUpVariants,
  slideInFromRightVariants,
  slideInFromLeftVariants,
  scaleUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
  staggerFastContainerVariants,
  staggerSlowContainerVariants,
  staggerScaleItemVariants,
  defaultTransition,
} from "@/lib/animations";

// ============================================
// PAGE TRANSITION WRAPPER
// ============================================

type TransitionType =
  | "fade"
  | "slideUp"
  | "slideRight"
  | "slideLeft"
  | "scale"
  | "none";

interface PageTransitionProps extends HTMLMotionProps<"div"> {
  type?: TransitionType;
  duration?: number;
}

const getVariants = (type: TransitionType) => {
  switch (type) {
    case "fade":
      return fadeInVariants;
    case "slideUp":
      return slideUpVariants;
    case "slideRight":
      return slideInFromRightVariants;
    case "slideLeft":
      return slideInFromLeftVariants;
    case "scale":
      return scaleUpVariants;
    case "none":
    default:
      return pageVariants;
  }
};

export function PageTransition({
  children,
  className,
  type = "slideUp",
  duration,
  ...props
}: PageTransitionProps) {
  const pathname = usePathname();
  const variants = getVariants(type);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={duration ? { duration } : pageTransition}
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// FADE IN WRAPPER
// ============================================

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.4,
  direction = "up",
  ...props
}: FadeInProps) {
  const directionOffset = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {},
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration, delay, ease: [0.25, 1, 0.5, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// STAGGER CONTAINER
// ============================================

type StaggerSpeed = "fast" | "normal" | "slow";

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  speed?: StaggerSpeed;
  staggerDelay?: number;
  delayChildren?: number;
}

const getStaggerVariants = (speed: StaggerSpeed) => {
  switch (speed) {
    case "fast":
      return staggerFastContainerVariants;
    case "slow":
      return staggerSlowContainerVariants;
    case "normal":
    default:
      return staggerContainerVariants;
  }
};

export function StaggerContainer({
  children,
  className,
  speed = "normal",
  staggerDelay,
  delayChildren,
  ...props
}: StaggerContainerProps) {
  const variants = getStaggerVariants(speed);
  const customVariants = staggerDelay || delayChildren ? {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay ?? (speed === "fast" ? 0.04 : speed === "slow" ? 0.15 : 0.08),
        delayChildren: delayChildren ?? (speed === "fast" ? 0.05 : speed === "slow" ? 0.2 : 0.1),
      },
    },
  } : variants;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={customVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// STAGGER ITEM
// ============================================

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  effect?: "slideUp" | "scale" | "fade";
}

export function StaggerItem({
  children,
  className,
  effect = "slideUp",
  ...props
}: StaggerItemProps) {
  const variants = effect === "scale" ? staggerScaleItemVariants : staggerItemVariants;

  return (
    <motion.div
      variants={variants}
      transition={defaultTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// ANIMATE IN VIEW
// ============================================

interface AnimateInViewProps extends HTMLMotionProps<"div"> {
  threshold?: number;
  once?: boolean;
  delay?: number;
  animation?: "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "scale" | "none";
}

export function AnimateInView({
  children,
  className,
  threshold = 0.2,
  once = true,
  delay = 0,
  animation = "fadeUp",
  ...props
}: AnimateInViewProps) {
  const animationMap = {
    fadeUp: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } },
    fadeDown: { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 } },
    fadeLeft: { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 } },
    fadeRight: { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 } },
    scale: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } },
    none: { initial: {}, animate: {} },
  };

  const { initial, animate } = animationMap[animation];

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once, amount: threshold }}
      transition={{ ...defaultTransition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// MOTION WRAPPER
// ============================================

interface MotionWrapperProps {
  animate?: boolean;
  type?: "fade" | "slide" | "scale" | "spring";
  children?: React.ReactNode;
  className?: string;
}

export function MotionWrapper({
  children,
  className,
  animate = true,
  type = "fade",
}: MotionWrapperProps) {
  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
    },
    spring: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
    },
  };

  const transition = type === "spring"
    ? { type: "spring" as const, stiffness: 300, damping: 30 }
    : defaultTransition;

  return (
    <motion.div
      initial={variants[type].initial}
      animate={variants[type].animate}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// SECTION REVEAL
// ============================================

interface SectionRevealProps extends HTMLMotionProps<"section"> {
  delay?: number;
  staggerChildren?: boolean;
}

export function SectionReveal({
  children,
  className,
  delay = 0,
  staggerChildren = false,
  ...props
}: SectionRevealProps) {
  if (staggerChildren) {
    return (
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          initial: {},
          animate: {
            transition: {
              staggerChildren: 0.1,
              delayChildren: delay,
            },
          },
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...defaultTransition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}

// ============================================
// LIST ANIMATION WRAPPER
// ============================================

interface AnimatedListProps extends HTMLMotionProps<"ul"> {
  items: React.ReactNode[];
  renderItem?: (item: React.ReactNode, index: number) => React.ReactNode;
}

export function AnimatedList({
  items,
  className,
  renderItem,
  ...props
}: AnimatedListProps) {
  return (
    <motion.ul
      initial="initial"
      animate="animate"
      variants={staggerContainerVariants}
      className={className}
      {...props}
    >
      {items.map((item, index) => (
        <motion.li
          key={index}
          variants={staggerItemVariants}
          transition={defaultTransition}
        >
          {renderItem ? renderItem(item, index) : item}
        </motion.li>
      ))}
    </motion.ul>
  );
}

// ============================================
// ANIMATED PRESENCE WRAPPER
// ============================================

interface AnimatedPresenceWrapperProps {
  children: React.ReactNode;
  isVisible: boolean;
  animation?: "fade" | "slide" | "scale";
}

export function AnimatedPresenceWrapper({
  children,
  isVisible,
  animation = "fade",
}: AnimatedPresenceWrapperProps) {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={variants[animation].initial}
          animate={variants[animation].animate}
          exit={variants[animation].exit}
          transition={defaultTransition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
