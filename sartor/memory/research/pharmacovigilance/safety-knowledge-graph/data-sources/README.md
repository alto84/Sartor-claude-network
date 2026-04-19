# Data Sources for CAR-T Safety Monitoring in SLE

## Overview

This document inventories and assesses the primary data sources available for pharmacovigilance, real-world evidence (RWE) generation, and safety signal detection for CAR-T therapy in autoimmune diseases, with a focus on SLE. Each source is evaluated for its strengths, limitations, CAR-T data availability, and relevance to the [[models/risk-model]].

---

## 1. Literature / Clinical Data Sources

### 1.1 PubMed / MEDLINE

| Parameter | Details |
|-----------|---------|
| **Type** | Bibliographic database (published literature) |
| **Operator** | US National Library of Medicine (NLM) |
| **Patient coverage** | Global; all published clinical data |
| **CAR-T data: Oncology** | Comprehensive (thousands of publications) |
| **CAR-T data: Autoimmune** | Growing rapidly; ~50-100 publications as of early 2025 |
| **Access method** | Free (PubMed.gov); structured search via MeSH and free text |
| **Update frequency** | Daily |

**Strengths:**
- Gold standard for published evidence
- Peer-reviewed; quality-controlled
- Structured indexing (MeSH) enables systematic searches
- Includes systematic reviews and meta-analyses

**Limitations:**
- Publication lag (months to years from data collection to publication)
- Publication bias (positive results published faster; safety signals may be underreported)
- Autoimmune CAR-T publications heavily dominated by Erlangen group
- Case reports and small series are hard to pool

**Search strategy for autoimmune CAR-T safety:**
```
("chimeric antigen receptor" OR "CAR T" OR "CAR-T") AND
("lupus" OR "SLE" OR "autoimmune") AND
("safety" OR "adverse" OR "toxicity" OR "cytokine release" OR "ICANS")
```

### 1.2 ClinicalTrials.gov

| Parameter | Details |
|-----------|---------|
| **Type** | Clinical trial registry and results database |
| **Operator** | US NLM / FDA |
| **Patient coverage** | Global (all trials with US sites; many international trials voluntarily registered) |
| **CAR-T data: Oncology** | Comprehensive (all approved products + hundreds of investigational) |
| **CAR-T data: Autoimmune** | ~40-50 registered trials (see [[trials/active-trials]]) |
| **Access method** | Free (ClinicalTrials.gov); API available for structured queries |
| **Update frequency** | Continuous (sponsors required to update quarterly) |

**Strengths:**
- Prospective registration reduces publication bias
- Results database includes AE tables (when posted)
- Protocol information available before results published
- Required by FDAAA 801 for US-based trials

**Limitations:**
- Results posting often delayed (>1 year after completion)
- AE reporting format is summary-level (not individual patient data)
- Chinese trials often registered on ChiCTR instead
- No standardized safety terminology across all entries

### 1.3 Chinese Clinical Trial Registry (ChiCTR)

| Parameter | Details |
|-----------|---------|
| **Type** | Clinical trial registry |
| **Operator** | Chinese Clinical Trial Registry Center |
| **Patient coverage** | China-based trials |
| **CAR-T data: Autoimmune** | **~20-30 registered trials** (largest single-country registry for autoimmune CAR-T) |
| **Access method** | Free (chictr.org.cn); some entries in Chinese only |

**Strengths:**
- Captures Chinese academic trials not on ClinicalTrials.gov
- China has the most autoimmune CAR-T patients outside Europe

**Limitations:**
- Variable data quality and completeness
- Language barriers (many entries in Chinese)
- Results rarely posted on the registry
- Regulatory standards differ from US/EU

---

## 2. Spontaneous Reporting Systems

### 2.1 FDA Adverse Event Reporting System (FAERS)

| Parameter | Details |
|-----------|---------|
| **Type** | Spontaneous adverse event reporting database |
| **Operator** | US FDA |
| **Patient coverage** | US (primarily); some international reports from manufacturers |
| **CAR-T data: Oncology** | Substantial (all approved products since 2017) |
| **CAR-T data: Autoimmune** | **Minimal to none** (no approved autoimmune CAR-T products in US yet) |
| **Access method** | Public dashboard (FDA Adverse Events Reporting System); OpenFDA API; FOIA requests |
| **Update frequency** | Quarterly public release |

