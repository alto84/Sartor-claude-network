"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
 Shield,
 Activity,
 Brain,
 FlaskConical,
 Database,
 FileText,
 BarChart3,
 Layers,
 ChevronRight,
 Microscope,
 Heart,
 AlertTriangle,
 TrendingDown,
 Network,
 Beaker,
 Pill,
 Syringe,
 ClipboardList,
 BookOpen,
 Target,
 Zap,
 FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdverseEventComparison } from "@/components/safety/adverse-event-comparison";
import { RiskWaterfall } from "@/components/safety/risk-waterfall";
import { SafetyRadar } from "@/components/safety/safety-radar";
import { BayesianPanel } from "@/components/safety/bayesian-panel";
import { ForestPlot } from "@/components/safety/forest-plot";
import { FAERSSignals } from "@/components/safety/faers-signals";
import { PatientJourney } from "@/components/safety/patient-journey";
import { ExecutiveBriefing } from "@/components/safety/executive-briefing";
import { EvidenceAccrual } from "@/components/safety/evidence-accrual";
import {
  adverseEventRates as canonicalAERates,
  mitigationStrategies as canonicalMitigations,
  clinicalTrials as canonicalTrials,
  dataSources as canonicalDataSources,
  getSLEBaselineRiskAssessment,
  getMitigationCorrelation,
  combineCorrelatedRR,
} from "@/lib/safety-data";

// ============================================================
// TYPES
// ============================================================

interface MitigationStrategy {
 id: string;
 name: string;
 mechanism: string;
 targetAE: string[];
 relativeRisk: number;
 ciLow: number;
 ciHigh: number;
 evidenceLevel: "Strong" | "Moderate" | "Limited" | "Theoretical";
 icon: React.ReactNode;
 correlatedWith?: { id: string; reason: string }[];
}

interface RiskEstimate {
 estimate: number;
 ciLow: number;
 ciHigh: number;
}

// ============================================================
// DATA - All numbers from pooled literature analysis
// ============================================================

// Adverse event data imported from canonical safety-data.ts
const adverseEventRates = canonicalAERates;

// UI augmentation map for mitigation strategies (icons, correlation warnings)
const mitigationUIData: Record<string, {
 icon: React.ReactNode;
 correlatedWith?: { id: string; reason: string }[];
}> = {
 tocilizumab: {
 icon: <Syringe className="h-4 w-4" />,
 correlatedWith: [
 { id: "corticosteroids", reason: "Both suppress cytokine pathways; combined RR may be non-multiplicative" },
 { id: "anakinra", reason: "Both target cytokine cascade (IL-6 and IL-1); overlapping mechanism" },
 ],
 },
 corticosteroids: {
 icon: <Pill className="h-4 w-4" />,
 correlatedWith: [
 { id: "tocilizumab", reason: "Both suppress cytokine pathways; combined RR may be non-multiplicative" },
 ],
 },
 anakinra: {
 icon: <Beaker className="h-4 w-4" />,
 correlatedWith: [
 { id: "tocilizumab", reason: "Both target cytokine cascade (IL-6 and IL-1); overlapping mechanism" },
 ],
 },
 "dose-reduction": {
 icon: <TrendingDown className="h-4 w-4" />,
 },
 "lymphodepletion-modification": {
 icon: <FlaskConical className="h-4 w-4" />,
 },
};

// Derive mitigation strategies from canonical data + UI augmentations
const mitigationStrategies: MitigationStrategy[] = canonicalMitigations.map(m => ({
 id: m.id,
 name: m.name,
 mechanism: m.mechanism,
 targetAE: m.targetAE,
 relativeRisk: m.relativeRisk,
 ciLow: m.confidenceInterval[0],
 ciHigh: m.confidenceInterval[1],
 evidenceLevel: m.evidenceLevel,
 icon: mitigationUIData[m.id]?.icon ?? <FlaskConical className="h-4 w-4" />,
 correlatedWith: mitigationUIData[m.id]?.correlatedWith,
}));

// Derive baseline risks from canonical data
const _canonicalBaseline = getSLEBaselineRiskAssessment();
const baselineRisks = {
 crsGrade3Plus: { estimate: _canonicalBaseline.baselineRisks.crsGrade3Plus.estimate, ciLow: _canonicalBaseline.baselineRisks.crsGrade3Plus.ci95[0], ciHigh: _canonicalBaseline.baselineRisks.crsGrade3Plus.ci95[1] },
 icansGrade3Plus: { estimate: _canonicalBaseline.baselineRisks.icansGrade3Plus.estimate, ciLow: _canonicalBaseline.baselineRisks.icansGrade3Plus.ci95[0], ciHigh: _canonicalBaseline.baselineRisks.icansGrade3Plus.ci95[1] },
 icahs: { estimate: _canonicalBaseline.baselineRisks.icahs.estimate, ciLow: _canonicalBaseline.baselineRisks.icahs.ci95[0], ciHigh: _canonicalBaseline.baselineRisks.icahs.ci95[1] },
 licats: { estimate: 77, ciLow: 61, ciHigh: 88 }, // Any-grade LICATS from Hagen 2025 (not in canonical baseline)
};

// Derive active clinical trials from canonical data (filter to recruiting/active)
const activeClinicalTrials = canonicalTrials
 .filter(t => t.status === "Recruiting" || t.status === "Active")
 .map(t => ({
 name: t.name,
 sponsor: t.sponsor,
 phase: t.phase,
 target: t.target,
 status: t.status as "Recruiting" | "Active",
 enrolled: t.enrollment,
 nctId: t.nctId,
 }));

// Icon map for data sources
const dataSourceIcons: Record<string, React.ReactNode> = {
 "Published Clinical Trial Literature": <BookOpen className="h-5 w-5" />,
 "FDA Adverse Event Reporting System (FAERS)": <Database className="h-5 w-5" />,
 "CIBMTR (Center for International Blood and Marrow Transplant Research)": <ClipboardList className="h-5 w-5" />,
 "EudraVigilance": <Database className="h-5 w-5" />,
 "Investigator-Sponsored Trial Databases": <Microscope className="h-5 w-5" />,
 "WHO VigiBase": <Database className="h-5 w-5" />,
 "TriNetX": <Network className="h-5 w-5" />,
 "Optum CDM": <Network className="h-5 w-5" />,
};

// Derive data sources from canonical data + icons
const dataSources = canonicalDataSources.map(ds => ({
 name: ds.name,
 type: ds.type,
 coverage: ds.coverage.length > 80 ? ds.coverage.slice(0, 77) + "..." : ds.coverage,
 hasAutoimmune: ds.autoimmuneCARTData,
 icon: dataSourceIcons[ds.name] ?? <Database className="h-5 w-5" />,
}));

// ============================================================
// RISK CALCULATION ENGINE
// ============================================================

