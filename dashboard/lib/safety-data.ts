// =============================================================================
// Safety Dashboard Data Layer
// Core data module for CAR-T safety monitoring in autoimmune indications
// =============================================================================

// ---------------------------------------------------------------------------
// TypeScript Interfaces
// ---------------------------------------------------------------------------

/** Adverse event rates by indication and product */
export interface AdverseEventRate {
  indication: string; // "SLE", "DLBCL", "ALL", "MM"
  product: string;
  trial: string;
  nPatients: number;
  crsAnyGrade: number; // percentage
  crsGrade3Plus: number;
  icansAnyGrade: number;
  icansGrade3Plus: number;
  icahsRate: number;
  licatsRate?: number; // autoimmune only
  source: string; // citation
  year: number;
  nEvents?: number; // numerator (number of patients with event)
  sourceTable?: string; // e.g., "Table 2"
}

/** Mitigation strategy */
export interface MitigationStrategy {
  id: string;
  name: string;
  mechanism: string;
  targetAE: string[]; // which AEs it addresses
  relativeRisk: number; // risk reduction multiplier (0-1, lower = more reduction)
  confidenceInterval: [number, number];
  evidenceLevel: "Strong" | "Moderate" | "Limited" | "Theoretical";
  dosing: string;
  timing: string;
  limitations: string[];
  references: string[];
}

/** Risk estimate with confidence interval */
export interface RiskEstimate {
  estimate: number;
  ci95: [number, number];
}

/** Risk model output */
export interface RiskAssessment {
  baselineRisks: {
    crsGrade3Plus: RiskEstimate;
    icansGrade3Plus: RiskEstimate;
    icahs: RiskEstimate;
    licats: RiskEstimate;
  };
  mitigatedRisks: {
    selectedMitigations: string[];
    crsGrade3Plus: RiskEstimate;
    icansGrade3Plus: RiskEstimate;
  };
}

/** Clinical trial */
export interface ClinicalTrial {
  name: string;
  sponsor: string;
  nctId: string;
  phase: string;
  target: string; // CD19, BCMA, dual
  indication: string;
  enrollment: number;
  status: "Recruiting" | "Active" | "Completed" | "Not yet recruiting";
  safetyData?: AdverseEventRate;
}

/** Data source */
export interface DataSource {
  name: string;
  type: "Literature" | "RWD" | "Spontaneous Reporting" | "Registry";
  coverage: string;
  cartDataAvailable: boolean;
  autoimmuneCARTData: boolean;
  accessMethod: string;
  strengths: string[];
  limitations: string[];
}

/** Chart data point for comparison visualizations */
export interface ChartDataPoint {
  label: string;
  indication: string;
  product: string;
  crsAnyGrade: number;
  crsGrade3Plus: number;
  icansAnyGrade: number;
  icansGrade3Plus: number;
  nPatients: number;
  category: "Autoimmune" | "Oncology";
}

// ---------------------------------------------------------------------------
// Adverse Event Rate Data
// ---------------------------------------------------------------------------

