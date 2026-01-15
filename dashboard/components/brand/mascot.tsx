"use client";

import { cn } from "@/lib/utils";
import { type MascotExpression } from "@/lib/brand";
import { useDarkMode } from "@/hooks/use-dark-mode";

interface MascotProps {
  expression?: MascotExpression;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animated?: boolean;
  /** Override dark mode detection (if not provided, auto-detects) */
  darkMode?: boolean;
}

const sizeMap = {
  sm: 48,
  md: 80,
  lg: 120,
  xl: 180,
};

// Color palettes for light and dark mode
const colorPalettes = {
  light: {
    body: "#fb923c", // orange-400
    bodyDark: "#ea580c", // orange-600
    belly: "#fed7aa", // orange-200
    cheek: "#fca5a5", // red-300
    beak: "#fbbf24", // yellow-400
    beakStroke: "#f59e0b", // yellow-500
    feet: "#f59e0b", // yellow-500
    tuft: "#ea580c", // orange-600
    eyeWhite: "white",
    eyePupil: "#1f2937", // gray-800
    eyeSparkle: "white",
    smile: "#9a3412", // orange-800
    thinkingDots: ["#d4d4d8", "#a1a1aa", "#71717a"], // gray shades
    sleepyZ: ["#71717a", "#a1a1aa", "#d4d4d8"], // gray shades
    surprisedMark: "#ef4444", // red-500
    celebrationStar1: "#fbbf24", // yellow-400
    celebrationStar2: "#22c55e", // green-500
    celebrationCircle1: "#fb923c", // orange-400
    celebrationCircle2: "#38bdf8", // sky-400
  },
  dark: {
    body: "#c2410c", // orange-700 (deeper)
    bodyDark: "#9a3412", // orange-800
    belly: "#fdba74", // orange-300
    cheek: "#f87171", // red-400
    beak: "#facc15", // yellow-400
    beakStroke: "#eab308", // yellow-500
    feet: "#eab308", // yellow-500
    tuft: "#9a3412", // orange-800
    eyeWhite: "#fef3c7", // amber-100 (warmer white)
    eyePupil: "#0f172a", // slate-900
    eyeSparkle: "#fef3c7", // amber-100
    smile: "#7c2d12", // orange-900
    thinkingDots: ["#a1a1aa", "#78716c", "#57534e"], // warmer grays
    sleepyZ: ["#57534e", "#78716c", "#a1a1aa"], // warmer grays
    surprisedMark: "#dc2626", // red-600
    celebrationStar1: "#eab308", // yellow-500
    celebrationStar2: "#16a34a", // green-600
    celebrationCircle1: "#ea580c", // orange-600
    celebrationCircle2: "#0ea5e9", // sky-500
  },
};

