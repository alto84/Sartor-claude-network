/**
 * Easter Eggs Library
 *
 * Fun hidden features that make the app delightful!
 */

import confetti from 'canvas-confetti';

// Konami Code sequence
const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
];

type KonamiCallback = () => void;

/**
 * Create a Konami Code listener
 * When user types the sequence, triggers celebration
 */
export function createKonamiListener(onTrigger?: KonamiCallback): () => void {
  let currentIndex = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  const handleKeyDown = (event: KeyboardEvent) => {
    // Reset timeout on each key press
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Check if the pressed key matches the expected key in the sequence
    if (event.code === KONAMI_CODE[currentIndex]) {
      currentIndex++;

      // If we've matched the entire sequence
      if (currentIndex === KONAMI_CODE.length) {
        triggerKonamiCelebration();
        if (onTrigger) {
          onTrigger();
        }
        currentIndex = 0;
      }
    } else {
      // Wrong key, reset the sequence
      currentIndex = 0;
    }

    // Reset if no key pressed for 2 seconds
    timeoutId = setTimeout(() => {
      currentIndex = 0;
    }, 2000);
  };

  // Add the event listener
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }

  // Return cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Trigger a massive celebration with confetti
 */
export function triggerKonamiCelebration() {
  // Play celebration sound (optional - only if available)
  playSound('celebration');

  // Fire confetti from multiple angles
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const colors = ['#fb923c', '#22c55e', '#38bdf8', '#f59e0b', '#ef4444', '#8b5cf6'];

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  // Create interval for continuous confetti
  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    // Fire from the left side
    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: randomInRange(0.1, 0.3),
        y: Math.random() - 0.2,
      },
      colors,
    });

    // Fire from the right side
    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: randomInRange(0.7, 0.9),
        y: Math.random() - 0.2,
      },
      colors,
    });
  }, 250);

  // Also fire a big burst in the center
  confetti({
    particleCount: 200,
    spread: 180,
    origin: { x: 0.5, y: 0.5 },
    colors,
    startVelocity: 45,
  });
}

/**
 * Secret click pattern detector
 * Triple-click on the mascot reveals secrets!
 */
export function createSecretClickDetector(
  element: HTMLElement,
  onTrigger: () => void
): () => void {
  let clickCount = 0;
  let clickTimer: NodeJS.Timeout | null = null;

  const handleClick = () => {
    clickCount++;

    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    if (clickCount === 3) {
      onTrigger();
      clickCount = 0;
    }

    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 500);
  };

  element.addEventListener('click', handleClick);

  return () => {
    element.removeEventListener('click', handleClick);
    if (clickTimer) {
      clearTimeout(clickTimer);
    }
  };
}

/**
 * Play a sound effect (optional - gracefully handles missing audio)
 */
export function playSound(soundType: 'celebration' | 'success' | 'pop' | 'sparkle') {
  if (typeof window === 'undefined') return;

  // Audio file paths (would need to be added to public folder)
  const soundMap: Record<string, string> = {
    celebration: '/sounds/celebration.mp3',
    success: '/sounds/success.mp3',
    pop: '/sounds/pop.mp3',
    sparkle: '/sounds/sparkle.mp3',
  };

  try {
    const audio = new Audio(soundMap[soundType]);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Silently fail if audio can't play (common on first interaction)
    });
  } catch {
    // Audio not available, that's ok!
  }
}

/**
 * Easter egg: Type "nestly" anywhere to see Pip wave
 */
export function createSecretWordListener(
  word: string,
  onTrigger: () => void
): () => void {
  let buffer = '';
  let timeoutId: NodeJS.Timeout | null = null;

  const handleKeyDown = (event: KeyboardEvent) => {
    // Only track letter keys
    if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
      buffer += event.key.toLowerCase();

      // Reset timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Check if buffer ends with the secret word
      if (buffer.endsWith(word.toLowerCase())) {
        onTrigger();
        buffer = '';
      }

      // Keep buffer from growing too large
      if (buffer.length > word.length) {
        buffer = buffer.slice(-word.length);
      }

      // Reset buffer after 3 seconds of no typing
      timeoutId = setTimeout(() => {
        buffer = '';
      }, 3000);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Easter egg dates - special occasions!
 */
export function getSpecialOccasion(): string | null {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const occasions: Record<string, string> = {
    '1-1': 'Happy New Year!',
    '2-14': "Happy Valentine's Day!",
    '3-17': "Happy St. Patrick's Day!",
    '4-1': "Happy April Fools' Day!",
    '7-4': 'Happy Independence Day!',
    '10-31': 'Happy Halloween!',
    '12-25': 'Merry Christmas!',
    '12-31': "Happy New Year's Eve!",
  };

  return occasions[`${month}-${day}`] || null;
}

/**
 * Random fun facts about birds (for Pip!)
 */
export const pipFunFacts = [
  "Did you know? Baby birds are called nestlings!",
  "Fun fact: Some birds can remember where they hid thousands of seeds!",
  "Pip's favorite: Birds are the only animals with feathers!",
  "Cool fact: The smallest bird egg is smaller than a jellybean!",
  "Bird wisdom: Crows can recognize human faces!",
  "Nesty knowledge: Birds communicate with over 100 different songs!",
  "Tweet tweet: A group of flamingos is called a 'flamboyance'!",
  "Pip says: Owls can rotate their heads almost 360 degrees!",
];

export function getRandomPipFact(): string {
  return pipFunFacts[Math.floor(Math.random() * pipFunFacts.length)];
}
