"use client";

/**
 * Adverse Event Comparison Chart
 *
 * Bar chart comparing AE rates across indications (SLE vs DLBCL vs ALL vs MM)
 * using recharts. Supports toggling between CRS and ICANS, and between
 * any-grade and grade 3+ severity views.
 *
 * @module components/safety/adverse-event-comparison
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
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getComparisonChartData, type ChartDataPoint } from "@/lib/safety-data";

// ============================================================================
// TYPES
// ============================================================================

interface AdverseEventComparisonProps {
  className?: string;
}

type EventFilter = "CRS" | "ICANS";
type GradeFilter = "anyGrade" | "grade3Plus";

// ============================================================================
// CONSTANTS
// ============================================================================

const INDICATION_COLORS: Record<string, string> = {
  SLE: "#22c55e",
  DLBCL: "#f59e0b",
  ALL: "#ef4444",
  MM: "#a855f7",
};

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      label: string;
      indication: string;
      product: string;
      nPatients: number;
      value: number;
    };
    value: number;
  }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold">{data.label}</p>
      <p className="text-muted-foreground text-xs">{data.product}</p>
      <div className="mt-1.5 space-y-0.5">
        <p>
          <span className="font-medium">{data.value}%</span> incidence rate
        </p>
        <p className="text-xs text-muted-foreground">
          N = {data.nPatients} patients
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AdverseEventComparison({ className }: AdverseEventComparisonProps) {
  const [eventFilter, setEventFilter] = React.useState<EventFilter>("CRS");
  const [gradeFilter, setGradeFilter] = React.useState<GradeFilter>("anyGrade");

  const chartData = React.useMemo(() => getComparisonChartData(), []);

  // Transform data for the selected view
  const displayData = React.useMemo(() => {
    return chartData.map((point) => {
      const rateKey = eventFilter === "CRS"
        ? gradeFilter === "anyGrade" ? "crsAnyGrade" : "crsGrade3Plus"
        : gradeFilter === "anyGrade" ? "icansAnyGrade" : "icansGrade3Plus";

      return {
        label: point.label,
        indication: point.indication,
        product: point.product,
        nPatients: point.nPatients,
        value: point[rateKey],
        fill: INDICATION_COLORS[point.indication] ?? "#6b7280",
        category: point.category,
      };
    });
  }, [chartData, eventFilter, gradeFilter]);

  // Sort: SLE first, then by rate descending
  const sortedData = React.useMemo(() => {
    return [...displayData].sort((a, b) => {
      if (a.indication === "SLE" && b.indication !== "SLE") return -1;
      if (a.indication !== "SLE" && b.indication === "SLE") return 1;
      return b.value - a.value;
    });
  }, [displayData]);

  const gradeLabel = gradeFilter === "anyGrade" ? "Any Grade" : "Grade 3+";
  const eventLabel = eventFilter === "CRS"
    ? "Cytokine Release Syndrome"
    : "Immune Effector Cell-Associated Neurotoxicity";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">AE Rate Comparison</CardTitle>
            <CardDescription>{eventLabel} - {gradeLabel}</CardDescription>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-2 mt-3">
          {/* Event toggle */}
          <div className="inline-flex items-center rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setEventFilter("CRS")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                eventFilter === "CRS"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              CRS
            </button>
            <button
              onClick={() => setEventFilter("ICANS")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                eventFilter === "ICANS"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              ICANS
            </button>
          </div>

          {/* Grade toggle */}
          <div className="inline-flex items-center rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setGradeFilter("anyGrade")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                gradeFilter === "anyGrade"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Any Grade
            </button>
            <button
              onClick={() => setGradeFilter("grade3Plus")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                gradeFilter === "grade3Plus"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Grade 3+
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart */}
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
              barSize={24}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.5 }} />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                label={{
                  position: "right",
                  formatter: (v: unknown) => `${v}%`,
                  fontSize: 11,
                  fontWeight: 600,
                  fill: "hsl(var(--foreground))",
                }}
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    fillOpacity={entry.indication === "SLE" ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-3 border-t border-border">
          {Object.entries(INDICATION_COLORS).map(([indication, color]) => (
            <div key={indication} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {indication}
              </span>
            </div>
          ))}
        </div>

        {/* Insight callout */}
        <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-xs text-blue-800 dark:text-blue-300">
              {eventFilter === "CRS" && gradeFilter === "grade3Plus" && (
                <>
                  Grade 3+ CRS in SLE is markedly lower than all oncology indications.
                  This is attributed to lower disease burden, reduced CAR-T doses (1x10^6/kg),
                  and younger, healthier patient populations.
                </>
              )}
              {eventFilter === "CRS" && gradeFilter === "anyGrade" && (
                <>
                  Any-grade CRS remains common across all indications but is generally
                  mild (grade 1-2) in SLE patients. Most events resolve within 48-72 hours
                  with supportive care alone.
                </>
              )}
              {eventFilter === "ICANS" && gradeFilter === "grade3Plus" && (
                <>
                  Grade 3+ ICANS has not been observed in published SLE CAR-T cohorts (0%),
                  compared with 10-28% in oncology. Lower baseline neuroinflammation and
                  reduced doses likely contribute.
                </>
              )}
              {eventFilter === "ICANS" && gradeFilter === "anyGrade" && (
                <>
                  Any-grade neurotoxicity is rare in SLE (3-5%), dramatically lower than
                  oncology indications. This difference likely reflects lower CAR-T doses,
                  absence of bulky disease, and intact blood-brain barrier.
                </>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdverseEventComparison;