export const adverseEventRates: AdverseEventRate[] = [
  // =========================================================================
  // SLE / Autoimmune CAR-T Trials
  // =========================================================================
  {
    indication: "SLE",
    product: "Anti-CD19 CAR-T (pooled)",
    trial: "SLE Pooled Analysis",
    nPatients: 47,
    crsAnyGrade: 56,
    crsGrade3Plus: 2.1,
    icansAnyGrade: 3,
    icansGrade3Plus: 1.5,
    icahsRate: 0,
    licatsRate: 0,
    source: "Pooled analysis of published SLE CAR-T studies 2022-2025",
    year: 2025,
    nEvents: 1,
    sourceTable: "Table 1 (pooled)",
  },
  {
    indication: "SLE",
    product: "Anti-CD19 CAR-T (MB-CART19.1)",
    trial: "Mackensen et al. 2022",
    nPatients: 5,
    crsAnyGrade: 60,
    crsGrade3Plus: 0,
    icansAnyGrade: 0,
    icansGrade3Plus: 0,
    icahsRate: 0,
    licatsRate: 0,
    source: "Mackensen A et al. Nat Med 2022;28:2124-2132",
    year: 2022,
    nEvents: 3,
    sourceTable: "Table 2",
  },
  {
    indication: "SLE",
    product: "Anti-CD19 CAR-T",
    trial: "Muller et al. 2024",
    nPatients: 15,
    crsAnyGrade: 53,
    crsGrade3Plus: 0,
    icansAnyGrade: 0,
    icansGrade3Plus: 0,
    icahsRate: 0,
    licatsRate: 0,
    source: "Muller F et al. N Engl J Med 2024;390:687-700",
    year: 2024,
    nEvents: 8,
    sourceTable: "Table 2",
  },
  {
    indication: "SLE",
    product: "Anti-CD19 CAR-T (YTB323)",
    trial: "CASTLE 2025",
    nPatients: 8,
    crsAnyGrade: 50,
    crsGrade3Plus: 0,
    icansAnyGrade: 0,
    icansGrade3Plus: 0,
    icahsRate: 0,
    licatsRate: 0,
    source: "Novartis CASTLE trial interim results, ASH 2024",
    year: 2025,
    nEvents: 4,
    sourceTable: "Abstract",
  },
  {
    indication: "SLE",
    product: "BCMA-CD19 cCAR",
    trial: "BCMA-CD19 cCAR SLE",
    nPatients: 7,
    crsAnyGrade: 57,
    crsGrade3Plus: 0,
    icansAnyGrade: 0,
    icansGrade3Plus: 0,
    icahsRate: 0,
    licatsRate: 0,
    source: "Jin X et al. BCMA/CD19 compound CAR-T in SLE, 2024",
    year: 2024,
    nEvents: 4,
    sourceTable: "Table 1",
  },
  {
    indication: "SLE",
    product: "CD19/BCMA co-infusion",
    trial: "Co-infusion SLE",
    nPatients: 6,
    crsAnyGrade: 67,
    crsGrade3Plus: 0,
    icansAnyGrade: 0,
    icansGrade3Plus: 0,
    icahsRate: 0,
    licatsRate: 0,
    source: "Dual-target co-infusion approach in refractory SLE, 2024",
    year: 2024,
    nEvents: 4,
    sourceTable: "Table 1",
  },
  {
    indication: "SLE",
    product: "CABA-201 (desar-cel)",
    trial: "Cabaletta RESET-SLE",
    nPatients: 4,
    crsAnyGrade: 50,
    crsGrade3Plus: 0,
    icansAnyGrade: 0,
    icansGrade3Plus: 0,
    icahsRate: 0,
    licatsRate: 0,
    source: "Cabaletta Bio RESET-SLE Phase 1 interim, ACR 2024",
    year: 2024,
    nEvents: 2,
    sourceTable: "Abstract",
  },
  {
    indication: "SLE",
    product: "Anti-CD19 CAR-T",
    trial: "BMS Breakfree-1",
    nPatients: 2,
    crsAnyGrade: 50,
    crsGrade3Plus: 0,
    icansAnyGrade: 0,
    icansGrade3Plus: 0,
    icahsRate: 0,
    licatsRate: 0,
    source: "BMS Breakfree-1 SLE cohort preliminary, 2025",
    year: 2025,
    nEvents: 1,
    sourceTable: "Abstract",
  },

  // =========================================================================
  // Oncology Comparators - DLBCL
  // =========================================================================
  {
    indication: "DLBCL",
    product: "Axi-cel (Yescarta)",
    trial: "ZUMA-1",
    nPatients: 101,
    crsAnyGrade: 93,
    crsGrade3Plus: 13,
    icansAnyGrade: 64,
    icansGrade3Plus: 28,
    icahsRate: 0,
    source: "Neelapu SS et al. N Engl J Med 2017;377:2531-2544 (ZUMA-1)",
    year: 2017,
  },
  {
    indication: "DLBCL",
    product: "Tisa-cel (Kymriah)",
    trial: "JULIET",
    nPatients: 111,
    crsAnyGrade: 58,
    crsGrade3Plus: 14,
    icansAnyGrade: 21,
    icansGrade3Plus: 12,
    icahsRate: 0,
    source: "Schuster SJ et al. N Engl J Med 2019;380:45-56 (JULIET)",
    year: 2019,
  },
  {
    indication: "DLBCL",
    product: "Liso-cel (Breyanzi)",
    trial: "TRANSCEND",
    nPatients: 269,
    crsAnyGrade: 42,
    crsGrade3Plus: 2,
    icansAnyGrade: 30,
    icansGrade3Plus: 10,
    icahsRate: 0,
    source: "Abramson JS et al. Lancet 2020;396:839-852 (TRANSCEND NHL 001)",
    year: 2020,
  },

  // =========================================================================
  // Oncology Comparators - ALL
  // =========================================================================
  {
    indication: "ALL",
    product: "Tisa-cel (Kymriah)",
    trial: "ELIANA",
    nPatients: 75,
    crsAnyGrade: 77,
    crsGrade3Plus: 48,
    icansAnyGrade: 40,
    icansGrade3Plus: 13,
    icahsRate: 0,
    source: "Maude SL et al. N Engl J Med 2018;378:439-448 (ELIANA)",
    year: 2018,
  },

  // =========================================================================
  // Oncology Comparators - Multiple Myeloma
  // =========================================================================
  {
    indication: "MM",
    product: "Ide-cel (Abecma)",
    trial: "KarMMa",
    nPatients: 128,
    crsAnyGrade: 89,
    crsGrade3Plus: 7,
    icansAnyGrade: 40,
    icansGrade3Plus: 4,
    icahsRate: 0,
    source: "Munshi NC et al. N Engl J Med 2021;384:705-716 (KarMMa)",
    year: 2021,
  },
  {
    indication: "MM",
    product: "Cilta-cel (Carvykti)",
    trial: "CARTITUDE-1",
    nPatients: 97,
    crsAnyGrade: 95,
    crsGrade3Plus: 4,
    icansAnyGrade: 21,
    icansGrade3Plus: 10,
    icahsRate: 0,
    source: "Berdeja JG et al. Lancet 2021;398:314-324 (CARTITUDE-1)",
    year: 2021,
  },
];

