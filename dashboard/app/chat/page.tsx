"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  error?: boolean;
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

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
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageContent,
          userId: CURRENT_USER.id,
          userName: CURRENT_USER.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: data.id || (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(data.timestamp || Date.now()),
        suggestions: data.suggestions,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
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
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Optionally auto-send
    // handleSendMessage();
  };

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
                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
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
                />
                <Button type="button" variant="ghost" size="icon">
                  <Mic className="h-5 w-5" />
                </Button>
                <Button type="submit" size="icon" disabled={!inputValue.trim()}>
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
