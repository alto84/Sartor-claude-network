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
  CheckCircle,
  XCircle,
  AlertCircle,
  HardDrive,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BackendStatus {
  name: string;
  type: string;
  connected: boolean;
  latency?: number;
  error?: string;
  details?: {
    version?: string;
    endpoint?: string;
  };
}

interface MemorySystemStatus {
  overall: 'healthy' | 'degraded' | 'offline';
  backends: BackendStatus[];
  tiers: {
    hot: { count: number; sizeBytes: number };
    warm: { count: number; sizeBytes: number };
    cold: { count: number };
  };
  lastSync: string;
}

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
  systemStatus?: MemorySystemStatus;
}

// Default/placeholder data
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

function getBackendIcon(type: string) {
  switch (type) {
    case 'firebase':
    case 'firestore':
      return Database;
    case 'obsidian':
      return HardDrive;
    case 'gdrive':
    case 'github':
      return Cloud;
    default:
      return Database;
  }
}

function getStatusIcon(connected: boolean) {
  return connected ? CheckCircle : XCircle;
}

function getStatusColor(connected: boolean) {
  return connected
    ? "text-green-500 dark:text-green-400"
    : "text-red-500 dark:text-red-400";
}

function getOverallStatusIcon(status: string) {
  switch (status) {
    case 'healthy':
      return CheckCircle;
    case 'degraded':
      return AlertCircle;
    case 'offline':
      return XCircle;
    default:
      return AlertCircle;
  }
}

function getOverallStatusColor(status: string) {
  switch (status) {
    case 'healthy':
      return "text-green-500";
    case 'degraded':
      return "text-yellow-500";
    case 'offline':
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export function MemoryStatusWidget() {
  const [data, setData] = useState<MemoryStatusData>(defaultMemoryData);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBackends, setShowBackends] = useState(false);

  const fetchMemoryStatus = async () => {
    try {
      // Fetch from the memory status API
      const response = await fetch("/api/memory-status");
      if (response.ok) {
        const systemStatus: MemorySystemStatus = await response.json();

        // Calculate totals from tiers
        const totalMemories =
          (systemStatus.tiers?.hot?.count || 0) +
          (systemStatus.tiers?.warm?.count || 0) +
          (systemStatus.tiers?.cold?.count || 0);

        setData({
          totalMemories,
          activeMemories: systemStatus.tiers?.hot?.count || 0,
          archivedMemories: systemStatus.tiers?.cold?.count || 0,
          recentActivity: 0,
          lastSync: systemStatus.lastSync,
          tiers: [
            {
              ...defaultMemoryData.tiers[0],
              count: systemStatus.tiers?.hot?.count || 0,
            },
            {
              ...defaultMemoryData.tiers[1],
              count: systemStatus.tiers?.warm?.count || 0,
            },
            {
              ...defaultMemoryData.tiers[2],
              count: 0,
            },
            {
              ...defaultMemoryData.tiers[3],
              count: 0,
            },
          ],
          systemStatus,
        });
      }
    } catch (error) {
      console.log("Memory API not available, using placeholder data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemoryStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMemoryStatus, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMemoryStatus();
  };

  const connectedBackends = data.systemStatus?.backends.filter(b => b.connected).length || 0;
  const totalBackends = data.systemStatus?.backends.length || 0;

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

            {/* Backend Health Status */}
            {data.systemStatus && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => setShowBackends(!showBackends)}
                  className="w-full flex items-center justify-between text-sm hover:bg-muted/50 rounded-lg p-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const StatusIcon = getOverallStatusIcon(data.systemStatus?.overall || 'offline');
                      return (
                        <StatusIcon
                          className={cn(
                            "h-4 w-4",
                            getOverallStatusColor(data.systemStatus?.overall || 'offline')
                          )}
                        />
                      );
                    })()}
                    <span className="text-muted-foreground">Backend Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {connectedBackends}/{totalBackends} connected
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 text-muted-foreground transition-transform",
                        showBackends && "rotate-90"
                      )}
                    />
                  </div>
                </button>

                {showBackends && data.systemStatus.backends && (
                  <div className="mt-2 space-y-1 pl-2">
                    {data.systemStatus.backends.map((backend) => {
                      const BackendIcon = getBackendIcon(backend.type);
                      const StatusIcon = getStatusIcon(backend.connected);
                      return (
                        <div
                          key={backend.name}
                          className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <BackendIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{backend.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {backend.latency && (
                              <span className="text-xs text-muted-foreground">
                                {backend.latency}ms
                              </span>
                            )}
                            <StatusIcon
                              className={cn(
                                "h-3 w-3",
                                getStatusColor(backend.connected)
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
