# Immune Effector Cell-Associated HLH-like Syndrome (IEC-HS / ICAHS)

## Definition

Immune effector Cell-Associated Hemophagocytic lymphohistiocytosis-like Syndrome (IEC-HS, also referred to as ICAHS) is a severe hyperinflammatory syndrome characterized by uncontrolled macrophage activation following immune effector cell therapy. It was formally defined in the 2024 ASTCT consensus update as a distinct entity from [[adverse-events/CRS]], recognizing that it represents a major driver of early non-relapse mortality in CAR-T therapy, particularly with BCMA-directed products.

Previously, IEC-HS events were often misclassified as prolonged or refractory CRS, leading to underrecognition and delayed appropriate treatment.

## ASTCT Diagnostic Criteria (2024 Update)

**All three criteria must be met:**

1. **Macrophage activation signs:** At least TWO of the following:
   - Hyperferritinemia (see thresholds below)
   - Hepatic transaminitis (AST or ALT > 3x ULN)
   - Hypofibrinogenemia (fibrinogen < 150 mg/dL)
   - Hypertriglyceridemia (fasting triglycerides > 265 mg/dL)
   - Hemophagocytosis on bone marrow biopsy

2. **Temporal relationship to IEC therapy:** Onset during or after immune effector cell infusion

3. **Cytopenias:** At least TWO lineage cytopenia(s) after initial hematopoietic recovery from lymphodepletion:
   - ANC < 1000/uL
   - Hemoglobin < 8 g/dL
   - Platelets < 50,000/uL

## Grading Criteria

### For CD19-directed products:
| Grade | Ferritin | Other Features |
|-------|----------|----------------|
| **1** | >10,000 ng/mL AND <2x baseline | Meeting diagnostic criteria |
| **2** | >10,000 ng/mL AND >=2x baseline | OR organ dysfunction not requiring ICU |
| **3** | >10,000 ng/mL with rapid rise | Organ dysfunction requiring ICU |
| **4** | Any ferritin meeting criteria | Life-threatening organ failure |

### For BCMA-directed products:
| Grade | Ferritin | Other Features |
|-------|----------|----------------|
| **1** | Rapid rise >=100 ug/L/hr sustained >12h | Meeting diagnostic criteria |
| **2** | Rapid rise >=100 ug/L/hr sustained >12h | OR organ dysfunction not requiring ICU |
| **3** | Rapid rise >=100 ug/L/hr | Organ dysfunction requiring ICU |
| **4** | Any qualifying ferritin | Life-threatening organ failure |

**Note:** The distinct ferritin thresholds for CD19 vs BCMA products reflect different kinetics of macrophage activation with these targets.

## Incidence Rates

### SLE / Autoimmune CAR-T

| Parameter | Rate | Source |
|-----------|------|--------|
| Any-grade IEC-HS | **0%** | NO CASES reported in any published autoimmune CAR-T study |
| 95% CI for any-grade | 0% - 7.5% | Exact binomial upper bound for 0/47 patients |
| Fatal IEC-HS | 0% | |

**Critical observation:** Zero IEC-HS events have been reported across all published autoimmune CAR-T cohorts (SLE, myositis, systemic sclerosis, combined n~100+ patients across indications). This is consistent with the hypothesis that lower antigen burden and lower CAR-T dose drive substantially less macrophage activation.

### Oncology Comparators

| Product | Indication | Incidence (Approximate) | Source |
|---------|-----------|------------------------|--------|
| BCMA-directed (ide-cel) | r/r MM | **~5-8%** (historically classified as prolonged CRS) | KarMMa, post-hoc analyses |
| BCMA-directed (cilta-cel) | r/r MM | **~15-20%** (IEC-HS is a major driver of NRM) | CARTITUDE-1, FDA review |
| CD19-directed (axi-cel) | DLBCL | **~3-5%** (often not separately reported) | Post-marketing data |
| CD19-directed (tisa-cel) | ALL | **~5-8%** | Post-marketing, case series |

**Note:** Historical incidence is difficult to determine precisely because IEC-HS was only formally defined as a separate entity in the 2024 ASTCT update. Many earlier cases were reported as CRS, macrophage activation syndrome (MAS), or secondary HLH.

## Distinguishing Features: IEC-HS vs CRS

| Feature | CRS | IEC-HS |
|---------|-----|--------|
| **Timing** | Day 0-7 post-infusion | After CRS resolution (day 7-21+); chronologically independent |
| **Primary driver** | T-cell activation -> cytokine storm | Uncontrolled macrophage activation |
| **Key cytokine** | IL-6 (elevated acutely) | IFN-gamma, IL-18, CXCL9 |
| **Ferritin** | Moderately elevated | Markedly elevated (>10,000 ng/mL or rapid rise) |
| **Fibrinogen** | Normal or mildly low | Characteristically low (<150 mg/dL) |
| **Cytopenias** | Expected from lymphodepletion | Persist/worsen AFTER expected recovery |
| **Tocilizumab response** | Typically responsive | Poor response (different mechanism) |
| **Hemophagocytosis** | Absent | May be present on marrow biopsy |

**Key distinction:** IEC-HS appears AFTER CRS resolves. If a patient's inflammatory markers and cytopenias worsen after initial CRS improvement, IEC-HS should be suspected.

## Pathophysiology

