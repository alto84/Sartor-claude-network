"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mascot } from "@/components/brand/mascot";
import { cn } from "@/lib/utils";

// ============================================
// ERROR BOUNDARY
// ============================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// ERROR FALLBACK UI
// ============================================

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ErrorFallback({
  error,
  onReset,
  showDetails = process.env.NODE_ENV === "development",
  className,
}: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center justify-center min-h-[400px] p-6", className)}
    >
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-4"
          >
            {/* Pip looking concerned/surprised */}
            <Mascot expression="surprised" size="lg" animated />
          </motion.div>
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Oops! Something went wrong
          </CardTitle>
          <CardDescription>
            Don&apos;t worry, Pip is here to help! Let&apos;s try to fix this together.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {showDetails && error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-md bg-destructive/10 p-4 border border-destructive/20"
            >
              <div className="flex items-start gap-2">
                <Bug className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-destructive">
                    {error.name}: {error.message}
                  </p>
                  {error.stack && (
                    <pre className="text-xs text-muted-foreground overflow-auto max-h-32 whitespace-pre-wrap">
                      {error.stack.split("\n").slice(1, 4).join("\n")}
                    </pre>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div className="text-sm text-muted-foreground text-center">
            <p>This error has been logged and we&apos;ll look into it.</p>
            <p className="mt-1">Try refreshing the page or go back home.</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2">
          {onReset && (
            <Button onClick={onReset} className="w-full sm:w-auto gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full sm:w-auto gap-2"
            onClick={() => window.location.href = "/"}
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ============================================
// SECTION ERROR BOUNDARY
// ============================================

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  section?: string;
  className?: string;
}

/**
 * A smaller error boundary for sections within a page
 */
export function SectionErrorBoundary({
  children,
  section = "section",
  className,
}: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <SectionErrorFallback section={section} className={className} />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

function SectionErrorFallback({
  section,
  className,
}: {
  section: string;
  className?: string;
}) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8 rounded-lg border border-destructive/20 bg-destructive/5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Mascot expression="surprised" size="sm" />
        <div>
          <p className="text-sm font-medium text-destructive">
            This {section} couldn&apos;t load
          </p>
          <p className="text-xs text-muted-foreground">
            Pip is working on fixing it!
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReload}
        className="gap-2"
      >
        <RefreshCw className="h-3 w-3" />
        Reload Page
      </Button>
    </motion.div>
  );
}

// ============================================
// WIDGET ERROR BOUNDARY
// ============================================

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  widgetName?: string;
}

/**
 * A minimal error boundary for dashboard widgets
 */
export function WidgetErrorBoundary({
  children,
  widgetName = "Widget",
}: WidgetErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 min-h-[100px]">
          <div className="flex items-center gap-2">
            <Mascot expression="surprised" size="sm" />
            <span className="text-xs text-destructive font-medium">
              {widgetName} error
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================
// ASYNC ERROR BOUNDARY (for Suspense)
// ============================================

interface AsyncBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * Combined Suspense + Error boundary for async components
 */
export function AsyncBoundary({
  children,
  fallback,
  errorFallback,
  loadingFallback,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <React.Suspense fallback={loadingFallback || fallback}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
