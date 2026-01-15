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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  updateIntegrationConfig,
  getSetupProgress,
} from "@/lib/setup-storage";
import { StepNavigation, type IntegrationStepProps } from "../setup-wizard";
import {
  Home,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  HelpCircle,
  Eye,
  EyeOff,
  Lightbulb,
  Thermometer,
  Lock,
  Speaker,
  Tv,
  Power,
  Search,
} from "lucide-react";

type SetupStep = "url" | "token" | "test" | "entities";

interface Entity {
  id: string;
  name: string;
  type: string;
  state: string;
}

// Simulated discovered entities
const mockEntities: Entity[] = [
  { id: "light.living_room", name: "Living Room Light", type: "light", state: "on" },
  { id: "light.bedroom", name: "Bedroom Light", type: "light", state: "off" },
  { id: "light.kitchen", name: "Kitchen Light", type: "light", state: "off" },
  { id: "climate.thermostat", name: "Main Thermostat", type: "climate", state: "72°F" },
  { id: "lock.front_door", name: "Front Door Lock", type: "lock", state: "locked" },
  { id: "lock.back_door", name: "Back Door Lock", type: "lock", state: "locked" },
  { id: "media_player.living_room", name: "Living Room Speaker", type: "media_player", state: "idle" },
  { id: "media_player.tv", name: "Living Room TV", type: "media_player", state: "off" },
  { id: "switch.garage", name: "Garage Door", type: "switch", state: "closed" },
];

const entityIcons: Record<string, typeof Lightbulb> = {
  light: Lightbulb,
  climate: Thermometer,
  lock: Lock,
  media_player: Speaker,
  switch: Power,
};

export function HomeAssistantSetup({ onComplete, onNeedHelp, onBack }: IntegrationStepProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>("url");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityFilter, setEntityFilter] = useState("");

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestError(null);

    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate success
    const success = Math.random() > 0.3;

    if (success) {
      setTestStatus("success");
      setEntities(mockEntities);
      updateIntegrationConfig("homeAssistant", {
        url,
        token,
        connectionTested: true,
        entitiesDiscovered: mockEntities.length,
        lastTested: new Date().toISOString(),
      });
    } else {
      setTestStatus("error");
      setTestError("Could not connect to Home Assistant. Please check your URL and access token.");
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const filteredEntities = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(entityFilter.toLowerCase()) ||
      e.id.toLowerCase().includes(entityFilter.toLowerCase())
  );

  const isValidUrl = url.startsWith("http://") || url.startsWith("https://");

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Home Assistant Setup</CardTitle>
            <CardDescription>
              Connect your smart home for device control and automation
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Progress */}
        <div className="flex items-center gap-2">
          {["url", "token", "test", "entities"].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  currentStep === step
                    ? "bg-primary text-primary-foreground"
                    : index < ["url", "token", "test", "entities"].indexOf(currentStep)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < ["url", "token", "test", "entities"].indexOf(currentStep) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-2",
                    index < ["url", "token", "test", "entities"].indexOf(currentStep)
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === "url" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Home Assistant URL</h3>
              <p className="text-sm text-muted-foreground">
                Enter the URL where your Home Assistant instance is accessible.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Home Assistant URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://homeassistant.local:8123"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Common formats: http://homeassistant.local:8123 or https://your-ha.duckdns.org
              </p>
              {url && !isValidUrl && (
                <p className="text-xs text-destructive">
                  URL must start with http:// or https://
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> If you're accessing Home Assistant from outside your home network,
                you'll need to set up remote access (like Nabu Casa or a Cloudflare Tunnel).
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I need help finding my Home Assistant URL",
                "User is on the Home Assistant URL step"
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="pt-4">
              <Button
                onClick={() => setCurrentStep("token")}
                disabled={!isValidUrl}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {currentStep === "token" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Long-Lived Access Token</h3>
              <p className="text-sm text-muted-foreground">
                Create a token in Home Assistant to allow secure access from the dashboard.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-medium">How to create an access token:</h3>
              <ol className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-muted-foreground">1.</span>
                  <span>Log into your Home Assistant</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">2.</span>
                  <span>Click your profile picture (bottom left corner)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">3.</span>
                  <span>Scroll down to "Long-Lived Access Tokens"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">4.</span>
                  <span>Click "Create Token" and give it a name (e.g., "Nestly Dashboard")</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">5.</span>
                  <span>Copy the token - it's only shown once!</span>
                </li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Access Token</Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I can't find where to create an access token in Home Assistant",
                `User is on the token step. URL entered: ${url}`
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("url")}
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("test")}
                disabled={!token}
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
                  <span className="text-muted-foreground">URL:</span>
                  <code className="bg-background px-2 py-0.5 rounded text-xs">
                    {url}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Access Token:</span>
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Test Connection</h3>
              <p className="text-sm text-muted-foreground">
                We'll connect to Home Assistant and discover your devices.
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
                {testStatus === "idle" && "Test Connection & Discover Devices"}
                {testStatus === "testing" && "Connecting..."}
                {testStatus === "success" && `Connected! Found ${entities.length} devices`}
                {testStatus === "error" && "Test Failed - Try Again"}
              </Button>

              {testStatus === "error" && testError && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {testError}
                </div>
              )}

              {testStatus === "success" && (
                <div className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-lg p-3 text-sm">
                  Successfully connected to Home Assistant! {entities.length} devices discovered.
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "My Home Assistant connection test is failing",
                `User is on the test step. URL: ${url}. Test status: ${testStatus}. Error: ${testError || "none"}`
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("token")}
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("entities")}
                disabled={testStatus !== "success"}
                className="flex-1"
              >
                View Discovered Devices
              </Button>
            </div>
          </div>
        )}

        {currentStep === "entities" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Discovered Devices ({entities.length})</h3>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <ScrollArea className="h-64 rounded-lg border">
              <div className="p-2 space-y-1">
                {filteredEntities.map((entity) => {
                  const Icon = entityIcons[entity.type] || Power;
                  return (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{entity.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {entity.id}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          entity.state === "on" || entity.state === "locked"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {entity.state}
                      </Badge>
                    </div>
                  );
                })}
                {filteredEntities.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No devices match your search
                  </p>
                )}
              </div>
            </ScrollArea>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              All discovered devices will be available for control through the dashboard.
              You can configure which devices to show later in Settings.
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("test")}
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
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
