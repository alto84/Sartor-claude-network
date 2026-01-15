/**
 * Celebration Effects Library
 *
 * Fun animations for various user interactions!
 */

import confetti from "canvas-confetti";

// Colors for different celebration types
const CELEBRATION_COLORS = {
  success: ["#22c55e", "#16a34a", "#15803d"],
  love: ["#ef4444", "#ec4899", "#f97316"],
  star: ["#fbbf24", "#f59e0b", "#d97706"],
  magic: ["#8b5cf6", "#a855f7", "#7c3aed", "#38bdf8"],
  rainbow: ["#ef4444", "#f97316", "#fbbf24", "#22c55e", "#3b82f6", "#8b5cf6"],
  nestly: ["#fb923c", "#22c55e", "#38bdf8"], // Brand colors
};

/**
 * Small confetti burst for task completion
 */
export function celebrateTaskComplete(origin?: { x: number; y: number }) {
  const pos = origin || { x: 0.5, y: 0.6 };

  confetti({
    particleCount: 50,
    spread: 60,
    origin: pos,
    colors: CELEBRATION_COLORS.success,
    gravity: 1.2,
    ticks: 150,
    startVelocity: 25,
  });
}

/**
 * Heart animation for starring/liking items
 */
export function celebrateStar(origin?: { x: number; y: number }) {
  const pos = origin || { x: 0.5, y: 0.5 };

  // Custom heart shape using emojis simulation with confetti
  confetti({
    particleCount: 30,
    spread: 40,
    origin: pos,
    colors: CELEBRATION_COLORS.love,
    gravity: 0.8,
    ticks: 100,
    startVelocity: 20,
    shapes: ["circle"],
    scalar: 0.8,
  });

  // Second burst with slightly different timing
  setTimeout(() => {
    confetti({
      particleCount: 15,
      spread: 30,
      origin: { x: pos.x, y: pos.y - 0.05 },
      colors: CELEBRATION_COLORS.love,
      gravity: 0.5,
      ticks: 80,
      startVelocity: 15,
      shapes: ["circle"],
      scalar: 0.6,
    });
  }, 100);
}

/**
 * Sparkle effect for sending messages
 */
export function celebrateMessage(origin?: { x: number; y: number }) {
  const pos = origin || { x: 0.9, y: 0.7 };

  // Small sparkles
  confetti({
    particleCount: 25,
    spread: 50,
    origin: pos,
    colors: CELEBRATION_COLORS.magic,
    gravity: 0.3,
    ticks: 100,
    startVelocity: 15,
    shapes: ["star"],
    scalar: 0.7,
  });
}

/**
 * Achievement unlock celebration
 */
export function celebrateAchievement() {
  const duration = 2000;
  const animationEnd = Date.now() + duration;

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 40 * (timeLeft / duration);

    // Fire from both sides
    confetti({
      particleCount: particleCount / 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: CELEBRATION_COLORS.rainbow,
    });

    confetti({
      particleCount: particleCount / 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: CELEBRATION_COLORS.rainbow,
    });
  }, 200);
}

/**
 * Big celebration for milestones and special occasions
 */
export function celebrateBig() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: CELEBRATION_COLORS.rainbow,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

/**
 * Fireworks effect for special occasions
 */
export function fireworks() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: CELEBRATION_COLORS.rainbow,
    });

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: CELEBRATION_COLORS.rainbow,
    });
  }, 250);
}

/**
 * Subtle sparkle for hover effects
 */
export function sparkle(x: number, y: number) {
  confetti({
    particleCount: 10,
    spread: 30,
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    colors: CELEBRATION_COLORS.star,
    gravity: 0.4,
    ticks: 50,
    startVelocity: 10,
    shapes: ["star"],
    scalar: 0.5,
  });
}

/**
 * Rain of hearts for Valentine's/love events
 */
export function heartRain() {
  const duration = 4000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    confetti({
      particleCount: 3,
      spread: 180,
      origin: { x: Math.random(), y: -0.1 },
      colors: CELEBRATION_COLORS.love,
      gravity: 0.4,
      ticks: 300,
      startVelocity: 0,
      shapes: ["circle"],
      scalar: 1.5,
    });
  }, 100);
}

/**
 * Snow effect for winter/holidays
 */
export function snowfall() {
  const duration = 5000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    confetti({
      particleCount: 2,
      spread: 180,
      origin: { x: Math.random(), y: -0.1 },
      colors: ["#ffffff", "#e0f2fe", "#bae6fd"],
      gravity: 0.3,
      ticks: 400,
      startVelocity: 0,
      shapes: ["circle"],
      scalar: 0.8,
    });
  }, 100);
}

/**
 * Calculate origin from mouse event
 */
export function getOriginFromEvent(event: MouseEvent | React.MouseEvent): {
  x: number;
  y: number;
} {
  return {
    x: event.clientX / window.innerWidth,
    y: event.clientY / window.innerHeight,
  };
}

/**
 * Calculate origin from element
 */
export function getOriginFromElement(element: HTMLElement): {
  x: number;
  y: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  };
}

/**
 * Create a reusable celebration handler
 */
export function createCelebrationHandler(
  type: "task" | "star" | "message" | "achievement" | "milestone"
) {
  return (event?: MouseEvent | React.MouseEvent) => {
    const origin = event ? getOriginFromEvent(event) : undefined;

    switch (type) {
      case "task":
        celebrateTaskComplete(origin);
        break;
      case "star":
        celebrateStar(origin);
        break;
      case "message":
        celebrateMessage(origin);
        break;
      case "achievement":
        celebrateAchievement();
        break;
      case "milestone":
        celebrateBig();
        break;
    }
  };
}

/**
 * Check if today is a special occasion and return appropriate celebration
 */
export function getOccasionCelebration(): (() => void) | null {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // Valentine's Day
  if (month === 2 && day === 14) {
    return heartRain;
  }

  // Christmas and nearby dates
  if (month === 12 && day >= 20 && day <= 26) {
    return snowfall;
  }

  // New Year's Eve/Day
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) {
    return fireworks;
  }

  // Independence Day (US)
  if (month === 7 && day === 4) {
    return fireworks;
  }

  return null;
}
