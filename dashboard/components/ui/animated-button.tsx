"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  buttonHoverVariants,
  buttonPulseVariants,
  iconButtonVariants,
  floatingActionButtonVariants,
  springTransition,
} from "@/lib/animations";
import { Spinner } from "./loading-states";

// ============================================
// BUTTON VARIANTS (same as original)
// ============================================

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ============================================
// ANIMATED BUTTON
// ============================================

type AnimationEffect = "scale" | "lift" | "pulse" | "glow" | "none";

interface AnimatedButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  animationEffect?: AnimationEffect;
  successState?: boolean;
}

const getAnimationVariants = (effect: AnimationEffect) => {
  switch (effect) {
    case "scale":
      return buttonHoverVariants;
    case "lift":
      return {
        rest: { y: 0, boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" },
        hover: { y: -2, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
        tap: { y: 0, boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" },
      };
    case "pulse":
      return buttonPulseVariants;
    case "glow":
      return {
        rest: { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)" },
        hover: { boxShadow: "0 0 20px 4px rgba(59, 130, 246, 0.4)" },
        tap: { boxShadow: "0 0 10px 2px rgba(59, 130, 246, 0.2)" },
      };
    case "none":
    default:
      return {};
  }
};

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      isLoading = false,
      loadingText,
      animationEffect = "scale",
      successState = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = getAnimationVariants(animationEffect);
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        variants={animationEffect !== "none" ? variants : undefined}
        initial={animationEffect !== "none" ? "rest" : undefined}
        whileHover={!isDisabled && animationEffect !== "none" ? "hover" : undefined}
        whileTap={!isDisabled && animationEffect !== "none" ? "tap" : undefined}
        transition={springTransition}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" color={variant === "default" ? "white" : "primary"} />
            {loadingText || "Loading..."}
          </span>
        ) : successState ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.svg>
            Done!
          </motion.span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";

// ============================================
// ICON BUTTON
// ============================================

interface AnimatedIconButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {
  icon: React.ReactNode;
  rotateOnHover?: boolean;
}

const AnimatedIconButton = React.forwardRef<HTMLButtonElement, AnimatedIconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "icon",
      icon,
      rotateOnHover = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        variants={iconButtonVariants}
        initial="rest"
        whileHover={!disabled ? "hover" : undefined}
        whileTap={!disabled ? "tap" : undefined}
        disabled={disabled}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        <motion.span
          whileHover={rotateOnHover ? { rotate: 90 } : undefined}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {icon}
        </motion.span>
      </motion.button>
    );
  }
);
AnimatedIconButton.displayName = "AnimatedIconButton";

// ============================================
// FLOATING ACTION BUTTON
// ============================================

interface FloatingActionButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref"> {
  icon: React.ReactNode;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  (
    {
      className,
      icon,
      label,
      position = "bottom-right",
      disabled,
      ...props
    },
    ref
  ) => {
    const positionClasses = {
      "bottom-right": "bottom-6 right-6",
      "bottom-left": "bottom-6 left-6",
      "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
    };

    return (
      <motion.button
        ref={ref}
        variants={floatingActionButtonVariants}
        initial="rest"
        whileHover={!disabled ? "hover" : undefined}
        whileTap={!disabled ? "tap" : undefined}
        disabled={disabled}
        className={cn(
          "fixed z-50 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg",
          label ? "gap-2 px-5 py-3" : "h-14 w-14",
          positionClasses[position],
          className
        )}
        {...props}
      >
        <motion.span
          whileHover={{ rotate: 90 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {icon}
        </motion.span>
        {label && <span className="font-medium">{label}</span>}
      </motion.button>
    );
  }
);
FloatingActionButton.displayName = "FloatingActionButton";

// ============================================
// RIPPLE BUTTON
// ============================================

interface RippleButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children">,
    VariantProps<typeof buttonVariants> {
  rippleColor?: string;
  children?: React.ReactNode;
}

const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      rippleColor = "rgba(255, 255, 255, 0.3)",
      children,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = React.useState<
      Array<{ x: number; y: number; id: number }>
    >([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);

      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          buttonVariants({ variant, size, className }),
          "relative overflow-hidden"
        )}
        {...props}
      >
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: "absolute",
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: rippleColor,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
        ))}
        {children}
      </motion.button>
    );
  }
);
RippleButton.displayName = "RippleButton";

// ============================================
// SUBMIT BUTTON (with loading and success states)
// ============================================

interface SubmitButtonProps extends AnimatedButtonProps {
  submitText?: string;
  successText?: string;
  errorText?: string;
  state?: "idle" | "loading" | "success" | "error";
}

const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  (
    {
      className,
      submitText = "Submit",
      successText = "Success!",
      errorText = "Error",
      loadingText = "Submitting...",
      state = "idle",
      variant = "default",
      size = "default",
      ...props
    },
    ref
  ) => {
    const getContent = () => {
      switch (state) {
        case "loading":
          return (
            <span className="flex items-center gap-2">
              <Spinner size="sm" color="white" />
              {loadingText}
            </span>
          );
        case "success":
          return (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2"
            >
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.svg>
              {successText}
            </motion.span>
          );
        case "error":
          return (
            <motion.span
              initial={{ x: -10 }}
              animate={{ x: [0, -5, 5, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {errorText}
            </motion.span>
          );
        default:
          return submitText;
      }
    };

    const getVariant = () => {
      if (state === "success") return "default";
      if (state === "error") return "destructive";
      return variant;
    };

    return (
      <motion.button
        ref={ref}
        whileHover={state === "idle" ? { scale: 1.02 } : undefined}
        whileTap={state === "idle" ? { scale: 0.98 } : undefined}
        disabled={state === "loading"}
        className={cn(
          buttonVariants({ variant: getVariant(), size, className }),
          state === "success" && "bg-green-500 hover:bg-green-500",
          state === "error" && "animate-shake"
        )}
        {...props}
      >
        {getContent()}
      </motion.button>
    );
  }
);
SubmitButton.displayName = "SubmitButton";

export {
  AnimatedButton,
  AnimatedIconButton,
  FloatingActionButton,
  RippleButton,
  SubmitButton,
  buttonVariants,
};
