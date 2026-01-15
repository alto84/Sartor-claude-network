/**
 * Nestly - Family Life Management
 * Brand constants and configuration
 */

export const brand = {
  name: "Nestly",
  tagline: "Your cozy command center",
  description: "A warm, AI-powered home for your family's life",

  // Brand story
  story: {
    short: "Like a cozy nest for your family",
    long: "Nestly brings your family together with warmth and care, helping you manage life's beautiful chaos from one cozy place.",
  },
} as const;

export const brandColors = {
  // Primary - Warm teal/sage (calm, nurturing)
  primary: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    DEFAULT: "#16a34a", // Main brand green
  },

  // Secondary - Warm coral/peach (welcoming, friendly)
  secondary: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    DEFAULT: "#fb923c", // Warm accent
  },

  // Accent - Soft sky blue (trust, openness)
  accent: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    DEFAULT: "#38bdf8",
  },

  // Warm neutrals (cozy, homey feel)
  warm: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#facc15",
    500: "#eab308",
    cream: "#fefce8",
    sand: "#f5f5dc",
    linen: "#faf0e6",
  },

  // Nest brown (grounding, earthy)
  nest: {
    light: "#d4a574",
    DEFAULT: "#8b6914",
    dark: "#5c4813",
  },
} as const;

export const brandTypography = {
  // Font families
  fontFamily: {
    display: "'Nunito', 'Geist', sans-serif", // Friendly, rounded
    body: "'Geist', system-ui, sans-serif",
    mono: "'Geist Mono', monospace",
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

export const brandAssets = {
  logo: {
    full: "/brand/logo-full.svg",
    icon: "/brand/logo-icon.svg",
    text: "/brand/logo-text.svg",
  },
  mascot: {
    happy: "/brand/mascot-happy.svg",
    thinking: "/brand/mascot-thinking.svg",
    celebrating: "/brand/mascot-celebrating.svg",
  },
  favicon: "/favicon.svg",
} as const;

// CSS custom properties for brand colors
export const brandCSSVariables = {
  light: {
    "--brand-primary": "142.1 76.2% 36.3%", // HSL for #16a34a
    "--brand-primary-foreground": "355.7 100% 97.3%",
    "--brand-secondary": "24.6 95% 53.1%", // HSL for #fb923c
    "--brand-secondary-foreground": "60 9.1% 97.8%",
    "--brand-accent": "198.6 88.7% 48.4%", // HSL for #38bdf8
    "--brand-accent-foreground": "222.2 47.4% 11.2%",
    "--brand-warm": "48 96.5% 76.7%",
    "--brand-nest": "35 55% 45%",
  },
  dark: {
    "--brand-primary": "142.1 70.6% 45.3%",
    "--brand-primary-foreground": "144.9 80.4% 10%",
    "--brand-secondary": "20.5 90.2% 48.2%",
    "--brand-secondary-foreground": "60 9.1% 97.8%",
    "--brand-accent": "198.6 88.7% 58.4%",
    "--brand-accent-foreground": "222.2 47.4% 11.2%",
    "--brand-warm": "48 96.5% 66.7%",
    "--brand-nest": "35 45% 55%",
  },
} as const;

// Mascot expressions for different states
export const mascotExpressions = {
  happy: "default", // Normal happy state
  thinking: "processing", // When loading or thinking
  celebrating: "success", // When something good happens
  sleepy: "idle", // When idle for a while
  surprised: "notification", // When there's a notification
} as const;

export type MascotExpression = keyof typeof mascotExpressions;
