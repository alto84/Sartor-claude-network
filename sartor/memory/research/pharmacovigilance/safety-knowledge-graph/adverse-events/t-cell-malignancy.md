# T-Cell Malignancy Risk Following CAR-T Therapy

> **Status:** Active | **Last Updated:** 2026-02-07
> **Category:** Adverse Event -- Secondary Malignancy (Long-Term Safety)
> **ICD-10:** C84.x (Mature T/NK-cell lymphomas), C91.5x (Adult T-cell lymphoma/leukemia)
> **Regulatory Status:** FDA Boxed Warning (January 2024); REMS Removed (June 2025)

---

## 1. Definition and Regulatory Context

### 1.1 Definition
T-cell malignancy following CAR-T therapy refers to the development of a new T-cell lymphoma or leukemia in a patient who has received CAR-T cell therapy, where the malignancy may arise from:
1. **CAR-T cell-derived malignancy:** The malignant T cells carry the CAR transgene, confirmed by detection of the CAR construct or vector integration site
2. **Non-CAR-T cell-derived malignancy:** A secondary T-cell cancer arising from the patient's own T cells, potentially related to prior therapies, immune dysregulation, or coincidence

### 1.2 FDA Boxed Warning (January 2024)
In January 2024, the FDA added a **boxed warning** (the most serious type of warning) to all six approved CAR-T cell products:
- Abecma (idecabtagene vicleucel, ide-cel) -- Bristol Myers Squibb
- Breyanzi (lisocabtagene maraleucel, liso-cel) -- Bristol Myers Squibb
- Carvykti (ciltacabtagene autoleucel, cilta-cel) -- Janssen/Legend
- Kymriah (tisagenlecleucel, tisa-cel) -- Novartis
- Tecartus (brexucabtagene autoleucel, brexu-cel) -- Kite/Gilead
- Yescarta (axicabtagene ciloleucel, axi-cel) -- Kite/Gilead

The warning states that T-cell malignancies, including CAR-positive lymphoma, have occurred following treatment.

### 1.3 REMS Status
- **January 2024:** FDA considered but did not implement a REMS (Risk Evaluation and Mitigation Strategy) specifically for T-cell malignancy
- **June 2025:** The existing REMS programs for all approved CAR-T products were **removed**, as FDA determined the existing boxed warning, long-term follow-up requirements, and post-marketing surveillance were sufficient
- **15-year long-term follow-up (LTFU)** remains mandatory for all CAR-T recipients under FDA requirements

---

## 2. Epidemiology

### 2.1 Incidence Data (FDA FAERS and Published Literature)

| Metric | Value | Source |
|---|---|---|
| Total secondary cancers reported (all types) | 326 cases | FDA analysis, 5,517 treated patients |
| Total secondary cancers rate | 5.9% (326/5,517) | FDA FAERS through Q3 2023 |
| T-cell malignancies specifically | 5 confirmed cases | FDA FAERS through Q3 2023 |
| T-cell malignancy rate | 0.09% (5/5,517) | FDA FAERS |
| CAR-positive T-cell lymphoma | 3 cases | Subset with confirmed CAR transgene |
| CAR-negative T-cell malignancy | 2 cases | Likely coincidental or therapy-related |

### 2.2 Context: Background T-Cell Lymphoma Rates
- Background incidence of T-cell lymphoma in general population: ~1-2 per 100,000 person-years
- Background incidence in heavily pre-treated lymphoma patients: elevated (exact rate uncertain, estimated 2-5x general population)
- The observed 0.09% rate in CAR-T recipients over a median follow-up of ~2 years represents a rate that is difficult to distinguish from background in a heavily pre-treated population

### 2.3 Time to Onset
- Range: 1-19 months post-CAR-T infusion
- Approximately 50% of cases occurred within the first 12 months
- Median time to onset: ~7 months (limited by small case numbers)

### 2.4 In Autoimmune CAR-T

| Metric | Value | Notes |
|---|---|---|
| T-cell malignancy cases | **0** | No cases reported in any autoimmune CAR-T cohort |
| Total autoimmune CAR-T patients | ~200+ (published and conference data) | Across SLE, SSc, IIM, ANCA vasculitis, myasthenia gravis |
| Maximum follow-up | ~39 months | Erlangen first patient (SLE), infused October 2021 |
| Upper bound of risk (rule of three) | ~6.1% (3/47 for formal SLE cohort) | Based on 0 events in n=47 |

