# AI-Driven Safety Monitoring and Adverse Event Prediction Across the Cell Therapy Clinical Development Lifecycle

> **Document Classification**: CMO Presentation-Ready Technical Brief
> **Last Updated**: 2026-02-07
> **Scope**: CAR-T, Bispecific T-Cell Engagers (TCEs), and related immune effector cell therapies
> **Regulatory Jurisdictions**: FDA (US), EMA (EU)

---

## Executive Summary

Cell therapies -- particularly chimeric antigen receptor T-cell (CAR-T) therapies and bispecific T-cell engagers (TCEs) -- present a fundamentally different safety monitoring challenge than small molecules or conventional biologics. Their toxicities (cytokine release syndrome, neurotoxicity, cytopenias, infections, secondary malignancies) are mechanistically linked to the therapy's mechanism of action, emerge on timescales from hours to years, and vary dramatically based on patient-specific, disease-specific, and product-specific factors.

An AI-driven safety monitoring system must therefore evolve across the clinical development lifecycle: learning from sparse preclinical signals, adapting in real time during first-in-human dosing, refining risk stratification as cohorts expand, validating prospectively in pivotal trials, and integrating with post-market surveillance infrastructure that spans 15 years of mandatory follow-up.

This document details exactly how such a system operates at each phase, what data flows in and out, what predictions are most valuable to clinical teams, and what regulatory bodies expect.

---

## Table of Contents

