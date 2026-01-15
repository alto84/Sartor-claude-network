"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  getSetupProgress,
  saveSetupProgress,
  updateIntegrationStatus,
  addHelpRequest,
  getIntegrationProgress,
  completeWizard,
  type SetupProgress,
  type IntegrationStatus,
} from "@/lib/setup-storage";
import { IntegrationCard } from "./integration-card";
import { HelpQueue } from "./help-queue";
import { FirebaseSetup } from "./steps/firebase-setup";
import { ObsidianSetup } from "./steps/obsidian-setup";
import { GoogleSetup } from "./steps/google-setup";
import { HomeAssistantSetup } from "./steps/home-assistant-setup";
import { CloudflareSetup } from "./steps/cloudflare-setup";
import {
  Flame,
  BookOpen,
  Calendar,
  Home,
  Cloud,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  PartyPopper,
  RotateCcw,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: typeof Flame;
  isOptional: boolean;
  component: React.ComponentType<IntegrationStepProps>;
}

export interface IntegrationStepProps {
  onComplete: () => void;
  onNeedHelp: (question: string, context?: string) => void;
  onBack: () => void;
}

const integrations: Integration[] = [
  {
    id: "firebase",
    name: "Firebase",
    description: "Real-time database and authentication for family data sync",
    icon: Flame,
    isOptional: false,
    component: FirebaseSetup,
  },
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Connect your knowledge vault for notes and documents",
    icon: BookOpen,
    isOptional: false,
    component: ObsidianSetup,
  },
  {
    id: "google",
    name: "Google Calendar",
    description: "Sync calendars and access Gmail for the family",
    icon: Calendar,
    isOptional: false,
    component: GoogleSetup,
  },
  {
    id: "homeAssistant",
    name: "Home Assistant",
    description: "Control your smart home devices and automations",
    icon: Home,
    isOptional: true,
    component: HomeAssistantSetup,
  },
  {
    id: "cloudflare",
    name: "Cloudflare Tunnel",
    description: "Secure access to local services without exposing ports",
    icon: Cloud,
    isOptional: true,
    component: CloudflareSetup,
  },
];

type WizardView = "overview" | "configure" | "help";

export function SetupWizard() {
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [view, setView] = useState<WizardView>("overview");
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
  const [showHelpQueue, setShowHelpQueue] = useState(false);

  // Load progress on mount
  useEffect(() => {
    setProgress(getSetupProgress());
  }, []);

  const refreshProgress = useCallback(() => {
    setProgress(getSetupProgress());
  }, []);

  const handleConfigure = (integrationId: string) => {
    updateIntegrationStatus(integrationId, "in_progress");
    setActiveIntegration(integrationId);
    setView("configure");
    refreshProgress();
  };

  const handleComplete = (integrationId: string) => {
    updateIntegrationStatus(integrationId, "complete");
    setView("overview");
    setActiveIntegration(null);
    refreshProgress();
  };

  const handleSkip = (integrationId: string) => {
    updateIntegrationStatus(integrationId, "skipped");
    refreshProgress();
  };

  const handleNeedHelp = (
    integrationId: string,
    integrationName: string,
    question: string,
    context?: string
  ) => {
    addHelpRequest(integrationId, integrationName, question, context);
    setShowHelpQueue(true);
    refreshProgress();
  };

  const handleBackToOverview = () => {
    setView("overview");
    setActiveIntegration(null);
  };

  const handleFinishSetup = () => {
    completeWizard();
    refreshProgress();
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all setup progress? This cannot be undone.")) {
      localStorage.removeItem("nestly-setup-progress");
      setProgress(getSetupProgress());
    }
  };

  if (!progress) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const progressInfo = getIntegrationProgress();
  const pendingHelpCount = progress.helpQueue.filter(
    (h) => h.status !== "resolved"
  ).length;

  // Render the active integration configuration
  if (view === "configure" && activeIntegration) {
    const integration = integrations.find((i) => i.id === activeIntegration);
    if (integration) {
      const StepComponent = integration.component;
      return (
        <StepComponent
          onComplete={() => handleComplete(activeIntegration)}
          onNeedHelp={(question, context) =>
            handleNeedHelp(activeIntegration, integration.name, question, context)
          }
          onBack={handleBackToOverview}
        />
      );
    }
  }

  // Check if setup is complete
  const allRequiredComplete = integrations
    .filter((i) => !i.isOptional)
    .every(
      (i) =>
        progress.integrationStatuses[i.id] === "complete" ||
        progress.integrationStatuses[i.id] === "skipped"
    );

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Integration Setup</CardTitle>
              <CardDescription className="mt-1">
                Configure your integrations to connect your family dashboard with
                external services
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {pendingHelpCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHelpQueue(true)}
                  className="gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help Queue
                  <Badge variant="warning" className="ml-1">
                    {pendingHelpCount}
                  </Badge>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                title="Reset progress"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">
                {progressInfo.completed} of {progressInfo.total} integrations
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressInfo.percentage}%` }}
              />
            </div>
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-muted" />
              <span className="text-muted-foreground">Not Started</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Complete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Needs Help</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Banner */}
      {allRequiredComplete && !progress.wizardComplete && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                  <PartyPopper className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    All required integrations are configured!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You can finish setup now or continue configuring optional
                    integrations.
                  </p>
                </div>
              </div>
              <Button onClick={handleFinishSetup} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Finish Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wizard Complete Banner */}
      {progress.wizardComplete && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Setup Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your integrations are configured. You can reconfigure any
                    integration at any time.
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <a href="/">Go to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            id={integration.id}
            name={integration.name}
            description={integration.description}
            icon={integration.icon}
            status={
              progress.integrationStatuses[integration.id] as IntegrationStatus
            }
            isOptional={integration.isOptional}
            onConfigure={() => handleConfigure(integration.id)}
            onNeedHelp={() =>
              handleNeedHelp(
                integration.id,
                integration.name,
                `I need help setting up ${integration.name}`,
                `Integration: ${integration.name}\nDescription: ${integration.description}`
              )
            }
            onSkip={
              integration.isOptional
                ? () => handleSkip(integration.id)
                : undefined
            }
          />
        ))}
      </div>

      {/* Help Queue Sheet */}
      {showHelpQueue && (
        <HelpQueue
          open={showHelpQueue}
          onClose={() => setShowHelpQueue(false)}
          onRefresh={refreshProgress}
        />
      )}
    </div>
  );
}

// Step Navigation Component (used within individual step components)
export function StepNavigation({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  showSkip = false,
  onSkip,
}: {
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ChevronLeft className="h-4 w-4" />
        Back to Overview
      </Button>
      <div className="flex items-center gap-2">
        {showSkip && onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        )}
        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled} className="gap-2">
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