**Critical caveat:** The absence of T-cell malignancy in autoimmune CAR-T patients is reassuring but **not definitive** due to:
- Small sample size (n~200)
- Short maximum follow-up (39 months)
- Insufficient statistical power to detect a 0.1% event rate

---

## 3. Mechanism: Insertional Mutagenesis

### 3.1 Vector Integration
CAR-T cells are manufactured using lentiviral (most products) or retroviral (some products) vectors to stably integrate the CAR transgene into the T-cell genome. This integration is semi-random and carries an inherent risk of:

1. **Insertional oncogene activation:** Vector integrates near a proto-oncogene promoter, driving aberrant expression
2. **Tumor suppressor disruption:** Vector integrates within a tumor suppressor gene, causing loss of function
3. **Enhancer-mediated dysregulation:** Long-range chromatin effects from vector regulatory elements

### 3.2 Historical Precedent
- **X-SCID gene therapy (2002-2003):** 5/20 patients developed T-cell leukemia from retroviral vector insertion near LMO2 oncogene
- Modern lentiviral vectors have improved safety profiles (self-inactivating design, chromatin insulators), but residual risk remains

### 3.3 Risk Factors for Insertional Mutagenesis

| Factor | Relevance |
|---|---|
| Vector type | Gammaretroviral > lentiviral (retroviral has stronger enhancer/promoter activity) |
| Vector copy number | Higher copy number = more integration sites = higher risk |
| Manufacturing process | T-cell activation and expansion conditions may select for clones with growth advantage |
| Patient factors | Prior mutagenic therapy (alkylating agents, radiation), older age |
| In vivo expansion | Highly expanded CAR-T clones undergo more cell divisions, accumulating somatic mutations |

### 3.4 Relevance to Autoimmune CAR-T
Several factors suggest the insertional mutagenesis risk may be LOWER in autoimmune settings:
- **Lower cell dose:** ~1x10^6/kg vs. 0.6-6x10^8 total in oncology (fewer transduced cells = fewer integration events)
- **Less in vivo expansion:** Without tumor antigen driving sustained proliferation, CAR-T cells undergo more limited expansion
- **Fewer prior mutagenic therapies:** Autoimmune patients typically have not received alkylating agents or radiation
- **Younger patients:** Lower background somatic mutation burden

However, these are theoretical arguments; no empirical data directly compare insertional mutagenesis rates.

---

## 4. Monitoring Requirements

### 4.1 FDA-Mandated Long-Term Follow-Up (15-Year LTFU)

All CAR-T recipients must be enrolled in a 15-year LTFU protocol. Monitoring includes:

| Time Period | Frequency | Assessments |
|---|---|---|
| Year 1 | Every 3 months | CBC with differential, LDH, comprehensive metabolic panel, physical exam with lymph node assessment |
| Year 2-5 | Every 6 months | CBC with differential, LDH, physical exam with lymph node assessment |
| Year 6-15 | Annually | CBC with differential, LDH, physical exam, patient questionnaire |

### 4.2 Clinical Assessment Elements
- **CBC with differential:** Screen for unexplained lymphocytosis, atypical lymphocytes, cytopenias suggestive of marrow infiltration
- **LDH:** Elevated LDH may indicate lymphoproliferative process
- **Peripheral blood smear:** If abnormal CBC, review for atypical cells
- **Physical examination:** Lymphadenopathy, hepatosplenomegaly, skin lesions (cutaneous T-cell lymphoma)
- **Symptom assessment:** B-symptoms (fever, night sweats, weight loss), fatigue, new lumps

### 4.3 Diagnostic Workup if Suspected
1. Flow cytometry of peripheral blood (T-cell immunophenotyping)
2. PCR for CAR transgene in abnormal cells
3. Integration site analysis (lentiviral/retroviral insertion mapping)
4. Lymph node biopsy if lymphadenopathy present
5. PET-CT if systemic disease suspected
6. Bone marrow biopsy if cytopenias or circulating atypical cells

---

## 5. Risk-Benefit Context

### 5.1 The Central Question for Autoimmune CAR-T Approval

T-cell malignancy risk represents **THE key open question** differentiating the risk-benefit calculus between oncology and autoimmune CAR-T:

**In oncology:**
- Patients have refractory/relapsed cancer with limited life expectancy (median OS ~6 months without CAR-T)
- A 0.09% risk of T-cell malignancy is clearly acceptable against certain death from cancer
- FDA approved all products despite this risk because alternatives are worse