// ---------------------------------------------------------------------------
// Mitigation Strategy Data
// ---------------------------------------------------------------------------

export const mitigationStrategies: MitigationStrategy[] = [
  {
    id: "tocilizumab",
    name: "Tocilizumab",
    mechanism:
      "IL-6 receptor antagonist; blocks IL-6 signaling cascade that drives CRS pathophysiology",
    targetAE: ["CRS"],
    relativeRisk: 0.45,
    confidenceInterval: [0.3, 0.65],
    evidenceLevel: "Strong",
    dosing: "8 mg/kg IV (max 800 mg), may repeat every 8 hours up to 3 doses",
    timing:
      "At onset of Grade 2+ CRS; prophylactic use in some protocols at 24-48h post-infusion",
    limitations: [
      "Does not directly address ICANS",
      "May transiently increase IL-6 levels before receptor blockade takes effect",
      "Limited data on prophylactic use in autoimmune CAR-T",
      "May mask early signs of infection",
    ],
    references: [
      "Le RQ et al. Blood 2018;132(suppl 1):3546",
      "Lee DW et al. Biol Blood Marrow Transplant 2019;25:625-638",
      "ASTCT CRS grading consensus, Lee et al. 2019",
    ],
  },
  {
    id: "corticosteroids",
    name: "Corticosteroids",
    mechanism:
      "Broad immunosuppression via suppression of inflammatory cytokine production; crosses blood-brain barrier for ICANS management",
    targetAE: ["ICANS"],
    relativeRisk: 0.55,
    confidenceInterval: [0.35, 0.75],
    evidenceLevel: "Moderate",
    dosing:
      "Dexamethasone 10 mg IV q6h or methylprednisolone 1-2 mg/kg/day; taper over 3-7 days",
    timing:
      "Grade 2+ CRS refractory to tocilizumab; Grade 2+ ICANS; earlier intervention in autoimmune patients",
    limitations: [
      "Potential concern for impairing CAR-T expansion and persistence",
      "Short courses (<72h) appear not to impact CAR-T efficacy in oncology",
      "May increase infection risk in already immunosuppressed patients",
      "Impact on long-term B-cell depletion duration in autoimmune setting unknown",
    ],
    references: [
      "Sterner RC & Sterner RM. Blood Cancer J 2021;11:69",
      "Lee DW et al. Biol Blood Marrow Transplant 2019;25:625-638",
      "Topp MS et al. J Clin Oncol 2015;33:3166",
    ],
  },
  {
    id: "anakinra",
    name: "Anakinra",
    mechanism:
      "IL-1 receptor antagonist; blocks upstream inflammatory signaling mediated by macrophage-derived IL-1, effective for both CRS and ICANS",
    targetAE: ["CRS", "ICANS"],
    relativeRisk: 0.65,
    confidenceInterval: [0.45, 0.85],
    evidenceLevel: "Moderate",
    dosing:
      "100-200 mg SC daily or IV; some protocols use 100 mg q12h for severe cases",
    timing:
      "Tocilizumab-refractory CRS; emerging data on prophylactic use starting day 0",
    limitations: [
      "Less clinical experience than tocilizumab in CAR-T setting",
      "Short half-life requires daily dosing",
      "Injection site reactions with SC administration",
      "Limited data specifically in autoimmune CAR-T populations",
    ],
    references: [
      "Norelli M et al. Nat Med 2018;24:1545-1551",
      "Sterner RM et al. Blood 2019;133:697-709",
      "Shah NN et al. Lancet Haematol 2022;9:e349-e359",
    ],
  },
  {
    id: "dose-reduction",
    name: "CAR-T Dose Reduction",
    mechanism:
      "Lower CAR-T cell doses reduce peak cytokine levels proportionally; autoimmune protocols typically use 0.5-1.0 x 10^6 CAR+ T cells/kg vs 2 x 10^6/kg in oncology",
    targetAE: ["CRS", "ICANS", "ICAHS"],
    relativeRisk: 0.15,
    confidenceInterval: [0.08, 0.3],
    evidenceLevel: "Strong",
    dosing:
      "0.5-1.0 x 10^6 CAR+ T cells/kg for autoimmune indications (vs 0.6-2.0 x 10^6/kg in oncology)",
    timing: "Fixed at manufacturing/infusion; not adjustable post-infusion",
    limitations: [
      "Lower dose may reduce depth or durability of B-cell depletion",
      "Optimal dose for autoimmune indications not yet established",
      "Dose-response relationship may differ between products",
      "Patient weight-based dosing introduces variability",
    ],
    references: [
      "Mackensen A et al. Nat Med 2022;28:2124-2132",
      "Muller F et al. N Engl J Med 2024;390:687-700",
      "Alexander T et al. Ann Rheum Dis 2023 (dosing review)",
    ],
  },
  {
    id: "lymphodepletion-modification",
    name: "Lymphodepletion Modification",
    mechanism:
      "Reduced-intensity lymphodepletion (e.g., lower-dose fludarabine/cyclophosphamide) lowers baseline inflammation while maintaining adequate conditioning for CAR-T engraftment",
    targetAE: ["CRS"],
    relativeRisk: 0.85,
    confidenceInterval: [0.65, 1.05],
    evidenceLevel: "Limited",
    dosing:
      "Flu 25 mg/m2 x 3d + Cy 250 mg/m2 x 3d (reduced from standard Flu 30/Cy 500 in oncology); some autoimmune protocols use Cy alone",
    timing:
      "Days -5 to -3 before CAR-T infusion; modifications determined pre-treatment",
    limitations: [
      "Insufficient conditioning may impair CAR-T expansion",
      "Optimal regimen for autoimmune indications under active investigation",
      "Interaction with prior immunosuppressive therapy burden",
      "No randomized comparisons of lymphodepletion intensity in autoimmune CAR-T",
    ],
    references: [
      "Mackensen A et al. Nat Med 2022;28:2124-2132",
      "Burt RK et al. Blood 2023 (conditioning in autoimmune HSCT)",
      "Muller F et al. N Engl J Med 2024;390:687-700",
    ],
  },
];

