"use client";

/**
 * Patient Journey Timeline
 *
 * Visual timeline showing the CAR-T treatment process from screening
 * through long-term follow-up, with safety monitoring milestones,
 * risk windows, and key assessments overlaid.
 *
 * @module components/safety/patient-journey
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
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Heart,
  Shield,
  Syringe,
  Zap,
} from "lucide-react";

// ============================================================================
// DATA
// ============================================================================

interface JourneyPhase {
  id: string;
  name: string;
  timeframe: string;
  dayRange: [number, number]; // start, end days from infusion (D0)
  icon: React.ReactNode;
  color: string;
  riskLevel: "Low" | "Moderate" | "High" | "Monitoring";
  description: string;
  keyActivities: string[];
  safetyMonitoring: string[];
  riskWindows?: { event: string; peak: string; color: string }[];
}

const phases: JourneyPhase[] = [
  {
    id: "screening",
    name: "Screening & Eligibility",
    timeframe: "Day -60 to -30",
    dayRange: [-60, -30],
    icon: <FlaskConical className="h-4 w-4" />,
    color: "slate",
    riskLevel: "Low",
    description: "Patient evaluation, leukapheresis planning, and eligibility confirmation",
    keyActivities: [
      "Confirm SLEDAI \u2265 6 and failure of \u2265 2 prior therapies",
      "Baseline organ function (CBC, CMP, eGFR, LFTs)",
      "Screen for active infections, malignancy, pregnancy",
      "Leukapheresis for T-cell collection",
      "CAR-T manufacturing initiated (2-4 weeks)",
    ],
    safetyMonitoring: [
      "Baseline ICE assessment",
      "Cardiac evaluation (ECHO if risk factors)",
      "Baseline immunoglobulin levels",
    ],
  },
  {
    id: "lymphodepletion",
    name: "Lymphodepletion",
    timeframe: "Day -5 to -3",
    dayRange: [-5, -3],
    icon: <Zap className="h-4 w-4" />,
    color: "amber",
    riskLevel: "Moderate",
    description: "Conditioning chemotherapy to create space for CAR-T cell expansion",
    keyActivities: [
      "Fludarabine 25 mg/m\u00B2 IV x3 days + Cyclophosphamide 250 mg/m\u00B2 IV x3 days",
      "Begin seizure prophylaxis (levetiracetam 750mg BID)",
      "Begin infection prophylaxis (acyclovir, fluconazole, TMP-SMX)",
      "Washout immunosuppressants \u2265 2 weeks prior",
    ],
    safetyMonitoring: [
      "CBC daily during lymphodepletion",
      "Tumor lysis labs if high burden",
      "Hydration and anti-emetics",
    ],
  },
  {
    id: "infusion",
    name: "CAR-T Infusion (Day 0)",
    timeframe: "Day 0",
    dayRange: [0, 0],
    icon: <Syringe className="h-4 w-4" />,
    color: "emerald",
    riskLevel: "High",
    description: "Single IV infusion of 1\u00D710\u2076 CAR-T cells/kg",
    keyActivities: [
      "Pre-medication: acetaminophen 650mg PO, diphenhydramine 25mg IV",
      "CAR-T cell infusion over 15-30 minutes",
      "Post-infusion observation \u2265 1 hour",
      "Tocilizumab and vasopressors on standby",
    ],
    safetyMonitoring: [
      "Vital signs q15min during infusion, q1h x4h post",
      "Monitor for infusion reactions (anaphylaxis)",
      "Baseline CRP, ferritin, LDH, fibrinogen",
    ],
    riskWindows: [
      { event: "Infusion Reactions", peak: "During infusion", color: "red" },
    ],
  },
  {
    id: "acute-monitoring",
    name: "Acute Monitoring",
    timeframe: "Day 1 \u2013 14",
    dayRange: [1, 14],
    icon: <Activity className="h-4 w-4" />,
    color: "red",
    riskLevel: "High",
    description: "Peak risk window for CRS and ICANS. Inpatient or close proximity monitoring required.",
    keyActivities: [
      "Inpatient observation Day 0-7 (minimum)",
      "Daily cytokine panel: CRP, ferritin, LDH, fibrinogen",
      "ICE assessment BID for ICANS screening",
      "Vital signs q4h or per institutional protocol",
    ],
    safetyMonitoring: [
      "Temperature monitoring (CRS hallmark: fever \u2265 38\u00B0C)",
      "Hemodynamic monitoring (hypotension = Grade 2+ CRS)",
      "Neurological assessment (orientation, handwriting, naming)",
      "O2 saturation monitoring",
    ],
    riskWindows: [
      { event: "CRS onset", peak: "Day 1-5 (median onset Day 2)", color: "orange" },
      { event: "ICANS onset", peak: "Day 3-10 (median onset Day 5)", color: "blue" },
      { event: "Peak CAR-T expansion", peak: "Day 7-14", color: "emerald" },
    ],
  },
  {
    id: "early-recovery",
    name: "Early Recovery",
    timeframe: "Day 15 \u2013 28",
    dayRange: [15, 28],
    icon: <Shield className="h-4 w-4" />,
    color: "blue",
    riskLevel: "Moderate",
    description: "CRS/ICANS risk declining. Monitor for cytopenias and early infections.",
    keyActivities: [
      "Transition to outpatient (if stable after Day 10-14)",
      "Remain within 2 weeks proximity to treatment center",
      "CBC 2x/week for cytopenia monitoring",
      "Driving restriction (2 weeks post-infusion, per updated REMS)",
    ],
    safetyMonitoring: [
      "CBC with differential 2x/week",
      "Immunoglobulin levels (IgG, IgA, IgM)",
      "B-cell count by flow cytometry (Day 14, 28)",
      "CAR-T cell expansion by qPCR (Day 14, 28)",
    ],
    riskWindows: [
      { event: "Cytopenias", peak: "Day 14-28 (nadir)", color: "purple" },
      { event: "Infection risk rising", peak: "B-cell aplasia beginning", color: "amber" },
    ],
  },
  {
    id: "b-cell-aplasia",
    name: "B-Cell Aplasia Phase",
    timeframe: "Month 1 \u2013 6",
    dayRange: [29, 180],
    icon: <Heart className="h-4 w-4" />,
    color: "purple",
    riskLevel: "Monitoring",
    description: "Expected therapeutic B-cell depletion. Key period for infection prophylaxis and disease response assessment.",
    keyActivities: [
      "Monthly clinic visits (M1, M2, M3, M4, M5, M6)",
      "Autoantibody monitoring (anti-dsDNA, complement C3/C4)",
      "Disease activity assessment (SLEDAI score)",
      "IVIG replacement when IgG <400 mg/dL (0.4 g/kg monthly)",
      "Continue infection prophylaxis until B-cell reconstitution",
    ],
    safetyMonitoring: [
      "Monthly CBC, CMP, immunoglobulins",
      "B-cell reconstitution monitoring (CD19+/CD20+ flow cytometry)",
      "Infection surveillance (cultures if febrile)",
      "Vaccination deferred until B-cell reconstitution",
    ],
    riskWindows: [
      { event: "Hypogammaglobulinemia", peak: "IgG <400 in ~40-60% by M3", color: "amber" },
      { event: "Infection risk", peak: "Peak during B-cell aplasia", color: "red" },
    ],
  },
  {
    id: "long-term",
    name: "Long-Term Follow-Up",
    timeframe: "Year 1 \u2013 15",
    dayRange: [181, 5475],
    icon: <Calendar className="h-4 w-4" />,
    color: "teal",
    riskLevel: "Low",
    description: "Mandatory 15-year follow-up per FDA. Monitor for disease relapse, B-cell reconstitution, and secondary malignancy.",
    keyActivities: [
      "Quarterly visits Year 1, semi-annual Year 2-5, annual Year 6-15",
      "SLE disease activity monitoring (SLEDAI, PGA, labs)",
      "Annual cancer screening (per FDA boxed warning)",
      "Autoantibody and complement monitoring",
      "Taper and discontinue infection prophylaxis after B-cell reconstitution",
    ],
    safetyMonitoring: [
      "Annual CBC, CMP, immunoglobulins",
      "Annual skin exam, age-appropriate cancer screening",
      "T-cell subset monitoring if clinically indicated",
      "Report any new malignancy to sponsor and CIBMTR",
    ],
    riskWindows: [
      { event: "T-cell malignancy (theoretical)", peak: "Ongoing surveillance (0.1% in oncology)", color: "red" },
      { event: "SLE relapse", peak: "If B-cells reconstitute with autoreactive clones", color: "amber" },
    ],
  },
];

// ============================================================================
// COLOR MAP
// ============================================================================

const colorMap: Record<string, {
  bg: string; border: string; text: string; dot: string; lightBg: string;
}> = {
  slate: { bg: "bg-slate-100 dark:bg-slate-900/30", border: "border-slate-300 dark:border-slate-700", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500", lightBg: "bg-slate-50 dark:bg-slate-950/20" },
  amber: { bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-300 dark:border-amber-700", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", lightBg: "bg-amber-50 dark:bg-amber-950/20" },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/20" },
  red: { bg: "bg-red-100 dark:bg-red-900/30", border: "border-red-300 dark:border-red-700", text: "text-red-600 dark:text-red-400", dot: "bg-red-500", lightBg: "bg-red-50 dark:bg-red-950/20" },
  blue: { bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-300 dark:border-blue-700", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500", lightBg: "bg-blue-50 dark:bg-blue-950/20" },
  purple: { bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-300 dark:border-purple-700", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500", lightBg: "bg-purple-50 dark:bg-purple-950/20" },
  teal: { bg: "bg-teal-100 dark:bg-teal-900/30", border: "border-teal-300 dark:border-teal-700", text: "text-teal-600 dark:text-teal-400", dot: "bg-teal-500", lightBg: "bg-teal-50 dark:bg-teal-950/20" },
};

const riskBadge: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Moderate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Monitoring: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PatientJourney({ className }: { className?: string }) {
  const [expandedPhase, setExpandedPhase] = React.useState<string | null>("acute-monitoring");

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-teal-600" />
          Patient Journey: CAR-T Treatment Timeline
        </CardTitle>
        <CardDescription className="text-xs">
          Safety monitoring milestones and risk windows from screening through 15-year follow-up
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Compact timeline bar */}
        <div className="flex gap-0.5 mb-4">
          {phases.map((phase) => {
            const c = colorMap[phase.color] ?? colorMap.slate;
            const isExpanded = expandedPhase === phase.id;
            return (
              <div
                key={phase.id}
                className={`flex-1 h-2 rounded-full cursor-pointer transition-all ${
                  isExpanded ? `${c.dot} ring-2 ring-offset-1 ring-${phase.color}-400` : `${c.dot} opacity-50 hover:opacity-80`
                }`}
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                title={phase.name}
              />
            );
          })}
        </div>

        {/* Phase cards */}
        <div className="space-y-2">
          {phases.map((phase, idx) => {
            const c = colorMap[phase.color] ?? colorMap.slate;
            const isExpanded = expandedPhase === phase.id;

            return (
              <motion.div
                key={phase.id}
                layout
                className={`rounded-lg border ${c.border} ${isExpanded ? c.lightBg : ""} overflow-hidden`}
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                >
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center ${c.text}`}>
                      {phase.icon}
                    </div>
                    {idx < phases.length - 1 && (
                      <div className={`w-0.5 h-2 ${c.dot} opacity-30 mt-0.5`} />
                    )}
                  </div>

                  {/* Phase info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{phase.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${riskBadge[phase.riskLevel]}`}>
                        {phase.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{phase.timeframe}</p>
                  </div>

                  {/* Expand toggle */}
                  <div className={c.text}>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3 pb-3 pt-0 border-t border-dashed"
                    style={{ borderColor: "inherit" }}
                  >
                    <p className="text-[11px] text-muted-foreground mb-2 mt-2">
                      {phase.description}
                    </p>

                    <div className="grid gap-3 md:grid-cols-2">
                      {/* Key Activities */}
                      <div>
                        <p className="text-[10px] font-semibold mb-1 flex items-center gap-1">
                          <FlaskConical className="h-3 w-3" /> Key Activities
                        </p>
                        <ul className="space-y-0.5">
                          {phase.keyActivities.map((a, i) => (
                            <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                              <div className={`h-1 w-1 rounded-full ${c.dot} mt-1.5 flex-shrink-0`} />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Safety Monitoring */}
                      <div>
                        <p className="text-[10px] font-semibold mb-1 flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Safety Monitoring
                        </p>
                        <ul className="space-y-0.5">
                          {phase.safetyMonitoring.map((s, i) => (
                            <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                              <div className={`h-1 w-1 rounded-full ${c.dot} mt-1.5 flex-shrink-0`} />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Risk Windows */}
                    {phase.riskWindows && phase.riskWindows.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed">
                        <p className="text-[10px] font-semibold mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Risk Windows
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {phase.riskWindows.map((rw, i) => (
                            <div
                              key={i}
                              className={`text-[10px] px-2 py-1 rounded border bg-${rw.color}-50 dark:bg-${rw.color}-950/20 border-${rw.color}-200 dark:border-${rw.color}-800`}
                            >
                              <span className="font-medium">{rw.event}:</span>{" "}
                              <span className="text-muted-foreground">{rw.peak}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Summary note */}
        <p className="text-[10px] text-muted-foreground italic mt-3 pt-2 border-t">
          Timeline adapted from published autoimmune CAR-T protocols (Mackensen 2022, Muller 2024) and
          ASTCT/FACT standards of care. Individual protocols may vary by institution and regulatory requirements.
        </p>
      </CardContent>
    </Card>
  );
}
