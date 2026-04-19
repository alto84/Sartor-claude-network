# Corticosteroids

## Overview

Corticosteroids are the mainstay of [[adverse-events/ICANS]] management and a critical second-line therapy for [[adverse-events/CRS]] refractory to [[mitigations/tocilizumab]]. Their ability to cross the blood-brain barrier makes them uniquely effective for neurotoxicity, and their broad immunosuppressive mechanism provides rapid control of inflammatory cascades.

In the autoimmune CAR-T context, corticosteroids also play an important role in disease management during the peri-infusion bridging period.

## Mechanism of Action

- **Genomic effects:** Bind intracellular glucocorticoid receptors -> translocate to nucleus -> suppress NF-kB, AP-1 -> reduce transcription of IL-1, IL-6, TNF-alpha, IFN-gamma, GM-CSF
- **Non-genomic effects (rapid):** Membrane stabilization, direct anti-inflammatory effects within minutes
- **BBB penetration:** Dexamethasone and methylprednisolone readily cross the blood-brain barrier (critical for [[adverse-events/ICANS]])
- **Broad spectrum:** Suppress both T-cell and macrophage/monocyte activation, reduce endothelial permeability

## Dosing Regimens

### ICANS Treatment (Primary Indication)

| ICANS Grade | Corticosteroid Regimen | Duration | Notes |
|-------------|----------------------|----------|-------|
| **Grade 1** | Consider dexamethasone 10mg IV once if persistent >24h | Single dose, reassess | Not mandatory for Grade 1 |
| **Grade 2** | Dexamethasone 10mg IV q6-12h | Until improvement to Grade 1, then taper over 3-7 days | Start immediately upon Grade 2 diagnosis |
| **Grade 3** | Dexamethasone 10mg IV q6h **OR** Methylprednisolone 1 mg/kg IV q12h | Until improvement to Grade 1, then taper | Consider methylprednisolone if no response to dexamethasone x48h |
| **Grade 4** | Methylprednisolone 1-2 g IV (pulse dose) | Daily for 3 days, then taper | High-dose pulse; combine with supportive ICU care |

### CRS Treatment (Second-line, After Tocilizumab)

| Scenario | Corticosteroid Regimen | Notes |
|----------|----------------------|-------|
| CRS Grade 2+ refractory to tocilizumab x2 | Dexamethasone 10mg IV q6-12h | Add to ongoing tocilizumab |
| CRS Grade 3 | Dexamethasone 10mg IV q6h (start concurrently with tocilizumab) | Do not wait for tocilizumab failure |
| CRS Grade 4 | Methylprednisolone 1-2 mg/kg IV q12h | Part of aggressive combination regimen |

### Bridging Steroids in Autoimmune CAR-T (Peri-Infusion Management)

| Phase | Steroid Management | Rationale |
|-------|-------------------|-----------|
| **Pre-leukapheresis** | Prednisone <=10 mg/day (or equivalent) | Minimize immunosuppression for optimal T-cell collection |
| **Between leukapheresis and lymphodepletion** | Higher doses permitted (up to 1 mg/kg prednisone) | Control autoimmune flares during manufacturing period (4-6 weeks) |
| **Washout before conditioning** | Taper and discontinue 1-2 weeks before lymphodepletion | Ensure endogenous T-cell function not suppressed for CAR-T expansion |
| **Pulse during washout** | Methylprednisolone 250-500mg IV pulse x1-3 days | Control acute flares WITHOUT sustained immunosuppression; short half-life allows recovery before conditioning |

**Critical principle:** The washout period is essential. Sustained high-dose corticosteroids at the time of lymphodepletion and CAR-T infusion may impair CAR-T expansion. However, short pulse dosing during the washout period does NOT appear to impair subsequent CAR-T expansion (Mackensen 2022, Taubmann 2024).

## Prophylactic Use

### Evidence in Oncology
| Study | Design | Findings | Reference |
|-------|--------|----------|-----------|
| Topp et al. 2023 | Retrospective, axi-cel | Prophylactic dex 10mg pre-infusion: no reduction in CRS/ICANS | Topp 2023 |
| ZUMA-19 | Prophylactic toci + dex | Combined prophylaxis reduced Grade 2+ CRS | Oluwole 2024 |
| Multiple retrospective | Various regimens | Early corticosteroids (within 24h of symptom onset) reduce ICANS severity | Strati 2020 |

### Estimated Risk Reduction (Prophylactic/Early Use)
| Outcome | Relative Risk (RR) | 95% CI | Evidence Level |
|---------|-------------------|--------|----------------|
| Grade 2+ ICANS (early steroid use) | **0.50-0.60** | 0.30-0.85 | Moderate (observational) |
| Grade 3+ ICANS (early steroid use) | **0.40-0.55** | 0.20-0.80 | Moderate (limited events) |
| Grade 2+ CRS (prophylactic steroids alone) | 0.70-0.90 | 0.50-1.10 | Low (inconsistent evidence) |

**Note:** Corticosteroids alone are less effective than [[mitigations/tocilizumab]] for CRS prevention but are the primary intervention for ICANS prevention and treatment.

## Impact on CAR-T Efficacy

### Historical Concern
Early CAR-T trials avoided corticosteroids due to concern that immunosuppression would impair CAR-T expansion and efficacy, leading to reduced response rates.