// Box-Muller transform for standard normal
function normalSample(): number {
 const u1 = Math.random();
 const u2 = Math.random();
 return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Approximate Beta sample using normal approximation
function betaSample(a: number, b: number): number {
 const mean = a / (a + b);
 const variance = (a * b) / ((a + b) ** 2 * (a + b + 1));
 const sd = Math.sqrt(variance);
 const sample = mean + sd * normalSample();
 return Math.max(0.0001, Math.min(0.9999, sample));
}

function median(arr: number[]): number {
 const mid = Math.floor(arr.length / 2);
 return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function calculateMitigatedRisk(
 baseline: RiskEstimate,
 selectedMitigations: string[],
 targetAE: string
): RiskEstimate {
 // Monte Carlo simulation with correlated mitigation correction (risk-model v2.0)
 const N = 10000;
 const samples: number[] = [];

 // Convert baseline percentage to proportion
 const baseEst = baseline.estimate / 100;

 // Estimate Beta parameters from baseline (method of moments)
 const alpha = Math.max(0.5, baseEst * 20);
 const beta = Math.max(0.5, (1 - baseEst) * 20);

 // Identify mitigations targeting this AE
 const relevantMitigations = selectedMitigations
   .map(mid => mitigationStrategies.find(s => s.id === mid))
   .filter((m): m is MitigationStrategy => m != null && m.targetAE.includes(targetAE));

 for (let i = 0; i < N; i++) {
 // Sample baseline from Beta distribution
 const baseSample = betaSample(alpha, beta);

 // Sample individual RRs from LogNormal for each mitigation
 const sampledItems = relevantMitigations.map(m => {
   const logMean = Math.log(m.relativeRisk);
   const logSE = (Math.log(m.ciHigh) - Math.log(m.ciLow)) / (2 * 1.96);
   return { id: m.id, rr: Math.exp(logMean + logSE * normalSample()) };
 });

 // Combine sampled RRs using correlated combination (greedy pairwise)
 let combinedRR = 1;
 if (sampledItems.length === 1) {
   combinedRR = sampledItems[0].rr;
 } else if (sampledItems.length > 1) {
   const items = [...sampledItems];
   while (items.length > 1) {
     let bestI = 0, bestJ = 1;
     let bestCorr = getMitigationCorrelation(items[0].id, items[1].id);
     for (let a = 0; a < items.length; a++) {
       for (let b = a + 1; b < items.length; b++) {
         const corr = getMitigationCorrelation(items[a].id, items[b].id);
         if (corr > bestCorr) { bestCorr = corr; bestI = a; bestJ = b; }
       }
     }
     const combined = combineCorrelatedRR(items[bestI].rr, items[bestJ].rr, bestCorr);
     const combinedId = `${items[bestI].id}+${items[bestJ].id}`;
     items.splice(bestJ, 1);
     items.splice(bestI, 1);
     items.push({ id: combinedId, rr: combined });
   }
   combinedRR = items[0].rr;
 }

 samples.push(baseSample * combinedRR * 100);
 }

 // Sort and extract percentiles
 samples.sort((a, b) => a - b);
 return {
 estimate: Math.max(0, median(samples)),
 ciLow: Math.max(0, samples[Math.floor(N * 0.025)]),
 ciHigh: Math.min(100, samples[Math.floor(N * 0.975)]),
 };
}

// ============================================================
// COMPONENTS
// ============================================================

function RiskGauge({
 label,
 risk,
 oncologyBenchmark,
 color,
}: {
 label: string;
 risk: RiskEstimate;
 oncologyBenchmark?: number;
 color: string;
}) {
 const colorOverrides: Record<string, string> = {
 blue: "bg-blue-500",
 emerald: "bg-emerald-500",
 amber: "bg-amber-500",
 };
 const getColor = (val: number) => {
 if (color && colorOverrides[color]) return colorOverrides[color];
 if (val < 2) return "bg-emerald-500";
 if (val < 5) return "bg-yellow-500";
 if (val < 10) return "bg-orange-500";
 return "bg-red-500";
 };

 return (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium text-foreground">{label}</span>
 <motion.span
 key={risk.estimate.toFixed(1)}
 initial={{ scale: 1.3, color: "#10b981" }}
 animate={{ scale: 1, color: "inherit" }}
 className="text-lg font-bold"
 >
 {risk.estimate.toFixed(1)}%
 </motion.span>
 </div>
 <div className="relative h-3 bg-muted rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${Math.min(risk.estimate * 2, 100)}%` }}
 transition={{ duration: 0.8, ease: "easeOut" }}
 className={`h-full rounded-full ${getColor(risk.estimate)}`}
 />
 {oncologyBenchmark && (
 <div
 className="absolute top-0 h-full w-0.5 bg-red-400/70"
 style={{ left: `${Math.min(oncologyBenchmark * 2, 100)}%` }}
 title={`Oncology benchmark: ${oncologyBenchmark}%`}
 />
 )}
 </div>
 <div className="flex justify-between text-xs text-muted-foreground">
 <span>95% CI: [{risk.ciLow.toFixed(1)}, {risk.ciHigh.toFixed(1)}]%</span>
 {oncologyBenchmark && (
 <span className="text-red-400">Oncology avg: {oncologyBenchmark}%</span>
 )}
 </div>
 </div>
 );
}

function ComparisonBar({
 label,
 sleRate,
 oncRates,
}: {
 label: string;
 sleRate: number;
 oncRates: { name: string; rate: number; color: string }[];
}) {
 const maxRate = Math.max(sleRate, ...oncRates.map((r) => r.rate));
 const scale = 100 / Math.max(maxRate * 1.2, 1);

 return (
 <div className="space-y-1.5">
 <span className="text-xs font-medium text-muted-foreground">{label}</span>
 {/* SLE bar */}
 <div className="flex items-center gap-2">
 <span className="text-xs w-16 text-right font-medium text-emerald-600">SLE</span>
 <div className="flex-1 h-5 bg-muted rounded relative">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${sleRate * scale}%` }}
 transition={{ duration: 0.6, delay: 0.1 }}
 className="h-full bg-emerald-500 rounded flex items-center justify-end pr-1"
 >
 <span className="text-[10px] font-bold text-white">{sleRate}%</span>
 </motion.div>
 </div>
 </div>
 {/* Oncology bars */}
 {oncRates.map((r, i) => (
 <div key={r.name} className="flex items-center gap-2">
 <span className="text-xs w-16 text-right text-muted-foreground">{r.name}</span>
 <div className="flex-1 h-5 bg-muted rounded relative">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${r.rate * scale}%` }}
 transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
 className={`h-full rounded flex items-center justify-end pr-1 ${r.color}`}
 >
 <span className="text-[10px] font-bold text-white">{r.rate}%</span>
 </motion.div>
 </div>
 </div>
 ))}
 </div>
 );
}

