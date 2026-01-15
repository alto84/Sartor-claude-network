"use client";

import { type LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IntegrationStatus } from "@/lib/setup-storage";
import {
  CheckCircle2,
  Circle,
  HelpCircle,
  Loader2,
  SkipForward,
  AlertCircle,
} from "lucide-react";

interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: IntegrationStatus;
  isOptional?: boolean;
  onConfigure: () => void;
  onNeedHelp: () => void;
  onSkip?: () => void;
}

const statusConfig: Record<
  IntegrationStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
    icon: LucideIcon;
  }
> = {
  not_started: {
    label: "Not Started",
    variant: "secondary",
    icon: Circle,
  },
  in_progress: {
    label: "In Progress",
    variant: "info",
    icon: Loader2,
  },
  complete: {
    label: "Complete",
    variant: "success",
    icon: CheckCircle2,
  },
  needs_help: {
    label: "Needs Help",
    variant: "warning",
    icon: AlertCircle,
  },
  skipped: {
    label: "Skipped",
    variant: "outline",
    icon: SkipForward,
  },
};

export function IntegrationCard({
  id,
  name,
  description,
  icon: Icon,
  status,
  isOptional = false,
  onConfigure,
  onNeedHelp,
  onSkip,
}: IntegrationCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const isComplete = status === "complete" || status === "skipped";

  return (
    <Card
      className={cn(
        "relative transition-all duration-200 hover:shadow-md",
        isComplete && "bg-muted/30",
        status === "needs_help" && "border-yellow-500/50"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                isComplete
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {name}
                {isOptional && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (Optional)
                  </span>
                )}
              </CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <Badge
            variant={statusInfo.variant}
            className="flex items-center gap-1"
          >
            <StatusIcon
              className={cn(
                "h-3 w-3",
                status === "in_progress" && "animate-spin"
              )}
            />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Button
            onClick={onConfigure}
            variant={isComplete ? "outline" : "default"}
            size="sm"
            className="flex-1"
          >
            {status === "complete" ? "Reconfigure" : "Configure"}
          </Button>
          <Button
            onClick={onNeedHelp}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>
          {isOptional && status !== "complete" && status !== "skipped" && onSkip && (
            <Button
              onClick={onSkip}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              Skip
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
