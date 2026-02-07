"use client";

/**
 * Decision Support Panel
 *
 * Expandable decision support sections for CSP writers covering dose selection,
 * monitoring protocols, stopping rules, and pharmacovigilance planning.
 *
 * @module components/safety/decision-support
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
  FileCheck,
  ChevronDown,
  ChevronRight,
  Syringe,
  HeartPulse,
  OctagonAlert,
  ClipboardCheck,
  ExternalLink,
  Info,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface DecisionSupportProps {
  className?: string;
}

interface SectionItem {
  label: string;
  value: string;
  evidence?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "destructive" | "info";
}

interface SectionData {
  id: string;
  title: string;
  icon: React.ElementType;
  iconGradient: string;
  description: string;
  items: SectionItem[];
  notes?: string[];
}

// ============================================================================
// SECTION DATA
// ============================================================================

const sections: SectionData[] = [
  {
    id: "dose-selection",
    title: "Dose Selection Rationale",
    icon: Syringe,
    iconGradient: "from-blue-500 to-cyan-600",
    description: "Evidence-based dose recommendation for SLE CAR-T",
    items: [
      {
        label: "Recommended dose",
        value: "1 x 10^6 CAR+ T cells/kg",
        evidence: "Mackensen 2022, Muller 2024, CASTLE protocol",
        badge: "Recommended",
        badgeVariant: "success",
      },
      {
        label: "Dose range studied",
        value: "0.5 - 1.0 x 10^6 CAR+ T cells/kg in autoimmune protocols",
        evidence: "Pooled analysis of 8 SLE CAR-T studies",
      },
      {
        label: "Oncology comparator",
        value: "0.6 - 2.0 x 10^6/kg (axi-cel: 2.0, tisa-cel: 0.6-6.0, liso-cel: 0.5-1.1)",
        evidence: "ZUMA-1, JULIET, TRANSCEND pivotal data",
      },
      {
        label: "Rationale for lower dose",
        value: "Lower disease burden in SLE (no bulky tumor mass), efficacy demonstrated at lower doses with reduced toxicity. B-cell depletion achievable at lower thresholds than tumor eradication.",
        evidence: "Mackensen 2022 - complete remission at 1x10^6/kg",
      },
      {
        label: "Dose-toxicity relationship",
        value: "Grade 3+ CRS correlates with higher CAR-T doses in oncology. All SLE trials using 1x10^6/kg report 0% grade 3+ CRS.",
        evidence: "Cross-trial comparison, pooled analysis 2025",
      },
      {
        label: "Dose escalation consideration",
        value: "Some protocols include option for dose escalation to 1.5x10^6/kg if insufficient B-cell depletion at day 28. Not yet required in published SLE data.",
        evidence: "CASTLE protocol design",
      },
    ],
    notes: [
      "Flat dosing vs weight-based: weight-based (per kg) is standard. Flat dose options under investigation for manufacturing simplicity.",
      "Manufacturing variability: actual delivered dose may vary from target. Quality release criteria should specify acceptable range.",
    ],
  },
  {
    id: "monitoring-protocol",
    title: "Monitoring Protocol",
    icon: HeartPulse,
    iconGradient: "from-rose-500 to-pink-600",
    description: "Recommended safety monitoring schedule post-infusion",
    items: [
      {
        label: "Vital signs",
        value: "Every 4 hours for days 0-3, every 8 hours for days 4-7, then daily until discharge",
        evidence: "ASTCT consensus guidelines, adapted for lower-risk autoimmune population",
        badge: "Days 0-7",
        badgeVariant: "warning",
      },
      {
        label: "Cytokine panel",
        value: "IL-6, CRP, ferritin daily on days 0-7; IL-1, TNF-alpha, IFN-gamma if CRS grade 2+",
        evidence: "Lee et al. ASTCT grading 2019, Mackensen protocol",
        badge: "Daily",
        badgeVariant: "info",
      },
      {
        label: "ICE score (neurotoxicity)",
        value: "BID assessment days 0-7, then daily until discharge. Full neurologic exam if ICE <7 or any focal deficit.",
        evidence: "ASTCT ICANS grading consensus",
        badge: "BID",
        badgeVariant: "warning",
      },
      {
        label: "B-cell monitoring",
        value: "Flow cytometry for CD19+ B cells at days 7, 14, 28, then monthly for 6 months, then quarterly.",
        evidence: "Mackensen 2022, CASTLE protocol",
      },
      {
        label: "Immunoglobulin levels",
        value: "IgG, IgA, IgM at baseline, monthly for 6 months, then quarterly. IVIg replacement if IgG <400 mg/dL with recurrent infections.",
        evidence: "Muller 2024 follow-up protocol",
      },
      {
        label: "Autoantibody panel",
        value: "Anti-dsDNA, complement (C3/C4), ANA at baseline, monthly x3, then quarterly. Track correlation with clinical remission.",
        evidence: "Mackensen 2022 - autoantibodies undetectable by month 3",
      },
      {
        label: "SLEDAI-2K score",
        value: "Baseline, day 28, months 3, 6, 9, 12, then every 6 months. Primary efficacy and safety integration endpoint.",
        evidence: "Standard SLE disease activity assessment",
      },
      {
        label: "Liver/renal function",
        value: "CMP daily days 0-3, then twice weekly until discharge. Monitor for ICAHS-related organ dysfunction.",
        evidence: "ASTCT guidelines for immune effector cell-associated organ toxicity",
      },
    ],
    notes: [
      "Inpatient monitoring minimum: 7-10 days post-infusion for autoimmune indications.",
      "Earlier discharge (day 7) may be considered if no CRS by day 5 and stable vitals.",
    ],
  },
  {
    id: "stopping-rules",
    title: "Stopping Rules & Escalation",
    icon: OctagonAlert,
    iconGradient: "from-red-500 to-orange-600",
    description: "CRS/ICANS management algorithm and escalation criteria",
    items: [
      {
        label: "CRS Grade 1",
        value: "Fever >= 38C: Supportive care, acetaminophen, cooling measures. Observe. Increase monitoring to q2h vitals.",
        evidence: "ASTCT CRS grading Lee et al. 2019",
        badge: "Observe",
        badgeVariant: "success",
      },
      {
        label: "CRS Grade 2",
        value: "Fever + hypotension (not requiring vasopressors) OR hypoxia (requiring low-flow O2): Tocilizumab 8 mg/kg IV (max 800 mg). May repeat q8h x 3 doses.",
        evidence: "ASTCT consensus, FDA tocilizumab label for CRS",
        badge: "Tocilizumab",
        badgeVariant: "warning",
      },
      {
        label: "CRS Grade 3",
        value: "Hypotension requiring vasopressors OR hypoxia requiring high-flow O2/non-rebreather: Tocilizumab + Dexamethasone 10mg IV q6h. ICU transfer. Consider anakinra if refractory to 2 doses tocilizumab.",
        evidence: "ASTCT consensus, Norelli 2018 for anakinra",
        badge: "ICU",
        badgeVariant: "destructive",
      },
      {
        label: "CRS Grade 4",
        value: "Life-threatening: mechanical ventilation, vasopressor escalation. Methylprednisolone 1g IV x 3 days. Anakinra. Siltuximab if available. Full ICU support.",
        evidence: "ASTCT consensus",
        badge: "Critical",
        badgeVariant: "destructive",
      },
      {
        label: "ICANS Grade 1",
        value: "ICE 7-9: Observation, q4h neuro checks. No intervention required. Avoid CNS-depressant medications.",
        evidence: "ASTCT ICANS grading",
        badge: "Observe",
        badgeVariant: "success",
      },
      {
        label: "ICANS Grade 2",
        value: "ICE 3-6: Dexamethasone 10mg IV q6h. Continuous cardiac monitoring. Neurology consult. Head CT if focal deficits.",
        evidence: "ASTCT consensus",
        badge: "Steroids",
        badgeVariant: "warning",
      },
      {
        label: "ICANS Grade 3-4",
        value: "ICE 0-2 or seizure or cerebral edema: ICU transfer. Methylprednisolone 1g IV daily x 3d. Anti-seizure prophylaxis (levetiracetam). Urgent MRI brain. Consider intrathecal therapy if severe.",
        evidence: "ASTCT consensus, institutional protocols",
        badge: "ICU + Steroids",
        badgeVariant: "destructive",
      },
      {
        label: "ICAHS / HLH-like syndrome",
        value: "Ferritin >10,000, hepatosplenomegaly, cytopenias, coagulopathy: Etoposide consideration (per HLH-2004 protocol adaptation). High-dose steroids. Ruxolitinib under investigation.",
        evidence: "HLH-2004 adapted, case reports",
        badge: "Specialist",
        badgeVariant: "destructive",
      },
    ],
    notes: [
      "In SLE patients with grade 3+ CRS, rule out concurrent infection and disease flare before attributing solely to CAR-T toxicity.",
      "Steroid use in autoimmune CAR-T: short courses (<72h) unlikely to impair CAR-T efficacy based on oncology data. Taper rapidly once toxicity controlled.",
      "Lower threshold for intervention in autoimmune patients: consider tocilizumab at early grade 2 CRS given favorable risk-benefit.",
    ],
  },
  {
    id: "pharmacovigilance",
    title: "Pharmacovigilance Plan",
    icon: ClipboardCheck,
    iconGradient: "from-indigo-500 to-violet-600",
    description: "Post-marketing safety surveillance requirements",
    items: [
      {
        label: "FAERS reporting",
        value: "15-day expedited reports for all serious AEs. 90-day periodic safety update reports (PSUR). Annual DSUR required for IND studies.",
        evidence: "21 CFR 312.32, 314.80",
        badge: "Mandatory",
        badgeVariant: "destructive",
      },
      {
        label: "CIBMTR reporting",
        value: "Mandatory REMS requirement for all approved CAR-T products. 100-day, 6-month, annual, and 15-year follow-up forms. Captures CRS, ICANS, infections, secondary malignancies.",
        evidence: "FDA REMS for all approved CAR-T products",
        badge: "REMS",
        badgeVariant: "warning",
      },
      {
        label: "Long-term follow-up (LTFU)",
        value: "15-year follow-up required per FDA guidance for gene therapy products. Annual assessments: secondary malignancies, persistent cytopenias, autoimmune phenomena, viral reactivation.",
        evidence: "FDA Guidance for Long-Term Follow-Up After Administration of a Human Gene Therapy Product (2020)",
        badge: "15 years",
        badgeVariant: "info",
      },
      {
        label: "REMS status",
        value: "All approved CAR-T products have REMS with Elements to Assure Safe Use (ETASU). Certified healthcare settings, trained prescribers, tocilizumab availability mandatory.",
        evidence: "FDA REMS programs for Kymriah, Yescarta, Breyanzi, Abecma, Carvykti",
      },
      {
        label: "Signal detection",
        value: "Quarterly disproportionality analysis in FAERS. Monitor for: delayed neurotoxicity, secondary T-cell malignancy, prolonged cytopenias, opportunistic infections, autoimmune flare.",
        evidence: "FDA post-marketing requirements for CAR-T class",
      },
      {
        label: "Autoimmune-specific monitoring",
        value: "Beyond standard CAR-T PV: monitor for disease relapse pattern, new-onset autoimmunity, B-cell reconstitution dynamics, immunoglobulin recovery, vaccination response post-reconstitution.",
        evidence: "Emerging from Mackensen/Muller follow-up data",
        badge: "Novel",
        badgeVariant: "info",
      },
      {
        label: "Risk Management Plan (EU)",
        value: "If seeking EMA approval: additional pharmacovigilance activities, PASS (post-authorization safety study), and targeted follow-up questionnaires for autoimmune-specific endpoints.",
        evidence: "EMA GVP Module V",
      },
    ],
    notes: [
      "T-cell malignancy risk: FDA issued class-wide investigation in Nov 2023 for T-cell malignancies post-CAR-T. Autoimmune patients may have different baseline risk profile.",
      "Insurance/registry linkage: consider linking CIBMTR data with claims databases for long-term outcome tracking beyond clinical trial infrastructure.",
    ],
  },
];

// ============================================================================
// EXPANDABLE SECTION
// ============================================================================

function ExpandableSection({ section }: { section: SectionData }) {
  const [expanded, setExpanded] = React.useState(false);
  const Icon = section.icon;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left p-4 hover:bg-muted/30 transition-colors"
      >
        <div className={cn("p-2 rounded-lg bg-gradient-to-br flex-shrink-0", section.iconGradient)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{section.title}</p>
          <p className="text-xs text-muted-foreground">{section.description}</p>
        </div>
        <Badge variant="secondary" className="text-[10px] flex-shrink-0 mr-1">
          {section.items.length} items
        </Badge>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/5">
          {section.items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg bg-card border border-border/50 p-3 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                {item.badge && (
                  <Badge
                    variant={
                      item.badgeVariant === "success" ? "success" :
                      item.badgeVariant === "warning" ? "warning" :
                      item.badgeVariant === "destructive" ? "destructive" :
                      item.badgeVariant === "info" ? "info" :
                      "secondary"
                    }
                    className="text-[10px] flex-shrink-0"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.value}
              </p>
              {item.evidence && (
                <p className="text-[10px] text-muted-foreground/70 italic">
                  Evidence: {item.evidence}
                </p>
              )}
            </div>
          ))}

          {/* Notes */}
          {section.notes && section.notes.length > 0 && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Implementation Notes
                </p>
              </div>
              <ul className="space-y-1">
                {section.notes.map((note, i) => (
                  <li
                    key={i}
                    className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-1.5 before:top-[7px] before:w-1 before:h-1 before:rounded-full before:bg-blue-400 dark:before:bg-blue-500"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DecisionSupport({ className }: DecisionSupportProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800">
            <FileCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Decision Support</CardTitle>
            <CardDescription>
              Evidence-backed guidance for CSP safety sections
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {sections.map((section) => (
          <ExpandableSection key={section.id} section={section} />
        ))}

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground leading-relaxed pt-2 border-t border-border">
          These recommendations are derived from published clinical data and
          consensus guidelines as of 2025. They are intended as a decision support
          resource for CSP authoring and should be reviewed by qualified medical
          personnel. Individual protocol decisions should account for
          product-specific characteristics, patient population, and regulatory
          requirements of each jurisdiction.
        </p>
      </CardContent>
    </Card>
  );
}

export default DecisionSupport;
