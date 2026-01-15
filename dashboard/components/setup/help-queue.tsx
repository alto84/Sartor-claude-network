"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  getSetupProgress,
  updateHelpRequest,
  resolveHelpRequest,
  type HelpQueueItem,
} from "@/lib/setup-storage";
import {
  X,
  HelpCircle,
  CheckCircle2,
  Clock,
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
} from "lucide-react";

interface HelpQueueProps {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function HelpQueue({ open, onClose, onRefresh }: HelpQueueProps) {
  const [helpItems, setHelpItems] = useState<HelpQueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HelpQueueItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const progress = getSetupProgress();
      setHelpItems(progress.helpQueue);

      // Auto-select first pending item if none selected
      if (!selectedItem) {
        const pending = progress.helpQueue.find((h) => h.status !== "resolved");
        if (pending) {
          handleSelectItem(pending);
        }
      }
    }
  }, [open]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectItem = (item: HelpQueueItem) => {
    setSelectedItem(item);

    // Initialize conversation with the original question
    setMessages([
      {
        id: `user-${item.id}`,
        role: "user",
        content: item.question + (item.context ? `\n\nContext:\n${item.context}` : ""),
        timestamp: new Date(item.createdAt),
      },
      {
        id: `assistant-initial-${item.id}`,
        role: "assistant",
        content: getInitialResponse(item),
        timestamp: new Date(),
      },
    ]);

    // Mark as in progress if pending
    if (item.status === "pending") {
      updateHelpRequest(item.id, { status: "in_progress" });
      const progress = getSetupProgress();
      setHelpItems(progress.helpQueue);
      onRefresh();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedItem) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate Claude response (in real implementation, this would call an API)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: getHelpResponse(selectedItem, inputValue.trim()),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleResolve = () => {
    if (!selectedItem) return;

    resolveHelpRequest(selectedItem.id);
    const progress = getSetupProgress();
    setHelpItems(progress.helpQueue);

    // Select next pending item or clear
    const nextPending = progress.helpQueue.find(
      (h) => h.status !== "resolved" && h.id !== selectedItem.id
    );
    if (nextPending) {
      handleSelectItem(nextPending);
    } else {
      setSelectedItem(null);
      setMessages([]);
    }

    onRefresh();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!open) return null;

  const pendingCount = helpItems.filter((h) => h.status !== "resolved").length;
  const resolvedCount = helpItems.filter((h) => h.status === "resolved").length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help Queue
              </h2>
              <p className="text-sm text-muted-foreground">
                {pendingCount} pending, {resolvedCount} resolved
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Queue List */}
            <div className="w-64 border-r flex flex-col">
              <div className="p-3 border-b">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Help Requests
                </p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {helpItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No help requests yet
                    </p>
                  ) : (
                    helpItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors",
                          selectedItem?.id === item.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.integrationName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {item.question.substring(0, 50)}...
                            </p>
                          </div>
                          <Badge
                            variant={
                              item.status === "resolved"
                                ? "success"
                                : item.status === "in_progress"
                                ? "info"
                                : "warning"
                            }
                            className="text-xs shrink-0"
                          >
                            {item.status === "resolved" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : item.status === "in_progress" ? (
                              <MessageCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                          </Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedItem ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{selectedItem.integrationName}</h3>
                        <p className="text-xs text-muted-foreground">
                          Started {new Date(selectedItem.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {selectedItem.status !== "resolved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResolve}
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            message.role === "user" && "flex-row-reverse"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              message.role === "assistant"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {message.role === "assistant" ? (
                              <Bot className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-4 py-2",
                              message.role === "assistant"
                                ? "bg-muted"
                                : "bg-primary text-primary-foreground"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <p
                              className={cn(
                                "text-xs mt-1 opacity-60",
                                message.role === "user" && "text-right"
                              )}
                            >
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="bg-muted rounded-lg px-4 py-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  {selectedItem.status !== "resolved" && (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type your question or follow-up..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="min-h-[44px] max-h-32 resize-none"
                          rows={1}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isLoading}
                          size="icon"
                          className="shrink-0"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Press Enter to send, Shift+Enter for new line
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Select a help request to start</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for simulated responses
function getInitialResponse(item: HelpQueueItem): string {
  const responses: Record<string, string> = {
    firebase: `I'll help you set up Firebase! Let me walk you through the process.

**Step 1: Create a Firebase Project**
1. Go to the Firebase Console (console.firebase.google.com)
2. Click "Add project" or select an existing one
3. Follow the setup wizard

**Step 2: Get Service Account Credentials**
1. In your project, go to Project Settings (gear icon)
2. Click the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely

What specific step are you stuck on?`,

    obsidian: `I'll help you connect Obsidian to the dashboard!

**Prerequisites:**
1. Install the "Local REST API" plugin in Obsidian
2. Enable and configure the plugin
3. Note down your API key

**Optional: Remote Access via Cloudflare Tunnel**
If you want to access your vault remotely, we'll set up a Cloudflare Tunnel.

What would you like help with?`,

    google: `I'll help you set up Google OAuth!

**Step 1: Create Google Cloud Project**
1. Go to console.cloud.google.com
2. Create a new project or select existing
3. Enable the Calendar and Gmail APIs

**Step 2: Configure OAuth**
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Configure the consent screen first if prompted
4. Select "Web application" as the type

What part do you need help with?`,

    homeAssistant: `I'll help you connect Home Assistant!

**You'll need:**
1. Your Home Assistant URL (e.g., http://homeassistant.local:8123)
2. A Long-Lived Access Token

**To get the token:**
1. Log into Home Assistant
2. Click your profile (bottom left)
3. Scroll to "Long-Lived Access Tokens"
4. Create a new token

What's your current setup like?`,

    cloudflare: `I'll help you set up Cloudflare Tunnel!

**What is Cloudflare Tunnel?**
It creates a secure connection between your local services and Cloudflare's network, without exposing ports to the internet.

**Prerequisites:**
1. A Cloudflare account
2. A domain added to Cloudflare
3. Cloudflared installed locally

Would you like step-by-step instructions for setting this up?`,
  };

  return responses[item.integrationId] || `I'll help you with ${item.integrationName}! What specific question do you have?`;
}

function getHelpResponse(item: HelpQueueItem, question: string): string {
  // Simple response generation based on keywords
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("error") || lowerQuestion.includes("fail")) {
    return `It sounds like you're running into an error. Could you share:

1. The exact error message you're seeing
2. What step you were on when it happened
3. Any relevant logs or screenshots

This will help me diagnose the issue more accurately.`;
  }

  if (lowerQuestion.includes("where") || lowerQuestion.includes("find")) {
    return `Here's where you can typically find that:

For **Firebase**: Firebase Console > Project Settings
For **Google Cloud**: Cloud Console > APIs & Services
For **Home Assistant**: Profile > Long-Lived Access Tokens
For **Obsidian**: Settings > Community Plugins

Let me know which specific item you're looking for!`;
  }

  if (lowerQuestion.includes("test") || lowerQuestion.includes("verify")) {
    return `Great idea to test the connection! Here's how:

1. Make sure all credentials are entered correctly
2. Click the "Test Connection" button in the setup form
3. Watch for the success or error message

If the test fails, check that:
- The service is running and accessible
- Your credentials haven't expired
- Firewall rules allow the connection

What result are you getting?`;
  }

  return `Thanks for that additional information!

Based on what you've shared, I'd suggest:

1. Double-check that all required fields are filled in correctly
2. Ensure the service you're connecting to is running
3. Try the "Test Connection" button to verify the setup

Is there a specific part of the setup that's unclear? I'm happy to provide more detailed instructions for any step.`;
}