**In autoimmune disease (SLE):**
- Patients have a chronic disease with significant morbidity but a 10-year survival >90% with conventional therapy
- Alternative treatments exist: belimumab, voclosporin, anifrolumab, rituximab, cyclophosphamide
- A 0.09% risk of T-cell malignancy (or even 0.01%) requires careful weighing against the benefit of drug-free remission
- The risk-benefit is favorable ONLY if CAR-T provides durable, drug-free remission AND the malignancy risk does not increase with longer follow-up

### 5.2 Regulatory Implications
- FDA has not yet approved any CAR-T product for autoimmune indications
- Phase 2 trials (CASTLE by BMS, RESET-SLE by Cabaletta Bio) will be critical
- Regulatory pathway likely requires:
  - Demonstration of durable efficacy (drug-free remission >= 2 years)
  - Long-term safety data (minimum 3-5 years follow-up in Phase 2)
  - Commitment to 15-year LTFU
  - Clear informed consent regarding theoretical malignancy risk
- The removal of REMS in June 2025 may signal FDA's evolving assessment that the risk is manageable

### 5.3 Risk Communication Framework
For the PSP, T-cell malignancy should be communicated to patients as:
- A **theoretical risk** based on the mechanism of gene modification
- **Not observed** in any autoimmune CAR-T patient to date
- **Very rare** even in oncology (0.09% of all CAR-T recipients)
- Subject to **ongoing monitoring** for 15 years
- **Contextualized** against the risks of uncontrolled autoimmune disease and long-term immunosuppression

---

## 6. Comparison: Long-Term Malignancy Risk of Conventional Autoimmune Therapies

| Therapy | Known Malignancy Risk | Context |
|---|---|---|
| Cyclophosphamide | Bladder cancer (5-15% with cumulative dose >36g), MDS/AML (~2-5%) | Historical standard for severe lupus nephritis |
| Azathioprine | Lymphoma (3-5x increased risk), skin cancer | Long-term maintenance therapy |
| Mycophenolate mofetil | Lymphoma (theoretical, <1%), skin cancer | Current first-line maintenance |
| Rituximab | PML risk (~1:25,000), no clear malignancy signal | B-cell depletion without gene modification |
| CAR-T (theoretical) | T-cell lymphoma (0.09% in oncology, 0% in autoimmune to date) | One-time treatment, potentially curative |

**This comparison is important:** Conventional therapies also carry long-term malignancy risks. A complete risk-benefit analysis must compare CAR-T risks not to zero, but to the cumulative risks of decades of immunosuppressive therapy.

---

## 7. Key References

1. FDA Safety Communication: Risk of T-cell malignancy following BCMA- and CD19-directed CAR-T cell immunotherapies. January 2024.
2. FDA Drug Safety Communication: FDA removes REMS requirements for CAR-T cell products. June 2025.
3. Levine BL, et al. Unanswered questions following reports of secondary malignancies after CAR-T cell therapy. *Nat Med.* 2024;30(2):338-341.
4. Ghilardi G, et al. T-cell lymphoma and secondary primary malignancies after CAR T-cell therapy. *NEJM.* 2024.
5. Mackensen A, et al. Anti-CD19 CAR T cell therapy for refractory systemic lupus erythematosus. *Nat Med.* 2022;28(12):2124-2132.
6. Cornely OA, et al. Secondary malignancies after CAR-T: FDA analysis of FAERS database. *Blood.* 2024.
7. Muller F, et al. CD19-targeted CAR T cells in refractory antisynthetase syndrome. *NEJM.* 2023.

---

## 8. Cross-References

- [[adverse-events/prolonged-cytopenias]] -- Bone marrow evaluation during cytopenias should include assessment for secondary malignancy
- [[adverse-events/CRS]] -- CRS management does not affect malignancy risk
- [[adverse-events/infections]] -- Immune surveillance impairment during B-cell aplasia is a theoretical concern for tumor immunosurveillance
- [[models/risk-model]] -- T-cell malignancy modeled with non-informative prior, upper 95% bound ~6.1%
- [[trials/active-trials]] -- All active trials include 15-year LTFU for malignancy monitoring

---
*Last reviewed: 2026-02-07. This is the most rapidly evolving area of the safety knowledge graph. Next review: upon any new case report of T-cell malignancy in autoimmune CAR-T or upon publication of 5-year follow-up data from any autoimmune cohort.*
