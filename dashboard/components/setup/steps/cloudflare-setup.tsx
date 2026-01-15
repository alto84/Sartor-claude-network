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
  Cloud,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  HelpCircle,
  Terminal,
  Copy,
  Check,
  Shield,
  Zap,
  Globe,
} from "lucide-react";

type SetupStep = "intro" | "install" | "configure" | "verify";

export function CloudflareSetup({ onComplete, onNeedHelp, onBack }: IntegrationStepProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>("intro");
  const [tunnelId, setTunnelId] = useState("");
  const [tunnelName, setTunnelName] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const handleCopyCommand = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const handleVerify = async () => {
    setVerifyStatus("verifying");
    setVerifyError(null);

    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const success = Math.random() > 0.3;

    if (success) {
      setVerifyStatus("success");
      updateIntegrationConfig("cloudflare", {
        tunnelId,
        tunnelName,
        configured: true,
        lastConfigured: new Date().toISOString(),
      });
    } else {
      setVerifyStatus("error");
      setVerifyError("Could not verify tunnel configuration. Please ensure the tunnel is running.");
    }
  };

  const handleComplete = () => {
    if (verifyStatus === "success") {
      onComplete();
    }
  };

  const commands = [
    {
      id: "login",
      label: "Login to Cloudflare",
      command: "cloudflared tunnel login",
      description: "Authenticate with your Cloudflare account",
    },
    {
      id: "create",
      label: "Create tunnel",
      command: `cloudflared tunnel create ${tunnelName || "nestly-tunnel"}`,
      description: "Create a new tunnel for your services",
    },
    {
      id: "route",
      label: "Route DNS",
      command: `cloudflared tunnel route dns ${tunnelName || "nestly-tunnel"} dashboard.yourdomain.com`,
      description: "Point a subdomain to your tunnel",
    },
    {
      id: "run",
      label: "Run tunnel",
      command: `cloudflared tunnel run ${tunnelName || "nestly-tunnel"}`,
      description: "Start the tunnel (keep running)",
    },
  ];

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Cloudflare Tunnel Setup</CardTitle>
            <CardDescription>
              Secure access to local services without exposing ports
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-auto">Optional</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Progress */}
        <div className="flex items-center gap-2">
          {["intro", "install", "configure", "verify"].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  currentStep === step
                    ? "bg-primary text-primary-foreground"
                    : index < ["intro", "install", "configure", "verify"].indexOf(currentStep)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < ["intro", "install", "configure", "verify"].indexOf(currentStep) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-2",
                    index < ["intro", "install", "configure", "verify"].indexOf(currentStep)
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === "intro" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">What is Cloudflare Tunnel?</h3>
              <p className="text-sm text-muted-foreground">
                Cloudflare Tunnel creates a secure, encrypted connection between your local services
                and Cloudflare's network, allowing you to access them from anywhere without
                exposing ports to the internet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <Shield className="h-8 w-8 text-green-500" />
                <h4 className="font-medium">Secure</h4>
                <p className="text-xs text-muted-foreground">
                  No exposed ports, encrypted traffic, DDoS protection
                </p>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <Zap className="h-8 w-8 text-yellow-500" />
                <h4 className="font-medium">Fast</h4>
                <p className="text-xs text-muted-foreground">
                  Cloudflare's global network ensures low latency access
                </p>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <Globe className="h-8 w-8 text-blue-500" />
                <h4 className="font-medium">Anywhere</h4>
                <p className="text-xs text-muted-foreground">
                  Access your dashboard from any device, any location
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Prerequisites:</strong> You'll need a Cloudflare account (free tier works)
                and a domain added to Cloudflare.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I want to understand more about Cloudflare Tunnel and whether I need it",
                "User is on the Cloudflare intro step"
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help deciding
            </Button>

            <div className="pt-4">
              <Button onClick={() => setCurrentStep("install")} className="w-full">
                I want to set up Cloudflare Tunnel
              </Button>
            </div>
          </div>
        )}

        {currentStep === "install" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Install cloudflared</h3>
              <p className="text-sm text-muted-foreground">
                First, install the Cloudflare Tunnel client on your machine.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b">
                  <span className="text-sm font-medium">Windows (winget)</span>
                </div>
                <div className="p-3 bg-background flex items-center justify-between">
                  <code className="text-sm font-mono">winget install cloudflare.cloudflared</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyCommand("winget install cloudflare.cloudflared", "win")}
                  >
                    {copiedCommand === "win" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b">
                  <span className="text-sm font-medium">macOS (Homebrew)</span>
                </div>
                <div className="p-3 bg-background flex items-center justify-between">
                  <code className="text-sm font-mono">brew install cloudflared</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyCommand("brew install cloudflared", "mac")}
                  >
                    {copiedCommand === "mac" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b">
                  <span className="text-sm font-medium">Linux (apt)</span>
                </div>
                <div className="p-3 bg-background flex items-center justify-between">
                  <code className="text-sm font-mono text-xs">curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo apt-key add - && sudo apt install cloudflared</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyCommand("curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo apt-key add - && sudo apt install cloudflared", "linux")}
                  >
                    {copiedCommand === "linux" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <a
              href="https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Full installation guide
              <ExternalLink className="h-3 w-3" />
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I'm having trouble installing cloudflared",
                "User is on the Cloudflare install step"
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("intro")}
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("configure")}
                className="flex-1"
              >
                I have cloudflared installed
              </Button>
            </div>
          </div>
        )}

        {currentStep === "configure" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tunnelName">Tunnel Name</Label>
              <Input
                id="tunnelName"
                value={tunnelName}
                onChange={(e) => setTunnelName(e.target.value)}
                placeholder="nestly-tunnel"
              />
              <p className="text-xs text-muted-foreground">
                Choose a name for your tunnel (lowercase, no spaces)
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Run these commands in order:
              </h3>

              <div className="space-y-2">
                {commands.map((cmd, index) => (
                  <div key={cmd.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">{cmd.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{cmd.description}</span>
                    </div>
                    <div className="p-3 bg-background flex items-center justify-between">
                      <code className="text-sm font-mono">{cmd.command}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyCommand(cmd.command, cmd.id)}
                      >
                        {copiedCommand === cmd.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tunnelId">Tunnel ID (from create command output)</Label>
              <Input
                id="tunnelId"
                value={tunnelId}
                onChange={(e) => setTunnelId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono"
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Note:</strong> You'll also need to create a config.yml file to specify
                which local services to expose. Check the Cloudflare docs for examples.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I need help configuring my Cloudflare Tunnel",
                `User is on the configure step. Tunnel name: ${tunnelName}. Tunnel ID: ${tunnelId}`
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("install")}
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("verify")}
                disabled={!tunnelName}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {currentStep === "verify" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Configuration Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tunnel Name:</span>
                  <code className="bg-background px-2 py-0.5 rounded">
                    {tunnelName}
                  </code>
                </div>
                {tunnelId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tunnel ID:</span>
                    <code className="bg-background px-2 py-0.5 rounded text-xs">
                      {tunnelId.substring(0, 8)}...
                    </code>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Verify Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Make sure your tunnel is running, then click to verify the setup.
              </p>

              <Button
                onClick={handleVerify}
                disabled={verifyStatus === "verifying"}
                variant={verifyStatus === "success" ? "outline" : "default"}
                className="w-full gap-2"
              >
                {verifyStatus === "verifying" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {verifyStatus === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {verifyStatus === "error" && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                {verifyStatus === "idle" && "Verify Tunnel Configuration"}
                {verifyStatus === "verifying" && "Verifying..."}
                {verifyStatus === "success" && "Tunnel Verified!"}
                {verifyStatus === "error" && "Verification Failed - Try Again"}
              </Button>

              {verifyStatus === "error" && verifyError && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {verifyError}
                </div>
              )}

              {verifyStatus === "success" && (
                <div className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-lg p-3 text-sm">
                  Cloudflare Tunnel is configured and running! Your local services are now securely accessible.
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "My Cloudflare Tunnel verification is failing",
                `User is on the verify step. Tunnel name: ${tunnelName}. Status: ${verifyStatus}. Error: ${verifyError || "none"}`
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
                onClick={handleComplete}
                disabled={verifyStatus !== "success"}
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
