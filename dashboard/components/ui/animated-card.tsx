"use client";

import * as React from "react";
import { motion, HTMLMotionProps, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  cardHoverVariants,
  cardPressVariants,
  cardRevealVariants,
  defaultTransition,
  springTransition,
} from "@/lib/animations";

// ============================================
// ANIMATED CARD BASE
// ============================================

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: "lift" | "scale" | "glow" | "none";
  revealOnMount?: boolean;
  revealDelay?: number;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      className,
      hoverEffect = "lift",
      revealOnMount = false,
      revealDelay = 0,
      children,
      ...props
    },
    ref
  ) => {
    const getHoverVariants = () => {
      switch (hoverEffect) {
        case "lift":
          return cardHoverVariants;
        case "scale":
          return cardPressVariants;
        case "glow":
          return {
            rest: { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)" },
            hover: { boxShadow: "0 0 20px 4px rgba(59, 130, 246, 0.3)" },
            tap: { boxShadow: "0 0 10px 2px rgba(59, 130, 246, 0.2)" },
          };
        case "none":
        default:
          return {};
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={revealOnMount ? "initial" : false}
        animate={revealOnMount ? "animate" : undefined}
        variants={revealOnMount ? cardRevealVariants : getHoverVariants()}
        whileHover={hoverEffect !== "none" ? "hover" : undefined}
        whileTap={hoverEffect !== "none" ? "tap" : undefined}
        transition={{ ...springTransition, delay: revealDelay }}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm cursor-pointer transition-colors",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

// ============================================
// ANIMATED CARD HEADER
// ============================================

interface AnimatedCardHeaderProps extends HTMLMotionProps<"div"> {
  animate?: boolean;
}

const AnimatedCardHeader = React.forwardRef<
  HTMLDivElement,
  AnimatedCardHeaderProps
>(({ className, animate = false, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={animate ? { opacity: 0, y: -10 } : false}
    animate={animate ? { opacity: 1, y: 0 } : undefined}
    transition={defaultTransition}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  >
    {children}
  </motion.div>
));
AnimatedCardHeader.displayName = "AnimatedCardHeader";

// ============================================
// ANIMATED CARD TITLE
// ============================================

interface AnimatedCardTitleProps extends HTMLMotionProps<"h3"> {
  animate?: boolean;
}

const AnimatedCardTitle = React.forwardRef<
  HTMLHeadingElement,
  AnimatedCardTitleProps
>(({ className, animate = false, children, ...props }, ref) => (
  <motion.h3
    ref={ref}
    initial={animate ? { opacity: 0, x: -10 } : false}
    animate={animate ? { opacity: 1, x: 0 } : undefined}
    transition={{ ...defaultTransition, delay: 0.1 }}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  >
    {children}
  </motion.h3>
));
AnimatedCardTitle.displayName = "AnimatedCardTitle";

// ============================================
// ANIMATED CARD DESCRIPTION
// ============================================

interface AnimatedCardDescriptionProps extends HTMLMotionProps<"p"> {
  animate?: boolean;
}

const AnimatedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  AnimatedCardDescriptionProps
>(({ className, animate = false, children, ...props }, ref) => (
  <motion.p
    ref={ref}
    initial={animate ? { opacity: 0 } : false}
    animate={animate ? { opacity: 1 } : undefined}
    transition={{ ...defaultTransition, delay: 0.15 }}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </motion.p>
));
AnimatedCardDescription.displayName = "AnimatedCardDescription";

// ============================================
// ANIMATED CARD CONTENT
// ============================================

interface AnimatedCardContentProps extends HTMLMotionProps<"div"> {
  animate?: boolean;
  stagger?: boolean;
}

const AnimatedCardContent = React.forwardRef<
  HTMLDivElement,
  AnimatedCardContentProps
>(({ className, animate = false, stagger = false, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={animate ? { opacity: 0, y: 10 } : false}
    animate={animate ? { opacity: 1, y: 0 } : undefined}
    transition={{ ...defaultTransition, delay: 0.2 }}
    className={cn("p-6 pt-0", className)}
    {...props}
  >
    {stagger ? (
      <motion.div
        initial="initial"
        animate="animate"
        variants={{
          initial: {},
          animate: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {children}
      </motion.div>
    ) : (
      children
    )}
  </motion.div>
));
AnimatedCardContent.displayName = "AnimatedCardContent";

// ============================================
// ANIMATED CARD FOOTER
// ============================================

interface AnimatedCardFooterProps extends HTMLMotionProps<"div"> {
  animate?: boolean;
}

const AnimatedCardFooter = React.forwardRef<
  HTMLDivElement,
  AnimatedCardFooterProps
>(({ className, animate = false, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={animate ? { opacity: 0, y: 10 } : false}
    animate={animate ? { opacity: 1, y: 0 } : undefined}
    transition={{ ...defaultTransition, delay: 0.25 }}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  >
    {children}
  </motion.div>
));
AnimatedCardFooter.displayName = "AnimatedCardFooter";

// ============================================
// INTERACTIVE CARD (with content reveal)
// ============================================

interface InteractiveCardProps extends Omit<AnimatedCardProps, 'children'> {
  expandable?: boolean;
  expandedContent?: React.ReactNode;
  children?: React.ReactNode;
}

const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  (
    {
      className,
      expandable = false,
      expandedContent,
      children,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
      <AnimatedCard
        ref={ref}
        className={cn("overflow-hidden", className)}
        onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
        {...props}
      >
        {children}
        {expandable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0,
            }}
            transition={springTransition}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 border-t border-border/50">
              {expandedContent}
            </div>
          </motion.div>
        )}
      </AnimatedCard>
    );
  }
);
InteractiveCard.displayName = "InteractiveCard";

// ============================================
// FLIP CARD
// ============================================

interface FlipCardProps extends React.HTMLAttributes<HTMLDivElement> {
  front: React.ReactNode;
  back: React.ReactNode;
  flipOnHover?: boolean;
}

const FlipCard = React.forwardRef<HTMLDivElement, FlipCardProps>(
  ({ className, front, back, flipOnHover = true, ...props }, ref) => {
    const [isFlipped, setIsFlipped] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn("perspective-1000 cursor-pointer", className)}
        onMouseEnter={flipOnHover ? () => setIsFlipped(true) : undefined}
        onMouseLeave={flipOnHover ? () => setIsFlipped(false) : undefined}
        onClick={!flipOnHover ? () => setIsFlipped(!isFlipped) : undefined}
        {...props}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={springTransition}
        >
          <div
            className="absolute w-full h-full backface-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            {front}
          </div>
          <div
            className="absolute w-full h-full backface-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {back}
          </div>
        </motion.div>
      </div>
    );
  }
);
FlipCard.displayName = "FlipCard";

// ============================================
// GLOWING CARD
// ============================================

interface GlowingCardProps extends AnimatedCardProps {
  glowColor?: string;
  glowIntensity?: "low" | "medium" | "high";
}

const GlowingCard = React.forwardRef<HTMLDivElement, GlowingCardProps>(
  (
    {
      className,
      glowColor = "rgba(59, 130, 246, 0.5)",
      glowIntensity = "medium",
      children,
      ...props
    },
    ref
  ) => {
    const intensityMap = {
      low: { spread: 10, opacity: 0.2 },
      medium: { spread: 20, opacity: 0.3 },
      high: { spread: 30, opacity: 0.5 },
    };

    const { spread, opacity } = intensityMap[glowIntensity];

    return (
      <motion.div
        ref={ref}
        initial={{ boxShadow: `0 0 0 0 transparent` }}
        whileHover={{
          boxShadow: `0 0 ${spread}px 4px ${glowColor}`,
        }}
        transition={springTransition}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlowingCard.displayName = "GlowingCard";

export {
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardTitle,
  AnimatedCardDescription,
  AnimatedCardContent,
  AnimatedCardFooter,
  InteractiveCard,
  FlipCard,
  GlowingCard,
};
