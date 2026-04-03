"use client";

/**
 * Executive Briefing Export Component
 *
 * Generates a clean, printable executive summary for CMOs and senior safety
 * leaders. Opens as a modal dialog with a full briefing document that can be
 * printed or saved as PDF via the browser's print dialog.
 *
 * Designed for AstraZeneca-quality presentation: clean typography, proper
 * spacing, dark text on white background, professional table formatting.
 *
 * @module components/safety/executive-briefing
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Printer,
  X,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import {
  clinicalTrials,
  adverseEventRates,
  mitigationStrategies,
} from "@/lib/safety-data";

// ============================================================================
// TYPES
// ============================================================================

interface RiskEstimateProps {
  estimate: number;
  ciLow: number;
  ciHigh: number;
}

export interface ExecutiveBriefingProps {
  open: boolean;
  onClose: () => void;
  baselineRisks: {
    crsGrade3Plus: RiskEstimateProps;
    icansGrade3Plus: RiskEstimateProps;
    icahs: RiskEstimateProps;
    licats: RiskEstimateProps;
  };
  mitigatedCRS: RiskEstimateProps;
  mitigatedICANS: RiskEstimateProps;
  selectedMitigations: string[];
  trialCount: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function riskReductionPct(baseline: number, mitigated: number): string {
  if (baseline <= 0) return "N/A";
  const reduction = ((baseline - mitigated) / baseline) * 100;
  return `${reduction.toFixed(0)}%`;
}

function getRiskLabel(rate: number): string {
  if (rate < 2) return "Low";
  if (rate <= 10) return "Moderate";
  return "High";
}

// ============================================================================
// PRINT STYLES
// ============================================================================

const printStyles = `
@media print {
  /* Hide everything except the briefing */
  body > *:not(#executive-briefing-portal) {
    display: none !important;
  }

  /* Hide modal chrome */
  [data-slot="dialog-overlay"],
  [data-slot="dialog-close"],
  .briefing-modal-controls {
    display: none !important;
  }

  /* Reset dialog content for print */
  [data-slot="dialog-content"] {
    position: static !important;
    transform: none !important;
    max-width: none !important;
    width: 100% !important;
    max-height: none !important;
    overflow: visible !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
  }

  [data-slot="dialog-portal"] {
    position: static !important;
  }

  /* Page setup */
  @page {
    size: A4;
    margin: 18mm 15mm 20mm 15mm;
  }

  /* Ensure white background and dark text */
  .briefing-document {
    background: white !important;
    color: #111827 !important;
    font-size: 10pt !important;
    line-height: 1.5 !important;
    max-height: none !important;
    overflow: visible !important;
    padding: 0 !important;
  }

  .briefing-document * {
    color: #111827 !important;
    background: transparent !important;
    border-color: #d1d5db !important;
  }

  /* Preserve table backgrounds in print */
  .briefing-table-header {
    background: #f3f4f6 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .briefing-risk-low {
    color: #047857 !important;
    font-weight: 700 !important;
  }

  .briefing-risk-moderate {
    color: #b45309 !important;
    font-weight: 700 !important;
  }

  .briefing-risk-high {
    color: #b91c1c !important;
    font-weight: 700 !important;
  }

  .briefing-highlight-box {
    background: #f0fdf4 !important;
    border: 1px solid #86efac !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .briefing-caution-box {
    background: #fffbeb !important;
    border: 1px solid #fcd34d !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Page breaks */
  .briefing-section {
    page-break-inside: avoid;
  }

  .briefing-page-break {
    page-break-before: always;
  }

  /* Hide scrollbar container styling */
  .briefing-scroll-container {
    max-height: none !important;
    overflow: visible !important;
  }
}
`;

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

function SectionHeader({
  number,
  title,
  icon: Icon,
}: {
  number: string;
  title: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3 pb-2 border-b-2 border-emerald-600 print:border-emerald-800">
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-600 text-white print:bg-emerald-700 flex-shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-base font-bold tracking-tight text-gray-900">
        <span className="text-emerald-700 mr-1.5">{number}.</span>
        {title}
      </h2>
    </div>
  );
}

function RiskCell({ value, className }: { value: number; className?: string }) {
  const label = getRiskLabel(value);
  const riskClass =
    label === "Low"
      ? "briefing-risk-low text-emerald-700"
      : label === "Moderate"
        ? "briefing-risk-moderate text-amber-700"
        : "briefing-risk-high text-red-700";
  return (
    <td className={cn("px-3 py-2 text-sm font-semibold tabular-nums", riskClass, className)}>
      {value.toFixed(1)}%
    </td>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ExecutiveBriefing({
  open,
  onClose,
  baselineRisks,
  mitigatedCRS,
  mitigatedICANS,
  selectedMitigations,
  trialCount,
}: ExecutiveBriefingProps) {
  const now = React.useMemo(() => new Date(), [open]);

  const handlePrint = React.useCallback(() => {
    window.print();
  }, []);

  // Derive data for the briefing
  const slePooled = adverseEventRates.find(
    (ae) => ae.indication === "SLE" && ae.trial === "SLE Pooled Analysis"
  );
  const patientCount = slePooled?.nPatients ?? 47;
  const studyCount = adverseEventRates.filter(
    (ae) => ae.indication === "SLE" && ae.trial !== "SLE Pooled Analysis"
  ).length;

  const recruitingTrials = clinicalTrials.filter(
    (t) =>
      t.status === "Recruiting" &&
      (t.indication.includes("SLE") ||
        t.indication.includes("Lupus") ||
        t.indication.includes("SSc") ||
        t.indication.includes("Myositis") ||
        t.indication.includes("NMOSD"))
  );

  const activeMitigationNames = selectedMitigations
    .map((id) => mitigationStrategies.find((m) => m.id === id)?.name)
    .filter(Boolean);

  const totalRecruitingEnrollment = recruitingTrials.reduce(
    (sum, t) => sum + t.enrollment,
    0
  );

  return (
    <>
      {/* Inject print styles */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent
          className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0"
          showCloseButton={false}
        >
          {/* Modal header with controls - hidden in print */}
          <div className="briefing-modal-controls flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <DialogHeader className="space-y-0.5 text-left">
                <DialogTitle className="text-lg font-bold">
                  Executive Briefing
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Print-ready safety summary for leadership review
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrint}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Print / Save as PDF
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable briefing document */}
          <div className="briefing-scroll-container overflow-y-auto flex-1 max-h-[calc(90vh-80px)]">
            <div className="briefing-document bg-white dark:bg-white p-8 sm:p-10 text-gray-900 space-y-6">
              {/* ============================================================
                  DOCUMENT HEADER
                  ============================================================ */}
              <div className="briefing-section text-center space-y-3 pb-5 border-b-2 border-gray-300">
                {/* Confidentiality banner */}
                <div className="inline-block px-4 py-1 rounded-sm bg-red-50 border border-red-200 text-red-800 text-[10px] font-bold tracking-widest uppercase">
                  Confidential -- For Internal Use Only
                </div>

                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Predictive Safety Platform
                  </h1>
                  <p className="text-lg font-semibold text-emerald-700">
                    Executive Briefing
                  </p>
                  <p className="text-sm text-gray-500">
                    CAR-T Cell Therapy Safety Profile in Systemic Lupus Erythematosus (SLE)
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-1">
                  <span>Date: {formatDate(now)}</span>
                  <span className="text-gray-300">|</span>
                  <span>Evidence Base: {studyCount} studies, N={patientCount}</span>
                  <span className="text-gray-300">|</span>
                  <span>Active Trials: {trialCount}</span>
                </div>
              </div>

              {/* ============================================================
                  1. KEY FINDINGS
                  ============================================================ */}
              <div className="briefing-section">
                <SectionHeader number="1" title="Key Findings" icon={CheckCircle2} />

                <div className="briefing-highlight-box rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <strong>Favorable safety profile:</strong> Grade 3+ CRS rate in SLE CAR-T
                      ({baselineRisks.crsGrade3Plus.estimate.toFixed(1)}%) is substantially lower
                      than oncology benchmarks (4-48%), representing an 80-95% relative risk reduction
                      driven primarily by lower cell doses and reduced antigen burden.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <strong>No treatment-related deaths:</strong> Across {patientCount} SLE patients
                      treated with CAR-T across {studyCount} studies, zero treatment-related fatalities
                      have been reported (median follow-up approximately 18 months).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <strong>ICANS and ICAHS near zero:</strong> Grade 3+ ICANS
                      ({baselineRisks.icansGrade3Plus.estimate.toFixed(1)}%) and IEC-HS/ICAHS
                      ({baselineRisks.icahs.estimate.toFixed(1)}%) rates are markedly lower than in
                      hematologic malignancies. No ICAHS events observed in any SLE cohort.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <strong>Evidence limitations:</strong> Current safety data derives from small,
                      open-label, predominantly single-center studies (N={patientCount} pooled). Wide
                      confidence intervals reflect sample size constraints. Phase 2/3 trial data will
                      be required to establish definitive safety profiles.
                    </p>
                  </div>
                </div>
              </div>

              {/* ============================================================
                  2. RISK SUMMARY TABLE
                  ============================================================ */}
              <div className="briefing-section">
                <SectionHeader number="2" title="Risk Summary" icon={Shield} />

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="briefing-table-header bg-gray-100">
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Adverse Event
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Baseline (SLE)
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          95% CI
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Mitigated
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Reduction
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Oncology Ref.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* CRS */}
                      <tr>
                        <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">
                          CRS Grade 3+
                        </td>
                        <RiskCell
                          value={baselineRisks.crsGrade3Plus.estimate}
                          className="text-center"
                        />
                        <td className="px-3 py-2 text-xs text-gray-500 text-center tabular-nums">
                          [{baselineRisks.crsGrade3Plus.ciLow.toFixed(1)}, {baselineRisks.crsGrade3Plus.ciHigh.toFixed(1)}]
                        </td>
                        <td className="px-3 py-2 text-sm font-bold text-emerald-700 text-center tabular-nums briefing-risk-low">
                          {mitigatedCRS.estimate.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-sm font-semibold text-emerald-600 text-center">
                          {riskReductionPct(baselineRisks.crsGrade3Plus.estimate, mitigatedCRS.estimate)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 text-center">
                          13% (DLBCL)
                        </td>
                      </tr>
                      {/* ICANS */}
                      <tr>
                        <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">
                          ICANS Grade 3+
                        </td>
                        <RiskCell
                          value={baselineRisks.icansGrade3Plus.estimate}
                          className="text-center"
                        />
                        <td className="px-3 py-2 text-xs text-gray-500 text-center tabular-nums">
                          [{baselineRisks.icansGrade3Plus.ciLow.toFixed(1)}, {baselineRisks.icansGrade3Plus.ciHigh.toFixed(1)}]
                        </td>
                        <td className="px-3 py-2 text-sm font-bold text-emerald-700 text-center tabular-nums briefing-risk-low">
                          {mitigatedICANS.estimate.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-sm font-semibold text-emerald-600 text-center">
                          {riskReductionPct(baselineRisks.icansGrade3Plus.estimate, mitigatedICANS.estimate)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 text-center">
                          28% (DLBCL)
                        </td>
                      </tr>
                      {/* ICAHS */}
                      <tr>
                        <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">
                          ICAHS (IEC-HS)
                        </td>
                        <RiskCell
                          value={baselineRisks.icahs.estimate}
                          className="text-center"
                        />
                        <td className="px-3 py-2 text-xs text-gray-500 text-center tabular-nums">
                          [{baselineRisks.icahs.ciLow.toFixed(1)}, {baselineRisks.icahs.ciHigh.toFixed(1)}]
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400 text-center italic">
                          --
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400 text-center italic">
                          --
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 text-center">
                          5% (ALL)
                        </td>
                      </tr>
                      {/* LICATS */}
                      <tr>
                        <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">
                          LICATS
                          <span className="ml-1 text-[10px] font-normal text-gray-400 italic">
                            (novel)
                          </span>
                        </td>
                        <RiskCell
                          value={baselineRisks.licats.estimate}
                          className="text-center"
                        />
                        <td className="px-3 py-2 text-xs text-gray-500 text-center tabular-nums">
                          [{baselineRisks.licats.ciLow.toFixed(1)}, {baselineRisks.licats.ciHigh.toFixed(1)}]
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400 text-center italic">
                          --
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400 text-center italic">
                          --
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400 text-center italic">
                          N/A
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                  Mitigated estimates based on selected strategies: {activeMitigationNames.join(", ") || "None"}.
                  Risk reduction calculated via Monte Carlo simulation with Beta-distributed baseline
                  and log-normal relative risk sampling (N=10,000 iterations).
                </p>
              </div>

              {/* ============================================================
                  3. EVIDENCE BASE
                  ============================================================ */}
              <div className="briefing-section">
                <SectionHeader number="3" title="Evidence Base" icon={FileText} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{studyCount}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Published Studies</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{patientCount}</p>
                    <p className="text-xs text-gray-500 mt-0.5">SLE Patients Pooled</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">Low</p>
                    <p className="text-xs text-gray-500 mt-0.5">Evidence Certainty</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">0</p>
                    <p className="text-xs text-gray-500 mt-0.5">Treatment Deaths</p>
                  </div>
                </div>

                <div className="briefing-caution-box mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-700 leading-relaxed">
                      <p className="font-semibold text-amber-800 mb-1">Evidence Quality Assessment</p>
                      <p>
                        Evidence certainty is rated <strong>Low</strong> per GRADE methodology.
                        All studies are open-label, predominantly single-center, with sample sizes
                        ranging from 2-15 patients per study. No randomized controlled trials have
                        been completed. The pooled analysis inherits heterogeneity across products
                        (CD19, BCMA/CD19 dual), manufacturing processes, and lymphodepletion
                        regimens. Confidence intervals are wide and should be interpreted accordingly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================
                  4. SLE vs ONCOLOGY COMPARISON
                  ============================================================ */}
              <div className="briefing-section">
                <SectionHeader number="4" title="SLE vs Oncology Comparison" icon={TrendingDown} />

                <div className="space-y-3">
                  {/* CRS Comparison */}
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      Grade 3+ CRS
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { label: "SLE (Pooled)", rate: baselineRisks.crsGrade3Plus.estimate, color: "bg-emerald-500" },
                        { label: "DLBCL (axi-cel)", rate: 13, color: "bg-amber-500" },
                        { label: "ALL (tisa-cel)", rate: 48, color: "bg-red-500" },
                        { label: "MM (ide-cel)", rate: 7, color: "bg-purple-500" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-28 text-right flex-shrink-0">
                            {item.label}
                          </span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", item.color)}
                              style={{ width: `${Math.min((item.rate / 50) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-10 tabular-nums">
                            {item.rate.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ICANS Comparison */}
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      Grade 3+ ICANS
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { label: "SLE (Pooled)", rate: baselineRisks.icansGrade3Plus.estimate, color: "bg-emerald-500" },
                        { label: "DLBCL (axi-cel)", rate: 28, color: "bg-amber-500" },
                        { label: "ALL (tisa-cel)", rate: 13, color: "bg-red-500" },
                        { label: "MM (cilta-cel)", rate: 10, color: "bg-purple-500" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-28 text-right flex-shrink-0">
                            {item.label}
                          </span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", item.color)}
                              style={{ width: `${Math.min((item.rate / 30) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-10 tabular-nums">
                            {item.rate.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================
                  5. ACTIVE TRIAL LANDSCAPE
                  ============================================================ */}
              <div className="briefing-section">
                <SectionHeader number="5" title="Active Trial Landscape" icon={FileText} />

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="briefing-table-header bg-gray-100">
                        <th className="px-3 py-2 text-left font-bold text-gray-700">Trial</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700">Sponsor</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700">Phase</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700">Target</th>
                        <th className="px-3 py-2 text-center font-bold text-gray-700">N</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recruitingTrials.map((trial) => (
                        <tr key={trial.nctId}>
                          <td className="px-3 py-2 font-semibold text-gray-900">
                            {trial.name}
                            <span className="block text-[10px] text-gray-400 font-mono">
                              {trial.nctId}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600">{trial.sponsor}</td>
                          <td className="px-3 py-2 text-gray-600">{trial.phase}</td>
                          <td className="px-3 py-2 text-gray-600">{trial.target}</td>
                          <td className="px-3 py-2 text-center text-gray-700 font-semibold tabular-nums">
                            {trial.enrollment}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {trial.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {recruitingTrials.length} actively recruiting trials with combined target enrollment
                  of {totalRecruitingEnrollment} patients across {
                    [...new Set(recruitingTrials.map((t) => t.sponsor))].length
                  } sponsors.
                  Data expected to mature significantly over the next 12-24 months.
                </p>
              </div>

              {/* ============================================================
                  6. RECOMMENDATIONS
                  ============================================================ */}
              <div className="briefing-section">
                <SectionHeader number="6" title="CSP Recommendations" icon={Shield} />

                <div className="space-y-2.5">
                  {[
                    {
                      num: "6.1",
                      title: "Dose selection",
                      body: `Adopt 1 x 10\u2076 CAR+ T cells/kg as the starting dose for SLE indications, consistent with all published autoimmune CAR-T protocols. This dose provides a 10-100x safety margin relative to oncology doses while achieving complete B-cell depletion.`,
                    },
                    {
                      num: "6.2",
                      title: "Mitigation strategy",
                      body: `Implement a standard mitigation protocol including tocilizumab availability for CRS management, corticosteroids for ICANS, and reduced-intensity lymphodepletion. Projected mitigated CRS rate: ${mitigatedCRS.estimate.toFixed(2)}% (${riskReductionPct(baselineRisks.crsGrade3Plus.estimate, mitigatedCRS.estimate)} reduction from baseline).`,
                    },
                    {
                      num: "6.3",
                      title: "Monitoring framework",
                      body: `Minimum 7-day inpatient monitoring post-infusion with daily cytokine panels (IL-6, CRP, ferritin) and BID ICE scoring for neurotoxicity assessment. B-cell monitoring monthly for 6 months, then quarterly. 15-year long-term follow-up per FDA gene therapy guidance.`,
                    },
                    {
                      num: "6.4",
                      title: "Stopping rules",
                      body: `Implement Bayesian stopping boundaries: suspend enrollment upon any treatment-related death; pause and convene DSMB review if Grade 3+ CRS exceeds 15% or Grade 3+ ICANS exceeds 13% in any rolling 20-patient cohort. Include dose de-escalation contingency to 0.5 x 10\u2076/kg.`,
                    },
                  ].map((rec) => (
                    <div
                      key={rec.num}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                        {rec.num}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{rec.title}</p>
                        <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                          {rec.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ============================================================
                  FOOTER
                  ============================================================ */}
              <div className="pt-5 mt-6 border-t-2 border-gray-300 space-y-3">
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>
                    Generated by Predictive Safety Platform (PSP) v1.0
                  </span>
                  <span>
                    {formatTimestamp(now)}
                  </span>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <strong className="text-gray-600">Disclaimer:</strong> This executive briefing
                    is generated from pooled analysis of published clinical data and is intended for
                    internal decision-support purposes only. All risk estimates carry substantial
                    uncertainty due to small sample sizes (N={patientCount}), heterogeneity across
                    study designs, and the absence of randomized controlled trial data. Mitigated
                    risk projections are modeled estimates based on oncology-derived relative risk
                    data and may not directly apply to autoimmune populations. This document does
                    not constitute regulatory advice. All safety conclusions should be independently
                    reviewed by qualified medical and regulatory personnel before incorporation into
                    any Clinical Safety Plan or regulatory submission. Evidence current as of
                    February 2026.
                  </p>
                </div>

                <div className="text-center text-[9px] text-gray-300 tracking-wider uppercase">
                  End of Executive Briefing
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ExecutiveBriefing;