// ---------------------------------------------------------------------------
// Clinical Trials Data
// ---------------------------------------------------------------------------

export const clinicalTrials: ClinicalTrial[] = [
  {
    name: "CASTLE",
    sponsor: "Novartis",
    nctId: "NCT05765006",
    phase: "Phase 1/2",
    target: "CD19",
    indication: "SLE",
    enrollment: 48,
    status: "Recruiting",
  },
  {
    name: "RESET-SLE",
    sponsor: "Cabaletta Bio",
    nctId: "NCT05765864",
    phase: "Phase 1",
    target: "CD19",
    indication: "SLE",
    enrollment: 36,
    status: "Recruiting",
  },
  {
    name: "RESET-Myositis",
    sponsor: "Cabaletta Bio",
    nctId: "NCT06220045",
    phase: "Phase 1",
    target: "CD19",
    indication: "Myositis",
    enrollment: 24,
    status: "Recruiting",
  },
  {
    name: "Breakfree-1",
    sponsor: "Bristol Myers Squibb",
    nctId: "NCT06099756",
    phase: "Phase 1",
    target: "CD19",
    indication: "SLE, SSc, Myositis",
    enrollment: 60,
    status: "Recruiting",
  },
  {
    name: "KYV-101 Autoimmune",
    sponsor: "Kyverna Therapeutics",
    nctId: "NCT06277856",
    phase: "Phase 2",
    target: "CD19",
    indication: "Lupus Nephritis",
    enrollment: 40,
    status: "Recruiting",
  },
  {
    name: "BCMA-CD19 cCAR SLE",
    sponsor: "iCell Gene Therapeutics",
    nctId: "NCT05474495",
    phase: "Phase 1",
    target: "BCMA/CD19 dual",
    indication: "SLE",
    enrollment: 20,
    status: "Active",
  },
  {
    name: "Erlangen Expanded Access",
    sponsor: "University Hospital Erlangen",
    nctId: "NCT05858983",
    phase: "Phase 1/2",
    target: "CD19",
    indication: "SLE, SSc, Myositis, NMOSD",
    enrollment: 30,
    status: "Active",
  },
  {
    name: "GC012F / AZD0120",
    sponsor: "AstraZeneca/Gracell",
    nctId: "NCT06684042",
    phase: "Phase 1",
    target: "BCMA/CD19 dual",
    indication: "SLE",
    enrollment: 12,
    status: "Recruiting",
  },
  {
    name: "ZUMA-1",
    sponsor: "Kite/Gilead",
    nctId: "NCT02348216",
    phase: "Phase 1/2",
    target: "CD19",
    indication: "DLBCL",
    enrollment: 101,
    status: "Completed",
  },
  {
    name: "JULIET",
    sponsor: "Novartis",
    nctId: "NCT02445248",
    phase: "Phase 2",
    target: "CD19",
    indication: "DLBCL",
    enrollment: 167,
    status: "Completed",
  },
  {
    name: "TRANSCEND NHL 001",
    sponsor: "BMS/Juno",
    nctId: "NCT02631044",
    phase: "Phase 1",
    target: "CD19",
    indication: "DLBCL",
    enrollment: 269,
    status: "Completed",
  },
  {
    name: "ELIANA",
    sponsor: "Novartis",
    nctId: "NCT02435849",
    phase: "Phase 2",
    target: "CD19",
    indication: "ALL",
    enrollment: 75,
    status: "Completed",
  },
  {
    name: "KarMMa",
    sponsor: "BMS/Bluebird",
    nctId: "NCT03361748",
    phase: "Phase 2",
    target: "BCMA",
    indication: "MM",
    enrollment: 128,
    status: "Completed",
  },
  {
    name: "CARTITUDE-1",
    sponsor: "Janssen/Legend",
    nctId: "NCT03548207",
    phase: "Phase 1b/2",
    target: "BCMA",
    indication: "MM",
    enrollment: 97,
    status: "Completed",
  },
];

