// Onboarding state management with localStorage persistence

export interface FamilyMember {
  id: string;
  name: string;
  role: "parent" | "child" | "other";
  avatar?: string;
}

export interface OnboardingData {
  familyName: string;
  members: FamilyMember[];
  enabledFeatures: string[];
  completedSteps: number[];
  currentStep: number;
  isComplete: boolean;
  completedAt?: string;
}

const STORAGE_KEY = "nestly-onboarding";

const defaultOnboardingData: OnboardingData = {
  familyName: "",
  members: [],
  enabledFeatures: [],
  completedSteps: [],
  currentStep: 0,
  isComplete: false,
};

export function getOnboardingData(): OnboardingData {
  if (typeof window === "undefined") {
    return defaultOnboardingData;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading onboarding data:", error);
  }

  return defaultOnboardingData;
}

export function setOnboardingData(data: Partial<OnboardingData>): OnboardingData {
  if (typeof window === "undefined") {
    return defaultOnboardingData;
  }

  try {
    const current = getOnboardingData();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error saving onboarding data:", error);
    return getOnboardingData();
  }
}

export function updateFamilyName(name: string): OnboardingData {
  return setOnboardingData({ familyName: name });
}

export function addFamilyMember(member: Omit<FamilyMember, "id">): OnboardingData {
  const current = getOnboardingData();
  const newMember: FamilyMember = {
    ...member,
    id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  return setOnboardingData({
    members: [...current.members, newMember],
  });
}

export function removeFamilyMember(memberId: string): OnboardingData {
  const current = getOnboardingData();
  return setOnboardingData({
    members: current.members.filter((m) => m.id !== memberId),
  });
}

export function updateFamilyMember(memberId: string, updates: Partial<FamilyMember>): OnboardingData {
  const current = getOnboardingData();
  return setOnboardingData({
    members: current.members.map((m) =>
      m.id === memberId ? { ...m, ...updates } : m
    ),
  });
}

export function toggleFeature(featureId: string): OnboardingData {
  const current = getOnboardingData();
  const features = current.enabledFeatures.includes(featureId)
    ? current.enabledFeatures.filter((f) => f !== featureId)
    : [...current.enabledFeatures, featureId];
  return setOnboardingData({ enabledFeatures: features });
}

export function setEnabledFeatures(features: string[]): OnboardingData {
  return setOnboardingData({ enabledFeatures: features });
}

export function completeStep(step: number): OnboardingData {
  const current = getOnboardingData();
  const completedSteps = current.completedSteps.includes(step)
    ? current.completedSteps
    : [...current.completedSteps, step];
  return setOnboardingData({ completedSteps });
}

export function setCurrentStep(step: number): OnboardingData {
  return setOnboardingData({ currentStep: step });
}

export function completeOnboarding(): OnboardingData {
  return setOnboardingData({
    isComplete: true,
    completedAt: new Date().toISOString(),
  });
}

export function resetOnboarding(): OnboardingData {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  return defaultOnboardingData;
}

export function isOnboardingComplete(): boolean {
  return getOnboardingData().isComplete;
}

// Available features for onboarding
export const availableFeatures = [
  {
    id: "calendar",
    name: "Family Calendar",
    description: "Sync and view everyone's schedules",
    icon: "Calendar",
    recommended: true,
  },
  {
    id: "tasks",
    name: "Shared Tasks",
    description: "Assign and track family to-dos",
    icon: "CheckSquare",
    recommended: true,
  },
  {
    id: "smart-home",
    name: "Smart Home",
    description: "Control lights, locks, and more",
    icon: "Home",
    recommended: false,
  },
  {
    id: "ai-assistant",
    name: "AI Assistant",
    description: "Get smart suggestions and reminders",
    icon: "Brain",
    recommended: true,
  },
  {
    id: "vault",
    name: "Family Vault",
    description: "Store documents and passwords securely",
    icon: "Shield",
    recommended: false,
  },
  {
    id: "health",
    name: "Health Tracking",
    description: "Monitor activity and wellness (opt-in)",
    icon: "Heart",
    recommended: false,
  },
];
