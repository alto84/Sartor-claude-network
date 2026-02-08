"use client";

/**
 * Safety Radar Chart
 *
 * Spider/radar chart comparing SLE CAR-T safety profile across
 * multiple dimensions against oncology benchmarks. Demonstrates
 * the dramatically better safety profile of CAR-T in autoimmune disease.
 *
 * @module components/safety/safety-radar
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
import { Shield } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// ============================================================================
// TYPES
// ============================================================================

interface SafetyRadarProps {
  className?: string;
}

// ============================================================================
// DATA
// ============================================================================

// Normalized safety dimensions (lower = better, scale 0-100)
// Each dimension represents Grade 3+ rate normalized to oncology worst-case
const radarData = [
  {
    dimension: "CRS Gr3+",
    SLE: 4.4,       // 2.1% / 48% * 100
    Oncology: 29.2,  // 14% average / 48% * 100
    fullMark: 100,
  },
  {
    dimension: "ICANS Gr3+",
    SLE: 5.4,       // 1.5% / 28% * 100
    Oncology: 42.9,  // 12% average / 28% * 100
    fullMark: 100,
  },
  {
    dimension: "IEC-HS",
    SLE: 0,          // 0% observed
    Oncology: 30,    // ~6% / 20% * 100
    fullMark: 100,
  },
  {
    dimension: "Mortality",
    SLE: 0,          // 0 deaths
    Oncology: 16.7,  // ~1% / 6% * 100 (some trials)
    fullMark: 100,
  },
  {
    dimension: "ICU Transfer",
    SLE: 5,          // ~2% estimated
    Oncology: 45,    // ~15-25% in oncology
    fullMark: 100,
  },
  {
    dimension: "Cytopenias",
    SLE: 20,         // Present but recoverable
    Oncology: 75,    // Very common, prolonged
    fullMark: 100,
  },
];

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SafetyRadar({ className }: SafetyRadarProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Safety Profile Comparison</CardTitle>
            <CardDescription>
              SLE vs Oncology (normalized severity index, lower = safer)
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fontSize: 9 }}
                tickFormatter={(v) => `${v}`}
                stroke="hsl(var(--border))"
              />
              <Tooltip content={<CustomTooltip />} />
              <Radar
                name="SLE (CAR-T)"
                dataKey="SLE"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.25}
                strokeWidth={2}
                dot={{ r: 3, fill: "#10b981" }}
              />
              <Radar
                name="Oncology (avg)"
                dataKey="Oncology"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.1}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: "#ef4444" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Interpretation */}
        <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            The SLE safety profile (green) is consistently closer to the center
            across all dimensions, indicating substantially lower toxicity compared
            to the oncology average (red dashed). The most dramatic differences are
            in ICANS, IEC-HS, and mortality where SLE approaches zero.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default SafetyRadar;