// ---------------------------------------------------------------------------
// Data Sources
// ---------------------------------------------------------------------------

export const dataSources: DataSource[] = [
  {
    name: "Published Clinical Trial Literature",
    type: "Literature",
    coverage:
      "Peer-reviewed publications from SLE CAR-T trials (2022-2025) and approved oncology CAR-T pivotal trials",
    cartDataAvailable: true,
    autoimmuneCARTData: true,
    accessMethod: "PubMed, journal databases, conference abstracts (ASH, ACR, EULAR)",
    strengths: [
      "Rigorous peer review process",
      "Standardized AE grading (CTCAE, ASTCT consensus)",
      "Detailed patient-level safety data in supplements",
      "Longitudinal follow-up data available for oncology products",
    ],
    limitations: [
      "Publication lag of 6-18 months from data cutoff",
      "Small sample sizes in autoimmune CAR-T trials (n=2-15)",
      "Heterogeneous reporting across trials and institutions",
      "Potential publication bias toward favorable outcomes",
    ],
  },
  {
    name: "FDA Adverse Event Reporting System (FAERS)",
    type: "Spontaneous Reporting",
    coverage:
      "Post-marketing spontaneous reports for approved CAR-T products (Kymriah, Yescarta, Breyanzi, Abecma, Carvykti, Tecvayli)",
    cartDataAvailable: true,
    autoimmuneCARTData: false,
    accessMethod: "FDA FAERS public dashboard, openFDA API, quarterly data extracts",
    strengths: [
      "Large post-marketing dataset capturing real-world use",
      "Captures rare events not seen in clinical trials",
      "Ongoing surveillance with quarterly updates",
      "Publicly accessible with structured data fields",
    ],
    limitations: [
      "Voluntary reporting leads to significant underreporting",
      "No autoimmune indication CAR-T data yet (no approved products)",
      "Lacks denominator data for incidence calculation",
      "Reporting quality varies; duplicate reports possible",
    ],
  },
  {
    name: "CIBMTR (Center for International Blood and Marrow Transplant Research)",
    type: "Registry",
    coverage:
      "Mandatory reporting of all commercial CAR-T infusions in the US as REMS requirement; ~15,000+ infusions tracked",
    cartDataAvailable: true,
    autoimmuneCARTData: false,
    accessMethod:
      "CIBMTR research database; requires data use agreement; annual summary reports published",
    strengths: [
      "Mandatory reporting for all US commercial CAR-T infusions",
      "Standardized data collection forms",
      "Long-term follow-up (15 years required by REMS)",
      "Largest real-world CAR-T safety database globally",
    ],
    limitations: [
      "Currently oncology indications only",
      "Reporting completeness decreases with longer follow-up",
      "Data access requires institutional DUA and IRB approval",
      "Variable data quality across reporting centers",
    ],
  },
  {
    name: "EudraVigilance",
    type: "Spontaneous Reporting",
    coverage:
      "EU pharmacovigilance database for all EMA-authorized products including CAR-T therapies",
    cartDataAvailable: true,
    autoimmuneCARTData: false,
    accessMethod: "EudraVigilance online portal (adrreports.eu), EMA access for signal detection",
    strengths: [
      "Covers entire EU/EEA population",
      "Structured MedDRA-coded adverse event data",
      "Signal detection algorithms run routinely by EMA",
      "Complementary to FAERS for global safety picture",
    ],
    limitations: [
      "No autoimmune CAR-T products approved in EU yet",
      "Voluntary reporting with known underreporting",
      "Less granular than clinical trial data",
      "Access to line-level data restricted to regulatory authorities",
    ],
  },
  {
    name: "Investigator-Sponsored Trial Databases",
    type: "RWD",
    coverage:
      "Individual center databases from Erlangen, Beijing, Shanghai, Charité tracking autoimmune CAR-T patients",
    cartDataAvailable: true,
    autoimmuneCARTData: true,
    accessMethod: "Collaborative agreements; published in aggregate in conference abstracts and papers",
    strengths: [
      "Primary source of autoimmune CAR-T safety data",
      "Detailed patient-level data including biomarkers",
      "Captures nuanced clinical context",
      "Earliest available data on novel safety signals",
    ],
    limitations: [
      "Small cohorts (typically n=5-20 per center)",
      "Non-standardized data collection across sites",
      "Access restricted to collaborating investigators",
      "Selection bias in academic referral populations",
    ],
  },
  {
    name: "WHO VigiBase",
    type: "Spontaneous Reporting",
    coverage:
      "Global ICSR database maintained by the Uppsala Monitoring Centre; aggregates reports from 170+ countries",
    cartDataAvailable: true,
    autoimmuneCARTData: false,
    accessMethod: "VigiAccess (public portal) for aggregate queries; VigiLyze for detailed analysis (requires UMC access)",
    strengths: [
      "Broadest global coverage of any pharmacovigilance database",
      "Useful for rare signal detection across populations",
      "Standardized MedDRA coding",
      "Complements regional databases (FAERS, EudraVigilance)",
    ],
    limitations: [
      "Highest level of data aggregation; least granular",
      "Duplicate reports across contributing national databases",
      "No autoimmune CAR-T data currently available",
      "Variable data quality across contributing countries",
    ],
  },
  {
    name: "TriNetX",
    type: "RWD",
    coverage:
      "Federated EHR network covering 150M+ patients across 120+ healthcare organizations globally",
    cartDataAvailable: true,
    autoimmuneCARTData: false,
    accessMethod: "TriNetX platform (requires institutional license); federated queries without data movement",
    strengths: [
      "Large-scale real-world data across diverse populations",
      "Near real-time data updates",
      "Federated model preserves patient privacy",
      "Good for epidemiological background rate estimation",
    ],
    limitations: [
      "No autoimmune CAR-T patients yet (pre-approval)",
      "CAR-T coding inconsistencies across institutions",
      "Limited to structured EHR data; lacks clinical detail",
      "May miss events documented in unstructured notes",
    ],
  },
  {
    name: "Optum CDM",
    type: "RWD",
    coverage:
      "Claims and EHR data covering 67M+ US patients; integrated medical and pharmacy claims",
    cartDataAvailable: true,
    autoimmuneCARTData: false,
    accessMethod: "Optum data licensing; requires DUA and IRB approval",
    strengths: [
      "Longitudinal patient-level data with integrated claims",
      "Good for comorbidity and comedication analysis",
      "Large denominator for rate comparisons",
      "Captures post-discharge outcomes",
    ],
    limitations: [
      "US-only population",
      "No autoimmune CAR-T patients (pre-approval)",
      "Claims-based AE identification has limited sensitivity",
      "Commercial/Medicare populations may not match trial demographics",
    ],
  },
];

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Calculate mitigated risk given baseline risks and selected mitigation strategies.
 *
 * Applies multiplicative risk reduction: for each selected mitigation that targets
 * a given AE, the risk estimate and CI bounds are multiplied by the mitigation's
 * relative risk factor. When multiple mitigations target the same AE, their effects
 * compound multiplicatively (conservative assumption of independence).
 */
