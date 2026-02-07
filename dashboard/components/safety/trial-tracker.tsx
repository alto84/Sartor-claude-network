"use client";

/**
 * Trial Tracker
 *
 * Active clinical trial tracker showing key CAR-T in SLE trials
 * with sortable status badges, enrollment numbers, and trial details.
 *
 * @module components/safety/trial-tracker
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
  Microscope,
  ArrowUpDown,
  ExternalLink,
  Users,
  Building2,
  Target,
} from "lucide-react";
import { clinicalTrials, type ClinicalTrial } from "@/lib/safety-data";

// ============================================================================
// TYPES
// ============================================================================

interface TrialTrackerProps {
  className?: string;
}

type SortField = "status" | "name" | "phase" | "enrollment";
type SortDirection = "asc" | "desc";

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: ClinicalTrial["status"] }) {
  const config: Record<
    ClinicalTrial["status"],
    { className: string; dotClass: string; pulse: boolean }
  > = {
    Recruiting: {
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
      dotClass: "bg-green-500",
      pulse: true,
    },
    Active: {
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      dotClass: "bg-blue-500",
      pulse: false,
    },
    Completed: {
      className: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      dotClass: "bg-gray-400",
      pulse: false,
    },
    "Not yet recruiting": {
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
      dotClass: "bg-yellow-500",
      pulse: false,
    },
  };

  const { className, dotClass, pulse } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotClass
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", dotClass)} />
      </span>
      {status}
    </span>
  );
}

// ============================================================================
// SORTABLE HEADER
// ============================================================================

function SortableHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentSort === field;

  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
        isActive && "text-foreground",
        className
      )}
    >
      {label}
      <ArrowUpDown
        className={cn(
          "h-3 w-3",
          isActive ? "text-foreground" : "text-muted-foreground/50"
        )}
      />
    </button>
  );
}

// ============================================================================
// TRIAL CARD (MOBILE)
// ============================================================================

function TrialCard({ trial }: { trial: ClinicalTrial }) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{trial.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{trial.sponsor}</span>
          </div>
        </div>
        <StatusBadge status={trial.status} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          {trial.target}
        </span>
        <span>Phase {trial.phase}</span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          N={trial.enrollment}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{trial.indication}</span>
        <a
          href={`https://clinicaltrials.gov/study/${trial.nctId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <span className="font-mono">{trial.nctId}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TrialTracker({ className }: TrialTrackerProps) {
  const [sortField, setSortField] = React.useState<SortField>("status");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");

  // Filter to autoimmune/SLE-relevant trials
  const autoImmuneTrials = React.useMemo(
    () =>
      clinicalTrials.filter(
        (t) =>
          t.indication.includes("SLE") ||
          t.indication.includes("Lupus") ||
          t.indication.includes("SSc") ||
          t.indication.includes("Myositis") ||
          t.indication.includes("NMOSD")
      ),
    []
  );

  const handleSort = React.useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  const statusOrder: Record<string, number> = {
    Recruiting: 0,
    Active: 1,
    "Not yet recruiting": 2,
    Completed: 3,
  };

  const filteredTrials = React.useMemo(() => {
    let trials = [...autoImmuneTrials];

    // Filter
    if (filterStatus !== "all") {
      trials = trials.filter((t) => t.status === filterStatus);
    }

    // Sort
    trials.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "status":
          comparison = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "phase":
          comparison = a.phase.localeCompare(b.phase);
          break;
        case "enrollment":
          comparison = a.enrollment - b.enrollment;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return trials;
  }, [autoImmuneTrials, filterStatus, sortField, sortDirection, statusOrder]);

  // Summary counts
  const recruiting = autoImmuneTrials.filter((t) => t.status === "Recruiting").length;
  const active = autoImmuneTrials.filter((t) => t.status === "Active").length;
  const completed = autoImmuneTrials.filter((t) => t.status === "Completed").length;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <Microscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Clinical Trial Tracker</CardTitle>
            <CardDescription>
              Active CAR-T trials in autoimmune indications
            </CardDescription>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setFilterStatus(filterStatus === "all" ? "all" : "all")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
              filterStatus === "all"
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
            )}
          >
            All ({autoImmuneTrials.length})
          </button>
          <button
            onClick={() =>
              setFilterStatus(filterStatus === "Recruiting" ? "all" : "Recruiting")
            }
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
              filterStatus === "Recruiting"
                ? "bg-green-600 text-white border-green-600"
                : "bg-transparent text-muted-foreground border-border hover:border-green-500/50"
            )}
          >
            Recruiting ({recruiting})
          </button>
          <button
            onClick={() =>
              setFilterStatus(filterStatus === "Active" ? "all" : "Active")
            }
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
              filterStatus === "Active"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-transparent text-muted-foreground border-border hover:border-blue-500/50"
            )}
          >
            Active ({active})
          </button>
          <button
            onClick={() =>
              setFilterStatus(filterStatus === "Completed" ? "all" : "Completed")
            }
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
              filterStatus === "Completed"
                ? "bg-gray-600 text-white border-gray-600"
                : "bg-transparent text-muted-foreground border-border hover:border-gray-500/50"
            )}
          >
            Completed ({completed})
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left">
                    <SortableHeader
                      label="Trial"
                      field="name"
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <span className="text-xs font-medium text-muted-foreground">
                      Sponsor
                    </span>
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SortableHeader
                      label="Phase"
                      field="phase"
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <span className="text-xs font-medium text-muted-foreground">
                      Target
                    </span>
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SortableHeader
                      label="Status"
                      field="status"
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-3 py-2 text-right">
                    <SortableHeader
                      label="N"
                      field="enrollment"
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                      className="justify-end"
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTrials.map((trial) => (
                  <tr
                    key={trial.nctId}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-medium text-sm">{trial.name}</p>
                        <a
                          href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-0.5"
                        >
                          <span className="font-mono">{trial.nctId}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {trial.sponsor}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="text-[10px]">
                        {trial.phase}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium">
                      {trial.target}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={trial.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-medium tabular-nums">
                      {trial.enrollment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile card layout */}
        <div className="md:hidden space-y-2">
          {filteredTrials.map((trial) => (
            <TrialCard key={trial.nctId} trial={trial} />
          ))}
        </div>

        {filteredTrials.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No trials match the selected filter.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TrialTracker;
