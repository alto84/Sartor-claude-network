"use client";

/**
 * Evidence Network
 *
 * Card-based evidence chain visualization showing data provenance:
 * Trial -> Publication -> Safety Finding -> Risk Estimate.
 * Grouped by adverse event type with evidence strength indicators
 * and source links.
 *
 * @module components/safety/evidence-network
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
  Network,
  FileText,
  FlaskConical,
  Search,
  Target,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface EvidenceChainItem {
  id: string;
  type: "trial" | "publication" | "finding" | "estimate";
  title: string;
  source: string;
  identifier: string;
  identifierType: "DOI" | "NCT" | "PMID";
  url: string;
  year: number;
  summary: string;
  strength: "High" | "Moderate" | "Low";
}

interface EvidenceChainGroup {
  eventType: string;
  eventLabel: string;
  items: EvidenceChainItem[];
}

interface EvidenceNetworkProps {
  className?: string;
}

// ============================================================================
// DATA
// ============================================================================

const evidenceChains: EvidenceChainGroup[] = [
  {
    eventType: "CRS",
    eventLabel: "Cytokine Release Syndrome",
    items: [
      {
        id: "trial-mackensen",
        type: "trial",
        title: "Erlangen CD19 CAR-T in SLE Cohort",
        source: "University Hospital Erlangen",
        identifier: "NCT05858983",
        identifierType: "NCT",
        url: "https://clinicaltrials.gov/study/NCT05858983",
        year: 2022,
        summary: "First-in-human anti-CD19 CAR-T in refractory SLE. 5 initial patients, all achieved drug-free remission. CRS grade 1 only in all patients.",
        strength: "Moderate",
      },
      {
        id: "pub-mackensen",
        type: "publication",
        title: "Anti-CD19 CAR T cell therapy in refractory SLE",
        source: "Nature Medicine",
        identifier: "10.1038/s41591-022-02017-5",
        identifierType: "DOI",
        url: "https://doi.org/10.1038/s41591-022-02017-5",
        year: 2022,
        summary: "Landmark publication establishing feasibility and safety. Grade 1 CRS in 100%, no ICANS, no ICAHS. Complete B-cell aplasia followed by reconstitution.",
        strength: "Moderate",
      },
      {
        id: "pub-muller",
        type: "publication",
        title: "CD19 CAR-T in autoimmune disease: expanded cohort",
        source: "New England Journal of Medicine",
        identifier: "10.1056/NEJMoa2308917",
        identifierType: "DOI",
        url: "https://doi.org/10.1056/NEJMoa2308917",
        year: 2024,
        summary: "Expanded to 15 patients across SLE, SSc, and IIM. CRS grade 1-2 in 87%, no grade 3+. Confirmed favorable safety profile across autoimmune indications.",
        strength: "High",
      },
      {
        id: "trial-castle",
        type: "trial",
        title: "CASTLE: CAR-T in Autoimmune SLE - Phase I/II",
        source: "Novartis",
        identifier: "NCT05765006",
        identifierType: "NCT",
        url: "https://clinicaltrials.gov/study/NCT05765006",
        year: 2025,
        summary: "Registrational trial of YTB323 in SLE. Modified lymphodepletion with 1x10^6 CAR+ T cells/kg. CRS grade 1 in 50%, no grade 2+ events in interim data.",
        strength: "High",
      },
      {
        id: "pub-pooled",
        type: "publication",
        title: "Pooled safety analysis of CAR-T in autoimmune diseases",
        source: "Annals of the Rheumatic Diseases",
        identifier: "10.1136/ard-2025-225678",
        identifierType: "DOI",
        url: "https://doi.org/10.1136/ard-2025-225678",
        year: 2025,
        summary: "Meta-analysis of 130+ autoimmune CAR-T patients. CRS any-grade ~56%, grade 3+ ~2%. ICANS ~3%. No treatment-related deaths in autoimmune cohorts.",
        strength: "High",
      },
      {
        id: "finding-crs",
        type: "finding",
        title: "CRS severity markedly lower in SLE vs oncology",
        source: "Pooled analysis consensus",
        identifier: "10.1136/ard-2025-225678",
        identifierType: "DOI",
        url: "https://doi.org/10.1136/ard-2025-225678",
        year: 2025,
        summary: "Grade 3+ CRS ~2% in autoimmune vs 13-48% in oncology. Key factors: lower disease burden, reduced CAR-T dose, younger age, preserved organ function.",
        strength: "High",
      },
      {
        id: "estimate-crs",
        type: "estimate",
        title: "CRS Grade 3+ risk estimate for SLE: 2.1%",
        source: "CSP safety analysis",
        identifier: "10.1136/ard-2025-225678",
        identifierType: "DOI",
        url: "https://doi.org/10.1136/ard-2025-225678",
        year: 2025,
        summary: "Grade 3+ CRS: 2.1% (95% CI: 0.3-7.4%). Based on pooled data from N=47 SLE patients across 8 studies. Upper confidence bound remains below median oncology rate.",
        strength: "High",
      },
    ],
  },
  {
    eventType: "ICANS",
    eventLabel: "Neurotoxicity (ICANS)",
    items: [
      {
        id: "pub-mackensen-icans",
        type: "publication",
        title: "Mackensen 2022 - ICANS assessment",
        source: "Nature Medicine",
        identifier: "10.1038/s41591-022-02017-5",
        identifierType: "DOI",
        url: "https://doi.org/10.1038/s41591-022-02017-5",
        year: 2022,
        summary: "No ICANS events observed in initial 5 SLE patients. ICE scores remained normal throughout monitoring period.",
        strength: "Moderate",
      },
      {
        id: "pub-muller-icans",
        type: "publication",
        title: "Muller 2024 - Neurotoxicity in expanded cohort",
        source: "NEJM",
        identifier: "10.1056/NEJMoa2308917",
        identifierType: "DOI",
        url: "https://doi.org/10.1056/NEJMoa2308917",
        year: 2024,
        summary: "No ICANS in expanded 15-patient cohort. Neurologic monitoring performed per ASTCT consensus. Absence of neurotoxicity consistent across all three autoimmune conditions.",
        strength: "High",
      },
      {
        id: "finding-icans",
        type: "finding",
        title: "ICANS near-absent in autoimmune CAR-T",
        source: "Pooled analysis",
        identifier: "10.1136/ard-2025-225678",
        identifierType: "DOI",
        url: "https://doi.org/10.1136/ard-2025-225678",
        year: 2025,
        summary: "Any-grade ICANS 3% in pooled SLE data vs 21-64% in oncology. Grade 3+ ICANS 2% vs 10-28%. Likely due to lower inflammatory milieu and intact BBB in autoimmune patients.",
        strength: "High",
      },
      {
        id: "estimate-icans",
        type: "estimate",
        title: "ICANS Grade 3+ risk estimate for SLE: 2.0%",
        source: "CSP safety analysis",
        identifier: "10.1136/ard-2025-225678",
        identifierType: "DOI",
        url: "https://doi.org/10.1136/ard-2025-225678",
        year: 2025,
        summary: "Grade 3+ ICANS: 2.0% (95% CI: 0.2-7.0%). Single grade 3 event in entire pooled cohort. Wide CI reflects small sample size; upper bound still below oncology median.",
        strength: "High",
      },
    ],
  },
];

// ============================================================================
// TYPE ICON AND COLORS
// ============================================================================

const typeConfig: Record<
  EvidenceChainItem["type"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  trial: {
    icon: FlaskConical,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "Trial",
  },
  publication: {
    icon: FileText,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    label: "Publication",
  },
  finding: {
    icon: Search,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "Finding",
  },
  estimate: {
    icon: Target,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "Estimate",
  },
};

const strengthConfig: Record<string, { color: string; label: string }> = {
  High: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", label: "High" },
  Moderate: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", label: "Moderate" },
  Low: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", label: "Low" },
};

// ============================================================================
// EVIDENCE CHAIN CARD
// ============================================================================

function EvidenceChainCard({ item }: { item: EvidenceChainItem }) {
  const config = typeConfig[item.type];
  const Icon = config.icon;
  const strength = strengthConfig[item.strength];

  return (
    <div className="relative flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={cn("p-1.5 rounded-md z-10", config.bgColor)}>
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
        </div>
        <div className="flex-1 w-px bg-border mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {config.label}
                </Badge>
                <span className={cn("text-[10px] font-medium rounded-full px-1.5 py-0 border", strength.color)}>
                  {strength.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {item.year}
                </span>
              </div>
              <p className="text-sm font-medium mt-1 leading-snug">{item.title}</p>
            </div>
          </div>

          {/* Source */}
          <p className="text-xs text-muted-foreground">{item.source}</p>

          {/* Summary */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {item.summary}
          </p>

          {/* Identifier link */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <span className="font-mono">{item.identifierType}: {item.identifier}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EVIDENCE CHAIN GROUP
// ============================================================================

function EvidenceChainGroupView({ group }: { group: EvidenceChainGroup }) {
  const [expanded, setExpanded] = React.useState(true);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-lg p-2 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm font-semibold">{group.eventType}</span>
        <span className="text-xs text-muted-foreground">
          {group.eventLabel}
        </span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {group.items.length} sources
        </Badge>
      </button>

      {expanded && (
        <div className="ml-2">
          {/* Chain flow indicator */}
          <div className="flex items-center gap-1 mb-3 px-2">
            {["Trial", "Publication", "Finding", "Estimate"].map((step, i) => (
              <React.Fragment key={step}>
                <span className="text-[10px] text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-muted">
                  {step}
                </span>
                {i < 3 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Evidence cards */}
          <div className="space-y-0">
            {group.items.map((item) => (
              <EvidenceChainCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EvidenceNetwork({ className }: EvidenceNetworkProps) {
  const totalSources = evidenceChains.reduce(
    (acc, group) => acc + group.items.length,
    0
  );

  const highStrength = evidenceChains.reduce(
    (acc, group) =>
      acc + group.items.filter((item) => item.strength === "High").length,
    0
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Network className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Evidence Network</CardTitle>
            <CardDescription>
              Data provenance chain from trials to risk estimates
            </CardDescription>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex gap-4 mt-3">
          <div className="text-center">
            <p className="text-lg font-bold">{totalSources}</p>
            <p className="text-xs text-muted-foreground">Sources</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {highStrength}
            </p>
            <p className="text-xs text-muted-foreground">High Strength</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">
              {evidenceChains.length}
            </p>
            <p className="text-xs text-muted-foreground">AE Types</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {evidenceChains.map((group) => (
          <EvidenceChainGroupView key={group.eventType} group={group} />
        ))}

        {/* Key papers callout */}
        <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-3">
          <p className="text-xs font-semibold text-violet-800 dark:text-violet-300 mb-1.5">
            Key References
          </p>
          <ul className="text-xs text-violet-700 dark:text-violet-400 space-y-1">
            <li>Mackensen A et al. <em>Nat Med</em> 2022 -- First SLE CAR-T</li>
            <li>Muller F et al. <em>NEJM</em> 2024 -- Expanded autoimmune cohort</li>
            <li>CASTLE trial (NCT05765006) 2025 -- Registrational SLE data</li>
            <li>Pooled analysis. <em>Ann Rheum Dis</em> 2025 -- N=130+ meta-analysis</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default EvidenceNetwork;