1. [Phase 0: Preclinical / IND-Enabling](#1-phase-0-preclinical--ind-enabling)
2. [Phase 1: First-in-Human / Dose Escalation](#2-phase-1-first-in-human--dose-escalation)
3. [Phase 2: Expansion Cohorts](#3-phase-2-expansion-cohorts)
4. [Phase 3: Pivotal Trials](#4-phase-3-pivotal-trials)
5. [Phase 4: Post-Market Surveillance](#5-phase-4-post-market-surveillance)
6. [Cross-Cutting: REMS Programs and Their Evolution](#6-cross-cutting-rems-programs-and-their-evolution)
7. [Cross-Cutting: Regulatory Frameworks for AI in Safety Monitoring](#7-cross-cutting-regulatory-frameworks-for-ai-in-safety-monitoring)
8. [Cross-Cutting: FACT Accreditation and Site Readiness](#8-cross-cutting-fact-accreditation-and-site-readiness)
9. [System Architecture: End-to-End Data Flow](#9-system-architecture-end-to-end-data-flow)

---

## 1. Phase 0: Preclinical / IND-Enabling

### 1.1 Available Safety Data Before First-in-Human

At the IND-enabling stage, the safety data landscape for a cell therapy product is fundamentally more limited than for a conventional drug. The data available includes:

**In Vitro Characterization Data**
- Cytokine release assays (CRA): Co-culture of CAR-T cells with target-expressing and target-negative cell lines, measuring supernatant levels of IFN-gamma, TNF-alpha, IL-2, IL-6, GM-CSF, and IL-10 at 24h, 48h, and 72h time points
- On-target/off-tumor reactivity panels: Screening the CAR construct against panels of normal human tissues to identify potential cross-reactivity
- T-cell exhaustion markers (PD-1, TIM-3, LAG-3 expression) under tonic signaling conditions
- Activation-induced cell death (AICD) assays
- Transduction efficiency and vector copy number per cell
- CAR surface expression density (molecules per cell by quantitative flow cytometry)

**Syngeneic and Transgenic Murine Models**
- Tumor clearance kinetics and associated cytokine profiles in immunocompetent mice bearing murine tumors expressing the human target antigen
- Limitation: Mouse immune systems differ fundamentally from human -- Fc receptors, cytokine biology, and myeloid compartment behavior all diverge

**Humanized Mouse Models**
- NSG-SGM3 mice (NOD-scid IL2Rgamma-null expressing human SCF, GM-CSF, and IL-3) reconstituted with human CD34+ hematopoietic stem cells provide a functional human myeloid compartment
- These models can reproduce CRS: humanized SGM3 recipient mice with human myeloid cells experience severe, sometimes fatal CRS within one week of CAR-T cell infusion
- Critical insight: Monocyte/macrophage-derived IL-1 and IL-6 drive CRS pathophysiology in these models, consistent with clinical observations

**Non-Human Primate (NHP) Studies**
- NHP models can mimic human CRS and neurotoxicity and provide mechanistic insight
- Particularly valuable for constructs targeting antigens with NHP homologs (e.g., CD20, BCMA)
- Limitation: NHP studies are expensive, involve small group sizes (typically n=3-5 per dose), and may not perfectly predict human dose-response relationships
- Cerebrospinal fluid sampling in NHPs can inform blood-brain barrier penetration and neurotoxicity risk

**Molecular and Structural Feature Analysis of the CAR Construct**

The structural design of the CAR construct itself carries significant predictive information for toxicity:

| CAR Component | Design Feature | Toxicity Correlation |
|---|---|---|
| **scFv Binding Domain** | Higher affinity (lower Kd) | Generally associated with more potent activation but also higher on-target/off-tumor toxicity. Affinity tuning (increasing Kd to the 10-100 nM range) can reduce toxicity while maintaining efficacy |
| **scFv Framework** | Aggregation-prone sequences | Tonic signaling, early T-cell exhaustion, unpredictable activation kinetics |
| **Hinge/Spacer** | CD28-derived hinge and transmembrane domains | Associated with higher incidence of CRS and neurotoxicity compared to CD8-derived hinge, regardless of costimulatory domain choice |
| **Hinge Length** | Short vs. long spacers | Impacts immune synapse distance; must be matched to epitope accessibility. IgD hinge provides better recognition of sterically hindered epitopes |
| **Costimulatory Domain** | CD28 vs. 4-1BB | CD28: faster T-cell expansion, higher peak cytokine levels, earlier CRS onset. 4-1BB: slower expansion, more durable persistence, generally lower acute toxicity |
| **Dual Costimulation** | CD28 + 4-1BB combined | Can potentiate lower-affinity CARs without proportionally increasing on-target/off-tumor toxicity |
| **Vector Copy Number** | High VCN per cell | Higher CAR surface density, potentially higher tonic signaling and activation threshold variability |

### 1.2 How AI Predicts CRS/ICANS Risk from Preclinical Data

At this stage, the AI system operates as a **structural risk profiler**, not a patient-level predictor. Its role:

**Construct-Level Risk Scoring**
- Input: CAR construct sequence (scFv, hinge, TM, costimulatory, CD3-zeta), vector design, manufacturing parameters
- Feature extraction: Binding affinity predictions (from structural modeling), aggregation propensity scores, tonic signaling risk based on framework sequences
- Historical mapping: Comparison to all published and internal CAR constructs with known clinical toxicity profiles
- Output: Risk category (low/medium/high) for CRS, ICANS, prolonged cytopenias, and on-target/off-tumor toxicity, with confidence intervals and the specific structural features driving each risk

**Preclinical-to-Clinical Translation Model**
- Input: In vitro CRA cytokine profiles (IL-6, IFN-gamma, TNF-alpha kinetics), humanized mouse CRS severity data, NHP toxicology findings
- Transfer learning approach: Using cytokine profile patterns from COVID-19 inflammatory datasets (which share IL-6/IL-1 driven pathophysiology) to compensate for limited CAR-T preclinical sample sizes (the PrCRS approach)
- Output: Predicted clinical CRS grade distribution at proposed starting dose, with uncertainty quantification

**IND Safety Section Support**
- Automated compilation of preclinical safety signals into structured IND Module 2.4 (Nonclinical Overview) and Module 2.6 (Nonclinical Written and Tabulated Summaries) format
- Flagging of any construct features that deviate from approved product benchmarks (Yescarta, Kymriah, Tecartus, Breyanzi, Abecma, Carvykti)
- Proposed starting dose justification informed by preclinical-to-clinical scaling models

### 1.3 What the Clinical Team Needs to See

- Comparative toxicity profile of the proposed construct vs. approved CAR-T products, mapped to specific structural features
- Predicted CRS/ICANS severity distribution at the proposed starting dose
- Recommended monitoring intensity for the first-in-human protocol, calibrated to construct risk level
- Proposed dose-escalation schema informed by preclinical dose-response data

### 1.4 What Regulators Expect

- FDA (CBER): Comprehensive nonclinical pharmacology/toxicology package per "Considerations for the Development of Chimeric Antigen Receptor (CAR) T Cell Products" guidance. Expects justification that animal models were adequate or, if not, that the risk is mitigated by clinical monitoring design
- EMA (CAT/CHMP): As of July 2025, the new guideline on quality, non-clinical, and clinical requirements for investigational ATMPs in clinical trials requires demonstration that nonclinical studies adequately characterize the risk profile to support first-in-human dosing

---

## 2. Phase 1: First-in-Human / Dose Escalation

### 2.1 Trial Design Context

- Typical enrollment: 20-50 patients across 3-6 dose levels
- Common designs: 3+3 rule-based escalation (used in 31.2% of CAR-T Phase 1 trials), modified continual reassessment method (mCRM), Bayesian Optimal Interval (BOIN) design, or mTPI-2 (modified Toxicity Probability Interval)
- Target DLT rate: Typically 30% with equivalence interval of 25-35%
- DLT evaluation window: Approximately 63.3% of trials use a window within 6 weeks post-infusion; many are 28 days
- Critical limitation: 45% of published Phase 1 CAR-T trials did not clearly report DLT definitions with explicit statements on CRS and neurotoxicity grading

### 2.2 Real-Time Data Collection

The data streams flowing into the safety monitoring system during Phase 1 are intensive:

**Vital Signs (Continuous/High-Frequency)**
- Heart rate, blood pressure, temperature, respiratory rate, SpO2
- Frequency: Continuous telemetry for the first 72h post-infusion, then q4h vitals through Day +14, then q8h through Day +28
- Temperature is the earliest clinical indicator of CRS onset (often preceding cytokine elevation)

**Laboratory Panels**
- Complete blood count with differential: Daily Days 0-14, then 2-3 times/week through Day 28, then weekly through Month 3, then monthly through Year 1
- Comprehensive metabolic panel (including LDH, creatinine): Daily through Day 14
- Coagulation (PT/INR, D-dimer, fibrinogen): Baseline, then at CRS onset and daily during active CRS
- Ferritin: Baseline, Day +3, Day +7, Day +14, and at CRS onset
- CRP: Daily Days 0-14

**Cytokine Panels**
- Core panel: IL-6, IL-1-beta, IFN-gamma, TNF-alpha, IL-2, IL-10, IL-8, IL-15, GM-CSF
- Frequency: Baseline (pre-lymphodepletion), Day -1 (post-lymphodepletion, pre-infusion), then Days +1, +3, +5, +7, +10, +14, +21, +28
- Turnaround time: Multiplex immunoassay results within 4-6 hours at specialized centers; this latency is a key challenge for real-time prediction

**Neurotoxicity Assessment**
- ICE (Immune Effector Cell-Associated Encephalopathy) score: Assessed daily for first 14 days, then at each visit
- Components: Orientation, naming, following commands, writing, attention (serial subtraction)
- CTCAE grading of neurological adverse events
- Brain MRI: Baseline and at onset of Grade 2+ ICANS

**CAR-T Cell Kinetics**
- Peripheral blood CAR-T cell quantification by flow cytometry and/or qPCR: Days +1, +3, +5, +7, +10, +14, +21, +28, then monthly
- Peak expansion typically Day +7 to Day +14
- Expansion kinetics correlate with both efficacy and toxicity

**Composite Risk Scores (Calculated in Real Time)**
- EASIX: LDH x Creatinine / Platelets (endothelial activation and stress index)
- m-EASIX: LDH x CRP / Platelets (modified EASIX, replaces creatinine with CRP)
- m-EASIX achieves AUC of 80.4% at lymphodepletion, 73.0% at Day -1, and 75.4% at Day +1 for predicting severe CRS
- EASIX and m-EASIX also predict ICANS, with m-EASIX generally outperforming EASIX

### 2.3 How the System Learns from the First Few Patients

This is the most technically challenging phase. The system must make useful predictions with n=3, n=10, n=20.

**n=1 to n=3: Bayesian Prior-Informed Predictions**
- The system begins with strong priors derived from:
  - Preclinical construct risk scoring (Phase 0 output)
  - Published clinical data from approved CAR-T products with similar constructs
  - Pooled meta-analytic data from 5,500+ published CAR-T patients (secondary malignancy rate: 5.8% across all studies; T-cell malignancy rate: 0.09%)
  - Cytokine kinetic profiles from analogous products
- For the first 1-3 patients, the system does NOT attempt individual-level outcome prediction. Instead, it provides:
  - Real-time CRS grading assistance (automated ASTCT consensus criteria scoring from vitals and labs)
  - Cytokine trajectory tracking against expected profiles from similar constructs
  - Early warning flags when any biomarker crosses predefined thresholds (e.g., ferritin >10,000 ng/mL, IL-6 >1000 pg/mL, CRP >20 mg/dL)
  - Bayesian posterior updates to the construct risk profile based on observed vs. predicted toxicity

**n=5 to n=10: Transfer Learning Activation**
- With 5-10 patients, the system activates transfer learning models:
  - PrCRS-style approach: A deep learning model pre-trained on COVID-19 inflammatory response data (which shares IL-6/IL-1 driven CRS pathophysiology) is fine-tuned on the accumulating CAR-T patient data
  - The model predicts probability of severe CRS at 1-day, 2-day, and 3-day horizons using dynamic features (vital sign trends, lab trajectories, cytokine slopes)
  - Key biomarkers at this stage: Lymphocyte counts (AUC 0.81) and IL-2 levels (AUC 0.78) at fever onset; their combination achieves AUC 0.85 for predicting severe CRS
- Simultaneously, a multivariate risk model begins fitting:
  - Pre-infusion features: Disease burden, LDH, ferritin, CRP, D-dimer, EASIX score, prior therapy lines
  - Product features: Dose level, CAR-T cell viability, transduction efficiency, CD4:CD8 ratio
  - Dynamic features: Time-to-first-fever, peak temperature, cytokine slope in first 48h

**n=10 to n=20: Initial Risk Stratification**
- The model begins differentiating low-risk from high-risk patients with clinically meaningful discrimination (target AUC >0.75)
- A multivariate model for any-grade ICANS incorporating CAR-T product type, time to CRS onset, IL-6 at Day +3, and pre-infusion D-dimer has achieved AUC 0.83 in published cohorts
- The system generates preliminary risk strata that inform:
  - Whether patients at a new dose level need inpatient vs. outpatient monitoring
  - Which patients may benefit from early intervention (e.g., early tocilizumab at CRS Grade 1, which reduced ICU admissions by 40% in published data)
  - Dose-escalation recommendations to the trial steering committee

### 2.4 DLT Assessment Integration

The system provides structured DLT adjudication support:
- Automated flagging of all adverse events meeting pre-specified DLT criteria
- Time-to-DLT analysis with dose-response modeling
- For Bayesian designs (BOIN, mTPI-2): Real-time posterior probability calculations for dose-escalation, stay, or de-escalation decisions
- Differentiation of CRS-related DLTs from non-CRS DLTs (important because CRS DLTs may be more manageable with improved supportive care, while non-CRS DLTs may be dose-limiting)

### 2.5 DSMB Reporting

Data Safety Monitoring Board packages generated by the system include:
- Patient-level toxicity narratives with automated timeline reconstruction
- Dose-level summary tables: DLT rates, CRS rates by grade (ASTCT criteria), ICANS rates by grade, other Grade 3+ adverse events
- Kaplan-Meier curves for time-to-CRS-onset and time-to-ICANS-onset by dose level
- Bayesian dose-toxicity model output with recommended dose for next cohort
- Aggregate cytokine response patterns by dose level
- CAR-T cell expansion kinetics by dose level with correlation to toxicity
- Any emerging safety signals (e.g., unexpected organ toxicities, delayed cytopenias, infections)

### 2.6 What the Clinical Team Needs to See

- **For the treating physician (real time)**: Current patient CRS/ICANS grade, trajectory prediction for next 24-48h, recommended intervention thresholds, vital sign and lab trend dashboards
- **For the medical monitor**: Cross-patient comparison at same dose level, aggregate toxicity rates vs. stopping boundaries, flag any patient whose trajectory deviates from expected pattern
- **For the study leadership**: Dose-escalation recommendation with confidence interval, comparison to competitive products at similar doses, emerging efficacy-toxicity trade-off data

### 2.7 What Regulators Expect

- IND safety reports (21 CFR 312.32): Expedited reporting of serious and unexpected adverse events within 15 calendar days (7 days for fatal/life-threatening)
- Annual IND safety update (21 CFR 312.33): Comprehensive annual summary of all safety data
- For FDA, CBER reviewers expect clear documentation of CRS and ICANS management algorithms used in the protocol, and how dose-escalation decisions were informed by emerging safety data
- EMA expects compliance with the ATMP clinical trial guideline (effective July 2025), including demonstration that safety monitoring intensity is proportionate to the identified risk profile

---

## 3. Phase 2: Expansion Cohorts

### 3.1 Trial Context

- Cohort sizes: 50-200 patients, often across multiple indications or patient subgroups
- Purpose: Confirm recommended Phase 2 dose (RP2D), explore activity across indications, refine safety profile
- Multiple expansion cohorts may run in parallel (e.g., relapsed DLBCL, transformed FL, primary refractory disease)

### 3.2 Subgroup Risk Stratification Emerging

With 50-200 patients, the system has sufficient data to begin meaningful subgroup analyses:

**Pre-Infusion Risk Model (Validated)**
- Inputs: Age, ECOG performance status, disease burden (metabolic tumor volume on PET, LDH), number of prior therapy lines, bridging therapy use, baseline CRP, ferritin, D-dimer, EASIX/m-EASIX scores, lymphodepletion regimen intensity
- Outputs: Individual patient probability of Grade 3+ CRS, any-grade ICANS, Grade 3+ ICANS, ICU admission, prolonged cytopenia (Day +28 ANC <500)
- Clinical utility: Allows prospective risk-adapted monitoring (high-risk patients: mandatory inpatient monitoring, ICU bed reservation; low-risk patients: potential for outpatient management after initial observation)

**Dynamic Risk Model (Hour-by-Hour Post-Infusion)**
- Continuously updated prediction incorporating vital sign trends, lab results, cytokine trajectories, and CAR-T cell expansion kinetics
- Key inflection points:
  - Days 0-3: Fever onset timing, initial cytokine surge
  - Days 3-7: Peak expansion, peak cytokine levels, CRS severity peak
  - Days 7-14: Late CRS (rare but clinically significant), ICANS window (ICANS occurred in 36% of patients in large published cohorts, more frequently with axicabtagene ciloleucel at 46% vs. 21% for other products)
  - Days 14-28: Infection risk (14.5% of patients within 28 days post-infusion; most common cause of death after Week 2)

**Product-Specific Differentiation**
- As data accumulates, the model captures product-specific toxicity signatures:
  - CD28-costimulated CARs (Yescarta/Tecartus): Higher peak cytokine levels, earlier CRS onset, higher ICANS rates
  - 4-1BB-costimulated CARs (Kymriah/Breyanzi): More gradual onset, generally lower CRS severity, different cytokine kinetic profiles
  - BCMA-directed CARs (Abecma/Carvykti): Different target biology, distinct toxicity spectrum (including movement and neurocognitive treatment-emergent adverse events with Carvykti)

### 3.3 How the Model Improves with More Data

**Recalibration Cycle**
- Every 10-20 new patients: Model coefficients are re-estimated, discrimination (AUC) and calibration (Brier score) are recalculated
- Subgroup-specific models are activated once a subgroup reaches n=20-30
- New features are evaluated: Any novel biomarker or clinical variable that shows univariate association with toxicity is tested for incremental model improvement

**External Data Integration**
- Published CRS/ICANS prediction models serve as benchmarks:
  - Serum and CSF cytokine profiling for ICANS (AUC 0.83 for any-grade ICANS prediction using CAR-T product, time to CRS onset, IL-6 at Day +3, and pre-infusion D-dimer)
  - Machine learning models achieving prediction of CRS onset up to 3 days before clinical manifestation
- Cross-trial learning: If the sponsor has multiple CAR-T programs, models trained on one program's data can transfer to another (domain adaptation)

**Emerging Signal Detection**
- At this stage, the system begins performing formal signal detection for unexpected toxicities:
  - Observed-vs-expected analysis for all MedDRA System Organ Classes
  - Temporal pattern analysis (are delayed toxicities emerging that were not seen in smaller Phase 1 cohorts?)
  - Correlation analysis: Do specific manufacturing lot characteristics (viability, transduction efficiency, CD4:CD8 ratio, memory T-cell phenotype) correlate with toxicity outcomes?

### 3.4 Integration with Clinical Operations

**Site Alerting System**
- Automated alerts to site investigators when:
  - A patient's dynamic risk score crosses a predefined threshold
  - A patient's cytokine trajectory matches a pattern previously associated with rapid deterioration
  - Laboratory values trigger protocol-specified intervention criteria
- Alert fatigue mitigation: Alerts are tiered (informational, advisory, urgent) with different delivery channels (dashboard notification vs. SMS/page)

**Protocol Amendment Support**
- The system generates data packages to support protocol amendments:
  - If CRS rates at a dose level exceed expectations: Evidence summary for dose modification or mandatory pre-medication (e.g., prophylactic tocilizumab, which reduced CRS rates from 72% to 10-26% in published TCE data)
  - If monitoring can be safely reduced: Data supporting shortened mandatory monitoring periods (evidence shows new-onset CRS after 2 weeks is 0%, and new-onset ICANS after 2 weeks is 0.7%)
  - If a new at-risk subgroup is identified: Proposed enrichment or stratification criteria

### 3.5 What Regulators Expect

- Ongoing IND safety reporting continues
- FDA may request interim safety updates, particularly for novel targets or novel construct designs
- EMA may require a protocol amendment if the observed safety profile materially differs from what was predicted in the IND/CTA
- Both agencies expect that dose-selection rationale for pivotal trial is grounded in a rigorous benefit-risk assessment from Phase 1/2 data

---

## 4. Phase 3: Pivotal Trials

### 4.1 Trial Context

- Hundreds of patients (200-500+), potentially across 30-80 clinical sites globally
- Often single-arm (for rare hematologic malignancies) or randomized (for more common indications)
- Primary endpoints: Overall response rate (ORR), complete response (CR) rate, progression-free survival (PFS), or overall survival (OS)
- Safety database must meet pre-BLA requirements

### 4.2 Prospective Validation of Prediction Models

This is where Phase 1/2 models prove their worth -- or reveal their limitations:

**Pre-Specified Validation Protocol**
- Risk stratification model is locked (no further recalibration) before the pivotal trial begins
- Prospective validation endpoints:
  - Discrimination: AUC for predicting Grade 3+ CRS (target: >0.75), any-grade ICANS (target: >0.70)
  - Calibration: Predicted vs. observed event rates within each risk stratum
  - Clinical utility: Net reclassification improvement (NRI) vs. clinical judgment alone
- Results are reported in the BLA submission as a companion analysis

**Adaptive Monitoring Based on Risk Score**
- If validated, the risk model can inform prospective monitoring intensity:
  - Low-risk patients (predicted CRS Grade 0-1): Shorter mandatory inpatient observation, earlier transition to outpatient monitoring
  - High-risk patients (predicted CRS Grade 3+): Intensified monitoring, prophylactic interventions, ICU bed reservation
  - This has direct health-economic implications: Reducing unnecessary ICU days for low-risk patients while ensuring high-risk patients receive appropriate surveillance

### 4.3 Integration with Electronic Data Capture (EDC)

**Real-Time Data Pipeline**
- EDC system (e.g., Medidata Rave, Oracle Clinical One, Veeva Vault CDMS) feeds structured data to the safety monitoring platform:
  - Adverse event reports (onset, grade, management, resolution)
  - Concomitant medications (especially tocilizumab, corticosteroids, anti-IL-1 agents)
  - Laboratory data (centralized and local labs)
  - Vital signs (from site eCRF entries and, where available, connected devices)
- Data reconciliation: Medical coding (MedDRA) is applied in near-real-time; the system flags coding inconsistencies for medical monitor review

**Automated Safety Narrative Generation**
- For SAEs (Serious Adverse Events) requiring expedited reporting, the system generates draft CIOMS-I narratives from structured EDC data
- Medical monitors review and finalize; this reduces narrative preparation time from hours to minutes
- The 15-day expedited reporting clock (21 CFR 600.80 for biologics) requires rapid turnaround

### 4.4 Real-Time Safety Dashboards for Medical Monitors

The dashboard architecture for a pivotal cell therapy trial includes:

**Patient-Level View**
- Current CRS/ICANS grade with automated ASTCT grading
- Vital sign trend graphs (48h rolling window)
- Lab value trajectories with normal ranges and alert thresholds
- Cytokine panel results (latest + trajectory)
- CAR-T cell expansion curve (latest + predicted peak)
- Risk score trajectory (pre-infusion score + dynamic updates)
- Intervention log (tocilizumab doses, corticosteroid use, vasopressor requirement, ICU transfer)

**Site-Level View**
- Aggregate CRS/ICANS rates by grade
- Mean time-to-onset and duration
- Tocilizumab utilization rates
- ICU transfer rates
- Active patients in monitoring window vs. completed monitoring

**Study-Level View**
- Cumulative safety summary (all grades, all System Organ Classes)
- Bayesian posterior estimates of true Grade 3+ CRS rate (with credible intervals)
- Safety trends over time (are rates changing as sites gain experience?)
- Site-to-site variation analysis (are specific sites outliers?)
- Efficacy-safety correlation (are higher-risk patients also higher-response patients?)

### 4.5 IDMC (Independent Data Monitoring Committee) Reporting

For pivotal cell therapy trials, the IDMC role is particularly critical because:
- Toxicities can be life-threatening and are inherent to mechanism of action
- Benefit-risk balance may shift as longer follow-up accumulates
- Secondary malignancy signals (discussed in Section 5) may emerge during the trial

**IDMC Report Package (generated quarterly or per charter)**
- Unblinded safety data by treatment arm (if randomized)
- Cumulative incidence of CRS Grade 3+, ICANS Grade 3+, treatment-related mortality
- Time-to-event analyses for key toxicities
- Bayesian predictive probability of meeting safety thresholds at final analysis
- AI model performance metrics (discrimination, calibration) as they track prospectively
- Any emerging signals: Disproportionality analyses across MedDRA preferred terms
- Recommendation framework: Continue as planned / modify protocol / suspend enrollment / terminate trial

### 4.6 Pre-BLA Safety Database Requirements

The BLA safety database for a cell therapy must include:

**Integrated Summary of Safety (ISS)**
- All patients exposed to the product across all clinical studies
- Minimum follow-up: Typically 6-12 months for all patients in the pivotal trial
- Adverse event tables by System Organ Class and Preferred Term (MedDRA)
- Detailed analyses of special-interest toxicities: CRS, ICANS, cytopenias, infections, hypogammaglobulinemia, secondary malignancies
- Subgroup analyses by demographics, disease characteristics, dose level, manufacturing parameters

**Risk Management Plan Elements**
- Proposed REMS (if applicable -- see Section 6 for current status)
- Risk-benefit analysis with quantitative framework
- Proposed labeling: Boxed warnings, warnings and precautions, adverse reactions table

**Long-Term Follow-Up Commitment**
- 15-year post-marketing observational safety study design (required for all gene therapy products, including CAR-T cells)
- Focused on: Secondary malignancies, delayed cytopenias, long-term immune reconstitution, insertional mutagenesis risk, replication-competent lentivirus/retrovirus testing

### 4.7 What the Clinical Team Needs to See

- Real-time study-wide safety posture (are we within expected bounds?)
- Emerging signals that may require protocol amendment or communication to IRBs/ECs
- Site-level performance metrics (are any sites managing toxicity differently?)
- Patient-level risk scores that inform individual management decisions

### 4.8 What Regulators Expect

- FDA (CBER): Complete safety database meeting ICH E1 exposure requirements, with ISS formatted per CTD Module 2.7.4. Real-time serious adverse event reporting continues. Pre-BLA meeting to align on safety database adequacy.
- EMA (CAT): Assessment by the Committee for Advanced Therapies, with focus on long-term safety data adequacy, risk management plan, and pharmacovigilance plan

---

## 5. Phase 4: Post-Market Surveillance

### 5.1 Regulatory Reporting Infrastructure

**FAERS (FDA Adverse Event Reporting System)**
- Post-marketing adverse experience reports are submitted under 21 CFR 600.80 for biologics
- Expedited 15-day reports for serious, unexpected adverse events
- Periodic adverse experience reports (PAERs) submitted at defined intervals
- The system automates:
  - Case intake and triage
  - MedDRA coding
  - Duplicate detection
  - Causality assessment assistance (using structured frameworks such as WHO-UMC or Naranjo, with AI augmentation)
  - Signal detection using disproportionality analysis: Proportional Reporting Ratio (PRR), Reporting Odds Ratio (ROR), Bayesian Confidence Propagation Neural Network (BCPNN), Multi-item Gamma Poisson Shrinker (MGPS)

**EudraVigilance (EU)**
- Individual Case Safety Reports (ICSRs) submitted per EU requirements
- Signal detection conducted by EMA Pharmacovigilance Risk Assessment Committee (PRAC)
- For ATMPs: Enhanced pharmacovigilance requirements including extended follow-up

### 5.2 REMS Program Status and Evolution

As of 2025-2026, the FDA has removed REMS requirements for all six currently approved autologous CAR-T cell therapies:
- **Yescarta** (axicabtagene ciloleucel) -- Gilead/Kite
- **Kymriah** (tisagenlecleucel) -- Novartis
- **Tecartus** (brexucabtagene autoleucel) -- Gilead/Kite
- **Breyanzi** (lisocabtagene maraleucel) -- BMS/Juno
- **Abecma** (idecabtagene vicleucel) -- BMS/Bluebird
- **Carvykti** (ciltacabtagene autoleucel) -- J&J/Legend

The FDA's rationale: Accumulated real-world experience demonstrates that safety information can be adequately conveyed through standard product labeling rather than requiring specialized programs.

However, the following post-marketing requirements remain:
- 15-year observational safety studies for all products
- Post-marketing studies to assess secondary malignancy risk
- Boxed warnings for CRS, neurotoxicity, AND secondary T-cell malignancies (added January 2024)

**For TCEs**: Some bispecific T-cell engagers retain REMS requirements. Teclistamab carries a boxed warning and REMS due to CRS risk (72% incidence) and neurologic toxicity (57% incidence, including 6% ICANS).

### 5.3 Secondary Malignancy Surveillance

This is the most active post-market safety concern for CAR-T therapies as of 2026:

**The Signal**
- In November 2023, FDA issued a safety communication regarding T-cell malignancies (including CAR-positive lymphoma) following CAR-T therapy
- As of December 31, 2023: 22 cases of T-cell cancers reported, including 17 T-cell non-Hodgkin lymphomas (majority anaplastic large T-cell lymphoma)
- Onset range: 1 to 19 months post-infusion, approximately 50% within the first year
- January 2024: FDA required class-wide boxed warnings for secondary T-cell malignancy risk across all approved CAR-T products
- Overall secondary malignancy rate across 5,517 patients in meta-analysis: 5.8%, with T-cell malignancy rate of 0.09%

**AI-Driven Surveillance Approach**
- Automated screening of FAERS reports for secondary malignancy signals in CAR-T-treated patients
- Disproportionality analysis comparing secondary malignancy rates in CAR-T patients vs. matched populations receiving standard chemotherapy/immunotherapy
- Real-world data integration from CIBMTR and EBMT registries (see below) for denominator-based incidence estimation
- Natural language processing of published case reports and conference abstracts for emerging signal enrichment

**February 2026 Development**: FDA officials are now pushing for mandatory long-term monitoring of autoimmune disease patients receiving CAR-T therapy (an emerging off-label/investigational use), recognizing that the safety profile may differ from oncology populations.

### 5.4 15-Year Long-Term Follow-Up (LTFU)

CAR-T cells qualify as gene therapy medicinal products, triggering mandatory 15-year LTFU:

**Monitoring Schedule (Typical)**
- Years 1-5: Annual visits with physical exam, CBC, comprehensive metabolic panel, immunoglobulin levels, lymphocyte subset analysis, replication-competent retrovirus/lentivirus (RCR/RCL) testing
- Years 6-15: Annual patient-reported questionnaire +/- annual visit (varies by protocol)

**Data Collected**
- New malignancies (any type, with special attention to hematologic malignancies and T-cell neoplasms)
- New autoimmune disorders
- New neurological disorders
- Infections (especially opportunistic, suggesting persistent immune dysfunction)
- Immune reconstitution parameters
- Pregnancy outcomes (if applicable)
- Patient survival and cause of death

**AI System Role in LTFU**
- Patient engagement automation: Reminder systems for annual follow-up visits/questionnaires
- Loss-to-follow-up prediction: Identifying patients at risk of dropping out and triggering intensified outreach
- Signal detection in longitudinal data: Detecting patterns across thousands of patients followed for years
- Integration with cancer registries and death registries for outcome ascertainment

### 5.5 CIBMTR Registry Integration

The Center for International Blood and Marrow Transplant Research (CIBMTR) serves as a critical data infrastructure:

- Captures outcomes for CAR-T-treated patients in the US
- Provides denominator-based incidence data (unlike FAERS, which only captures numerator data from spontaneous reports)
- Enables:
  - Benchmarking of real-world toxicity rates against clinical trial rates
  - Identification of risk factors for delayed toxicities using large real-world cohorts
  - Comparative effectiveness and safety analyses across products
  - Long-term outcome tracking complementing manufacturer-sponsored LTFU studies

In Europe, the EBMT (European Society for Blood and Marrow Transplantation) registry serves an analogous function. EMA has issued a positive opinion on using the EBMT registry for long-term CAR-T follow-up in EU member states.

### 5.6 Spontaneous Reporting Analysis

The AI system enhances spontaneous report processing:

**Automated Case Processing**
- NLP-driven extraction of adverse event information from unstructured reports (MedWatch forms, healthcare professional narratives, patient reports)
- Automated MedDRA coding with confidence scores
- Duplicate detection using probabilistic matching across reporters, dates, and event descriptions
- Causality triage: Flagging cases with high likelihood of causal association for priority medical review

**Signal Detection and Evaluation**
- Continuous disproportionality monitoring across all MedDRA preferred terms
- Time-stratified analyses to detect signals emerging at specific post-treatment intervals
- Integration of multiple data streams: FAERS reports + CIBMTR registry data + published literature + social media monitoring
- Signal evaluation reports generated for Pharmacovigilance Review Board, with recommended actions (labeling update, Dear Healthcare Provider letter, REMS modification, etc.)

### 5.7 What the Clinical/Commercial Team Needs to See

- Quarterly post-market safety reports: Aggregate adverse event rates, new signals, comparison to labeling
- Real-world CRS/ICANS rates and management patterns: Are community centers managing as well as academic trial sites?
- LTFU compliance rates: What percentage of patients are completing annual follow-up?
- Competitive landscape safety intelligence: How does our product's real-world safety profile compare to competitors?

### 5.8 What Regulators Expect

- FDA: Timely FAERS reporting (15-day expedited, periodic reports), annual LTFU study reports, response to FDA queries about emerging signals, labeling supplements as warranted
- EMA: Periodic Safety Update Reports (PSURs) per EU pharmacovigilance legislation, signal management per PRAC guidance, compliance with ATMP-specific follow-up requirements
- Both agencies increasingly expect: Integration of real-world evidence into the ongoing benefit-risk assessment, proactive signal communication

---

## 6. Cross-Cutting: REMS Programs and Their Evolution

### 6.1 Historical REMS Structure (2017-2025)

When the first CAR-T therapies were approved (Kymriah in 2017, Yescarta in 2017), the FDA imposed REMS programs that required:

1. **Certified Healthcare Facility Requirement**: Only hospitals and clinics that completed a specialized certification process could administer CAR-T therapy
2. **Training Requirements**: Healthcare providers at certified facilities had to complete specific training on recognition and management of CRS and neurological toxicities
3. **Minimum tocilizumab availability**: Certified facilities had to have a minimum of 2 doses of tocilizumab available on-site for each patient being treated
4. **Patient registration**: Enrollment in a patient registry for long-term follow-up

### 6.2 REMS Removal (2025)

The FDA's decision to remove REMS for all six approved CAR-T products represents a maturation of the field:

**Rationale**
- Accumulated real-world experience across thousands of patients demonstrated that:
  - CRS and neurotoxicity are well-characterized and predictable
  - Clinicians have developed competency in recognition and management
  - Standard product labeling adequately conveys necessary safety information
  - REMS requirements were creating access barriers, particularly for patients at non-academic centers

**Implications for AI Safety Monitoring**
- The removal of REMS does NOT reduce the need for sophisticated safety monitoring -- it shifts the burden:
  - Without mandatory certification, there is greater reliance on robust safety monitoring systems to ensure that community oncology centers manage toxicity appropriately
  - Real-time safety dashboards become more important, not less, as therapy moves to less experienced centers
  - FACT accreditation (voluntary) takes on heightened importance as the quality gatekeeper

### 6.3 TCE REMS: A Different Trajectory

Bispecific T-cell engagers follow a different REMS trajectory:
- Teclistamab retains REMS due to high CRS rates (72%) and neurotoxicity (57%)
- Step-up dosing mitigates risk: Initial doses of 0.06 mg/kg and 0.3 mg/kg followed by therapeutic dose of 1.5 mg/kg SC weekly
- 48-72h inpatient observation required after each step-up dose
- Prophylactic tocilizumab (8 mg/kg) before first step-up dose reduced CRS rates to 10-26% in published data
- Condensed step-up schedules (e.g., completing step-up in fewer days) are being studied to reduce hospitalization burden

---

## 7. Cross-Cutting: Regulatory Frameworks for AI in Safety Monitoring

### 7.1 FDA Framework

**January 2025 Draft Guidance**: "Considerations for the Use of Artificial Intelligence to Support Regulatory Decision-Making for Drug and Biological Products"

Key principles:
1. **Risk-Based Credibility Assessment**: AI models that support regulatory decisions must undergo credibility assessment proportional to the risk of the decision they inform
2. **Context of Use**: The guidance specifically addresses adverse event prediction as a use case, citing the example of an AI model categorizing patients by risk of adverse events to determine monitoring intensity (outpatient vs. inpatient)
3. **Higher Risk Classification**: AI models that make final determinations without human intervention are considered higher risk and require more rigorous validation
4. **Transparency**: Model development documentation, training data provenance, validation methodology, and performance characteristics must be reported

**September 2025 Draft Guidance**: "Postapproval Methods to Capture Safety and Efficacy Data for Cell and Gene Therapy Products"
- Addresses innovative approaches to post-market safety data collection for cell/gene therapies
- Provides framework for using registries, EHR-based surveillance, and real-world data

**Implications for AI Safety Monitoring Systems**
- Any AI model used to inform dose-escalation decisions, monitoring intensity, or risk stratification in a regulatory submission must be pre-specified, validated, and documented according to the credibility framework
- Human-in-the-loop is expected for high-risk decisions (e.g., dose-escalation recommendations, treatment discontinuation)
- FDA explicitly seeks feedback on AI use in post-marketing pharmacovigilance, signaling openness to innovation in this space

### 7.2 EMA Framework

**ATMP-Specific Requirements**
- The Committee for Advanced Therapies (CAT) provides scientific recommendations on ATMP classification and quality/safety/efficacy assessment
- EMA guideline on quality, non-clinical, and clinical requirements for investigational ATMPs in clinical trials (effective July 2025) establishes:
  - Proportionate non-clinical testing based on product risk profile
  - Flexible clinical trial designs for small populations (relevant to rare disease indications)
  - Enhanced pharmacovigilance and risk management system requirements

**EMA-HMA Joint Statement (March 2025)**
- Addresses risks of unregulated advanced therapies
- Provides guidance on distinguishing regulated from unregulated ATMP supplies
- Reinforces the need for robust pharmacovigilance in the post-market setting

**AI in Clinical Trials**
- EMA has not issued ATMP-specific AI guidance but applies general principles from the Clinical Trial Regulation (EU) 536/2014 and pharmacovigilance legislation
- The EU AI Act (effective 2025-2026 phased implementation) classifies AI in medical devices as high-risk, with implications for AI-based safety monitoring tools if they are classified as medical devices/software as a medical device (SaMD)

### 7.3 Explainability Requirements

Both FDA and EMA require that AI-driven safety decisions be explainable:
- SHAP (SHapley Additive exPlanations) values for feature importance in individual predictions
- LIME (Local Interpretable Model-agnostic Explanations) for local decision rationale
- Global model interpretation: Which features drive the model's overall predictions?
- Counterfactual explanations: "What would need to change for this patient to move from high-risk to low-risk?"

---

## 8. Cross-Cutting: FACT Accreditation and Site Readiness

### 8.1 FACT Standards for Immune Effector Cells

The Foundation for the Accreditation of Cellular Therapy (FACT) published its Standards for Immune Effector Cells (IEC) in response to the unique safety challenges of cell therapies:

**Key Requirements**
- Institutional policies and procedures for immune effector cell therapy
- Staff training and competency assessment:
  - Recognition of CRS: Signs, symptoms, grading (ASTCT criteria)
  - Recognition of ICANS: ICE scoring, neurological assessment
  - Management protocols: Tocilizumab dosing, corticosteroid escalation, vasopressor management, ICU transfer criteria
  - Emergency procedures for Grade 4 CRS and Grade 4 ICANS
- Quality management system for the entire cell therapy process (leukapheresis, manufacturing interface, chain of identity/custody, product receipt, administration, monitoring)
- Adverse event reporting and quality improvement

### 8.2 Community IEC Standards (November 2025)

FACT published Standards for Immune Effector Cells in the Community Clinical Setting (1st edition) to extend cell therapy access beyond academic medical centers:

- Adapts the FACT-JACIE International Standards for IEC (3rd edition) for community oncology programs
- "Fit-for-purpose" approach: Recognizes that community settings have different infrastructure than transplant centers
- Maintains core safety requirements while adjusting operational expectations
- Implications for AI safety monitoring: Community centers may have greater reliance on centralized monitoring tools, telehealth-based oversight, and automated alerting systems to compensate for less on-site cell therapy expertise

### 8.3 Training Infrastructure

**Required Competencies**
- All prescribing physicians: Completion of product-specific training (provided by manufacturers)
- Nursing staff: CRS/ICANS recognition, grading, and immediate management
- Pharmacy: Tocilizumab preparation and rapid administration, corticosteroid protocols
- ICU team: Familiarity with cell therapy-specific complications (CRS not responsive to tocilizumab/steroids, cerebral edema in severe ICANS, HLH/MAS overlap syndrome)

**AI System Support for Training**
- Simulation modules using historical patient data (de-identified) to train clinicians on CRS/ICANS recognition
- Real-time clinical decision support overlaid on the monitoring dashboard
- Automated CRS/ICANS grading assistance to calibrate clinical judgment

---

## 9. System Architecture: End-to-End Data Flow

### 9.1 Data Flow Summary by Phase

```
PRECLINICAL                 PHASE 1                    PHASE 2
-----------                 -------                    -------
In vitro CRA    ----+       Vitals (q4h)   ----+      All Phase 1 data  ----+
NHP tox data    ----|       Labs (daily)   ----|      + Larger cohorts   ----|
Construct seq   ----|       Cytokines      ----|      + Subgroup data    ----|
Mouse models    ----|       ICE scores     ----|      + MFG lot data     ----|
                    |       CAR-T kinetics ----|                              |
                    v                          v                              v
            [Construct Risk           [Bayesian Prior +              [Validated Risk
             Profiler]                 Transfer Learning              Stratification
                    |                  Dynamic Model]                 Model]
                    v                          v                              v
            IND Safety Section        Real-time CRS/ICANS           Risk-Adapted
            Starting Dose             Grade Prediction              Monitoring
            Monitoring Plan           DSMB Reports                  Protocol Amendments
                                      Dose Escalation Rec           Site Alerting

PHASE 3                           POST-MARKET
-------                           -----------
All prior data        ----+       FAERS reports        ----+
+ Pivotal trial data  ----|       CIBMTR/EBMT data     ----|
+ Multi-site data     ----|       LTFU study data      ----|
+ EDC integration     ----|       Literature/NLP       ----|
                           v       Social media         ----|
                    [Prospectively                           v
                     Validated Model]              [Post-Market Signal
                           v                        Detection Engine]
                    ISS for BLA                            v
                    IDMC Reports                    Safety Signal Reports
                    Real-Time Dashboards            PSUR/PADER Support
                    Risk-Benefit Analysis           Labeling Updates
                                                    LTFU Compliance
```

### 9.2 Model Evolution Summary

| Phase | n Patients | Model Type | Key Capability | Target AUC |
|---|---|---|---|---|
| Preclinical | 0 (construct-level) | Structural risk profiling + historical comparison | Construct risk category assignment | N/A |
| Phase 1 (n=1-3) | 1-3 | Bayesian priors from published data | Real-time grading assistance, threshold alerting | N/A (monitoring only) |
| Phase 1 (n=5-10) | 5-10 | Transfer learning (COVID-19 CRS to CAR-T CRS) | 1-3 day CRS severity prediction | 0.70-0.80 |
| Phase 1 (n=10-20) | 10-20 | Multivariate logistic + dynamic features | Risk stratification (high vs. low) | 0.75-0.85 |
| Phase 2 | 50-200 | Recalibrated multivariate + subgroup models | Individual patient risk scores, subgroup stratification | 0.80-0.90 |
| Phase 3 | 200-500+ | Locked, prospectively validated model | Regulatory-grade validated prediction | 0.80+ (validated) |
| Post-Market | Thousands | Ensemble (disproportionality + NLP + registry) | New signal detection, real-world effectiveness | Sensitivity/specificity for signal detection |

### 9.3 Key Integration Points

| System | Integration Method | Data Direction | Latency |
|---|---|---|---|
| EDC (Medidata, Oracle, Veeva) | API / HL7 FHIR | EDC to Safety Platform | Minutes to hours |
| Central Lab | HL7v2 / FHIR | Lab to Safety Platform | Hours (batch or real-time) |
| Cytokine Lab | Custom API | Lab to Safety Platform | 4-6 hours |
| FAERS | FDA Gateway / E2B(R3) | Bidirectional | Days (reporting) |
| EudraVigilance | E2B(R3) | Bidirectional | Days (reporting) |
| CIBMTR | Registry API / Batch export | Registry to Safety Platform | Monthly |
| EBMT | Registry API / Batch export | Registry to Safety Platform | Monthly |
| EHR (Epic, Cerner) | FHIR R4 / CDS Hooks | EHR to Safety Platform | Real-time |
| IDMC/DSMB | Secure portal | Safety Platform to IDMC | Per charter schedule |

---

## Appendix A: Approved CAR-T Products -- Safety Profile Reference

| Product | Target | Costim Domain | Hinge/TM | CRS (any grade) | CRS (Grade 3+) | ICANS (any grade) | ICANS (Grade 3+) | REMS Status (2026) |
|---|---|---|---|---|---|---|---|---|
| **Yescarta** | CD19 | CD28 | CD28 | 93% | 13% | 64% | 28% | Removed |
| **Kymriah** | CD19 | 4-1BB | CD8 | 79% | 22% | 21% | 12% | Removed |
| **Tecartus** | CD19 | CD28 | CD28 | 91% | 15% | 60% | 24% | Removed |
| **Breyanzi** | CD19 | 4-1BB | CD8/CD28 | 46% | 4% | 35% | 12% | Removed |
| **Abecma** | BCMA | 4-1BB | CD8 | 84% | 5% | 18% | 3% | Removed |
| **Carvykti** | BCMA | 4-1BB | CD8 | 95% | 5% | 21% | 9% | Removed |

Note: Rates from pivotal trials. Real-world rates may differ. All products now carry boxed warnings for CRS, neurotoxicity, and secondary T-cell malignancy.

---

## Appendix B: Key Biomarkers for CRS/ICANS Prediction

| Biomarker | Timing | CRS Prediction | ICANS Prediction | Availability |
|---|---|---|---|---|
| **IL-6** | Day +3 | Core predictor (elevated in severe CRS) | Included in ICANS multivariate model (AUC 0.83) | Research/specialty lab, 4-6h turnaround |
| **IL-2** | Fever onset | AUC 0.78 alone; 0.85 combined with lymphocyte count | Associated with T-cell activation intensity | Research lab |
| **IFN-gamma** | Days +1-7 | Key predictor of CRS severity | Elevated in ICANS | Research lab |
| **IL-10** | Days +1-7 | Associated with severe CRS | Elevated in ICANS | Research lab |
| **IL-15** | Baseline, Day +3 | Associated with CRS severity | Elevated serum and CSF levels linked to ICANS | Research lab |
| **Ferritin** | Baseline, Day +3, Day +7 | >10,000 ng/mL associated with severe CRS | Marker of macrophage activation | Standard lab, 2-4h |
| **CRP** | Daily Days 0-14 | Component of m-EASIX (AUC 0.80 for severe CRS) | Inflammatory marker | Standard lab, 1h |
| **LDH** | Baseline, daily | Component of EASIX/m-EASIX; reflects tumor burden and tissue damage | Indirect marker | Standard lab, 1h |
| **D-dimer** | Baseline, at CRS onset | Pre-infusion D-dimer in ICANS multivariate model | Endothelial activation/coagulopathy | Standard lab, 2h |
| **m-EASIX score** | Calculated: LDH x CRP / Platelets | AUC 0.73-0.80 at various pre/post-infusion timepoints | Predicts both CRS and ICANS | Calculated from standard labs |
| **Lymphocyte count** | Fever onset | AUC 0.81 alone for severe CRS | Reflects immune substrate | Standard lab, 1h |

---

## Appendix C: Sources and References

### Prediction Models and Biomarkers
- [ICANS risk model with serum and CSF cytokine profiling](https://www.nature.com/articles/s41409-025-02679-y) -- Nature Bone Marrow Transplantation, 2025
- [Predicting CAR T-cell toxicity: insurance for CAR crashes](https://ashpublications.org/bloodadvances/article/9/2/335/535072/Predicting-CAR-T-cell-toxicity-insurance-for-CAR) -- Blood Advances, ASH 2025
- [Machine learning-based predictive model for high-grade CRS](https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2025.1692892/full) -- Frontiers in Immunology, 2025
- [PrCRS: prediction model of severe CRS based on transfer learning](https://bmcbioinformatics.biomedcentral.com/articles/10.1186/s12859-024-05804-8) -- BMC Bioinformatics, 2024
- [Identification of early predictive biomarkers for severe CRS in pediatric patients](https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2024.1450173/full) -- Frontiers in Immunology, 2024
- [EASIX and m-EASIX predict CRS and ICANS in pediatric/AYA patients](https://ashpublications.org/bloodadvances/article/9/2/270/517998/EASIX-and-m-EASIX-predict-CRS-and-ICANS-in) -- Blood Advances, ASH 2025
- [Modified EASIX predicts severe CRS and neurotoxicity](https://pubmed.ncbi.nlm.nih.gov/34432870/) -- PubMed, 2021
- [Meta-analysis informed ML: Supporting cytokine storm detection during CAR-T](https://www.sciencedirect.com/science/article/pii/S1532046423000886) -- Journal of Biomedical Informatics, 2023

### CAR Construct Design and Toxicity
- [CAR-T design: Elements and their synergistic function](https://www.sciencedirect.com/science/article/pii/S2352396420303078) -- eBioMedicine/Lancet, 2020
- [Influence of CAR structural domains on clinical outcomes and toxicities](https://www.mdpi.com/2072-6694/13/1/38) -- Cancers, 2021
- [Hinge and TM domains regulate CAR expression and signaling threshold](https://pmc.ncbi.nlm.nih.gov/articles/PMC7291079/) -- PMC, 2020

### Preclinical Models
- [Early induction of CRS by rapidly generated CAR T cells in preclinical models](https://pubmed.ncbi.nlm.nih.gov/38514793/) -- PubMed, 2024
- [Applying a clinical lens to animal models of CAR-T cell therapies](https://pmc.ncbi.nlm.nih.gov/articles/PMC9478925/) -- PMC, 2022
- [Mechanisms of CRS and neurotoxicity and management strategies](https://pmc.ncbi.nlm.nih.gov/articles/PMC8600921/) -- Journal of Experimental and Clinical Cancer Research, 2021

### Phase 1 Design and Monitoring
- [Phase I CAR-T Clinical Trials Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10132085/) -- PMC, 2023
- [Bayesian adaptive designs to accelerate CAR-T development](https://www.scienceopen.com/hosted-document?doi=10.15212/HOD-2022-0003) -- ScienceOpen, 2022
- [Bayesian mTPI-2 for Phase I dose escalation in cancer immunotherapy](https://www.medrxiv.org/content/10.1101/2024.06.10.24308712v1.full) -- medRxiv, 2024
- [Optimizing the post-CAR T monitoring period](https://ashpublications.org/bloodadvances/article/8/20/5346/517124/Optimizing-the-post-CAR-T-monitoring-period-in) -- Blood Advances, ASH 2024
- [Immune Monitoring - EBMT/EHA CAR-T Cell Handbook](https://www.ncbi.nlm.nih.gov/books/NBK584155/) -- NCBI Bookshelf
- [CAR-T cell therapy: practical guide to routine laboratory monitoring](https://pubmed.ncbi.nlm.nih.gov/33685719/) -- PubMed, 2021

### Regulatory Frameworks
- [FDA draft guidance: AI to support regulatory decision-making for drugs and biologics](https://www.goodwinlaw.com/en/insights/publications/2025/01/alerts-lifesciences-aiml-fda-publishes-its-first-draft-guidance) -- Goodwin Law summary, January 2025
- [FDA draft guidance: Postapproval methods for cell and gene therapy products](https://www.fda.gov/vaccines-blood-biologics/biologics-guidances/recently-issued-guidance-documents) -- FDA CBER, September 2025
- [DLA Piper: Key takeaways from FDA's draft guidance on AI](https://www.dlapiper.com/en/insights/publications/2025/01/fda-releases-draft-guidance-on-use-of-ai) -- DLA Piper, 2025
- [EMA guideline on clinical-stage ATMPs](https://www.ema.europa.eu/en/guideline-quality-non-clinical-clinical-requirements-investigational-advanced-therapy-medicinal-products-clinical-trials-scientific-guideline) -- EMA Scientific Guideline, effective July 2025
- [EMA ATMP overview](https://www.ema.europa.eu/en/human-regulatory-overview/advanced-therapy-medicinal-products-overview) -- EMA
- [FDA Considerations for CAR T Cell Products](https://www.fda.gov/media/156896/download) -- FDA CBER Guidance

### REMS and Post-Market Safety
- [FDA removes REMS for all approved CAR-T therapies](https://www.onclive.com/view/fda-removes-rems-programs-for-all-currently-approved-cd19--and-bcma-directed-car-t-cell-therapies-in-hematologic-malignancies) -- OncLive, 2025
- [FDA eliminates REMS, reduces requirements for CAR-T](https://www.cancertherapyadvisor.com/news/fda-eliminates-rems-reduces-other-requirements-for-car-t-cell-therapies/) -- Cancer Therapy Advisor, 2025
- [FDA removes CAR-T access barriers](https://www.fiercepharma.com/pharma/fda-removes-barrier-car-t-therapies-access-boost-cancer-immunotherapy-uptake) -- Fierce Pharma, 2025
- [FDA investigating T-cell malignancy risk following CAR-T](https://www.fda.gov/vaccines-blood-biologics/safety-availability-biologics/fda-investigating-serious-risk-t-cell-malignancy-following-bcma-directed-or-cd19-directed-autologous) -- FDA Safety Communication, 2023
- [FDA requires boxed warning for T-cell malignancies after CAR-T](https://www.fda.gov/vaccines-blood-biologics/safety-availability-biologics/fda-requires-boxed-warning-t-cell-malignancies-following-treatment-bcma-directed-or-cd19-directed) -- FDA, 2024
- [Post-marketing surveillance of CAR-T from FAERS database](https://link.springer.com/article/10.1007/s40264-022-01194-z) -- Drug Safety/Springer, 2022
- [Characterization of secondary malignancies from FAERS and VigiBase](https://pmc.ncbi.nlm.nih.gov/articles/PMC11245995/) -- PMC, 2024
- [FDA officials push for long-term monitoring of autoimmune CAR-T patients](https://www.statnews.com/2026/02/02/fda-long-term-follow-up-studies-car-t-therapy-automimmune-disorders/) -- STAT News, February 2026

### TCE Safety Monitoring
- [FDA Approval Summary: Teclistamab](https://pmc.ncbi.nlm.nih.gov/articles/PMC11649460/) -- Clinical Cancer Research/PMC, 2024
- [Clinical pharmacology of CRS with T-cell-engaging bispecific antibodies](https://aacrjournals.org/clincancerres/article/31/2/245/751114/Clinical-Pharmacology-of-Cytokine-Release-Syndrome) -- Clinical Cancer Research, 2025
- [Condensed step-up dosing of teclistamab](https://pubmed.ncbi.nlm.nih.gov/39157607/) -- PubMed, 2024
- [Outpatient delivery of bispecific T-cell engager therapies for myeloma](https://pmc.ncbi.nlm.nih.gov/articles/PMC12025952/) -- PMC, 2025

### FACT Accreditation
- [FACT Standards and Accreditation for Immune Effector Cells](https://parentsguidecordblood.org/en/news/fact-standards-and-accreditation-immune-effector-cells) -- Parents Guide to Cord Blood
- [FACT Standards for IEC in Community Clinical Setting](https://www.accessnewswire.com/newsroom/en/healthcare-and-pharmaceutical/facts-new-standards-for-immune-effector-cells-in-the-community-clinic-1098424) -- AccessNewsWire, November 2025
- [FACT Home - Standards](https://www.factglobal.org/standards/) -- FACT Global

### FAERS and Pharmacovigilance Infrastructure
- [FAERS Essentials Guide](https://pmc.ncbi.nlm.nih.gov/articles/PMC12393772/) -- PMC
- [FDA Adverse Event Reporting System](https://open.fda.gov/data/faers/) -- OpenFDA

### Transfer Learning and Small Sample Methods
- [Two-step transfer learning for deep learning in small datasets](https://pmc.ncbi.nlm.nih.gov/articles/PMC11700395/) -- PMC, 2024
- [AI and innovation in clinical trials](https://www.nature.com/articles/s41746-025-02048-5) -- npj Digital Medicine, 2025

---

> **Document prepared for**: CMO-level strategic review of AI-driven safety monitoring capabilities across the cell therapy clinical development lifecycle.
>
> **Key takeaway**: An AI safety monitoring system for cell therapies is not a single model deployed once -- it is an evolving intelligence layer that begins with structural risk profiling of the CAR construct, learns from sparse first-in-human data through Bayesian priors and transfer learning, matures through iterative recalibration during expansion, proves itself through prospective validation in pivotal trials, and then transitions to a surveillance engine that must operate for 15 years post-approval. Each phase has distinct data inputs, prediction targets, clinical decision points, and regulatory expectations. The system's value is measured not just by prediction accuracy, but by its ability to reduce time-to-intervention for acute toxicities, optimize monitoring intensity to expand access, detect delayed safety signals that emerge over years, and provide the explainable, documented evidence that regulators require.
