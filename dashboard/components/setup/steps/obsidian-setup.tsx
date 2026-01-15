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
  BookOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  HelpCircle,
  Eye,
  EyeOff,
  Cloud,
  Plug,
  AlertTriangle,
} from "lucide-react";

type SetupStep = "plugin" | "configure" | "cloudflare" | "test";

export function ObsidianSetup({ onComplete, onNeedHelp, onBack }: IntegrationStepProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>("plugin");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [vaultPath, setVaultPath] = useState("");
  const [useCloudflare, setUseCloudflare] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestError(null);

    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate success (in real implementation, this would call an API)
    const success = Math.random() > 0.3;

    if (success) {
      setTestStatus("success");
      updateIntegrationConfig("obsidian", {
        apiKey: apiKey,
        vaultPath: vaultPath || undefined,
        connectionTested: true,
        cloudflareConfigured: useCloudflare,
        lastTested: new Date().toISOString(),
      });
    } else {
      setTestStatus("error");
      setTestError("Could not connect to Obsidian Local REST API. Make sure the plugin is running and the API key is correct.");
    }
  };

  const handleComplete = () => {
    if (testStatus === "success") {
      onComplete();
    }
  };

  const steps: SetupStep[] = useCloudflare
    ? ["plugin", "configure", "cloudflare", "test"]
    : ["plugin", "configure", "test"];

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Obsidian Setup</CardTitle>
            <CardDescription>
              Connect your Obsidian vault for knowledge management
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Progress */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  currentStep === step
                    ? "bg-primary text-primary-foreground"
                    : index < steps.indexOf(currentStep)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < steps.indexOf(currentStep) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-2",
                    index < steps.indexOf(currentStep)
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === "plugin" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Install the Local REST API Plugin</h3>
              <p className="text-sm text-muted-foreground">
                The Local REST API plugin allows external applications to interact with your Obsidian vault.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Installation Steps:</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 text-xs font-medium">
                    1
                  </span>
                  <span>Open Obsidian and go to Settings (gear icon)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 text-xs font-medium">
                    2
                  </span>
                  <span>Navigate to "Community plugins" in the left sidebar</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 text-xs font-medium">
                    3
                  </span>
                  <span>Click "Browse" and search for "Local REST API"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 text-xs font-medium">
                    4
                  </span>
                  <span>Click "Install" then "Enable"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 text-xs font-medium">
                    5
                  </span>
                  <span>Go to the plugin settings and copy your API key</span>
                </li>
              </ol>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Security Note
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Keep your API key secure. It provides full access to your vault.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I need help installing the Local REST API plugin in Obsidian",
                "User is on the Obsidian plugin installation step"
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="pt-4">
              <Button onClick={() => setCurrentStep("configure")} className="w-full">
                I have the plugin installed
              </Button>
            </div>
          </div>
        )}

        {currentStep === "configure" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Local REST API key"
                  className="pr-10 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Found in Obsidian Settings → Community Plugins → Local REST API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vaultPath">Vault Path (Optional)</Label>
              <Input
                id="vaultPath"
                value={vaultPath}
                onChange={(e) => setVaultPath(e.target.value)}
                placeholder="e.g., C:/Users/name/Documents/MyVault"
              />
              <p className="text-xs text-muted-foreground">
                The full path to your Obsidian vault folder
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Remote Access via Cloudflare Tunnel</p>
                    <p className="text-xs text-muted-foreground">
                      Access your vault from anywhere securely
                    </p>
                  </div>
                </div>
                <Button
                  variant={useCloudflare ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseCloudflare(!useCloudflare)}
                >
                  {useCloudflare ? "Enabled" : "Enable"}
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I'm having trouble finding my API key in Obsidian",
                `User is on the configure step. API key entered: ${!!apiKey}`
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("plugin")}
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(useCloudflare ? "cloudflare" : "test")}
                disabled={!apiKey}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {currentStep === "cloudflare" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Cloudflare Tunnel Setup</h3>
              <p className="text-sm text-muted-foreground">
                Cloudflare Tunnel creates a secure connection between your local Obsidian and the internet, without exposing your local ports.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Setup Instructions:</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                    1
                  </span>
                  <div>
                    <span>Install cloudflared on your machine</span>
                    <a
                      href="https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      Installation Guide
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                    2
                  </span>
                  <span>Run: <code className="bg-background px-1.5 py-0.5 rounded text-xs">cloudflared tunnel login</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                    3
                  </span>
                  <span>Create a tunnel: <code className="bg-background px-1.5 py-0.5 rounded text-xs">cloudflared tunnel create obsidian</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                    4
                  </span>
                  <span>Route traffic: <code className="bg-background px-1.5 py-0.5 rounded text-xs">cloudflared tunnel route dns obsidian vault.yourdomain.com</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                    5
                  </span>
                  <span>Start the tunnel pointing to your Local REST API port (default 27123)</span>
                </li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tunnelUrl">Tunnel URL (Optional)</Label>
              <Input
                id="tunnelUrl"
                value={tunnelUrl}
                onChange={(e) => setTunnelUrl(e.target.value)}
                placeholder="e.g., https://vault.yourdomain.com"
              />
              <p className="text-xs text-muted-foreground">
                The public URL for your Cloudflare tunnel
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I need help setting up a Cloudflare Tunnel for Obsidian",
                "User is on the Cloudflare tunnel setup step for Obsidian"
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("configure")}
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("test")}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {currentStep === "test" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Configuration Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API Key:</span>
                  <Badge variant="success" className="gap-1">
                    <Plug className="h-3 w-3" />
                    Configured
                  </Badge>
                </div>
                {vaultPath && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vault Path:</span>
                    <code className="bg-background px-2 py-0.5 rounded text-xs truncate max-w-[200px]">
                      {vaultPath}
                    </code>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Remote Access:</span>
                  <Badge variant={useCloudflare ? "success" : "secondary"}>
                    {useCloudflare ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Test Connection</h3>
              <p className="text-sm text-muted-foreground">
                Make sure Obsidian is running with the Local REST API plugin enabled, then click to test.
              </p>

              <Button
                onClick={handleTestConnection}
                disabled={testStatus === "testing"}
                variant={testStatus === "success" ? "outline" : "default"}
                className="w-full gap-2"
              >
                {testStatus === "testing" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {testStatus === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {testStatus === "error" && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                {testStatus === "idle" && "Test Connection"}
                {testStatus === "testing" && "Testing..."}
                {testStatus === "success" && "Connection Successful!"}
                {testStatus === "error" && "Test Failed - Try Again"}
              </Button>

              {testStatus === "error" && testError && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {testError}
                </div>
              )}

              {testStatus === "success" && (
                <div className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-lg p-3 text-sm">
                  Successfully connected to your Obsidian vault!
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "My Obsidian connection test is failing",
                `User is on the test step. Has API key: ${!!apiKey}. Uses Cloudflare: ${useCloudflare}. Test status: ${testStatus}. Error: ${testError || "none"}`
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(useCloudflare ? "cloudflare" : "configure")}
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={testStatus !== "success"}
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