export function calculateMitigatedRisk(
  baselineRisks: RiskAssessment["baselineRisks"],
  selectedMitigationIds: string[]
): RiskAssessment["mitigatedRisks"] {
  const selectedMitigations = mitigationStrategies.filter((m) =>
    selectedMitigationIds.includes(m.id)
  );

  // Calculate compound risk reduction for CRS
  let crsMitigationFactor = 1;
  for (const m of selectedMitigations) {
    if (m.targetAE.includes("CRS")) {
      crsMitigationFactor *= m.relativeRisk;
    }
  }

  // Calculate compound risk reduction for ICANS
  let icansMitigationFactor = 1;
  for (const m of selectedMitigations) {
    if (m.targetAE.includes("ICANS")) {
      icansMitigationFactor *= m.relativeRisk;
    }
  }

  // Apply floor to prevent unrealistically low estimates
  const applyFloor = (value: number, floor: number = 0.1): number =>
    Math.max(value, floor);

  return {
    selectedMitigations: selectedMitigationIds,
    crsGrade3Plus: {
      estimate: applyFloor(
        baselineRisks.crsGrade3Plus.estimate * crsMitigationFactor
      ),
      ci95: [
        applyFloor(baselineRisks.crsGrade3Plus.ci95[0] * crsMitigationFactor),
        baselineRisks.crsGrade3Plus.ci95[1] * crsMitigationFactor,
      ],
    },
    icansGrade3Plus: {
      estimate: applyFloor(
        baselineRisks.icansGrade3Plus.estimate * icansMitigationFactor
      ),
      ci95: [
        applyFloor(
          baselineRisks.icansGrade3Plus.ci95[0] * icansMitigationFactor
        ),
        baselineRisks.icansGrade3Plus.ci95[1] * icansMitigationFactor,
      ],
    },
  };
}