**Strengths:**
- Largest US spontaneous reporting database
- Captures post-marketing safety signals not seen in trials
- Includes MedDRA-coded events enabling signal detection
- Disproportionality analysis (PRR, ROR, EBGM) can identify safety signals

**Limitations:**
- **No autoimmune CAR-T data currently** (pre-approval)
- Underreporting is inherent (~1-10% of events reported)
- No denominator (cannot calculate incidence rates)
- Duplicate reports common
- Reporter quality varies (HCP vs consumer)
- Will become relevant once US approvals occur (expected 2027+)

**Future value:** Once RESET-SLE or other US trials lead to approvals, FAERS will be the primary post-marketing safety monitoring database. Signal detection algorithms should be pre-programmed for CRS, ICANS, ICAHS ([[adverse-events/CRS]], [[adverse-events/ICANS]], [[adverse-events/ICAHS]]).

### 2.2 EudraVigilance

| Parameter | Details |
|-----------|---------|
| **Type** | Spontaneous adverse event reporting database |
| **Operator** | European Medicines Agency (EMA) |
| **Patient coverage** | EU/EEA member states |
| **CAR-T data: Oncology** | Yes (approved CAR-T products in EU) |
| **CAR-T data: Autoimmune** | **Very limited** (compassionate use / named-patient reports from Erlangen cohort may be present) |
| **Access method** | Public dashboard (adrreports.eu); restricted access for detailed line listings |

**Strengths:**
- Covers EU population where most autoimmune CAR-T activity occurs
- MedDRA-coded
- Signal detection methods integrated
- May capture early autoimmune CAR-T AEs from compassionate use programs

**Limitations:**
- Similar underreporting issues as FAERS
- No denominator data
- Public access limited to aggregated data
- Named-patient / compassionate use reporting is inconsistent

### 2.3 WHO VigiBase

| Parameter | Details |
|-----------|---------|
| **Type** | Global spontaneous reporting database |
| **Operator** | Uppsala Monitoring Centre (UMC) / WHO |
| **Patient coverage** | Global (>150 countries contributing) |
| **CAR-T data** | Aggregates from FAERS, EudraVigilance, and national databases worldwide |
| **Access method** | VigiLyze (authorized access); VigiAccess (public, limited) |

**Strengths:**
- Broadest global coverage
- Can capture signals from countries with active autoimmune CAR-T programs (China, Germany)
- Deduplication across national databases

**Limitations:**
- Reporting lag from contributing countries
- Variable quality across contributing nations
- Access restrictions for detailed data
- Autoimmune CAR-T data extremely limited currently

---

## 3. Administrative Claims and Electronic Health Records

### 3.1 Optum Clinformatics Data Mart (CDM)

| Parameter | Details |
|-----------|---------|
| **Type** | US commercial insurance claims database |
| **Operator** | Optum / UnitedHealth Group |
| **Patient coverage** | ~15-20 million commercially insured lives |
| **CAR-T data: Oncology** | Yes (identifiable via ICD-10-PCS codes for CAR-T administration, J-codes for products) |
| **CAR-T data: Autoimmune** | **None currently** (no approved/reimbursed autoimmune CAR-T in US) |
| **Access method** | Licensed access (commercial) |

**Strengths:**
- Longitudinal patient tracking
- Captures diagnoses, procedures, prescriptions, costs
- Can identify CAR-T patients and track outcomes
- Large sample size for oncology CAR-T

**Limitations:**
- No autoimmune CAR-T data (pre-approval)
- Claims data lacks clinical detail (no lab values, imaging, vitals)
- Cannot determine CRS/ICANS grade from claims alone
- Will be valuable post-approval for long-term safety tracking

### 3.2 TriNetX

| Parameter | Details |
|-----------|---------|
| **Type** | Federated EHR research network |
| **Operator** | TriNetX Inc. |
| **Patient coverage** | ~100+ million patients across participating health systems |
| **CAR-T data: Oncology** | Yes (CAR-T treatment centers are represented) |
| **CAR-T data: Autoimmune** | **Minimal** (may capture a few investigational patients at participating sites) |
| **Access method** | Licensed access (commercial); analytics platform |

**Strengths:**
- Real-time data (near real-time EHR updates)
- Richer clinical data than claims (labs, vitals, notes)
- Can build SLE cohorts and track treatments
- Feasibility assessment for study design

