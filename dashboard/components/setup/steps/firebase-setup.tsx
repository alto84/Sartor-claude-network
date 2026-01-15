"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useFirebaseStatus } from "@/hooks/use-firebase";
import { isFirebaseConfigured, rtdbGet } from "@/lib/firebase";
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
  Flame,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  FileJson,
  ExternalLink,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";

type SetupStep = "instructions" | "upload" | "test";

export function FirebaseSetup({ onComplete, onNeedHelp, onBack }: IntegrationStepProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>("instructions");
  const [projectId, setProjectId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the real Firebase status hook
  const { isConfigured, isConnected, error: firebaseError } = useFirebaseStatus();

  // Check if Firebase is already configured via environment variables
  useEffect(() => {
    if (isFirebaseConfigured()) {
      setProjectId(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "");
      setCurrentStep("test");
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setTestError("Please upload a JSON file");
      return;
    }

    setUploadedFile(file);
    setTestError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validate it looks like a Firebase service account
        if (!parsed.project_id || !parsed.private_key) {
          setTestError("This doesn't appear to be a valid Firebase service account file");
          setUploadedFile(null);
          return;
        }

        setFileContent(content);
        setProjectId(parsed.project_id);

        // Save to config
        updateIntegrationConfig("firebase", {
          projectId: parsed.project_id,
          serviceAccountUploaded: true,
        });
      } catch (err) {
        setTestError("Failed to parse JSON file");
        setUploadedFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleTestConnection = useCallback(async () => {
    setTestStatus("testing");
    setTestError(null);

    try {
      // Check if Firebase is configured
      if (!isFirebaseConfigured()) {
        setTestStatus("error");
        setTestError("Firebase is not configured. Please set the environment variables in .env.local");
        return;
      }

      // Test actual connection by reading the .info/connected path
      const connected = await rtdbGet(".info/connected");

      // Also try to read a test path to verify database access
      const testRead = await rtdbGet("config");

      if (connected || testRead !== null) {
        setTestStatus("success");
        updateIntegrationConfig("firebase", {
          connectionTested: true,
          lastTested: new Date().toISOString(),
        });
      } else {
        setTestStatus("error");
        setTestError("Could not connect to Firebase. Please check your credentials and database rules.");
      }
    } catch (err) {
      setTestStatus("error");
      setTestError(err instanceof Error ? err.message : "Connection test failed");
    }
  }, [])

  const handleCopyProjectId = () => {
    navigator.clipboard.writeText(projectId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    if (testStatus === "success") {
      onComplete();
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Firebase Setup</CardTitle>
            <CardDescription>
              Connect Firebase for real-time data sync and authentication
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Environment Configuration Notice */}
        {isConfigured && (
          <div className="bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Firebase environment variables detected!</span>
            </div>
            <p className="mt-1 text-green-600 dark:text-green-400">
              Project: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
            </p>
          </div>
        )}

        {/* Step Progress */}
        <div className="flex items-center gap-2">
          {["instructions", "upload", "test"].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  currentStep === step
                    ? "bg-primary text-primary-foreground"
                    : index < ["instructions", "upload", "test"].indexOf(currentStep)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < ["instructions", "upload", "test"].indexOf(currentStep) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 2 && (
                <div
                  className={cn(
                    "h-0.5 w-12 mx-2",
                    index < ["instructions", "upload", "test"].indexOf(currentStep)
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === "instructions" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Before you begin, you'll need:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                    1
                  </span>
                  <span>A Firebase project (or create a new one)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                    2
                  </span>
                  <span>A service account JSON file with appropriate permissions</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">How to get your service account:</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                    1
                  </span>
                  <div>
                    <p>Go to the Firebase Console</p>
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      console.firebase.google.com
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                    2
                  </span>
                  <span>Select your project (or create a new one)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                    3
                  </span>
                  <span>Click the gear icon and go to "Project settings"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                    4
                  </span>
                  <span>Navigate to the "Service accounts" tab</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                    5
                  </span>
                  <span>Click "Generate new private key" and save the JSON file</span>
                </li>
              </ol>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I need help creating a Firebase project and getting the service account",
                "User is on the Firebase setup instructions step"
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="pt-4">
              <Button onClick={() => setCurrentStep("upload")} className="w-full">
                I have my service account file
              </Button>
            </div>
          </div>
        )}

        {currentStep === "upload" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service Account JSON File</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-primary/50",
                  uploadedFile ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-muted-foreground/25"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadedFile ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click to upload a different file
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Accepts .json files only
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {testError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {testError}
                </p>
              )}
            </div>

            {projectId && (
              <div className="space-y-2">
                <Label>Detected Project ID</Label>
                <div className="flex items-center gap-2">
                  <Input value={projectId} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyProjectId}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "I'm having trouble uploading my service account file",
                `User is on the upload step. File uploaded: ${!!uploadedFile}. Error: ${testError || "none"}`
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("instructions")}
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("test")}
                disabled={!uploadedFile || !projectId}
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
                  <span className="text-muted-foreground">Project ID:</span>
                  <code className="bg-background px-2 py-0.5 rounded">{projectId}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service Account:</span>
                  <Badge variant="success" className="gap-1">
                    <FileJson className="h-3 w-3" />
                    Uploaded
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Test Connection</h3>
              <p className="text-sm text-muted-foreground">
                Click the button below to verify your Firebase configuration is working correctly.
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
                  Successfully connected to Firebase project "{projectId}". Your configuration is working!
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNeedHelp(
                "My Firebase connection test is failing",
                `User is on the test step. Project ID: ${projectId}. Test status: ${testStatus}. Error: ${testError || "none"}`
              )}
              className="gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              I need help with this
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("upload")}
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