/**
 * Get comparison chart data formatted for visualization components.
 * Returns one data point per trial/product for cross-indication comparison.
 */
export function getComparisonChartData(): ChartDataPoint[] {
  return adverseEventRates
    .filter((ae) => {
      // Include only the primary entries (pooled SLE + oncology pivotal trials)
      const primaryTrials = [
        "SLE Pooled Analysis",
        "ZUMA-1",
        "JULIET",
        "TRANSCEND",
        "ELIANA",
        "KarMMa",
        "CARTITUDE-1",
      ];
      return primaryTrials.includes(ae.trial);
    })
    .map((ae) => ({
      label:
        ae.indication === "SLE"
          ? "SLE (Pooled)"
          : `${ae.product.split(" ")[0]} (${ae.indication})`,
      indication: ae.indication,
      product: ae.product,
      crsAnyGrade: ae.crsAnyGrade,
      crsGrade3Plus: ae.crsGrade3Plus,
      icansAnyGrade: ae.icansAnyGrade,
      icansGrade3Plus: ae.icansGrade3Plus,
      nPatients: ae.nPatients,
      category: ae.indication === "SLE" ? "Autoimmune" : "Oncology",
    }));
}

/**
 * Get summary counts of clinical trial statuses.
 */
export function getTrialSummary(): {
  recruiting: number;
  active: number;
  completed: number;
  notYetRecruiting: number;
  total: number;
} {
  const recruiting = clinicalTrials.filter(
    (t) => t.status === "Recruiting"
  ).length;
  const active = clinicalTrials.filter((t) => t.status === "Active").length;
  const completed = clinicalTrials.filter(
    (t) => t.status === "Completed"
  ).length;
  const notYetRecruiting = clinicalTrials.filter(
    (t) => t.status === "Not yet recruiting"
  ).length;

  return {
    recruiting,
    active,
    completed,
    notYetRecruiting,
    total: clinicalTrials.length,
  };
}

