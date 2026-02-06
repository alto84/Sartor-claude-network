"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Mic,
  Paperclip,
  Bot,
  Sparkles,
  Calendar,
  ListTodo,
  Home,
  HelpCircle,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface ToolExecution {
  name: string;
  status: "running" | "completed" | "error";
  timestamp: Date;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  error?: boolean;
  toolsUsed?: string[];
  isStreaming?: boolean;
}

// Current user - in production this comes from auth
const CURRENT_USER = {
  id: "alton-sartor",
  name: "Alton",
  initials: "AS",
};

const suggestedPrompts = [
  {
    icon: Calendar,
    title: "Check Schedule",
    prompt: "What's on my calendar today?",
  },
  {
    icon: ListTodo,
    title: "Pending Tasks",
    prompt: "Show me my pending tasks",
  },
  {
    icon: Home,
    title: "Home Status",
    prompt: "What's the status of my home devices?",
  },
  {
    icon: HelpCircle,
    title: "Help",
    prompt: "What can you help me with?",
  },
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm Claude, the Sartor family assistant. I can help you manage your family's schedule, tasks, home devices, and more. How can I help you today?",
    timestamp: new Date(),
    suggestions: ["What's on my calendar?", "Show pending tasks", "Home status"],
  },
];

// Map skill/tool names to friendly action descriptions
const SKILL_ACTION_MAP: Record<string, string> = {
  calendar_list: "Checking your calendar...",
  calendar_create: "Creating calendar event...",
  calendar_update: "Updating calendar event...",
  calendar_free_slots: "Finding available time slots...",
  email_inbox: "Checking your inbox...",
  email_read: "Reading email...",
  email_send: "Sending email...",
  email_search: "Searching emails...",
  home_status: "Checking home devices...",
  home_service: "Controlling home device...",
  home_scene: "Activating scene...",
  obsidian_read: "Reading from vault...",
  obsidian_write: "Writing to vault...",
  obsidian_search: "Searching notes...",
  memory_search: "Searching memory...",
  memory_create: "Saving to memory...",
  finance_accounts: "Checking accounts...",
  finance_transactions: "Fetching transactions...",
  finance_budget: "Reviewing budget...",
  health_summary: "Getting health summary...",
  health_steps: "Checking step count...",
  health_sleep: "Reviewing sleep data...",
};

// Map tool names to friendly display names for badges
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  calendar_list: "Calendar Query",
  calendar_create: "Calendar Create",
  calendar_update: "Calendar Update",
  calendar_free_slots: "Free Slots",
  email_inbox: "Email Inbox",
  email_read: "Email Read",
  email_send: "Email Send",
  email_search: "Email Search",
  home_status: "Home Status",
  home_service: "Home Control",
  home_scene: "Scene Activation",
  obsidian_read: "Vault Read",
  obsidian_write: "Vault Write",
  obsidian_search: "Vault Search",
  memory_search: "Memory Search",
  memory_create: "Memory Store",
  finance_accounts: "Accounts",
  finance_transactions: "Transactions",
  finance_budget: "Budget",
  health_summary: "Health Summary",
  health_steps: "Steps",
  health_sleep: "Sleep Data",
};

// Simple markdown renderer for Claude's responses
function renderMarkdown(content: string) {
  // Handle bold text
  let result = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Handle inline code
  result = result.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  // Handle line breaks
  result = result.replace(/\n/g, '<br />');
  // Handle checkboxes
  result = result.replace(/\[ \]/g, '<span class="inline-block w-4 h-4 border rounded mr-1 align-middle"></span>');
  result = result.replace(/\[x\]/g, '<span class="inline-block w-4 h-4 border rounded mr-1 align-middle bg-primary text-primary-foreground text-center text-xs">✓</span>');

  return <span dangerouslySetInnerHTML={{ __html: result }} />;
}

