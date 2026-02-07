"use client";

/**
 * Data Source Inventory
 *
 * Grid of data source cards showing name, type, patient coverage,
 * availability, and whether each source has autoimmune CAR-T data.
 *
 * @module components/safety/data-source-inventory
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  BookOpen,
  FileBarChart,
  AlertCircle,
  Globe,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { dataSources, type DataSource } from "@/lib/safety-data";

// ============================================================================
// TYPES
// ============================================================================

interface DataSourceInventoryProps {
  className?: string;
}

// ============================================================================
// TYPE AND ACCESS ICONS
// ============================================================================

const typeConfig: Record<
  DataSource["type"],
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  Literature: {
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  RWD: {
    icon: Database,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  "Spontaneous Reporting": {
    icon: AlertCircle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  Registry: {
    icon: FileBarChart,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
  },
};

function AccessBadge({ method }: { method: string }) {
  const isOpen = method.toLowerCase().includes("pubmed") ||
    method.toLowerCase().includes("public") ||
    method.toLowerCase().includes("openfda");
  const isRestricted = method.toLowerCase().includes("restricted") ||
    method.toLowerCase().includes("dua") ||
    method.toLowerCase().includes("irb");

  if (isOpen) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-400">
        <Unlock className="h-3 w-3" />
        Open
      </span>
    );
  }
  if (isRestricted) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400">
        <Lock className="h-3 w-3" />
        Restricted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
      <Lock className="h-3 w-3" />
      Licensed
    </span>
  );
}

// ============================================================================
// DATA SOURCE CARD
// ============================================================================

function DataSourceCard({ source }: { source: DataSource }) {
  const config = typeConfig[source.type];
  const Icon = config.icon;
  const hasAutoImmuneData = source.autoimmuneCARTData;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3 transition-all duration-200 hover:shadow-sm",
        hasAutoImmuneData
          ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10"
          : "border-border bg-card"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className={cn("p-1.5 rounded-md flex-shrink-0", config.bgColor)}>
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{source.name}</p>
            <Badge variant="outline" className="text-[10px] mt-1">
              {source.type}
            </Badge>
          </div>
        </div>

        {/* Autoimmune CAR-T data indicator */}
        {hasAutoImmuneData ? (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 flex-shrink-0">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[10px] font-semibold">AI CAR-T</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground/50 flex-shrink-0">
            <XCircle className="h-4 w-4" />
            <span className="text-[10px]">No AI data</span>
          </div>
        )}
      </div>

      {/* Coverage */}
      <div className="flex items-start gap-1.5">
        <Globe className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {source.coverage}
        </p>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <AccessBadge method={source.accessMethod} />
        <div className="flex items-center gap-1">
          {source.cartDataAvailable && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
              CAR-T
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DataSourceInventory({ className }: DataSourceInventoryProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");

  const filteredSources = React.useMemo(() => {
    let sources = [...dataSources];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      sources = sources.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.type.toLowerCase().includes(query) ||
          s.coverage.toLowerCase().includes(query)
      );
    }

    if (typeFilter !== "all") {
      if (typeFilter === "autoimmune") {
        sources = sources.filter((s) => s.autoimmuneCARTData);
      } else {
        sources = sources.filter((s) => s.type === typeFilter);
      }
    }

    // Sort: autoimmune CAR-T data first
    sources.sort((a, b) => {
      if (a.autoimmuneCARTData && !b.autoimmuneCARTData) return -1;
      if (!a.autoimmuneCARTData && b.autoimmuneCARTData) return 1;
      return 0;
    });

    return sources;
  }, [searchQuery, typeFilter]);

  const autoImmuneCount = dataSources.filter((s) => s.autoimmuneCARTData).length;

  const uniqueTypes = Array.from(new Set(dataSources.map((s) => s.type)));

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-rose-600">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Data Source Inventory</CardTitle>
            <CardDescription>
              {dataSources.length} sources tracked -- {autoImmuneCount} with
              autoimmune CAR-T data
            </CardDescription>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search data sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
                typeFilter === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              All
            </button>
            <button
              onClick={() =>
                setTypeFilter(typeFilter === "autoimmune" ? "all" : "autoimmune")
              }
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
                typeFilter === "autoimmune"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-transparent text-muted-foreground border-border hover:border-green-500/50"
              )}
            >
              Has AI Data
            </button>
            {uniqueTypes.map((type) => (
              <button
                key={type}
                onClick={() =>
                  setTypeFilter(typeFilter === type ? "all" : type)
                }
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
                  typeFilter === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSources.map((source) => (
            <DataSourceCard key={source.name} source={source} />
          ))}
        </div>

        {filteredSources.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No data sources match your search.
          </div>
        )}

        {/* Summary note */}
        <div className="mt-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3">
          <p className="text-xs text-orange-800 dark:text-orange-300">
            <strong>Gap Analysis:</strong> Only {autoImmuneCount} of {dataSources.length} data
            sources currently contain autoimmune CAR-T data. As products gain approval,
            FAERS, CIBMTR, and RWD databases will become primary post-marketing
            surveillance sources. TriNetX and MarketScan can provide SLE natural
            history comparator data now.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataSourceInventory;