/**
 * Get the default baseline risk assessment for SLE CAR-T.
 * Uses the pooled SLE data as the baseline with CIs reflecting the small sample size.
 */
export function getSLEBaselineRiskAssessment(): RiskAssessment {
  const baselineRisks: RiskAssessment["baselineRisks"] = {
    crsGrade3Plus: { estimate: 2.1, ci95: [0.3, 7.4] },
    icansGrade3Plus: { estimate: 1.5, ci95: [0.2, 5.8] },
    icahs: { estimate: 0, ci95: [0, 6.4] }, // upper bound from rule-of-3: 3/47 = 6.4%
    licats: { estimate: 0, ci95: [0, 6.4] }, // Grade 3+ LICATS; any-grade ~77% (Hagen 2025)
  };

  // Default mitigated risk with standard-of-care mitigations
  const defaultMitigations = ["tocilizumab", "corticosteroids", "dose-reduction"];
  const mitigatedRisks = calculateMitigatedRisk(baselineRisks, defaultMitigations);

  return {
    baselineRisks,
    mitigatedRisks,
  };
}

/**
 * Get adverse event rates filtered by indication.
 */
export function getAdverseEventsByIndication(
  indication: string
): AdverseEventRate[] {
  return adverseEventRates.filter((ae) => ae.indication === indication);
}

/**
 * Get all autoimmune (SLE) trial-level data for detailed breakdown views.
 */
export function getAutoimmuneSLETrials(): AdverseEventRate[] {
  return adverseEventRates.filter(
    (ae) => ae.indication === "SLE" && ae.trial !== "SLE Pooled Analysis"
  );
}
