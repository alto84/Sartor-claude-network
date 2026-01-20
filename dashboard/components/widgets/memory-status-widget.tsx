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
  Brain,
  Database,
  Layers,
  Zap,
  Archive,
  ChevronRight,
  RefreshCw,
  Clock,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryTierStats {
  tier: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}

interface MemoryStatusData {
  totalMemories: number;
  activeMemories: number;
  archivedMemories: number;
  recentActivity: number;
  lastSync: string | null;
  tiers: MemoryTierStats[];
}

// Default/placeholder data - in production this would come from the memory API
const defaultMemoryData: MemoryStatusData = {
  totalMemories: 0,
  activeMemories: 0,
  archivedMemories: 0,
  recentActivity: 0,
  lastSync: null,
  tiers: [
    {
      tier: "Episodic",
      count: 0,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      description: "Events & experiences",
    },
    {
      tier: "Semantic",
      count: 0,
      icon: Database,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      description: "Facts & knowledge",
    },
    {
      tier: "Procedural",
      count: 0,
      icon: Layers,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      description: "Workflows & patterns",
    },
    {
      tier: "Working",
      count: 0,
      icon: Zap,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      description: "Current session",
    },
  ],
};

function formatLastSync(timestamp: string | null): string {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function MemoryStatusWidget() {
  const [data, setData] = useState<MemoryStatusData>(defaultMemoryData);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMemoryStatus = async () => {
    try {
      // Try to fetch from the memory API
      const response = await fetch("/api/memory/status");
      if (response.ok) {
        const memoryStatus = await response.json();
        setData({
          totalMemories: memoryStatus.total || 0,
          activeMemories: memoryStatus.active || 0,
          archivedMemories: memoryStatus.archived || 0,
          recentActivity: memoryStatus.recentActivity || 0,
          lastSync: memoryStatus.lastSync || null,
          tiers: [
            {
              ...defaultMemoryData.tiers[0],
              count: memoryStatus.byType?.episodic || 0,
            },
            {
              ...defaultMemoryData.tiers[1],
              count: memoryStatus.byType?.semantic || 0,
            },
            {
              ...defaultMemoryData.tiers[2],
              count: memoryStatus.byType?.procedural || 0,
            },
            {
              ...defaultMemoryData.tiers[3],
              count: memoryStatus.byType?.working || 0,
            },
          ],
        });
      }
    } catch (error) {
      // Keep default/placeholder data on error
      console.log("Memory API not available, using placeholder data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemoryStatus();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMemoryStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMemoryStatus();
  };

  const usagePercentage = data.totalMemories > 0
    ? Math.round((data.activeMemories / data.totalMemories) * 100)
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900/50">
            <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Memory Status</CardTitle>
            <p className="text-xs text-muted-foreground">
              Last sync: {formatLastSync(data.lastSync)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(isRefreshing && "animate-spin")}
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-violet-100/50 to-purple-100/50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200/50 dark:border-violet-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
                <p className="text-2xl font-bold">{data.totalMemories}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-100/50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <p className="text-2xl font-bold">{data.activeMemories}</p>
              </div>
            </div>

            {/* Memory Tiers */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Memory Types
              </p>
              <div className="space-y-2">
                {data.tiers.map((tier) => {
                  const Icon = tier.icon;
                  return (
                    <div
                      key={tier.tier}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn("p-2 rounded-lg", tier.bgColor)}>
                        <Icon className={cn("h-4 w-4", tier.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{tier.tier}</p>
                          <span className="text-sm font-semibold">{tier.count}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {tier.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Archived Section */}
            {data.archivedMemories > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Archive className="h-4 w-4" />
                    <span>Archived</span>
                  </div>
                  <span className="font-medium">{data.archivedMemories}</span>
                </div>
              </div>
            )}

            {/* View All Link */}
            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                <span>View Memory Details</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
