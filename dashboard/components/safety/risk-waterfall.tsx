"use client";

/**
 * Risk Waterfall Chart
 *
 * Shows step-by-step risk reduction as mitigations are applied.
 * Each bar shows the cumulative risk after applying that mitigation,
 * with the reduction delta visible as a connecting segment.
 *
 * @module components/safety/risk-waterfall
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
import { TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

// ============================================================================
// TYPES
// ============================================================================

interface WaterfallStep {
  name: string;
  value: number;
  reduction: number;
  isBaseline?: boolean;
  isFinal?: boolean;
}

interface RiskWaterfallProps {
  className?: string;
  title?: string;
  baselineRate: number;
  mitigations: Array<{
    name: string;
    relativeRisk: number;
  }>;
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: WaterfallStep;
  }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const step = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold">{step.name}</p>
      <div className="mt-1.5 space-y-0.5">
        <p>
          Risk: <span className="font-bold">{step.value.toFixed(2)}%</span>
        </p>
        {!step.isBaseline && (
          <p className="text-emerald-600">
            Reduction: -{step.reduction.toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RiskWaterfall({
  className,
  title = "Risk Waterfall",
  baselineRate,
  mitigations,
}: RiskWaterfallProps) {
  const steps = React.useMemo(() => {
    const result: WaterfallStep[] = [];
    let currentRate = baselineRate;

    result.push({
      name: "Baseline",
      value: currentRate,
      reduction: 0,
      isBaseline: true,
    });

    for (const m of mitigations) {
      const newRate = currentRate * m.relativeRisk;
      result.push({
        name: m.name,
        value: newRate,
        reduction: currentRate - newRate,
      });
      currentRate = newRate;
    }

    result.push({
      name: "Final Risk",
      value: currentRate,
      reduction: 0,
      isFinal: true,
    });

    return result;
  }, [baselineRate, mitigations]);

  const totalReduction = baselineRate - steps[steps.length - 1].value;
  const pctReduction = baselineRate > 0 ? (totalReduction / baselineRate) * 100 : 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <TrendingDown className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>
              {baselineRate.toFixed(1)}% baseline {"->"}  {steps[steps.length - 1].value.toFixed(2)}% mitigated ({pctReduction.toFixed(0)}% reduction)
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={steps}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              barSize={40}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {steps.map((step, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      step.isBaseline
                        ? "#ef4444" // red for baseline
                        : step.isFinal
                        ? "#10b981" // green for final
                        : "#3b82f6" // blue for intermediate steps
                    }
                    fillOpacity={step.isFinal ? 1 : 0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Step-by-step breakdown */}
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          {steps.filter(s => !s.isBaseline && !s.isFinal).map((step) => (
            <div key={step.name} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{step.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-medium">-{step.reduction.toFixed(2)}%</span>
                <span className="text-muted-foreground">{"->"} {step.value.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default RiskWaterfall;