// Pip the Nestly Bird - Our cute mascot!
export function Mascot({
  expression = "happy",
  size = "md",
  className,
  animated = true,
  darkMode: darkModeOverride,
}: MascotProps) {
  const systemDarkMode = useDarkMode();
  const isDarkMode = darkModeOverride ?? systemDarkMode ?? false;
  const pixelSize = sizeMap[size];
  const colors = isDarkMode ? colorPalettes.dark : colorPalettes.light;

  return (
    <div
      className={cn("inline-block", animated && "transition-all", className)}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <ellipse
          cx="50"
          cy="60"
          rx="28"
          ry="25"
          fill={colors.body}
          className={cn(
            animated && expression === "celebrating" && "animate-pulse"
          )}
        />

        {/* Belly */}
        <ellipse cx="50" cy="65" rx="18" ry="16" fill={colors.belly} />

        {/* Head */}
        <circle
          cx="50"
          cy="35"
          r="22"
          fill={colors.body}
          className={cn(
            animated &&
              expression === "thinking" &&
              "animate-[wiggle_1s_ease-in-out_infinite]"
          )}
        />

        {/* Cheeks - blush */}
        <circle cx="32" cy="38" r="5" fill={colors.cheek} opacity="0.6" />
        <circle cx="68" cy="38" r="5" fill={colors.cheek} opacity="0.6" />

        {/* Eyes based on expression */}
        {expression === "happy" && (
          <>
            {/* Happy eyes - open and sparkly */}
            <ellipse cx="40" cy="32" rx="6" ry="7" fill={colors.eyeWhite} />
            <ellipse cx="60" cy="32" rx="6" ry="7" fill={colors.eyeWhite} />
            <circle cx="42" cy="31" r="3.5" fill={colors.eyePupil} />
            <circle cx="62" cy="31" r="3.5" fill={colors.eyePupil} />
            {/* Eye sparkles */}
            <circle cx="43" cy="29" r="1.5" fill={colors.eyeSparkle} />
            <circle cx="63" cy="29" r="1.5" fill={colors.eyeSparkle} />
          </>
        )}

        {expression === "thinking" && (
          <>
            {/* Thinking eyes - looking up */}
            <ellipse cx="40" cy="32" rx="6" ry="7" fill={colors.eyeWhite} />
            <ellipse cx="60" cy="32" rx="6" ry="7" fill={colors.eyeWhite} />
            <circle cx="41" cy="28" r="3.5" fill={colors.eyePupil} />
            <circle cx="61" cy="28" r="3.5" fill={colors.eyePupil} />
            {/* Thinking dots */}
            <circle cx="78" cy="18" r="3" fill={colors.thinkingDots[0]} />
            <circle cx="85" cy="10" r="4" fill={colors.thinkingDots[1]} />
            <circle cx="93" cy="0" r="5" fill={colors.thinkingDots[2]} />
          </>
        )}

        {expression === "celebrating" && (
          <>
            {/* Celebrating eyes - closed happy arcs */}
            <path
              d="M34 32 Q40 26 46 32"
              stroke={colors.eyePupil}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M54 32 Q60 26 66 32"
              stroke={colors.eyePupil}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            {/* Confetti/sparkles */}
            <path
              d="M20 15 L25 10 M22 12 L23 17"
              stroke={colors.celebrationStar1}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M80 15 L75 10 M78 12 L77 17"
              stroke={colors.celebrationStar2}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="15" cy="25" r="2" fill={colors.celebrationCircle1} />
            <circle cx="85" cy="25" r="2" fill={colors.celebrationCircle2} />
          </>
        )}

        {expression === "sleepy" && (
          <>
            {/* Sleepy eyes - droopy */}
            <path
              d="M34 34 Q40 30 46 34"
              stroke={colors.eyePupil}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M54 34 Q60 30 66 34"
              stroke={colors.eyePupil}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Z's for sleeping */}
            <text x="72" y="22" fill={colors.sleepyZ[0]} fontSize="10" fontWeight="bold">
              z
            </text>
            <text x="80" y="15" fill={colors.sleepyZ[1]} fontSize="8" fontWeight="bold">
              z
            </text>
            <text x="86" y="10" fill={colors.sleepyZ[2]} fontSize="6" fontWeight="bold">
              z
            </text>
          </>
        )}

        {expression === "surprised" && (
          <>
            {/* Surprised eyes - wide open */}
            <ellipse cx="40" cy="32" rx="7" ry="9" fill={colors.eyeWhite} />
            <ellipse cx="60" cy="32" rx="7" ry="9" fill={colors.eyeWhite} />
            <circle cx="40" cy="32" r="4" fill={colors.eyePupil} />
            <circle cx="60" cy="32" r="4" fill={colors.eyePupil} />
            <circle cx="41" cy="30" r="2" fill={colors.eyeSparkle} />
            <circle cx="61" cy="30" r="2" fill={colors.eyeSparkle} />
            {/* Exclamation */}
            <text x="75" y="20" fill={colors.surprisedMark} fontSize="16" fontWeight="bold">
              !
            </text>
          </>
        )}

        {/* Beak */}
        <path
          d="M50 42 L44 50 L50 48 L56 50 Z"
          fill={colors.beak}
          stroke={colors.beakStroke}
          strokeWidth="1"
        />

        {/* Small smile under beak */}
        {(expression === "happy" || expression === "celebrating") && (
          <path
            d="M45 52 Q50 56 55 52"
            stroke={colors.smile}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Wings */}
        <ellipse
          cx="22"
          cy="58"
          rx="10"
          ry="15"
          fill={colors.bodyDark}
          transform="rotate(-15 22 58)"
          className={cn(
            animated &&
              expression === "celebrating" &&
              "animate-[wave_0.5s_ease-in-out_infinite]"
          )}
        />
        <ellipse
          cx="78"
          cy="58"
          rx="10"
          ry="15"
          fill={colors.bodyDark}
          transform="rotate(15 78 58)"
          className={cn(
            animated &&
              expression === "celebrating" &&
              "animate-[wave_0.5s_ease-in-out_infinite_reverse]"
          )}
        />

        {/* Feet */}
        <path
          d="M38 82 L32 90 M38 82 L38 90 M38 82 L44 90"
          stroke={colors.feet}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M62 82 L56 90 M62 82 L62 90 M62 82 L68 90"
          stroke={colors.feet}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Tuft on head */}
        <path
          d="M45 15 Q48 8 50 14 Q52 8 55 15"
          stroke={colors.tuft}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

// Small inline mascot for use in text or buttons
export function MascotInline({
  expression = "happy",
  className,
}: {
  expression?: MascotExpression;
  className?: string;
}) {
  return <Mascot expression={expression} size="sm" className={className} />;
}

// Mascot with speech bubble
export function MascotWithMessage({
  expression = "happy",
  message,
  size = "md",
  className,
}: MascotProps & { message: string }) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Mascot expression={expression} size={size} />
      <div className="relative mt-2 rounded-xl bg-white px-4 py-2 shadow-md border border-gray-100">
        {/* Speech bubble pointer */}
        <div className="absolute -left-2 top-3 h-4 w-4 rotate-45 border-l border-b border-gray-100 bg-white" />
        <p className="relative text-sm text-gray-700">{message}</p>
      </div>
    </div>
  );
}

export default Mascot;
