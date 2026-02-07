"use client";

/**
 * Mitigation Explorer
 *
 * Interactive mitigation strategy explorer allowing users to toggle mitigation
 * checkboxes and see dynamically recalculated risk estimates with animated
 * transitions between before/after values.
 *
 * @module components/safety/mitigation-explorer
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ShieldCheck,
  ChevronRight,
  ArrowDown,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import {
  mitigationStrategies,
  calculateMitigatedRisk,
  getSLEBaselineRiskAssessment,
  type MitigationStrategy,
  type RiskAssessment,
} from "@/lib/safety-data";

// ============================================================================
// TYPES
// ============================================================================

interface MitigationExplorerProps {
  className?: string;
}

// ============================================================================
// EVIDENCE LEVEL BADGE
// ============================================================================

function EvidenceLevelBadge({ level }: { level: MitigationStrategy["evidenceLevel"] }) {
  const config: Record<
    MitigationStrategy["evidenceLevel"],
    { className: string; label: string }
  > = {
    Strong: {
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
      label: "Strong",
    },
    Moderate: {
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
      label: "Moderate",
    },
    Limited: {
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
      label: "Limited",
    },
    Theoretical: {
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800",
      label: "Theoretical",
    },
  };

  const { className, label } = config[level];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        className
      )}
    >
      {label}
    </span>
  );
}

// ============================================================================
// MITIGATION CHECKBOX CARD
// ============================================================================

function MitigationCheckbox({
  strategy,
  checked,
  onToggle,
}: {
  strategy: MitigationStrategy;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
        checked
          ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
          : "border-border hover:border-border/80 hover:bg-muted/30"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(strategy.id)}
        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">{strategy.name}</span>
          <EvidenceLevelBadge level={strategy.evidenceLevel} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {strategy.mechanism}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {strategy.targetAE.map((ae) => (
            <span
              key={ae}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground"
            >
              {ae}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">
            RR: {strategy.relativeRisk.toFixed(2)} [{strategy.confidenceInterval[0].toFixed(2)}-{strategy.confidenceInterval[1].toFixed(2)}]
          </span>
        </div>
      </div>
    </label>
  );
}

// ============================================================================
// ANIMATED RISK VALUE
// ============================================================================

function AnimatedRiskValue({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <motion.div
      key={value.toFixed(2)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="text-center"
    >
      <p className={cn("text-2xl font-bold tabular-nums", color)}>
        {value.toFixed(2)}%
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}

// ============================================================================
// RISK COMPARISON DISPLAY
// ============================================================================

function RiskComparisonRow({
  label,
  baselineEstimate,
  baselineCi: baselineCi,
  mitigatedEstimate,
  mitigatedCi,
}: {
  label: string;
  baselineEstimate: number;
  baselineCi: [number, number];
  mitigatedEstimate: number;
  mitigatedCi: [number, number];
}) {
  const reduction = baselineEstimate > 0
    ? ((1 - mitigatedEstimate / baselineEstimate) * 100)
    : 0;

  const hasReduction = mitigatedEstimate < baselineEstimate;

  return (
    <div className="rounded-lg bg-muted/30 p-3 space-y-2">
      <p className="text-sm font-semibold">{label} (Grade 3+)</p>
      <div className="flex items-center gap-3">
        {/* Before */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <AnimatedRiskValue
              value={baselineEstimate}
              label="Baseline"
              color="text-foreground"
            />
          </AnimatePresence>
          <p className="text-[10px] text-muted-foreground text-center mt-0.5">
            CI: [{baselineCi[0].toFixed(1)}, {baselineCi[1].toFixed(1)}]
          </p>
        </div>

        {/* Arrow */}
        <motion.div
          animate={{ opacity: hasReduction ? 1 : 0.3 }}
          className="flex flex-col items-center gap-0.5"
        >
          <ArrowDown className={cn(
            "h-4 w-4",
            hasReduction ? "text-green-500" : "text-muted-foreground"
          )} />
          {hasReduction && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] font-bold text-green-600 dark:text-green-400"
            >
              -{reduction.toFixed(0)}%
            </motion.span>
          )}
        </motion.div>

        {/* After */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <AnimatedRiskValue
              value={mitigatedEstimate}
              label="Mitigated"
              color={hasReduction ? "text-green-600 dark:text-green-400" : "text-foreground"}
            />
          </AnimatePresence>
          <p className="text-[10px] text-muted-foreground text-center mt-0.5">
            CI: [{mitigatedCi[0].toFixed(1)}, {mitigatedCi[1].toFixed(1)}]
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MitigationExplorer({ className }: MitigationExplorerProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([
    "tocilizumab",
    "dose-reduction",
  ]);

  const defaultAssessment = React.useMemo(() => getSLEBaselineRiskAssessment(), []);
  const baselineRisks = defaultAssessment.baselineRisks;

  const mitigatedRisks = React.useMemo(
    () => calculateMitigatedRisk(baselineRisks, selectedIds),
    [baselineRisks, selectedIds]
  );

  const handleToggle = React.useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const activeMitigations = mitigationStrategies.filter((m) =>
    selectedIds.includes(m.id)
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Mitigation Explorer</CardTitle>
            <CardDescription>
              Toggle mitigations to see projected risk reduction
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Mitigation checkboxes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Available Mitigations</p>
            <Badge variant="secondary" className="text-[10px]">
              {selectedIds.length} / {mitigationStrategies.length} selected
            </Badge>
          </div>
          <div className="space-y-2">
            {mitigationStrategies.map((strategy) => (
              <MitigationCheckbox
                key={strategy.id}
                strategy={strategy}
                checked={selectedIds.includes(strategy.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>

        {/* Risk comparison */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Projected Risk Impact</p>
          </div>

          <RiskComparisonRow
            label="CRS"
            baselineEstimate={baselineRisks.crsGrade3Plus.estimate}
            baselineCi={baselineRisks.crsGrade3Plus.ci95}
            mitigatedEstimate={mitigatedRisks.crsGrade3Plus.estimate}
            mitigatedCi={mitigatedRisks.crsGrade3Plus.ci95}
          />

          <RiskComparisonRow
            label="ICANS"
            baselineEstimate={baselineRisks.icansGrade3Plus.estimate}
            baselineCi={baselineRisks.icansGrade3Plus.ci95}
            mitigatedEstimate={mitigatedRisks.icansGrade3Plus.estimate}
            mitigatedCi={mitigatedRisks.icansGrade3Plus.ci95}
          />
        </div>

        {/* Active mitigations summary */}
        {activeMitigations.length > 0 && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">
              Active Mitigation Strategy
            </p>
            <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
              {activeMitigations.map((m) => (
                <li key={m.id} className="flex items-start gap-1.5">
                  <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>{m.name}</strong>: {m.dosing}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Caveat */}
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Risk reduction estimates assume multiplicative independence of mitigation
          effects. Actual risk reduction may differ. Confidence intervals reflect
          baseline uncertainty only and do not incorporate mitigation uncertainty.
          These projections are for CSP planning purposes and should be validated
          against emerging trial data.
        </p>
      </CardContent>
    </Card>
  );
}

export default MitigationExplorer;
