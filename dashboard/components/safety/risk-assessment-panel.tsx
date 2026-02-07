"use client";

/**
 * Risk Assessment Panel
 *
 * Interactive risk assessment showing baseline CRS, ICANS, and ICAHS risk
 * gauges for SLE CAR-T therapy with colored bars, confidence intervals,
 * and oncology benchmarks for comparison.
 *
 * @module components/safety/risk-assessment-panel
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
import { Shield, AlertTriangle, Activity, Brain, Flame } from "lucide-react";
import type { RiskAssessment } from "@/lib/safety-data";
import {
  getSLEBaselineRiskAssessment,
  adverseEventRates,
} from "@/lib/safety-data";

// ============================================================================
// TYPES
// ============================================================================

interface RiskGaugeData {
  event: string;
  label: string;
  icon: React.ElementType;
  baselineRate: number;
  baselineCiLower: number;
  baselineCiUpper: number;
  mitigatedRate?: number;
  oncologyBenchmark: number;
  oncologyLabel: string;
  anyGradeRate: number;
}

interface RiskAssessmentPanelProps {
  baselineRisks?: RiskAssessment["baselineRisks"];
  mitigatedRisks?: RiskAssessment["mitigatedRisks"];
  showMitigated?: boolean;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getRiskColor(rate: number): string {
  if (rate < 2) return "bg-green-500";
  if (rate <= 10) return "bg-amber-500";
  return "bg-red-500";
}

function getRiskTextColor(rate: number): string {
  if (rate < 2) return "text-green-600 dark:text-green-400";
  if (rate <= 10) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getRiskBadgeVariant(rate: number): "success" | "warning" | "destructive" {
  if (rate < 2) return "success";
  if (rate <= 10) return "warning";
  return "destructive";
}

// ============================================================================
// RISK GAUGE COMPONENT
// ============================================================================

function RiskGauge({
  gauge,
  showMitigated,
}: {
  gauge: RiskGaugeData;
  showMitigated: boolean;
}) {
  const Icon = gauge.icon;
  const displayRate = showMitigated && gauge.mitigatedRate !== undefined
    ? gauge.mitigatedRate
    : gauge.baselineRate;

  // Scale bar width: max at 50% rate => 100% bar width
  const barWidth = Math.min((displayRate / 50) * 100, 100);
  const oncologyBarWidth = Math.min((gauge.oncologyBenchmark / 50) * 100, 100);

  return (
    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-md",
            displayRate < 2 ? "bg-green-100 dark:bg-green-900/30" :
            displayRate <= 10 ? "bg-amber-100 dark:bg-amber-900/30" :
            "bg-red-100 dark:bg-red-900/30"
          )}>
            <Icon className={cn("h-4 w-4", getRiskTextColor(displayRate))} />
          </div>
          <div>
            <p className="text-sm font-semibold">{gauge.event}</p>
            <p className="text-xs text-muted-foreground">{gauge.label}</p>
          </div>
        </div>
        <Badge variant={getRiskBadgeVariant(displayRate)}>
          Grade 3+: {displayRate.toFixed(1)}%
        </Badge>
      </div>

      {/* Any-grade rate */}
      <div className="text-xs text-muted-foreground">
        Any grade: {gauge.anyGradeRate}%
      </div>

      {/* SLE Risk Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">SLE (Grade 3+)</span>
          <span className={cn("font-bold", getRiskTextColor(displayRate))}>
            {displayRate.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              getRiskColor(displayRate)
            )}
            style={{ width: `${barWidth}%` }}
          />
          {/* Mitigated overlay */}
          {showMitigated && gauge.mitigatedRate !== undefined && gauge.mitigatedRate < gauge.baselineRate && (
            <div
              className="absolute top-0 h-full rounded-full bg-green-500/30 border-r-2 border-green-600"
              style={{ width: `${Math.min((gauge.baselineRate / 50) * 100, 100)}%` }}
            />
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>95% CI: [{gauge.baselineCiLower.toFixed(1)}%, {gauge.baselineCiUpper.toFixed(1)}%]</span>
          {showMitigated && gauge.mitigatedRate !== undefined && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              Mitigated from {gauge.baselineRate.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Oncology Benchmark Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Oncology benchmark ({gauge.oncologyLabel})
          </span>
          <span className="text-muted-foreground font-medium">
            {gauge.oncologyBenchmark}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-red-400/60 dark:bg-red-500/40"
            style={{ width: `${oncologyBarWidth}%` }}
          />
        </div>
      </div>

      {/* Comparison indicator */}
      {gauge.oncologyBenchmark > 0 && displayRate > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Shield className="h-3 w-3 text-green-500" />
          <span>
            {((1 - displayRate / gauge.oncologyBenchmark) * 100).toFixed(0)}% lower
            than oncology benchmark
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RiskAssessmentPanel({
  baselineRisks: propBaselineRisks,
  mitigatedRisks: propMitigatedRisks,
  showMitigated = false,
  className,
}: RiskAssessmentPanelProps) {
  const defaultAssessment = React.useMemo(() => getSLEBaselineRiskAssessment(), []);

  const baselineRisks = propBaselineRisks ?? defaultAssessment.baselineRisks;
  const mitigatedRisks = propMitigatedRisks ?? defaultAssessment.mitigatedRisks;

  // Get SLE pooled any-grade rates
  const slePooled = adverseEventRates.find(
    (ae) => ae.indication === "SLE" && ae.trial === "SLE Pooled Analysis"
  );

  // Get oncology benchmarks (ZUMA-1 for DLBCL)
  const dlbclBenchmark = adverseEventRates.find(
    (ae) => ae.trial === "ZUMA-1"
  );

  const allBenchmark = adverseEventRates.find(
    (ae) => ae.trial === "ELIANA"
  );

  const gauges: RiskGaugeData[] = [
    {
      event: "CRS",
      label: "Cytokine Release Syndrome",
      icon: Flame,
      baselineRate: baselineRisks.crsGrade3Plus.estimate,
      baselineCiLower: baselineRisks.crsGrade3Plus.ci95[0],
      baselineCiUpper: baselineRisks.crsGrade3Plus.ci95[1],
      mitigatedRate: showMitigated ? mitigatedRisks.crsGrade3Plus.estimate : undefined,
      oncologyBenchmark: dlbclBenchmark?.crsGrade3Plus ?? 13,
      oncologyLabel: "DLBCL axi-cel",
      anyGradeRate: slePooled?.crsAnyGrade ?? 56,
    },
    {
      event: "ICANS",
      label: "Neurotoxicity Syndrome",
      icon: Brain,
      baselineRate: baselineRisks.icansGrade3Plus.estimate,
      baselineCiLower: baselineRisks.icansGrade3Plus.ci95[0],
      baselineCiUpper: baselineRisks.icansGrade3Plus.ci95[1],
      mitigatedRate: showMitigated ? mitigatedRisks.icansGrade3Plus.estimate : undefined,
      oncologyBenchmark: dlbclBenchmark?.icansGrade3Plus ?? 28,
      oncologyLabel: "DLBCL axi-cel",
      anyGradeRate: slePooled?.icansAnyGrade ?? 3,
    },
    {
      event: "ICAHS",
      label: "HLH-like Syndrome",
      icon: AlertTriangle,
      baselineRate: baselineRisks.icahs.estimate,
      baselineCiLower: baselineRisks.icahs.ci95[0],
      baselineCiUpper: baselineRisks.icahs.ci95[1],
      mitigatedRate: undefined,
      oncologyBenchmark: 5,
      oncologyLabel: "ALL tisa-cel",
      anyGradeRate: slePooled?.icahsRate ?? 0,
    },
  ];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Risk Assessment</CardTitle>
            <CardDescription>
              CAR-T safety profile in SLE vs oncology benchmarks
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">&lt;2% (Low)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">2-10% (Moderate)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">&gt;10% (High)</span>
          </div>
        </div>

        {/* Risk gauges */}
        <div className="space-y-3">
          {gauges.map((gauge) => (
            <RiskGauge
              key={gauge.event}
              gauge={gauge}
              showMitigated={showMitigated}
            />
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
          <div className="flex items-start gap-2">
            <Activity className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="text-xs text-green-800 dark:text-green-300">
              <p className="font-semibold mb-1">Key Finding</p>
              <p>
                Grade 3+ CRS and ICANS rates in SLE CAR-T are substantially lower
                than oncology benchmarks. No treatment-related deaths reported in
                autoimmune CAR-T cohorts (N={slePooled?.nPatients ?? 47}).
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RiskAssessmentPanel;