### Current Evidence (Reassuring)
| Study | Finding | Reference |
|-------|---------|-----------|
| Strati et al. 2021 | Early corticosteroids (within 72h) did NOT reduce CR rate or PFS with axi-cel | Strati 2021 |
| Topp et al. 2023 | Prophylactic steroids did NOT impair CAR-T expansion kinetics | Topp 2023 |
| Liu et al. 2020 | Short-course dexamethasone did NOT reduce CAR-T persistence at 1 year | Liu 2020 |
| Mackensen 2022 (SLE) | Pulse steroids during washout did NOT prevent successful CAR-T expansion | Mackensen 2022 |

### Autoimmune-Specific Evidence
- In the Erlangen SLE cohort, patients received bridging steroids and pulse steroids during the washout period
- All patients achieved successful CAR-T expansion and B-cell aplasia
- Drug-free remission was maintained despite prior steroid exposure
- **Conclusion:** Short-course and pulse corticosteroids do NOT impair CAR-T efficacy in autoimmune indications

## Autoimmune CAR-T Protocol Considerations

### Pre-Treatment Phase
1. **Reduce background steroids** to <=10mg prednisone/day before leukapheresis
2. **Bridge with pulse steroids** if flares occur during manufacturing wait
3. **Complete washout** 7-14 days before lymphodepletion (Flu/Cy)

### Post-Infusion Phase
1. **Do NOT use prophylactic steroids** routinely (baseline ICANS risk already very low at ~3%)
2. **Low threshold for early steroids** if any neurological symptoms develop (ICE score <10)
3. **Dexamethasone 10mg IV** as first-line for Grade 2 ICANS
4. **Short courses** preferred (3-7 days with rapid taper)

### Pulse Steroid Protocol for Washout Flares
- Methylprednisolone 250-500mg IV daily x 1-3 days
- No oral taper (purpose is rapid, transient control)
- Resume washout after pulse
- Must complete washout (steroid-free) >= 7 days before conditioning
- This approach has been validated in the Erlangen cohort

## Safety Considerations

| Concern | Risk in CAR-T Setting | Mitigation |
|---------|----------------------|------------|
| Infection | Elevated (additive to lymphodepletion-induced immunosuppression) | Antimicrobial prophylaxis, monitor closely |
| Hyperglycemia | Common, especially with dexamethasone | Blood glucose monitoring q6h, insulin sliding scale |
| Psychiatric effects | Insomnia, agitation, psychosis (may confound ICANS assessment) | Distinguish steroid-induced psychiatric effects from ICANS |
| Adrenal suppression | Unlikely with short courses (3-7 days) | Taper if used >7 days |
| GI bleeding | Low but present | PPI prophylaxis with high-dose steroids |
| Myopathy | Minimal with short courses | Relevant only if prolonged use |

## Key References

1. Lee DW, Santomasso BD, Locke FL, et al. ASTCT Consensus Grading for Cytokine Release Syndrome and Neurologic Toxicity Associated with Immune Effector Cells. *Biol Blood Marrow Transplant*. 2019;25(4):625-638. DOI: [10.1016/j.bbmt.2018.12.758](https://doi.org/10.1016/j.bbmt.2018.12.758)

2. Strati P, Ahmed S, Furqan F, et al. Prognostic impact of corticosteroids on efficacy of chimeric antigen receptor T-cell therapy in large B-cell lymphoma. *Blood*. 2021;137(23):3272-3276. DOI: [10.1182/blood.2020008865](https://doi.org/10.1182/blood.2020008865)

3. Topp MS, van Meerten T, Houot R, et al. Earlier corticosteroid use for adverse event management in patients receiving axicabtagene ciloleucel for large B-cell lymphoma. *Br J Haematol*. 2023;201(6):1096-1104. DOI: [10.1111/bjh.18770](https://doi.org/10.1111/bjh.18770)

4. Mackensen A, Muller F, Mougiakakos D, et al. Anti-CD19 CAR T cell therapy for refractory systemic lupus erythematosus. *Nat Med*. 2022;28(10):2124-2132. DOI: [10.1038/s41591-022-02017-5](https://doi.org/10.1038/s41591-022-02017-5)

5. Liu S, Deng B, Yin Z, et al. Corticosteroids do not influence the efficacy and kinetics of CAR-T cells for B-cell acute lymphoblastic leukemia. *Blood Cancer J*. 2020;10(2):15. DOI: [10.1038/s41408-020-0280-y](https://doi.org/10.1038/s41408-020-0280-y)

6. Neelapu SS, Tummala S, Kebriaei P, et al. Chimeric antigen receptor T-cell therapy - assessment and management of toxicities. *Nat Rev Clin Oncol*. 2018;15(1):47-62. DOI: [10.1038/nrclinonc.2017.148](https://doi.org/10.1038/nrclinonc.2017.148)

---

**Evidence Level:** Moderate (standard of care for ICANS management; observational data supporting no efficacy impairment; autoimmune-specific bridging data from Erlangen cohort)

**Last Updated:** 2025-06-15

**See also:** [[adverse-events/ICANS]] | [[adverse-events/CRS]] | [[mitigations/tocilizumab]] | [[mitigations/anakinra]] | [[mitigations/dose-reduction]] | [[models/risk-model]]