// Typing indicator with current action
function TypingIndicator({ currentAction }: { currentAction: string | null }) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1.5">
        <div className="bg-muted rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
              <span
                className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        </div>
        {currentAction && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{currentAction}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Tool execution badge component
function ToolBadge({ toolName }: { toolName: string }) {
  const displayName = TOOL_DISPLAY_NAMES[toolName] || toolName;
  return (
    <Badge variant="secondary" className="text-xs gap-1">
      <CheckCircle2 className="h-3 w-3 text-green-500" />
      {displayName}
    </Badge>
  );
}

// Streaming message component
function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className="bg-muted rounded-lg px-4 py-2">
          <div className="text-sm">
            {renderMarkdown(content)}
            <span className="inline-block w-0.5 h-4 bg-primary/70 ml-0.5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive or streaming content updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isStreaming, streamingContent]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    const messageContent = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setIsStreaming(false);
    setStreamingContent("");
    setCurrentAction(null);
    setToolsUsed([]);
    setError(null);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({
          content: messageContent,
          userId: CURRENT_USER.id,
          userName: CURRENT_USER.name,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Check if the response is a stream
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream") || contentType?.includes("application/x-ndjson")) {
        // Handle streaming response
        setIsTyping(false);
        setIsStreaming(true);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulatedContent = "";
        const usedTools: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.trim()) continue;

            // Handle SSE format (data: ...)
            let jsonStr = line;
            if (line.startsWith("data: ")) {
              jsonStr = line.slice(6);
            }

            // Skip SSE comments and empty data
            if (jsonStr === "[DONE]" || !jsonStr.trim()) continue;

            try {
              const event = JSON.parse(jsonStr);

              switch (event.type) {
                case "text_delta":
                case "content":
                case "delta":
                  // Accumulate streamed text
                  const newText = event.text || event.content || event.delta || "";
                  accumulatedContent += newText;
                  setStreamingContent(accumulatedContent);
                  break;

                case "tool_start":
                case "tool_use":
                case "skill_start":
                  // Show current action based on tool being used
                  const toolName = event.tool || event.name || event.skill;
                  const actionText = SKILL_ACTION_MAP[toolName] || `Running ${toolName}...`;
                  setCurrentAction(actionText);
                  break;

                case "tool_end":
                case "tool_result":
                case "skill_end":
                  // Tool completed - add to used tools and clear action
                  const completedTool = event.tool || event.name || event.skill;
                  if (completedTool && !usedTools.includes(completedTool)) {
                    usedTools.push(completedTool);
                    setToolsUsed([...usedTools]);
                  }
                  setCurrentAction(null);
                  break;

                case "thinking":
                case "status":
                  // Show thinking/status message
                  setCurrentAction(event.message || event.status || "Thinking...");
                  break;

                case "error":
                  throw new Error(event.message || "Stream error");

                case "done":
                case "end":
                case "message_stop":
                  // Stream complete
                  break;

                default:
                  // Handle plain text responses or unknown event types
                  if (typeof event === "string") {
                    accumulatedContent += event;
                    setStreamingContent(accumulatedContent);
                  } else if (event.content && typeof event.content === "string") {
                    accumulatedContent += event.content;
                    setStreamingContent(accumulatedContent);
                  }
              }
            } catch (parseError) {
              // If not JSON, treat as plain text chunk
              if (jsonStr.trim() && !jsonStr.startsWith(":")) {
                accumulatedContent += jsonStr;
                setStreamingContent(accumulatedContent);
              }
            }
          }
        }

        // Finalize the streamed message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: accumulatedContent || "I apologize, but I couldn't generate a response. Please try again.",
          timestamp: new Date(),
          toolsUsed: usedTools.length > 0 ? usedTools : undefined,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsStreaming(false);
        setStreamingContent("");
        setCurrentAction(null);

      } else {
        // Handle non-streaming JSON response (fallback)
        const data = await response.json();
        setIsTyping(false);

        const assistantMessage: Message = {
          id: data.id || (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
          timestamp: new Date(data.timestamp || Date.now()),
          suggestions: data.suggestions,
          toolsUsed: data.toolsUsed,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // Request was cancelled, ignore
        return;
      }
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
      // Mark the last user message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, error: true } : msg
        )
      );
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
      setCurrentAction(null);
    }
  }, [inputValue]);

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  // Cancel streaming on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chat Assistant</h1>
          <p className="text-muted-foreground">
            Ask me anything about your family life
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0">
          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm border-b">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto hover:opacity-70"
              >
                &times;
              </button>
            </div>
          )}
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      {message.role === "assistant" ? (
                        <>
                          <AvatarImage src="" alt="Assistant" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src="" alt="User" />
                          <AvatarFallback className="bg-blue-500 text-white">
                            AS
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        } ${message.error ? "border border-destructive" : ""}`}
                      >
                        <div className="text-sm">
                          {message.role === "assistant"
                            ? renderMarkdown(message.content)
                            : message.content}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p
                            className={`text-xs ${
                              message.role === "user"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                            suppressHydrationWarning
                          >
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {message.error && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Failed to send
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Tool execution badges */}
                      {message.toolsUsed && message.toolsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 ml-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Used:
                          </span>
                          {message.toolsUsed.map((tool, idx) => (
                            <ToolBadge key={idx} toolName={tool} />
                          ))}
                        </div>
                      )}
                      {/* Suggestion buttons */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Streaming message display */}
                {isStreaming && streamingContent && (
                  <StreamingMessage content={streamingContent} />
                )}

                {/* Typing indicator with current action */}
                {(isTyping || (isStreaming && !streamingContent)) && (
                  <TypingIndicator currentAction={currentAction} />
                )}

                {/* Show current action during streaming */}
                {isStreaming && streamingContent && currentAction && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-11">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{currentAction}</span>
                  </div>
                )}

                {/* Show tools used during streaming */}
                {isStreaming && toolsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-11">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Used:
                    </span>
                    {toolsUsed.map((tool, idx) => (
                      <ToolBadge key={idx} toolName={tool} />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Button type="button" variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1"
                  disabled={isTyping || isStreaming}
                />
                <Button type="button" variant="ghost" size="icon">
                  <Mic className="h-5 w-5" />
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isTyping || isStreaming}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-4">
          {/* Suggested Prompts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedPrompts.map((prompt) => (
                <Button
                  key={prompt.title}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => handleSuggestedPrompt(prompt.prompt)}
                  disabled={isTyping || isStreaming}
                >
                  <prompt.icon className="h-4 w-4 mr-3 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{prompt.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {prompt.prompt}
                    </p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                What I Can Help With
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Calendar and scheduling
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Task management
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Smart home control
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Family information lookup
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                  Email management (coming soon)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                  Budget tracking (coming soon)
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
