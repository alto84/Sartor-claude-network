/**
 * Fun Loading Messages for Pip
 *
 * These cute messages appear when something is loading,
 * making the wait more enjoyable!
 */

export const loadingMessages = [
  // Nest-themed
  "Pip is fluffing the pillows...",
  "Gathering twigs for your nest...",
  "Warming up your cozy corner...",
  "Arranging the feathers just right...",
  "Building the coziest nest...",
  "Lining the nest with soft down...",
  "Pip is tidying up the branches...",

  // Action-themed
  "Pip is on the case!",
  "Flying through the data...",
  "Chirping to the servers...",
  "Pip is stretching wings...",
  "Hatching your request...",
  "Pecking at the details...",
  "Preening the information...",

  // Cute and fun
  "Pip is doing a happy dance...",
  "Teaching baby birds to fly...",
  "Checking under every leaf...",
  "Pip says patience is a virtue!",
  "Making everything extra cozy...",
  "Counting eggs in the basket...",
  "Sprinkling a little bird magic...",

  // Encouraging
  "Almost there, hang tight!",
  "Good things come to those who wait...",
  "Pip believes in you!",
  "Just a flap or two more...",
  "Your patience makes Pip happy!",
];

/**
 * Get a random loading message
 */
export function getRandomLoadingMessage(): string {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
}

/**
 * Loading message categories for specific contexts
 */
export const contextualLoadingMessages = {
  saving: [
    "Pip is carefully storing this...",
    "Tucking this safely in the nest...",
    "Adding this to the collection...",
    "Making sure everything is saved...",
    "Pip is being extra careful here...",
  ],
  loading: [
    "Pip is fetching your stuff...",
    "Gathering all the pieces...",
    "Flying back with your data...",
    "Almost got everything...",
    "Pip is on the way back!",
  ],
  sending: [
    "Pip is delivering your message...",
    "Flying as fast as wings allow...",
    "Special delivery incoming...",
    "Your message is taking flight...",
    "Pip is on a mission!",
  ],
  thinking: [
    "Pip is pondering deeply...",
    "Consulting the wise owl...",
    "Thinking really hard about this...",
    "Pip is connecting the dots...",
    "Processing with bird brain power...",
  ],
  celebrating: [
    "Pip is doing a victory dance!",
    "Tweet tweet! That was great!",
    "Pip is celebrating with confetti!",
    "High-five! ...er, high-wing!",
    "Pip is so proud of you!",
  ],
};

/**
 * Get a contextual loading message
 */
export function getContextualMessage(
  context: keyof typeof contextualLoadingMessages
): string {
  const messages = contextualLoadingMessages[context];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Loading dots animation messages
 * Returns an array that can be cycled through
 */
export const loadingDots = [".", "..", "...", ".."];

/**
 * Get greeting based on time of day
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good evening";
  } else {
    return "Hello, night owl";
  }
}

/**
 * Get a motivational message
 */
export function getMotivationalMessage(): string {
  const messages = [
    "You've got this!",
    "One step at a time!",
    "Pip believes in you!",
    "Making great progress!",
    "Keep up the amazing work!",
    "You're doing wonderful!",
    "Every task matters!",
    "Small wins add up!",
    "Pip is cheering for you!",
    "You're unstoppable today!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get empty state messages
 */
export const emptyStateMessages = {
  tasks: [
    "No tasks yet! Pip is ready when you are.",
    "All clear! Time to add some tasks?",
    "A clean slate! What shall we work on?",
    "Pip is patiently waiting for tasks...",
  ],
  vault: [
    "Your vault is empty! Start adding important info.",
    "Nothing stored yet. Let's fill this nest!",
    "Empty for now. Pip will guard whatever you add!",
    "Ready to store your treasures!",
  ],
  messages: [
    "No messages yet. Say hi to Pip!",
    "The chat is quiet... for now!",
    "Pip is here and ready to chat!",
    "Start a conversation with Claude!",
  ],
  family: [
    "No family members yet. Add your loved ones!",
    "Your nest awaits its inhabitants!",
    "Ready to welcome your family!",
    "Let's fill this nest with family!",
  ],
};

export function getEmptyStateMessage(
  context: keyof typeof emptyStateMessages
): string {
  const messages = emptyStateMessages[context];
  return messages[Math.floor(Math.random() * messages.length)];
}