```
Initial CAR-T activation + CRS
       |
       v
CRS resolves (day 5-10)
       |
       v
Ongoing/secondary macrophage activation
  - IFN-gamma from persistently activated CAR-T cells
  - Positive feedback loop: macrophage -> IL-18 -> T/NK cells -> IFN-gamma -> macrophage
       |
       v
Uncontrolled macrophage expansion
  - Hemophagocytosis (phagocytosis of blood cells by activated macrophages)
  - Massive ferritin release
  - Fibrinogen consumption
  - Hepatic injury (Kupffer cell activation)
       |
       v
Multi-organ dysfunction
  - Cytopenias (hemophagocytosis + marrow failure)
  - Hepatic failure
  - Coagulopathy (DIC)
  - Renal failure
  - Pulmonary involvement
```

### Why Zero Cases in Autoimmune CAR-T?

Several factors likely explain the absence of IEC-HS in autoimmune CAR-T:

1. **Low CAR-T dose** ([[mitigations/dose-reduction]]): ~10x lower dose means less sustained IFN-gamma production
2. **Low antigen burden:** Fewer CD19+ targets means less prolonged CAR-T activation
3. **Milder CRS:** Less initial macrophage priming from the CRS phase
4. **Different patient population:** Younger, fitter patients without extensive prior chemotherapy
5. **Less marrow involvement:** Autoimmune diseases generally have less bone marrow disease than hematologic malignancies

## Management (Oncology-Derived)

1. **Early recognition:** Monitor ferritin and fibrinogen daily through day 21, especially if CRS has resolved but cytopenias persist
2. **First-line:** Dexamethasone 10mg IV q12h + [[mitigations/anakinra]] 100-200mg SC daily (IL-1 blockade addresses upstream macrophage activation)
3. **Second-line:** Emapalumab (anti-IFN-gamma) for refractory cases; ruxolitinib (JAK1/2 inhibitor)
4. **Supportive:** Aggressive transfusion support, fibrinogen replacement, broad-spectrum antimicrobials
5. **Note:** [[mitigations/tocilizumab]] is generally NOT effective for IEC-HS (different mechanism from CRS)

## Implications for Autoimmune CAR-T Program

- IEC-HS is a **theoretical risk** that should be included in risk monitoring protocols despite zero observed events
- The upper bound of the confidence interval (7.5%) means the risk cannot be definitively excluded
- Monitoring should include:
  - Daily ferritin through day 21
  - Daily fibrinogen through day 14
  - CBC with differential daily through expected hematopoietic recovery
  - Hepatic panel every 2-3 days through day 21
- As patient numbers increase and sicker patients are treated, vigilance for IEC-HS remains important

## Key References

1. Hines MR, Keenan C, Maron Alfaro G, et al. Immune Effector Cell-Associated Hemophagocytic Lymphohistiocytosis-Like Syndrome (IEC-HS). *Transplant Cell Ther*. 2023;29(7):438.e1-438.e16. DOI: [10.1016/j.jtct.2023.03.006](https://doi.org/10.1016/j.jtct.2023.03.006)

2. Canna SW, Marsh RA. Pediatric hemophagocytic lymphohistiocytosis. *Blood*. 2020;135(16):1332-1343. DOI: [10.1182/blood.2019000936](https://doi.org/10.1182/blood.2019000936)

3. Sandler RD, Tattersall RS, Schoemans H, et al. Diagnosis and management of secondary HLH/MAS following HSCT and CAR-T cell therapy in adults: a review of the literature and a survey of practice within EBMT centres on behalf of the Autoimmune Diseases Working Party (ADWP) and Transplant Complications Working Party (TCWP). *Front Immunol*. 2020;11:524. DOI: [10.3389/fimmu.2020.00524](https://doi.org/10.3389/fimmu.2020.00524)

4. Berdeja JG, Madduri D, Usmani SZ, et al. Ciltacabtagene autoleucel, a B-cell maturation antigen-directed chimeric antigen receptor T-cell therapy in patients with relapsed or refractory multiple myeloma (CARTITUDE-1). *Lancet*. 2021;398(10297):314-324. DOI: [10.1016/S0140-6736(21)00933-8](https://doi.org/10.1016/S0140-6736(21)00933-8)

5. Lee DW, Santomasso BD, Locke FL, et al. ASTCT Consensus Grading for Cytokine Release Syndrome and Neurologic Toxicity Associated with Immune Effector Cells. *Biol Blood Marrow Transplant*. 2019;25(4):625-638. DOI: [10.1016/j.bbmt.2018.12.758](https://doi.org/10.1016/j.bbmt.2018.12.758)

6. Mackensen A, Muller F, Mougiakakos D, et al. Anti-CD19 CAR T cell therapy for refractory systemic lupus erythematosus. *Nat Med*. 2022;28(10):2124-2132. DOI: [10.1038/s41591-022-02017-5](https://doi.org/10.1038/s41591-022-02017-5)

---

**Evidence Level:** Low (zero events in autoimmune; formal definition only established 2023-2024; oncology incidence still being characterized)

**Last Updated:** 2025-06-15

**See also:** [[adverse-events/CRS]] | [[adverse-events/ICANS]] | [[adverse-events/LICATS]] | [[mitigations/anakinra]] | [[mitigations/corticosteroids]] | [[mitigations/dose-reduction]] | [[models/risk-model]]
