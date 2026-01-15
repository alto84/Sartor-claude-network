"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  updateIntegrationConfig,
  getSetupProgress,
} from "@/lib/setup-storage";
import { StepNavigation, type IntegrationStepProps } from "../setup-wizard";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  HelpCircle,
  Eye,
  EyeOff,
  Mail,
  Shield,
  Check,
} from "lucide-react";

type SetupStep = "project" | "oauth" | "scopes" | "connect";

interface Scope {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

const availableScopes: Scope[] = [
  {
    id: "calendar.readonly",
    name: "Calendar (Read)",
    description: "View your calendar events",
    required: true,
  },
  {
    id: "calendar.events",
    name: "Calendar (Write)",
    description: "Create and edit calendar events",
    required: false,
  },
  {
    id: "gmail.readonly",
    name: "Gmail (Read)",
    description: "View your email messages",
    required: false,
  },
  {
    id: "gmail.send",
    name: "Gmail (Send)",
    description: "Send emails on your behalf",
    required: false,
  },
];

export function GoogleSetup({ onComplete, onNeedHelp, onBack }: IntegrationStepProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>("project");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["calendar.readonly"]);
  const [oauthStatus, setOauthStatus] = useState<"idle" | "connecting" | "success" | "error">("idle");
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleScopeToggle = (scopeId: string) => {
    const scope = availableScopes.find((s) => s.id === scopeId);
    if (scope?.required) return;

    setSelectedScopes((prev) =>
      prev.includes(scopeId)
        ? prev.filter((s) => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  const handleOAuthConnect = async () => {
    setOauthStatus("connecting");
    setOauthError(null);

    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Simulate success
    const success = Math.random() > 0.3;

    if (success) {
      setOauthStatus("success");
      updateIntegrationConfig("google", {
        clientId,
        clientSecret,
        scopes: selectedScopes,
        oauthComplete: true,
        lastConnected: new Date().toISOString(),
      });
    } else {
      setOauthStatus("error");
      setOauthError("OAuth flow failed. Please check your credentials and try again.");
    }
  };

  const handleComplete = () => {
    if (oauthStatus === "success") {
      onComplete();
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Google Calendar & Gmail Setup</CardTitle>
            <CardDescription>
              Connect Google services for calendar and email integration
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Progress */}
        <div className="flex items-center gap-2">
          {["project", "oauth", "scopes", "connect"].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  currentStep === step
                    ? "bg-primary text-primary-foreground"
                    : index < ["project", "oauth", "scopes", "connect"].indexOf(currentStep)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < ["project", "oauth", "scopes", "connect"].indexOf(currentStep) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-2",
                    index < ["project", "oauth", "scopes", "connect"].indexOf(currentStep)
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === "project" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Create a Google Cloud Project</h3>
              <p className="text-sm text-muted-foreground">
                You'll need a Google Cloud project with the Calendar and Gmail APIs enabled.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Setup Instructions:</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                    1
                  </span>
                  <div>
                    <span>Go to Google Cloud Console</span>
                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      console.cloud.google.com
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                    2
                  </span>
                  <span>Create a new project or select an existing one</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                    3
                  </span>
                  <span>Go to "APIs & Services" → "Library"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                    4
                  </span>
                  <span>Search and enable "Google Calendar API"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                    5
                  </span>
                  <span>Search and enable "Gmail API" (if needed)</span>
                </li>
              </ol>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I need help creating a Google Cloud project",
                "User is on the Google project creation step"
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="pt-4">
              <Button onClick={() => setCurrentStep("oauth")} className="w-full">
                I have a Google Cloud project
              </Button>
            </div>
          </div>
        )}

        {currentStep === "oauth" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Configure OAuth Credentials</h3>
              <p className="text-sm text-muted-foreground">
                Create OAuth 2.0 credentials to allow secure access to Google services.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-medium">To create OAuth credentials:</h3>
              <ol className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-muted-foreground">1.</span>
                  <span>Go to "APIs & Services" → "Credentials"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">2.</span>
                  <span>Click "Create Credentials" → "OAuth 2.0 Client ID"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">3.</span>
                  <span>Configure the consent screen if prompted</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">4.</span>
                  <span>Select "Web application" as the type</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">5.</span>
                  <span>Add authorized redirect URI: <code className="bg-background px-1.5 py-0.5 rounded">http://localhost:3000/api/auth/callback/google</code></span>
                </li>
              </ol>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="xxxxx.apps.googleusercontent.com"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <div className="relative">
                  <Input
                    id="clientSecret"
                    type={showSecret ? "text" : "password"}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Enter your client secret"
                    className="pr-10 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I need help configuring Google OAuth credentials",
                `User is on the OAuth step. Has client ID: ${!!clientId}. Has secret: ${!!clientSecret}`
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("project")}
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("scopes")}
                disabled={!clientId || !clientSecret}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {currentStep === "scopes" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Select Permissions</h3>
              <p className="text-sm text-muted-foreground">
                Choose which Google services you want to connect. You can change these later.
              </p>
            </div>

            <div className="space-y-3">
              {availableScopes.map((scope) => (
                <div
                  key={scope.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer",
                    selectedScopes.includes(scope.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                    scope.required && "cursor-not-allowed"
                  )}
                  onClick={() => handleScopeToggle(scope.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      scope.id.includes("calendar")
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-red-500/10 text-red-500"
                    )}>
                      {scope.id.includes("calendar") ? (
                        <Calendar className="h-5 w-5" />
                      ) : (
                        <Mail className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {scope.name}
                        {scope.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{scope.description}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                    selectedScopes.includes(scope.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}>
                    {selectedScopes.includes(scope.id) && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("oauth")}
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("connect")}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {currentStep === "connect" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Configuration Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Client ID:</span>
                  <code className="bg-background px-2 py-0.5 rounded text-xs truncate max-w-[200px]">
                    {clientId.substring(0, 20)}...
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Client Secret:</span>
                  <Badge variant="success" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Configured
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Permissions:</span>
                  <span className="text-xs">{selectedScopes.length} scopes</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Connect Your Google Account</h3>
              <p className="text-sm text-muted-foreground">
                Click below to sign in with Google and authorize the selected permissions.
              </p>

              <Button
                onClick={handleOAuthConnect}
                disabled={oauthStatus === "connecting"}
                variant={oauthStatus === "success" ? "outline" : "default"}
                className="w-full gap-2"
              >
                {oauthStatus === "connecting" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {oauthStatus === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {oauthStatus === "error" && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                {oauthStatus === "idle" && (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
                {oauthStatus === "connecting" && "Connecting..."}
                {oauthStatus === "success" && "Connected Successfully!"}
                {oauthStatus === "error" && "Try Again"}
              </Button>

              {oauthStatus === "error" && oauthError && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {oauthError}
                </div>
              )}

              {oauthStatus === "success" && (
                <div className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-lg p-3 text-sm">
                  Successfully connected to Google! Your calendar and email are now accessible.
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I'm having trouble connecting my Google account",
                `User is on the connect step. OAuth status: ${oauthStatus}. Error: ${oauthError || "none"}`
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("scopes")}
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={oauthStatus !== "success"}
                className="flex-1 gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete Setup
              </Button>
            </div>
          </div>
        )}

        <StepNavigation onBack={onBack} />
      </CardContent>
    </Card>
  );
}