function EvidenceBadge({ level }: { level: string }) {
 const styles: Record<string, string> = {
 Strong: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
 Moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
 Limited: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
 Theoretical: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
 };
 return (
 <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${styles[level] || styles.Theoretical}`}>
 {level}
 </span>
 );
}

// ============================================================
// MAIN PAGE
// ============================================================

type TabId = "overview" | "comparison" | "mitigations" | "trials" | "sources" | "decisions";
const VALID_TABS: TabId[] = ["overview", "comparison", "mitigations", "trials", "sources", "decisions"];

export default function SafetyDashboardPage() {
 return (
 <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading safety data...</div>}>
 <SafetyDashboardContent />
 </Suspense>
 );
}

function SafetyDashboardContent() {
 const searchParams = useSearchParams();
 const router = useRouter();
 const tabParam = searchParams.get("tab");
 const initialTab: TabId = VALID_TABS.includes(tabParam as TabId) ? (tabParam as TabId) : "overview";

 const [selectedMitigations, setSelectedMitigations] = useState<string[]>(["dose-reduction"]);
 const [activeTab, setActiveTab] = useState<TabId>(initialTab);
 const [expandedDecision, setExpandedDecision] = useState<string | null>(null);
 const [briefingOpen, setBriefingOpen] = useState(false);

 const handleTabChange = (tab: TabId) => {
 setActiveTab(tab);
 const params = new URLSearchParams(searchParams.toString());
 if (tab === "overview") {
 params.delete("tab");
 } else {
 params.set("tab", tab);
 }
 router.replace(`/safety${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
 };

 const toggleMitigation = (id: string) => {
 setSelectedMitigations((prev) =>
 prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
 );
 };

 const mitigatedCRS = calculateMitigatedRisk(baselineRisks.crsGrade3Plus, selectedMitigations, "CRS");
 const mitigatedICANS = calculateMitigatedRisk(baselineRisks.icansGrade3Plus, selectedMitigations, "ICANS");

 // Detect correlated mitigations that are co-selected and report corrections
 const correlationWarnings: string[] = [];
 const seenPairs = new Set<string>();
 for (const mid of selectedMitigations) {
 const m = mitigationStrategies.find((s) => s.id === mid);
 if (m?.correlatedWith) {
 for (const corr of m.correlatedWith) {
 if (selectedMitigations.includes(corr.id)) {
 const pairKey = [mid, corr.id].sort().join("|");
 if (!seenPairs.has(pairKey)) {
 seenPairs.add(pairKey);
 const otherName = mitigationStrategies.find((s) => s.id === corr.id)?.name ?? corr.id;
 const rho = getMitigationCorrelation(mid, corr.id);
 correlationWarnings.push(
 `${m.name} + ${otherName} (\u03C1=${rho.toFixed(1)}): Correlated mechanism correction applied`
 );
 }
 }
 }
 }
 }

 const tabs = [
 { id: "overview" as const, label: "Risk Overview", icon: <Shield className="h-4 w-4" /> },
 { id: "comparison" as const, label: "SLE vs Oncology", icon: <BarChart3 className="h-4 w-4" /> },
 { id: "mitigations" as const, label: "Mitigations", icon: <Target className="h-4 w-4" /> },
 { id: "trials" as const, label: "Active Trials", icon: <Microscope className="h-4 w-4" /> },
 { id: "sources" as const, label: "Data Sources", icon: <Database className="h-4 w-4" /> },
 { id: "decisions" as const, label: "CSP Guidance", icon: <FileText className="h-4 w-4" /> },
 ];

 return (
 <div className="space-y-6">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex flex-col gap-2"
 >
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
 <Shield className="h-6 w-6" />
 </div>
 <div className="flex-1">
 <h1 className="text-2xl font-bold tracking-tight">
 Predictive Safety Platform
 </h1>
 <p className="text-sm text-muted-foreground">
 CAR-T Cell Therapy in SLE -- BCMA/CD19 Safety Intelligence
 </p>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setBriefingOpen(true)}
 className="text-xs gap-1.5 h-8"
 >
 <FileDown className="h-3.5 w-3.5" />
 Export Briefing
 </Button>
 </div>
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
 Evidence Base: 47 SLE patients, 7 studies
 </span>
 <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
 {activeClinicalTrials.length} Active Trials
 </span>
 <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium">
 Last Updated: Feb 2026
 </span>
 </div>
 </motion.div>

 {/* Tab Navigation */}
 <div className="flex gap-1 overflow-x-auto pb-1">
 {tabs.map((tab) => (
 <Button
 key={tab.id}
 variant={activeTab === tab.id ? "default" : "ghost"}
 size="sm"
 onClick={() => handleTabChange(tab.id)}
 className={`flex items-center gap-1.5 whitespace-nowrap text-xs ${
 activeTab === tab.id
 ? "bg-emerald-600 hover:bg-emerald-700 text-white"
 : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
 }`}
 >
 {tab.icon}
 {tab.label}
 </Button>
 ))}
 </div>

 {/* Tab Content */}
 <AnimatePresence mode="wait">
 {/* ========== OVERVIEW TAB ========== */}
 {activeTab === "overview" && (
 <motion.div
 key="overview"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="grid gap-4 md:grid-cols-2"
 >
 {/* Executive Summary Card */}
 <Card className="md:col-span-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
 <CardContent className="pt-4 pb-4">
 <div className="flex items-start gap-3">
 <Zap className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
 <div className="flex-1">
 <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
 Key Finding: CAR-T in SLE has a dramatically better safety profile than in oncology
 </p>
 <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
 Grade 3+ CRS: ~2% in SLE vs 4-48% in oncology. Grade 3+ ICANS: &lt;2% vs 4-28%.
 Zero IEC-HS events and zero treatment-related deaths in any SLE CAR-T study.
 Primary drivers: lower CAR-T dose (1x10^6/kg) and absence of high antigen burden.
 </p>
 {/* Quick metrics row */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
 <div className="text-center">
 <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">47</p>
 <p className="text-[10px] text-emerald-600 dark:text-emerald-400">SLE patients pooled</p>
 </div>
 <div className="text-center">
 <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">0</p>
 <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Treatment deaths</p>
 </div>
 <div className="text-center">
 <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">7</p>
 <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Published studies</p>
 </div>
 <div className="text-center">
 <p className="text-xl font-bold text-amber-600 dark:text-amber-400">Low</p>
 <p className="text-[10px] text-muted-foreground">Evidence certainty</p>
 </div>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Safety Radar Chart */}
 <SafetyRadar className="md:col-span-2" />

 {/* Bayesian Risk Model (gpuserver1) */}
 <BayesianPanel className="md:col-span-2" />

 {/* Evidence Accrual Curve */}
 <EvidenceAccrual className="md:col-span-2" />

 {/* Baseline Risk */}
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <Activity className="h-4 w-4 text-emerald-600" />
 Baseline Risk (SLE, Standard Protocol)
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <RiskGauge
 label="Grade 3+ CRS"
 risk={baselineRisks.crsGrade3Plus}
 oncologyBenchmark={14}
 color="emerald"
 />
 <p className="text-[10px] text-muted-foreground mt-1 italic">
 Evidence: Low-Moderate (pooled observational, n=47, no RCTs)
 </p>
 </div>
 <div>
 <RiskGauge
 label="Grade 3+ ICANS"
 risk={baselineRisks.icansGrade3Plus}
 oncologyBenchmark={12}
 color="emerald"
 />
 <p className="text-[10px] text-muted-foreground mt-1 italic">
 Evidence: Low-Moderate (pooled observational, n=47, no RCTs)
 </p>
 </div>
 <div>
 <RiskGauge
 label="Any ICAHS (IEC-HS)"
 risk={baselineRisks.icahs}
 oncologyBenchmark={20}
 color="emerald"
 />
 <p className="text-[10px] text-muted-foreground mt-1 italic">
 Evidence: Very Low (zero events observed; upper bound from rule-of-3)
 </p>
 </div>
 <div className="pt-2 border-t">
 <RiskGauge
 label="LICATS (autoimmune-specific)"
 risk={baselineRisks.licats}
 color="blue"
 />
 <p className="text-[10px] text-muted-foreground mt-1">
 LICATS is a novel, mild, self-resolving local toxicity unique to autoimmune CAR-T (Hagen 2025)
 </p>
 <p className="text-[10px] text-muted-foreground mt-0.5 italic">
 Evidence: Low (single-center case series, novel endpoint)
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Mitigated Risk Preview */}
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <Shield className="h-4 w-4 text-blue-600" />
 Mitigated Risk (with selected strategies)
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <RiskGauge label="Grade 3+ CRS (mitigated)" risk={mitigatedCRS} color="blue" />
 <RiskGauge label="Grade 3+ ICANS (mitigated)" risk={mitigatedICANS} color="blue" />

 {correlationWarnings.length > 0 && (
 <div className="rounded-md border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 p-2">
 <div className="flex items-start gap-1.5">
 <Network className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
 <p className="text-[10px] text-blue-700 dark:text-blue-400">
 Correlated mitigation correction applied (risk-model v2.0). Shared-mechanism pairs yield less benefit than independent mitigations.
 </p>
 </div>
 </div>
 )}

 <div className="pt-3 border-t space-y-2">
 <p className="text-xs font-medium text-muted-foreground">Active Mitigations:</p>
 <div className="flex flex-wrap gap-1">
 {selectedMitigations.map((id) => {
 const m = mitigationStrategies.find((s) => s.id === id);
 return m ? (
 <span
 key={id}
 className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
 >
 {m.name}
 </span>
 ) : null;
 })}
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleTabChange("mitigations")}
 className="text-xs w-full mt-2"
 >
 Configure Mitigations <ChevronRight className="h-3 w-3 ml-1" />
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* Emerging Safety Signals */}
 <Card className="md:col-span-2">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <AlertTriangle className="h-4 w-4 text-amber-600" />
 Emerging Safety Signals
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid gap-3 md:grid-cols-3">
 {/* Cytopenias */}
 <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
 <div className="flex items-center gap-2 mb-2">
 <Activity className="h-4 w-4 text-amber-600" />
 <span className="text-xs font-semibold">Prolonged Cytopenias</span>
 </div>
 <div className="space-y-1 text-[10px]">
 <p className="text-muted-foreground">
 B-cell aplasia is expected and therapeutic. Prolonged neutropenia/thrombocytopenia observed in ~30% of oncology patients beyond day 28.
 </p>
 <div className="flex items-center gap-1 mt-1.5">
 <span className="font-medium text-amber-700 dark:text-amber-400">SLE data:</span>
 <span className="text-muted-foreground">Recoverable cytopenias in most patients; no prolonged Grade 4 reported</span>
 </div>
 <div className="flex items-center gap-1">
 <span className="font-medium text-amber-700 dark:text-amber-400">Monitoring:</span>
 <span className="text-muted-foreground">CBC 2x/week x4 weeks, then weekly until recovery</span>
 </div>
 <p className="text-muted-foreground italic mt-1">Evidence: Low (limited reporting in autoimmune trials)</p>
 </div>
 </div>
 {/* Infections */}
 <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
 <div className="flex items-center gap-2 mb-2">
 <Shield className="h-4 w-4 text-amber-600" />
 <span className="text-xs font-semibold">Infections (B-cell Aplasia)</span>
 </div>
 <div className="space-y-1 text-[10px]">
 <p className="text-muted-foreground">
 B-cell depletion causes hypogammaglobulinemia (IgG &lt;400 mg/dL in ~40-60% by month 3). Risk of bacterial/viral infections during aplasia window.
 </p>
 <div className="flex items-center gap-1 mt-1.5">
 <span className="font-medium text-amber-700 dark:text-amber-400">SLE data:</span>
 <span className="text-muted-foreground">Grade 3+ infections in ~10-15%; one COVID-19 death reported (not treatment-related)</span>
 </div>
 <div className="flex items-center gap-1">
 <span className="font-medium text-amber-700 dark:text-amber-400">Mitigation:</span>
 <span className="text-muted-foreground">IVIG replacement when IgG &lt;400; prophylactic antivirals/antifungals</span>
 </div>
 <p className="text-muted-foreground italic mt-1">Evidence: Moderate (consistent across multiple centers)</p>
 </div>
 </div>
 {/* T-cell malignancy */}
 <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-3">
 <div className="flex items-center gap-2 mb-2">
 <AlertTriangle className="h-4 w-4 text-red-600" />
 <span className="text-xs font-semibold">T-cell Malignancy</span>
 </div>
 <div className="space-y-1 text-[10px]">
 <p className="text-muted-foreground">
 FDA boxed warning added Jan 2024 after 33 cases of T-cell lymphoma/leukemia in ~34,000 treated patients (~0.1% incidence). All in oncology.
 </p>
 <div className="flex items-center gap-1 mt-1.5">
 <span className="font-medium text-red-700 dark:text-red-400">SLE data:</span>
 <span className="text-muted-foreground">Zero cases in 47 patients (limited follow-up, median ~18 months)</span>
 </div>
 <div className="flex items-center gap-1">
 <span className="font-medium text-red-700 dark:text-red-400">Requirement:</span>
 <span className="text-muted-foreground">15-year follow-up mandatory; annual cancer screening</span>
 </div>
 <p className="text-muted-foreground italic mt-1">Evidence: Very Low (theoretical risk; insufficient follow-up in autoimmune)</p>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* PSP Engine Architecture */}
 <Card className="md:col-span-2">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <Layers className="h-4 w-4 text-purple-600" />
 PSP Engine Architecture
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-3 gap-3">
 {[
 {
 layer: "Layer 1: Data & Evidence",
 desc: "Graph-networked knowledge base linking trials, publications, safety findings, and risk estimates with full provenance",
 items: ["47 SLE patients pooled", "31 citations from anchor paper", "8 data sources mapped"],
 color: "emerald",
 icon: <Database className="h-4 w-4" />,
 },
 {
 layer: "Layer 2: Scientific Reasoning",
 desc: "Mechanism-aware hypothesis generation: CAR-T activation -> macrophage cascade -> IL-6/TNF-a -> endothelial disruption",
 items: ["CRS/ICANS pathophysiology modeled", "5 mitigation strategies quantified", "Bayesian risk updating"],
 color: "blue",
 icon: <Brain className="h-4 w-4" />,
 },
 {
 layer: "Layer 3: Operational Integration",
 desc: "Interpretable outputs for CSP writers, DSMBs, and clinical teams -- predictions tied to MOA with rationale + uncertainty",
 items: ["Decision support panels", "Real-time risk gauges", "Regulatory-ready outputs"],
 color: "purple",
 icon: <FileText className="h-4 w-4" />,
 },
 ].map((l) => {
 const colorMap: Record<string, { border: string; bg: string; text: string; dot: string }> = {
 emerald: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", text: "text-emerald-600", dot: "bg-emerald-500" },
 blue: { border: "border-blue-200 dark:border-blue-800", bg: "bg-blue-50/50 dark:bg-blue-950/20", text: "text-blue-600", dot: "bg-blue-500" },
 purple: { border: "border-purple-200 dark:border-purple-800", bg: "bg-purple-50/50 dark:bg-purple-950/20", text: "text-purple-600", dot: "bg-purple-500" },
 };
 const c = colorMap[l.color] ?? colorMap.blue;
 return (
 <div
 key={l.layer}
 className={`rounded-lg p-3 border ${c.border} ${c.bg}`}
 >
 <div className="flex items-center gap-2 mb-2">
 <div className={c.text}>{l.icon}</div>
 <span className="text-xs font-semibold">{l.layer}</span>
 </div>
 <p className="text-[10px] text-muted-foreground mb-2">{l.desc}</p>
 <ul className="space-y-1">
 {l.items.map((item) => (
 <li key={item} className="text-[10px] flex items-center gap-1">
 <div className={`h-1 w-1 rounded-full ${c.dot}`} />
 {item}
 </li>
 ))}
 </ul>
 </div>
 );
 })}
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )}

 {/* ========== COMPARISON TAB ========== */}
 {activeTab === "comparison" && (
 <motion.div
 key="comparison"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-4"
 >
 {/* Interactive Recharts Comparison */}
 <AdverseEventComparison />

 {/* Forest Plot - Classic meta-analysis visualization */}
 <ForestPlot />

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <BarChart3 className="h-4 w-4 text-emerald-600" />
 Grade 3+ CRS: SLE vs Oncology
 </CardTitle>
 </CardHeader>
 <CardContent>
 <ComparisonBar
 label="Grade 3+ Cytokine Release Syndrome"
 sleRate={2.1}
 oncRates={[
 { name: "DLBCL", rate: 13, color: "bg-amber-500" },
 { name: "ALL", rate: 48, color: "bg-red-500" },
 { name: "MM", rate: 5.5, color: "bg-purple-500" },
 ]}
 />
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <Brain className="h-4 w-4 text-blue-600" />
 Grade 3+ ICANS: SLE vs Oncology
 </CardTitle>
 </CardHeader>
 <CardContent>
 <ComparisonBar
 label="Grade 3+ Neurotoxicity (ICANS)"
 sleRate={1.5}
 oncRates={[
 { name: "DLBCL", rate: 17, color: "bg-amber-500" },
 { name: "ALL", rate: 13, color: "bg-red-500" },
 { name: "MM", rate: 7, color: "bg-purple-500" },
 ]}
 />
 </CardContent>
 </Card>

 {/* Individual Trial Table */}
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <Microscope className="h-4 w-4 text-teal-600" />
 Individual SLE Trial Safety Data
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="border-b text-left text-muted-foreground">
 <th className="pb-2 pr-4">Trial</th>
 <th className="pb-2 pr-4">N</th>
 <th className="pb-2 pr-4">CRS Any</th>
 <th className="pb-2 pr-4">CRS 3+</th>
 <th className="pb-2 pr-4">ICANS Any</th>
 <th className="pb-2 pr-4">ICANS 3+</th>
 <th className="pb-2">Source / Provenance</th>
 </tr>
 </thead>
 <tbody>
 {adverseEventRates
 .filter((r) => r.indication === "SLE")
 .map((r) => (
 <tr key={r.trial} className="border-b border-dashed">
 <td className="py-2 pr-4 font-medium">{r.product}</td>
 <td className="py-2 pr-4">{r.nPatients}</td>
 <td className="py-2 pr-4">{r.crsAnyGrade}%</td>
 <td className="py-2 pr-4">
 <span className={r.crsGrade3Plus === 0 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
 {r.crsGrade3Plus}%
 </span>
 </td>
 <td className="py-2 pr-4">{r.icansAnyGrade}%</td>
 <td className="py-2 pr-4">
 <span className={r.icansGrade3Plus === 0 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
 {r.icansGrade3Plus}%
 </span>
 </td>
 <td className="py-2 text-muted-foreground">
 <div>{r.source}</div>
 {r.sourceTable && (
 <span className="text-[9px] text-blue-600 dark:text-blue-400">{r.sourceTable}</span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )}

 {/* ========== MITIGATIONS TAB ========== */}
 {activeTab === "mitigations" && (
 <motion.div
 key="mitigations"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-4"
 >
 {/* Correlated Mitigation Correction Banner */}
 {correlationWarnings.length > 0 && (
 <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 p-3">
 <div className="flex items-start gap-2">
 <Network className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
 <div>
 <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
 Correlated Mitigation Correction Active
 </p>
 <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">
 Mitigations with shared mechanisms have diminishing marginal benefit. The risk model corrects for pairwise correlations: RR_combined = (RR_i {"\u00D7"} RR_j)^(1-{"\u03C1"}) {"\u00D7"} min(RR)^{"\u03C1"}, where {"\u03C1"} is mechanistic correlation (0=independent, 1=redundant).
 </p>
 <ul className="mt-1 space-y-0.5">
 {correlationWarnings.map((w, i) => (
 <li key={i} className="text-[10px] text-blue-700 dark:text-blue-400 flex items-start gap-1">
 <span className="mt-1 h-1 w-1 rounded-full bg-blue-500 flex-shrink-0" />
 {w}
 </li>
 ))}
 </ul>
 </div>
 </div>
 </div>
 )}

 <div className="grid gap-4 md:grid-cols-2">
 {/* Mitigation Selection */}
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <Target className="h-4 w-4 text-blue-600" />
 Select Mitigation Strategies
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 {mitigationStrategies.map((m) => (
 <motion.div
 key={m.id}
 whileHover={{ scale: 1.01 }}
 whileTap={{ scale: 0.99 }}
 onClick={() => toggleMitigation(m.id)}
 className={`p-3 rounded-lg border cursor-pointer transition-all ${
 selectedMitigations.includes(m.id)
 ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700"
 : "border-muted hover:border-blue-200 dark:hover:border-blue-800"
 }`}
 >
 <div className="flex items-center gap-2">
 <div
 className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-all ${
 selectedMitigations.includes(m.id)
 ? "bg-blue-600 border-blue-600"
 : "border-muted-foreground/30"
 }`}
 >
 {selectedMitigations.includes(m.id) && (
 <svg className="h-3 w-3 text-white" viewBox="0 0 12 12">
 <path d="M10 3L4.5 8.5L2 6" fill="none" stroke="currentColor" strokeWidth="2" />
 </svg>
 )}
 </div>
 <span className="text-xs font-medium flex-1">{m.name}</span>
 {m.icon}
 <EvidenceBadge level={m.evidenceLevel} />
 </div>
 <p className="text-[10px] text-muted-foreground mt-1 ml-6">{m.mechanism}</p>
 <div className="flex gap-1 mt-1 ml-6">
 {m.targetAE.map((ae) => (
 <span key={ae} className="text-[9px] px-1.5 py-0.5 rounded bg-muted">
 {ae}
 </span>
 ))}
 <span className="text-[9px] text-muted-foreground ml-1">
 RR: {m.relativeRisk.toFixed(2)} [{m.ciLow.toFixed(2)}-{m.ciHigh.toFixed(2)}]
 </span>
 </div>
 </motion.div>
 ))}
 </CardContent>
 </Card>

 {/* Impact Visualization */}
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <TrendingDown className="h-4 w-4 text-emerald-600" />
 Projected Risk Reduction
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="space-y-4">
 <div>
 <p className="text-xs font-medium mb-2">Grade 3+ CRS</p>
 <div className="flex items-center gap-3">
 <div className="text-center">
 <p className="text-lg font-bold text-muted-foreground">{baselineRisks.crsGrade3Plus.estimate.toFixed(1)}%</p>
 <p className="text-[10px] text-muted-foreground">Baseline</p>
 </div>
 <ChevronRight className="h-4 w-4 text-muted-foreground" />
 <div className="text-center">
 <motion.p
 key={mitigatedCRS.estimate.toFixed(2)}
 initial={{ scale: 1.2 }}
 animate={{ scale: 1 }}
 className="text-lg font-bold text-emerald-600"
 >
 {mitigatedCRS.estimate.toFixed(2)}%
 </motion.p>
 <p className="text-[10px] text-emerald-600">Mitigated</p>
 </div>
 <div className="ml-auto text-right">
 <p className="text-sm font-bold text-emerald-600">
 {baselineRisks.crsGrade3Plus.estimate > 0
 ? `-${(((baselineRisks.crsGrade3Plus.estimate - mitigatedCRS.estimate) / baselineRisks.crsGrade3Plus.estimate) * 100).toFixed(0)}%`
 : "N/A"}
 </p>
 <p className="text-[10px] text-muted-foreground">Reduction</p>
 </div>
 </div>
 </div>

 <div>
 <p className="text-xs font-medium mb-2">Grade 3+ ICANS</p>
 <div className="flex items-center gap-3">
 <div className="text-center">
 <p className="text-lg font-bold text-muted-foreground">{baselineRisks.icansGrade3Plus.estimate.toFixed(1)}%</p>
 <p className="text-[10px] text-muted-foreground">Baseline</p>
 </div>
 <ChevronRight className="h-4 w-4 text-muted-foreground" />
 <div className="text-center">
 <motion.p
 key={mitigatedICANS.estimate.toFixed(2)}
 initial={{ scale: 1.2 }}
 animate={{ scale: 1 }}
 className="text-lg font-bold text-blue-600"
 >
 {mitigatedICANS.estimate.toFixed(2)}%
 </motion.p>
 <p className="text-[10px] text-blue-600">Mitigated</p>
 </div>
 <div className="ml-auto text-right">
 <p className="text-sm font-bold text-blue-600">
 {baselineRisks.icansGrade3Plus.estimate > 0
 ? `-${(((baselineRisks.icansGrade3Plus.estimate - mitigatedICANS.estimate) / baselineRisks.icansGrade3Plus.estimate) * 100).toFixed(0)}%`
 : "N/A"}
 </p>
 <p className="text-[10px] text-muted-foreground">Reduction</p>
 </div>
 </div>
 </div>
 </div>

 <div className="pt-3 border-t">
 <p className="text-[10px] text-muted-foreground">
 <AlertTriangle className="h-3 w-3 inline mr-1" />
 Risk reduction estimates are derived from published relative risk data in oncology CAR-T trials and
 extrapolated to the autoimmune setting. Wide confidence intervals reflect small sample sizes (n=47 pooled SLE).
 Prospective validation in Phase 2/3 trials is needed.
 </p>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Risk Waterfall Charts */}
 <div className="grid gap-4 md:grid-cols-2">
 <RiskWaterfall
 title="CRS Risk Waterfall"
 baselineRate={baselineRisks.crsGrade3Plus.estimate}
 mitigations={selectedMitigations
 .map((id) => mitigationStrategies.find((m) => m.id === id))
 .filter((m): m is typeof mitigationStrategies[number] => !!m && m.targetAE.includes("CRS"))
 .map((m) => ({ name: m.name, relativeRisk: m.relativeRisk }))}
 />
 <RiskWaterfall
 title="ICANS Risk Waterfall"
 baselineRate={baselineRisks.icansGrade3Plus.estimate}
 mitigations={selectedMitigations
 .map((id) => mitigationStrategies.find((m) => m.id === id))
 .filter((m): m is typeof mitigationStrategies[number] => !!m && m.targetAE.includes("ICANS"))
 .map((m) => ({ name: m.name, relativeRisk: m.relativeRisk }))}
 />
 </div>

 {/* Correlation Sensitivity Analysis */}
 {correlationWarnings.length > 0 && (() => {
   // Compute mitigated rate across a range of rho multipliers
   const rhoScales = [0, 0.5, 1.0, 1.5, 2.0];
   const rhoLabels = ["Independent", "Half", "Estimated", "1.5\u00D7", "Double"];
   const crsMits = mitigationStrategies.filter(m => selectedMitigations.includes(m.id) && m.targetAE.includes("CRS"));
   const icansMits = mitigationStrategies.filter(m => selectedMitigations.includes(m.id) && m.targetAE.includes("ICANS"));

   function computeScaledRR(mits: typeof crsMits, scale: number): number {
     if (mits.length <= 1) return mits.length === 1 ? mits[0].relativeRisk : 1;
     const items = mits.map(m => ({ id: m.id, rr: m.relativeRisk }));
     while (items.length > 1) {
       let bi = 0, bj = 1;
       let bc = getMitigationCorrelation(items[0].id, items[1].id) * scale;
       for (let a = 0; a < items.length; a++) {
         for (let b = a + 1; b < items.length; b++) {
           const c = getMitigationCorrelation(items[a].id, items[b].id) * scale;
           if (c > bc) { bc = c; bi = a; bj = b; }
         }
       }
       const rho = Math.min(bc, 0.99);
       const combined = combineCorrelatedRR(items[bi].rr, items[bj].rr, rho);
       items.splice(bj, 1);
       items.splice(bi, 1);
       items.push({ id: items.length.toString(), rr: combined });
     }
     return items[0].rr;
   }

   const crsRates = rhoScales.map(s => baselineRisks.crsGrade3Plus.estimate * computeScaledRR(crsMits, s));
   const icansRates = rhoScales.map(s => baselineRisks.icansGrade3Plus.estimate * computeScaledRR(icansMits, s));
   const estimatedIdx = 2;

   return (
     <Card>
       <CardHeader className="pb-2">
         <CardTitle className="text-sm font-semibold flex items-center gap-2">
           <Layers className="h-4 w-4 text-purple-600" />
           Correlation Sensitivity Analysis
         </CardTitle>
       </CardHeader>
       <CardContent>
         <p className="text-[10px] text-muted-foreground mb-3">
           How do mitigated risk estimates change if the true mechanistic correlation between mitigations is higher or lower than estimated?
           A CMO should consider the range of plausible outcomes across different correlation assumptions.
         </p>
         <div className="overflow-x-auto">
           <table className="w-full text-xs">
             <thead>
               <tr className="border-b text-left text-muted-foreground">
                 <th className="pb-2 pr-3">{"\u03C1"} Assumption</th>
                 <th className="pb-2 pr-3 text-right">CRS Grade 3+</th>
                 <th className="pb-2 text-right">ICANS Grade 3+</th>
               </tr>
             </thead>
             <tbody>
               {rhoScales.map((s, i) => (
                 <tr
                   key={s}
                   className={`border-b border-dashed ${i === estimatedIdx ? "bg-blue-50/50 dark:bg-blue-950/20 font-semibold" : ""}`}
                 >
                   <td className="py-1.5 pr-3">
                     <span className="font-mono text-[10px]">{rhoLabels[i]}</span>
                     <span className="text-[9px] text-muted-foreground ml-1">
                       ({s === 0 ? "\u03C1=0" : s === 1 ? "\u03C1 est." : `\u03C1\u00D7${s}`})
                     </span>
                     {i === estimatedIdx && (
                       <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                         current
                       </span>
                     )}
                   </td>
                   <td className={`py-1.5 pr-3 text-right font-mono text-[10px] ${i === estimatedIdx ? "text-emerald-600" : ""}`}>
                     {crsRates[i].toFixed(3)}%
                   </td>
                   <td className={`py-1.5 text-right font-mono text-[10px] ${i === estimatedIdx ? "text-blue-600" : ""}`}>
                     {icansRates[i].toFixed(3)}%
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
         <div className="mt-3 flex gap-4">
           <div className="flex-1">
             <p className="text-[9px] text-muted-foreground font-medium mb-1">CRS Range</p>
             <div className="h-2 rounded-full bg-muted relative overflow-hidden">
               <div
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-300 to-emerald-600 rounded-full"
                 style={{
                   left: `${(Math.min(...crsRates) / baselineRisks.crsGrade3Plus.estimate) * 100}%`,
                   width: `${((Math.max(...crsRates) - Math.min(...crsRates)) / baselineRisks.crsGrade3Plus.estimate) * 100}%`,
                 }}
               />
             </div>
             <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
               <span>{Math.min(...crsRates).toFixed(3)}%</span>
               <span>{Math.max(...crsRates).toFixed(3)}%</span>
             </div>
           </div>
           <div className="flex-1">
             <p className="text-[9px] text-muted-foreground font-medium mb-1">ICANS Range</p>
             <div className="h-2 rounded-full bg-muted relative overflow-hidden">
               <div
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-300 to-blue-600 rounded-full"
                 style={{
                   left: `${(Math.min(...icansRates) / baselineRisks.icansGrade3Plus.estimate) * 100}%`,
                   width: `${((Math.max(...icansRates) - Math.min(...icansRates)) / baselineRisks.icansGrade3Plus.estimate) * 100}%`,
                 }}
               />
             </div>
             <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
               <span>{Math.min(...icansRates).toFixed(3)}%</span>
               <span>{Math.max(...icansRates).toFixed(3)}%</span>
             </div>
           </div>
         </div>
         <p className="text-[9px] text-muted-foreground italic mt-2">
           {"\u201C"}Independent{"\u201D"} assumes no shared mechanism ({"\u03C1"}=0).
           {"\u201C"}Estimated{"\u201D"} uses knowledge-graph correlation values.
           {"\u201C"}Double{"\u201D"} tests if true correlations are 2{"\u00D7"} our estimates.
           Sensitivity range informs model robustness for CSP decision-making.
         </p>
       </CardContent>
     </Card>
   );
 })()}

 </motion.div>
 )}

 {/* ========== TRIALS TAB ========== */}
 {activeTab === "trials" && (
 <motion.div
 key="trials"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 >
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <Microscope className="h-4 w-4 text-emerald-600" />
 Active CAR-T Trials for SLE ({activeClinicalTrials.length} key trials)
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid gap-3 md:grid-cols-2">
 {activeClinicalTrials.map((trial) => (
 <div
 key={trial.nctId}
 className="p-3 rounded-lg border hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
 >
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-semibold">{trial.name}</span>
 <span
 className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
 trial.status === "Recruiting"
 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
 : trial.status === "Active"
 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
 : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
 }`}
 >
 {trial.status}
 </span>
 </div>
 <p className="text-xs text-muted-foreground">{trial.sponsor}</p>
 <div className="flex gap-2 mt-2 text-[10px]">
 <span className="px-1.5 py-0.5 rounded bg-muted">{trial.phase}</span>
 <span className="px-1.5 py-0.5 rounded bg-muted">{trial.target}</span>
 <span className="px-1.5 py-0.5 rounded bg-muted">N={trial.enrolled}</span>
 <span className="text-muted-foreground ml-auto">{trial.nctId}</span>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )}

 {/* ========== DATA SOURCES TAB ========== */}
 {activeTab === "sources" && (
 <motion.div
 key="sources"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-4"
 >
 {/* FAERS Signal Detection */}
 <FAERSSignals />

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold flex items-center gap-2">
 <Database className="h-4 w-4 text-purple-600" />
 Data Source Inventory for Safety Modeling
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
 {dataSources.map((ds) => (
 <div
 key={ds.name}
 className={`p-3 rounded-lg border transition-all ${
 ds.hasAutoimmune
 ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
 : "border-muted"
 }`}
 >
 <div className="flex items-center gap-2 mb-2">
 <div className={ds.hasAutoimmune ? "text-emerald-600" : "text-muted-foreground"}>
 {ds.icon}
 </div>
 <span className="text-xs font-semibold">{ds.name}</span>
 </div>
 <p className="text-[10px] text-muted-foreground">{ds.coverage}</p>
 <div className="flex items-center gap-1 mt-2">
 <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
 ds.hasAutoimmune
 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
 : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
 }`}>
 {ds.hasAutoimmune ? "Has autoimmune CAR-T data" : "Oncology CAR-T only"}
 </span>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )}

 {/* ========== CSP GUIDANCE TAB ========== */}
 {activeTab === "decisions" && (
 <motion.div
 key="decisions"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-3"
 >
 {/* Patient Journey Timeline */}
 <PatientJourney />

 {[
 {
 id: "dose",
 title: "Dose Selection Rationale",
 icon: <Syringe className="h-4 w-4" />,
 content: (
 <div className="space-y-2 text-xs">
 <p><strong>Recommended:</strong> 1 x 10^6 CAR-T cells/kg body weight (single infusion)</p>
 <p><strong>Evidence:</strong> Consistent across all published autoimmune CAR-T studies (n=47 SLE patients). This dose is 10-100x lower than oncology protocols.</p>
 <p><strong>Rationale:</strong> Autoimmune patients lack the massive antigen burden of hematologic malignancies. The pathogenic B-cell compartment is much smaller, so lower doses achieve complete B-cell depletion with dramatically less cytokine release.</p>
 <p><strong>Safety impact:</strong> Primary driver of the 80-90% reduction in severe CRS compared to oncology benchmarks.</p>
 </div>
 ),
 },
 {
 id: "monitoring",
 title: "Recommended Monitoring Protocol",
 icon: <Activity className="h-4 w-4" />,
 content: (
 <div className="space-y-2 text-xs">
 <table className="w-full">
 <thead>
 <tr className="border-b text-left text-muted-foreground">
 <th className="pb-1 pr-3">Timepoint</th>
 <th className="pb-1 pr-3">Assessment</th>
 <th className="pb-1">Frequency</th>
 </tr>
 </thead>
 <tbody className="text-[11px]">
 <tr className="border-b border-dashed"><td className="py-1 pr-3">Days 0-3</td><td className="pr-3">Vital signs, temperature</td><td>Every 4 hours</td></tr>
 <tr className="border-b border-dashed"><td className="py-1 pr-3">Days 0-7</td><td className="pr-3">CRP, ferritin, LDH, fibrinogen</td><td>Daily</td></tr>
 <tr className="border-b border-dashed"><td className="py-1 pr-3">Days 0-14</td><td className="pr-3">ICE score (ICANS screening)</td><td>BID</td></tr>
 <tr className="border-b border-dashed"><td className="py-1 pr-3">Days 0-28</td><td className="pr-3">CBC with differential, CMP</td><td>2x/week</td></tr>
 <tr className="border-b border-dashed"><td className="py-1 pr-3">Day 14, 28, 60, 90</td><td className="pr-3">CAR-T cell expansion (flow cytometry)</td><td>Per schedule</td></tr>
 <tr className="border-b border-dashed"><td className="py-1 pr-3">Monthly x6, then q3mo</td><td className="pr-3">B-cell reconstitution, immunoglobulins</td><td>Per schedule</td></tr>
 <tr><td className="py-1 pr-3">15 years</td><td className="pr-3">Long-term follow-up (secondary malignancy)</td><td>Annual</td></tr>
 </tbody>
 </table>
 </div>
 ),
 },
 {
 id: "stopping",
 title: "Toxicity Management Algorithm",
 icon: <AlertTriangle className="h-4 w-4" />,
 content: (
 <div className="space-y-2 text-xs">
 <p className="font-semibold">CRS Management (ASTCT grading):</p>
 <ul className="space-y-1 ml-4 list-disc">
 <li><strong>Grade 1</strong> (fever only): Supportive care, acetaminophen, monitoring</li>
 <li><strong>Grade 2</strong> (hypotension not requiring vasopressors OR low-flow O2): Tocilizumab 8 mg/kg IV; may repeat x1 in 8hrs</li>
 <li><strong>Grade 3</strong> (vasopressor OR high-flow O2): Tocilizumab + dexamethasone 10mg IV q12h; ICU transfer</li>
 <li><strong>Grade 4</strong> (multiple vasopressors OR mechanical ventilation): Methylprednisolone 1g IV daily x3; consider anakinra</li>
 </ul>
 <p className="font-semibold mt-3">ICANS Management:</p>
 <ul className="space-y-1 ml-4 list-disc">
 <li><strong>Grade 1</strong> (ICE 7-9): Observation, seizure prophylaxis (levetiracetam)</li>
 <li><strong>Grade 2</strong> (ICE 3-6): Dexamethasone 10mg IV q6h</li>
 <li><strong>Grade 3-4</strong> (ICE 0-2 or seizures): High-dose methylprednisolone 1g/day; ICU; consider anakinra if refractory</li>
 </ul>
 </div>
 ),
 },
 {
 id: "pharmacovigilance",
 title: "Pharmacovigilance Plan",
 icon: <Heart className="h-4 w-4" />,
 content: (
 <div className="space-y-2 text-xs">
 <p><strong>Regulatory status (as of 2025-2026):</strong></p>
 <ul className="space-y-1 ml-4 list-disc">
 <li>REMS programs removed for all approved CAR-T products (June 2025)</li>
 <li>Driving restrictions reduced from 8 to 2 weeks post-infusion</li>
 <li>Proximity requirements reduced from 4 to 2 weeks</li>
 <li>15-year mandatory long-term follow-up remains in effect</li>
 <li>Boxed warning for T-cell malignancies added January 2024</li>
 </ul>
 <p className="mt-2"><strong>Recommended pharmacovigilance activities:</strong></p>
 <ul className="space-y-1 ml-4 list-disc">
 <li>Expedited reporting of all SAEs within 15 days (IND safety reports)</li>
 <li>SUSAR reporting within 7 days for fatal/life-threatening events</li>
 <li>Annual DSUR submission to FDA/EMA</li>
 <li>CIBMTR registry enrollment for all patients</li>
 <li>Integration with FAERS post-approval</li>
 <li>Proactive secondary malignancy monitoring (annual cancer screening)</li>
 </ul>
 </div>
 ),
 },
 {
 id: "stopping-rules",
 title: "Statistical Stopping Rules",
 icon: <BarChart3 className="h-4 w-4" />,
 content: (
 <div className="space-y-3 text-xs">
 <table className="w-full">
 <thead>
 <tr className="border-b text-left text-muted-foreground">
 <th className="pb-1 pr-3">Trigger</th>
 <th className="pb-1 pr-3">Threshold</th>
 <th className="pb-1 pr-3">Action</th>
 <th className="pb-1">Rationale</th>
 </tr>
 </thead>
 <tbody className="text-[11px]">
 <tr className="border-b border-dashed">
 <td className="py-1.5 pr-3 font-medium">Grade 4+ CRS</td>
 <td className="py-1.5 pr-3">{"\u2265"}2 events in first 10 patients</td>
 <td className="py-1.5 pr-3">Pause enrollment, DSMB review</td>
 <td className="py-1.5 text-muted-foreground">Observed rate {"\u2265"}20% exceeds expected &lt;5%</td>
 </tr>
 <tr className="border-b border-dashed">
 <td className="py-1.5 pr-3 font-medium">Grade 3+ CRS</td>
 <td className="py-1.5 pr-3">{"\u2265"}3 events in first 20 patients</td>
 <td className="py-1.5 pr-3">Pause enrollment, DSMB review</td>
 <td className="py-1.5 text-muted-foreground">Observed rate {"\u2265"}15% exceeds expected ~2%</td>
 </tr>
 <tr className="border-b border-dashed">
 <td className="py-1.5 pr-3 font-medium text-red-600">Fatal CRS or ICANS</td>
 <td className="py-1.5 pr-3">Any event</td>
 <td className="py-1.5 pr-3 text-red-600 font-medium">Suspend enrollment, mandatory DSMB review</td>
 <td className="py-1.5 text-muted-foreground">Zero tolerance for treatment-related death</td>
 </tr>
 <tr className="border-b border-dashed">
 <td className="py-1.5 pr-3 font-medium">Grade 3+ ICANS</td>
 <td className="py-1.5 pr-3">{"\u2265"}2 events in first 15 patients</td>
 <td className="py-1.5 pr-3">Pause, neurology consult for all subsequent patients</td>
 <td className="py-1.5 text-muted-foreground">Observed rate {"\u2265"}13% exceeds expected &lt;2%</td>
 </tr>
 <tr className="border-b border-dashed">
 <td className="py-1.5 pr-3 font-medium">T-cell malignancy</td>
 <td className="py-1.5 pr-3">Any event</td>
 <td className="py-1.5 pr-3">Report to DSMB and FDA within 15 days; continue with enhanced monitoring</td>
 <td className="py-1.5 text-muted-foreground">Per FDA boxed warning requirements</td>
 </tr>
 <tr>
 <td className="py-1.5 pr-3 font-medium">Grade 3+ infection</td>
 <td className="py-1.5 pr-3">{"\u2265"}3 events in first 15 patients</td>
 <td className="py-1.5 pr-3">Review infection prophylaxis protocol, consider IVIG for all patients</td>
 <td className="py-1.5 text-muted-foreground">Rate {"\u2265"}20% exceeds expected ~15%</td>
 </tr>
 </tbody>
 </table>
 <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
 <p className="text-xs text-amber-800 dark:text-amber-300">
 <strong>Dose de-escalation:</strong> If CRS Grade 3+ rate exceeds 10% in any dosing cohort, de-escalate to 0.5 x 10{"\u2076"} cells/kg for subsequent patients.
 </p>
 </div>
 </div>
 ),
 },
 {
 id: "eligibility",
 title: "Eligibility Criteria Recommendations",
 icon: <ClipboardList className="h-4 w-4" />,
 content: (
 <div className="space-y-4 text-xs">
 <div>
 <p className="font-semibold mb-2">Key Exclusion Criteria (Safety-Driven):</p>
 <ul className="space-y-1 ml-4 list-disc">
 <li>Active neuropsychiatric SLE with CNS involvement within past 6 months</li>
 <li>eGFR &lt;30 mL/min/1.73m{"\u00B2"} (severe renal impairment)</li>
 <li>Active uncontrolled infection</li>
 <li>Prior CAR-T cell therapy (risk of anti-drug antibodies)</li>
 <li>ECOG performance status {"\u2265"}3</li>
 <li>Active second malignancy</li>
 <li>Positive HIV, active hepatitis B or C</li>
 <li>Pregnant or breastfeeding</li>
 <li>Uncontrolled seizure disorder (risk factor for severe ICANS)</li>
 </ul>
 </div>
 <div>
 <p className="font-semibold mb-2">Key Inclusion Criteria (Safety-Relevant):</p>
 <ul className="space-y-1 ml-4 list-disc">
 <li>Failed {"\u2265"}2 prior standard-of-care treatments including at least one biologic (rituximab, belimumab, or voclosporin)</li>
 <li>Adequate organ function: ANC {"\u2265"}1000/{"\u03BC"}L, platelets {"\u2265"}75,000/{"\u03BC"}L, hemoglobin {"\u2265"}8 g/dL, ALT/AST {"\u2264"}3x ULN, total bilirubin {"\u2264"}2x ULN</li>
 <li>SLEDAI score {"\u2265"}6 (moderate-to-severe active disease)</li>
 <li>At least 2-week washout from systemic immunosuppressants before lymphodepletion</li>
 </ul>
 </div>
 <div>
 <p className="font-semibold mb-2">Required Concomitant Medications:</p>
 <ul className="space-y-1 ml-4 list-disc">
 <li><strong>Seizure prophylaxis:</strong> levetiracetam 750mg BID starting day -1 through day +30</li>
 <li><strong>Infection prophylaxis:</strong> acyclovir 400mg BID, fluconazole 200mg daily, TMP-SMX DS 3x/week &mdash; all continued until B-cell reconstitution AND IgG &gt;400 mg/dL</li>
 <li><strong>IVIG replacement:</strong> 0.4 g/kg monthly when IgG &lt;400 mg/dL</li>
 </ul>
 </div>
 </div>
 ),
 },
 ].map((section) => (
 <Card key={section.id}>
 <div
 className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
 onClick={() => setExpandedDecision(expandedDecision === section.id ? null : section.id)}
 >
 <div className="flex items-center gap-2">
 <div className="text-emerald-600">{section.icon}</div>
 <span className="text-sm font-semibold">{section.title}</span>
 </div>
 <motion.div
 animate={{ rotate: expandedDecision === section.id ? 90 : 0 }}
 transition={{ duration: 0.2 }}
 >
 <ChevronRight className="h-4 w-4 text-muted-foreground" />
 </motion.div>
 </div>
 <AnimatePresence>
 {expandedDecision === section.id && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: "auto", opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="overflow-hidden"
 >
 <CardContent className="pt-0 pb-4 border-t">
 {section.content}
 </CardContent>
 </motion.div>
 )}
 </AnimatePresence>
 </Card>
 ))}
 </motion.div>
 )}
 </AnimatePresence>

 {/* Executive Briefing Export Modal */}
 <ExecutiveBriefing
 open={briefingOpen}
 onClose={() => setBriefingOpen(false)}
 baselineRisks={baselineRisks}
 mitigatedCRS={mitigatedCRS}
 mitigatedICANS={mitigatedICANS}
 selectedMitigations={selectedMitigations}
 trialCount={activeClinicalTrials.length}
 />
 </div>
 );
}