**Limitations:**
- Participating network may not include all CAR-T autoimmune trial sites
- Data quality varies by site
- Structured data only (no access to free-text clinical notes in standard access)
- CAR-T identification may be incomplete (coding inconsistencies)

### 3.3 Flatiron Health

| Parameter | Details |
|-----------|---------|
| **Type** | Oncology-specific EHR-derived database |
| **Operator** | Flatiron Health (Roche subsidiary) |
| **Patient coverage** | ~3 million active cancer patients across ~280 US cancer clinics |
| **CAR-T data: Oncology** | **Strong** (includes detailed CAR-T treatment data for hematologic malignancies) |
| **CAR-T data: Autoimmune** | **None** (oncology-only database) |
| **Access method** | Licensed access (commercial); research partnerships |

**Strengths:**
- Deepest oncology-specific clinical data (includes treatment lines, response, detailed AEs)
- Curated datasets with manual abstraction
- Strong CAR-T safety data for benchmarking oncology rates ([[adverse-events/CRS]], [[adverse-events/ICANS]])
- Can provide oncology comparator data for [[models/risk-model]]

**Limitations:**
- No autoimmune patients
- Oncology-only focus; cannot track SLE outcomes
- Expensive access

### 3.4 IQVIA

| Parameter | Details |
|-----------|---------|
| **Type** | Multi-source healthcare data (claims, EHR, prescription, hospital) |
| **Operator** | IQVIA |
| **Patient coverage** | ~300+ million US patient records (claims); global data |
| **CAR-T data** | Oncology (prescription/procedure tracking); limited clinical detail |
| **Access method** | Licensed access (commercial) |

**Strengths:**
- Largest US data aggregator
- Longitudinal tracking of prescriptions and procedures
- Can track tocilizumab, anakinra use patterns as proxy for CRS management
- Market analytics capabilities

**Limitations:**
- Breadth over depth (less clinical detail than EHR-based sources)
- CAR-T identification requires complex algorithms
- No autoimmune CAR-T data currently

### 3.5 Sentinel System

| Parameter | Details |
|-----------|---------|
| **Type** | FDA's active surveillance system |
| **Operator** | FDA (operated by Harvard Pilgrim Health Care Institute) |
| **Patient coverage** | ~100+ million patients across participating US health plans |
| **CAR-T data** | Limited (CAR-T procedures identifiable via codes; safety outcomes less characterized) |
| **Access method** | FDA-initiated queries only; some routine surveillance reports public |

**Strengths:**
- FDA's own active surveillance tool (can trigger regulatory action)
- Pre-specified queries can be designed for post-marketing surveillance
- Large, population-based denominator
- Can detect signals missed by spontaneous reporting

**Limitations:**
- Reactive (FDA must initiate queries)
- Claims-based (limited clinical detail)
- CAR-T-specific modules not yet fully developed
- No autoimmune CAR-T data currently

### 3.6 MarketScan (Merative, formerly IBM Watson Health / Truven)

| Parameter | Details |
|-----------|---------|
| **Type** | US commercial and Medicare supplemental claims database |
| **Operator** | Merative (formerly IBM Watson Health) |
| **Patient coverage** | ~30-40 million commercially insured + Medicare supplemental |
| **CAR-T data** | Oncology (procedure and diagnosis codes) |
| **Access method** | Licensed access (commercial) |

**Strengths:**
- Large, well-validated claims database
- Extensively used in pharmacoepidemiologic research
- Good longitudinal tracking
- Medicare supplemental captures older populations

**Limitations:**
- No autoimmune CAR-T data
- Claims-level data only (no labs, vitals)
- Lag in data availability (6-12 months)

---

## 4. Registries

### 4.1 CIBMTR (Center for International Blood and Marrow Transplant Research)

| Parameter | Details |
|-----------|---------|
| **Type** | Clinical outcomes registry for cellular therapy and transplantation |
| **Operator** | CIBMTR (Medical College of Wisconsin / NMDP) |
| **Patient coverage** | >500,000 transplant/cellular therapy recipients globally |
| **CAR-T data: Oncology** | **Comprehensive** (mandatory reporting for all US CAR-T recipients since 2018; FDA REMS requirement) |
| **CAR-T data: Autoimmune** | **Emerging** (autoimmune CAR-T patients will be captured as programs expand) |
| **Access method** | Research proposals through CIBMTR; data use agreements |

