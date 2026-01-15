// Setup progress storage utility
// Stores integration setup progress in localStorage

export type IntegrationStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'needs_help'
  | 'skipped';

export interface IntegrationConfig {
  firebase?: {
    projectId?: string;
    serviceAccountUploaded?: boolean;
    connectionTested?: boolean;
    lastTested?: string;
  };
  obsidian?: {
    apiKey?: string;
    vaultPath?: string;
    connectionTested?: boolean;
    cloudflareConfigured?: boolean;
    lastTested?: string;
  };
  google?: {
    clientId?: string;
    clientSecret?: string;
    scopes?: string[];
    oauthComplete?: boolean;
    lastConnected?: string;
  };
  homeAssistant?: {
    url?: string;
    token?: string;
    connectionTested?: boolean;
    entitiesDiscovered?: number;
    lastTested?: string;
  };
  cloudflare?: {
    tunnelId?: string;
    tunnelName?: string;
    configured?: boolean;
    lastConfigured?: string;
  };
}

export interface HelpQueueItem {
  id: string;
  integrationId: string;
  integrationName: string;
  question: string;
  context?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  response?: string;
}

export interface SetupProgress {
  currentStep: number;
  completedSteps: string[];
  integrationStatuses: Record<string, IntegrationStatus>;
  integrationConfigs: IntegrationConfig;
  helpQueue: HelpQueueItem[];
  lastUpdated: string;
  wizardComplete: boolean;
}

const STORAGE_KEY = 'nestly-setup-progress';

const defaultProgress: SetupProgress = {
  currentStep: 0,
  completedSteps: [],
  integrationStatuses: {
    firebase: 'not_started',
    obsidian: 'not_started',
    google: 'not_started',
    homeAssistant: 'not_started',
    cloudflare: 'not_started',
  },
  integrationConfigs: {},
  helpQueue: [],
  lastUpdated: new Date().toISOString(),
  wizardComplete: false,
};

export function getSetupProgress(): SetupProgress {
  if (typeof window === 'undefined') {
    return defaultProgress;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultProgress;
    }
    return JSON.parse(stored) as SetupProgress;
  } catch (error) {
    console.error('Failed to load setup progress:', error);
    return defaultProgress;
  }
}

export function saveSetupProgress(progress: Partial<SetupProgress>): SetupProgress {
  if (typeof window === 'undefined') {
    return defaultProgress;
  }

  try {
    const current = getSetupProgress();
    const updated: SetupProgress = {
      ...current,
      ...progress,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save setup progress:', error);
    return getSetupProgress();
  }
}

export function updateIntegrationStatus(
  integrationId: string,
  status: IntegrationStatus
): SetupProgress {
  const current = getSetupProgress();
  return saveSetupProgress({
    integrationStatuses: {
      ...current.integrationStatuses,
      [integrationId]: status,
    },
  });
}

export function updateIntegrationConfig<K extends keyof IntegrationConfig>(
  integrationId: K,
  config: IntegrationConfig[K]
): SetupProgress {
  const current = getSetupProgress();
  return saveSetupProgress({
    integrationConfigs: {
      ...current.integrationConfigs,
      [integrationId]: {
        ...current.integrationConfigs[integrationId],
        ...config,
      },
    },
  });
}

export function markStepComplete(stepId: string): SetupProgress {
  const current = getSetupProgress();
  if (current.completedSteps.includes(stepId)) {
    return current;
  }
  return saveSetupProgress({
    completedSteps: [...current.completedSteps, stepId],
  });
}

export function setCurrentStep(step: number): SetupProgress {
  return saveSetupProgress({ currentStep: step });
}

export function addHelpRequest(
  integrationId: string,
  integrationName: string,
  question: string,
  context?: string
): SetupProgress {
  const current = getSetupProgress();
  const newItem: HelpQueueItem = {
    id: `help-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    integrationId,
    integrationName,
    question,
    context,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Also mark the integration as needing help
  return saveSetupProgress({
    helpQueue: [...current.helpQueue, newItem],
    integrationStatuses: {
      ...current.integrationStatuses,
      [integrationId]: 'needs_help',
    },
  });
}

export function updateHelpRequest(
  helpId: string,
  updates: Partial<HelpQueueItem>
): SetupProgress {
  const current = getSetupProgress();
  return saveSetupProgress({
    helpQueue: current.helpQueue.map((item) =>
      item.id === helpId
        ? { ...item, ...updates }
        : item
    ),
  });
}

export function resolveHelpRequest(
  helpId: string,
  response?: string
): SetupProgress {
  const current = getSetupProgress();
  const helpItem = current.helpQueue.find((item) => item.id === helpId);

  const updated = saveSetupProgress({
    helpQueue: current.helpQueue.map((item) =>
      item.id === helpId
        ? {
            ...item,
            status: 'resolved' as const,
            resolvedAt: new Date().toISOString(),
            response,
          }
        : item
    ),
  });

  // Check if the integration still has pending help requests
  if (helpItem) {
    const stillNeedsHelp = updated.helpQueue.some(
      (item) =>
        item.integrationId === helpItem.integrationId &&
        item.status !== 'resolved'
    );

    if (!stillNeedsHelp) {
      return updateIntegrationStatus(helpItem.integrationId, 'in_progress');
    }
  }

  return updated;
}

export function clearHelpQueue(): SetupProgress {
  return saveSetupProgress({ helpQueue: [] });
}

export function completeWizard(): SetupProgress {
  return saveSetupProgress({ wizardComplete: true });
}

export function resetSetupProgress(): SetupProgress {
  if (typeof window === 'undefined') {
    return defaultProgress;
  }

  localStorage.removeItem(STORAGE_KEY);
  return defaultProgress;
}

export function getIntegrationProgress(): {
  total: number;
  completed: number;
  percentage: number;
} {
  const progress = getSetupProgress();
  const statuses = Object.values(progress.integrationStatuses);
  const total = statuses.length;
  const completed = statuses.filter(
    (s) => s === 'complete' || s === 'skipped'
  ).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}
