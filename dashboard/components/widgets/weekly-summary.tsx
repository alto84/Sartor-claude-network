"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CheckCircle2,
  CalendarCheck,
  FolderPlus,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyStat {
  label: string;
  value: number;
  previousValue: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

// Sample data - in production this would come from your data store
const weeklyStats: WeeklyStat[] = [
  {
    label: "Tasks Completed",
    value: 24,
    previousValue: 18,
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    label: "Events Attended",
    value: 8,
    previousValue: 10,
    icon: CalendarCheck,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    label: "Vault Items Added",
    value: 12,
    previousValue: 12,
    icon: FolderPlus,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
];

function getTrendInfo(current: number, previous: number) {
  const diff = current - previous;
  const percentChange = previous !== 0 ? Math.round((diff / previous) * 100) : 0;

  if (diff > 0) {
    return {
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      text: `+${percentChange}%`,
      description: "from last week",
    };
  } else if (diff < 0) {
    return {
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      text: `${percentChange}%`,
      description: "from last week",
    };
  }
  return {
    icon: Minus,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    text: "0%",
    description: "same as last week",
  };
}

function getWeekDateRange(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function WeeklySummaryWidget() {
  const [stats, setStats] = useState<WeeklyStat[]>(weeklyStats);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setIsAnimated(true), 100);
  }, []);

  // Calculate totals
  const totalCompleted = stats.reduce((sum, stat) => sum + stat.value, 0);
  const totalPrevious = stats.reduce((sum, stat) => sum + stat.previousValue, 0);
  const overallTrend = getTrendInfo(totalCompleted, totalPrevious);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
            <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Weekly Summary</CardTitle>
            <p className="text-xs text-muted-foreground">{getWeekDateRange()}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1">
          Details
          <ChevronRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Overall Progress */}
        <div className="mb-5 p-4 rounded-lg bg-gradient-to-r from-indigo-100/50 to-blue-100/50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200/50 dark:border-indigo-800/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Activity</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {totalCompleted}
                </span>
                <span className="text-sm text-muted-foreground">items</span>
              </div>
            </div>
            <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-sm", overallTrend.bgColor)}>
              <overallTrend.icon className={cn("h-4 w-4", overallTrend.color)} />
              <span className={overallTrend.color}>{overallTrend.text}</span>
            </div>
          </div>
          <ProgressBar
            value={totalCompleted}
            max={Math.max(totalCompleted, totalPrevious) * 1.2}
            color="bg-gradient-to-r from-indigo-500 to-blue-500"
          />
        </div>

        {/* Individual Stats */}
        <div className="space-y-4">
          {stats.map((stat, index) => {
            const trend = getTrendInfo(stat.value, stat.previousValue);
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg transition-all duration-300 hover:bg-muted/50",
                  isAnimated ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={cn("p-2.5 rounded-lg", stat.bgColor)}>
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{stat.value}</span>
                      <div className={cn("flex items-center gap-0.5 text-xs", trend.color)}>
                        <trend.icon className="h-3 w-3" />
                        <span>{trend.text}</span>
                      </div>
                    </div>
                  </div>
                  <ProgressBar
                    value={stat.value}
                    max={Math.max(stat.value, stat.previousValue) * 1.5}
                    color={stat.bgColor.replace("bg-", "bg-gradient-to-r from-").replace("/30", "-500/70 to-").replace("100", "500")}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Achievement Badge */}
        {totalCompleted > totalPrevious && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/50">
              <div className="text-2xl">🏆</div>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Great Week!
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  You completed {totalCompleted - totalPrevious} more items than last week
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