**Strengths:**
- **Most important future data source for autoimmune CAR-T safety**
- Mandatory reporting for FDA-approved CAR-T in US (REMS programs)
- Detailed safety outcomes (CRS grade, ICANS grade, infections, long-term follow-up)
- 15-year follow-up requirement for CAR-T patients
- Can track [[adverse-events/CRS]], [[adverse-events/ICANS]], [[adverse-events/ICAHS]], infections, secondary malignancies
- International contributing sites

**Limitations:**
- Currently focuses on oncology CAR-T (regulatory mandate)
- Autoimmune CAR-T not yet subject to REMS reporting requirements
- Data completeness varies by contributing center
- Limited real-time access (research queries take weeks-months)
- Will become central once autoimmune CAR-T products are approved with REMS

**Recommendation:** CIBMTR should be a PRIMARY data source for post-marketing safety monitoring. Advocate for inclusion of autoimmune CAR-T patients in CIBMTR reporting requirements.

---

## Data Source Comparison Matrix

| Source | Type | CAR-T Onc | CAR-T AI | Denominator | Clinical Depth | Real-time | Access |
|--------|------|-----------|----------|-------------|----------------|-----------|--------|
| PubMed | Literature | +++ | ++ | No | +++ | No (lag) | Free |
| ClinicalTrials.gov | Registry | +++ | ++ | Partial | ++ | Partial | Free |
| ChiCTR | Registry | + | ++ | Partial | + | No | Free |
| **FAERS** | Spontaneous | ++ | - | No | + | Quarterly | Free |
| **EudraVigilance** | Spontaneous | ++ | +/- | No | + | Quarterly | Restricted |
| **VigiBase** | Spontaneous | ++ | +/- | No | + | Variable | Restricted |
| Optum CDM | Claims | ++ | - | Yes | + | Quarterly | Commercial |
| TriNetX | EHR | ++ | +/- | Yes | ++ | Near real-time | Commercial |
| Flatiron | EHR (onc) | +++ | - | Yes | +++ | Quarterly | Commercial |
| IQVIA | Multi-source | ++ | - | Yes | + | Quarterly | Commercial |
| Sentinel | Active surv. | + | - | Yes | + | On-demand | FDA only |
| MarketScan | Claims | ++ | - | Yes | + | Quarterly | Commercial |
| **CIBMTR** | Registry | +++ | +/- (emerging) | Yes | +++ | Lag | Research |

**Key:** +++ = comprehensive; ++ = good; + = limited; +/- = minimal; - = none currently

---

## Recommended Data Strategy for [[models/risk-model]]

### Current Phase (Pre-approval, 2025)
1. **Primary:** PubMed systematic review + ClinicalTrials.gov results
2. **Supplementary:** ChiCTR for Chinese trial data
3. **Benchmarking:** Flatiron + CIBMTR for oncology CRS/ICANS rates

### Near-term (Phase II Results Available, 2026-2027)
1. **Primary:** CASTLE and RESET-SLE trial results
2. **Signal detection:** EudraVigilance (European compassionate use)
3. **Contextual:** TriNetX for SLE natural history benchmarking

### Post-approval (2027+)
1. **Primary:** CIBMTR (if REMS mandated), FAERS
2. **Active surveillance:** Sentinel (FDA-initiated queries)
3. **RWE:** Optum CDM, MarketScan for long-term safety outcomes
4. **Global:** VigiBase for international signal aggregation

---

## Key References

1. FDA Sentinel System. https://www.sentinelinitiative.org/
2. CIBMTR. https://cibmtr.org/
3. FDA FAERS. https://www.fda.gov/drugs/drug-approvals-and-databases/fda-adverse-event-reporting-system-faers
4. EMA EudraVigilance. https://www.adrreports.eu/
5. WHO VigiBase. https://www.who-umc.org/vigibase/vigibase/
6. TriNetX. https://trinetx.com/
7. Flatiron Health. https://flatiron.com/

---

**Last Updated:** 2025-06-15

**See also:** [[models/risk-model]] | [[trials/active-trials]] | [[adverse-events/CRS]] | [[adverse-events/ICANS]] | [[adverse-events/ICAHS]] | [[adverse-events/LICATS]]
