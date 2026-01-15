"use client";

import { cn } from "@/lib/utils";

export type LogoVariant = "full" | "icon" | "text";
export type LogoSize = "sm" | "md" | "lg" | "xl";
export type LogoColor = "primary" | "white" | "dark";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  color?: LogoColor;
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: { icon: 24, text: 16, full: 24 },
  md: { icon: 32, text: 20, full: 32 },
  lg: { icon: 48, text: 28, full: 48 },
  xl: { icon: 64, text: 36, full: 64 },
};

const textSizeMap = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-4xl",
};

const colorMap = {
  primary: {
    nest: "#16a34a",
    leaf: "#22c55e",
    accent: "#fb923c",
    text: "#16a34a",
  },
  white: {
    nest: "#ffffff",
    leaf: "#ffffff",
    accent: "#ffffff",
    text: "#ffffff",
  },
  dark: {
    nest: "#166534",
    leaf: "#15803d",
    accent: "#9a3412",
    text: "#14532d",
  },
};

// The Nestly nest icon - a cute, welcoming bird's nest with a small bird
function NestIcon({
  size,
  colors,
  animated = false,
}: {
  size: number;
  colors: (typeof colorMap)["primary"];
  animated?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(animated && "transition-transform hover:scale-105")}
    >
      {/* Nest base - woven twigs look */}
      <ellipse
        cx="24"
        cy="34"
        rx="18"
        ry="8"
        fill={colors.nest}
        opacity="0.9"
      />
      <ellipse cx="24" cy="32" rx="16" ry="7" fill={colors.leaf} />

      {/* Nest rim detail */}
      <path
        d="M8 32 Q12 28 16 30 Q20 26 24 28 Q28 26 32 30 Q36 28 40 32"
        stroke={colors.nest}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cute little bird in the nest */}
      <g className={cn(animated && "animate-bounce")}>
        {/* Bird body */}
        <ellipse cx="24" cy="24" rx="8" ry="7" fill={colors.accent} />

        {/* Bird head */}
        <circle cx="28" cy="18" r="6" fill={colors.accent} />

        {/* Bird eye */}
        <circle cx="30" cy="17" r="2" fill="white" />
        <circle cx="30.5" cy="16.5" r="1" fill="#1f2937" />

        {/* Bird beak */}
        <path
          d="M33 19 L38 18 L33 21 Z"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="0.5"
        />

        {/* Bird wing */}
        <ellipse
          cx="22"
          cy="24"
          rx="4"
          ry="5"
          fill={colors.nest}
          opacity="0.6"
        />
      </g>

      {/* Small decorative leaves */}
      <path
        d="M6 28 Q4 24 8 22 Q6 26 8 28"
        fill={colors.leaf}
        opacity="0.7"
      />
      <path
        d="M42 28 Q44 24 40 22 Q42 26 40 28"
        fill={colors.leaf}
        opacity="0.7"
      />
    </svg>
  );
}

// Text logo
function NestlyText({
  size,
  color,
  className,
}: {
  size: LogoSize;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-bold tracking-tight",
        textSizeMap[size],
        className
      )}
      style={{ color }}
    >
      Nestly
    </span>
  );
}

export function Logo({
  variant = "full",
  size = "md",
  color = "primary",
  className,
  animated = false,
}: LogoProps) {
  const colors = colorMap[color];
  const iconSize = sizeMap[size].icon;

  if (variant === "icon") {
    return (
      <div className={cn("inline-flex items-center", className)}>
        <NestIcon size={iconSize} colors={colors} animated={animated} />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <NestlyText size={size} color={colors.text} className={className} />
    );
  }

  // Full variant - icon + text
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <NestIcon size={iconSize} colors={colors} animated={animated} />
      <NestlyText size={size} color={colors.text} />
    </div>
  );
}

// Simple icon version for compact spaces (favicon style)
export function NestlyIcon({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Simplified nest */}
      <ellipse cx="16" cy="22" rx="12" ry="5" fill="#16a34a" />
      <ellipse cx="16" cy="21" rx="10" ry="4" fill="#22c55e" />

      {/* Simplified bird */}
      <ellipse cx="16" cy="14" rx="6" ry="5" fill="#fb923c" />
      <circle cx="19" cy="11" r="4" fill="#fb923c" />
      <circle cx="20" cy="10" r="1.5" fill="white" />
      <circle cx="20.3" cy="9.7" r="0.7" fill="#1f2937" />
      <path d="M22 12 L26 11 L22 14 Z" fill="#fbbf24" />
    </svg>
  );
}

export default Logo;
