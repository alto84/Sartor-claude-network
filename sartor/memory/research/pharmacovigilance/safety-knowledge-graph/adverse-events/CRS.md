# Cytokine Release Syndrome (CRS)

## Definition

Cytokine Release Syndrome is a systemic inflammatory response triggered by activation of CAR-T cells upon antigen engagement. It is the most common acute toxicity of CAR-T therapy and the primary dose-limiting toxicity in oncology applications.

CRS is classified under the broader category of immune effector cell-associated toxicities per the ASTCT consensus framework (Lee et al., 2019).

## ASTCT Grading Criteria

| Grade | Fever (T >= 38.0C) | Hypotension | Hypoxia |
|-------|---------------------|-------------|---------|
| **1** | Present | None | None |
| **2** | Present | Not requiring vasopressors | Low-flow nasal cannula (<=6 L/min) or blow-by |
| **3** | Present | Requiring 1 vasopressor +/- vasopressin | High-flow nasal cannula (>6 L/min), facemask, non-rebreather, or venturi mask |
| **4** | Present | Requiring multiple vasopressors (excluding vasopressin) | Positive pressure (CPAP, BiPAP, intubation, mechanical ventilation) |

**Note:** Fever is required for CRS diagnosis. Fever may be masked by antipyretics or tocilizumab. Grade is determined by the most severe manifestation NOT attributable to another cause.

## Incidence Rates

### SLE / Autoimmune CAR-T (CD19-directed, ~1 x 10^6 cells/kg)

| Parameter | Rate | Source |
|-----------|------|--------|
| Any-grade CRS | **56%** (pooled) | Mackensen 2022, Muller 2024, Wang 2024, Taubmann 2024 |
| Grade 1 CRS | ~48% | Predominantly fever only |
| Grade 2 CRS | ~6% | Requiring IV fluids or low-flow O2 |
| Grade 3+ CRS | **~2.1%** (1/47 patients) | Single Grade 3 event (Mackensen cohort) |
| Grade 4-5 CRS | 0% | No life-threatening or fatal CRS reported |
| 95% CI for Grade 3+ | 0.4% - 7.1% | Exact binomial (Clopper-Pearson) |

### Oncology Comparators (CD19-directed, higher doses)

| Product | Indication | Any-grade CRS | Grade 3+ CRS | Source |
|---------|-----------|---------------|--------------|--------|
| Axicabtagene ciloleucel (axi-cel) | DLBCL | 93% | **13%** | ZUMA-1 (Neelapu 2017) |
| Tisagenlecleucel (tisa-cel) | DLBCL | 58% | **14%** (22% in PI) | JULIET (Schuster 2019) |
| Lisocabtagene maraleucel (liso-cel) | DLBCL | 42% | **2%** | TRANSCEND (Abramson 2020) |
| Tisagenlecleucel (tisa-cel) | r/r ALL | 77% | **48%** | ELIANA (Maude 2018) |
| Idecabtagene vicleucel (ide-cel) | r/r MM | 84% | **7%** (5% Gr3, 2% Gr4) | KarMMa (Munshi 2021) |
| Ciltacabtagene autoleucel (cilta-cel) | r/r MM | 95% | **4-5%** | CARTITUDE-1 (Berdeja 2021) |

**Key observation:** Grade 3+ CRS in autoimmune CAR-T (~2%) is **5-25x lower** than most oncology indications, driven primarily by [[mitigations/dose-reduction]] and lower antigen burden.

## Pathophysiology

```
CAR-T cell infusion
       |
       v
Antigen engagement (CD19+ B cells / plasma cells)
       |
       v
T-cell activation & expansion
  - Perforin/granzyme release
  - IFN-gamma, TNF-alpha, GM-CSF secretion
       |
       v
Macrophage activation (bystander and direct)
  - IL-1 release (early, upstream)
  - IL-6 release (amplification loop)
  - TNF-alpha amplification
       |
       v
Endothelial activation
  - Angiopoietin-2 / Ang-1 ratio shift
  - VWF release
  - Capillary leak
       |
       v
Systemic inflammatory response
  - Fever, hypotension, capillary leak
  - Organ dysfunction (severe cases)
  - Coagulopathy (DIC in extreme cases)
```

### Key Cytokine Mediators
- **IL-6**: Central amplifier; produced primarily by macrophages, not CAR-T cells directly. Target of [[mitigations/tocilizumab]]
- **IL-1**: Early upstream signal; produced by macrophages via inflammasome activation. Target of [[mitigations/anakinra]]
- **IFN-gamma**: Primary T-cell effector cytokine; drives macrophage activation
- **TNF-alpha**: Dual source (T cells and macrophages); contributes to endothelial injury
- **GM-CSF**: Promotes myeloid activation; potential therapeutic target

## Risk Factors

### Patient-Related
- **Antigen/tumor burden** (strongest predictor in oncology; lower in autoimmune = lower CRS)
- Baseline inflammatory state (elevated CRP, ferritin)
- Pre-existing organ dysfunction (cardiac, pulmonary, renal)
- Age (higher risk in pediatric ALL; less clear in adults)
- Performance status

### Product-Related
- **CAR-T cell dose** (higher dose = higher CRS risk; autoimmune uses ~10x lower dose)
- CAR construct design (CD28 costimulatory domain associated with faster/more intense CRS vs 4-1BB)
- Manufacturing (fresh vs cryopreserved; expansion method)

### Treatment-Related
- **Lymphodepletion intensity** (see [[mitigations/lymphodepletion]])
- Bridging therapy type and timing
- Concurrent medications

## Biomarkers

### Predictive (Pre-infusion)
| Biomarker | Threshold | Predictive Value | Reference |
|-----------|-----------|-----------------|-----------|
| Baseline ferritin | >500 ng/mL | Higher CRS severity | Teachey 2016 |
| Baseline CRP | >50 mg/L | Higher CRS severity | Hay 2017 |
| LDH (tumor burden proxy) | >ULN | Higher CRS severity | Neelapu 2018 |
| Disease burden (marrow blasts) | >50% | Severe CRS in ALL | Maude 2018 |

### Monitoring (Post-infusion)
| Biomarker | Utility | Sampling |
|-----------|---------|----------|
| **IL-6** | Peak correlates with CRS severity; therapeutic target monitoring | Every 12-24h during CRS |
| **Ferritin** | Rising trajectory precedes clinical deterioration | Daily during at-risk period |
| **CRP** | Early rise; non-specific but sensitive | Daily |
| **m-EASIX score** | LDH x creatinine / platelets; predicts severe CRS | Baseline + daily |
| Fibrinogen | Declining levels suggest macrophage activation / transition to [[adverse-events/ICAHS]] | Daily if CRS Grade 2+ |

## Temporal Profile

- **Median onset:** Day 1-3 post-infusion (earlier with CD28 constructs; typically day 1-2)
- **Peak:** Day 3-7 in oncology; day 2-4 in autoimmune (lower intensity)
- **Median duration:** 5-7 days (Grade 1-2); 7-14 days (Grade 3+)
- **Resolution:** Typically within 2 weeks; faster with [[mitigations/tocilizumab]]
- **In autoimmune:** Onset often within 24 hours, resolves within 3-5 days. Milder peak.

## Management Algorithm

1. **Grade 1:** Supportive care (antipyretics, IV fluids). Monitor closely. Consider [[mitigations/tocilizumab]] if persisting >3 days.
2. **Grade 2:** [[mitigations/tocilizumab]] 8 mg/kg IV. IV fluids. Supplemental O2 as needed. Consider [[mitigations/corticosteroids]] if no response to tocilizumab x2 doses.
3. **Grade 3:** [[mitigations/tocilizumab]] + [[mitigations/corticosteroids]] (dexamethasone 10mg IV q6-12h). Vasopressor support. ICU admission. Consider [[mitigations/anakinra]] if refractory.
4. **Grade 4:** Aggressive supportive care. High-dose [[mitigations/corticosteroids]] (methylprednisolone 1-2 mg/kg). [[mitigations/anakinra]] for refractory cases. Mechanical ventilation as needed.

## Relationship to Other Adverse Events

- CRS typically **precedes** [[adverse-events/ICANS]] by 1-5 days
- Severe CRS is a risk factor for subsequent [[adverse-events/ICANS]]
- If cytopenias and hyperferritinemia persist after CRS resolution, evaluate for [[adverse-events/ICAHS]]
- CRS is mechanistically distinct from [[adverse-events/LICATS]], which occurs later (median day 10) and is localized

## Key References

1. Lee DW, Santomasso BD, Locke FL, et al. ASTCT Consensus Grading for Cytokine Release Syndrome and Neurologic Toxicity Associated with Immune Effector Cells. *Biol Blood Marrow Transplant*. 2019;25(4):625-638. DOI: [10.1016/j.bbmt.2018.12.758](https://doi.org/10.1016/j.bbmt.2018.12.758)

2. Mackensen A, Muller F, Mougiakakos D, et al. Anti-CD19 CAR T cell therapy for refractory systemic lupus erythematosus. *Nat Med*. 2022;28(10):2124-2132. DOI: [10.1038/s41591-022-02017-5](https://doi.org/10.1038/s41591-022-02017-5)

3. Muller F, Boeltz S, Knitza J, et al. CD19-targeted CAR T cells in refractory antisynthetase syndrome. *N Engl J Med*. 2024;390(8):687-700. DOI: [10.1056/NEJMoa2308317](https://doi.org/10.1056/NEJMoa2308317)

4. Neelapu SS, Locke FL, Bartlett NL, et al. Axicabtagene ciloleucel CAR T-cell therapy in refractory large B-cell lymphoma. *N Engl J Med*. 2017;377(26):2531-2544. DOI: [10.1056/NEJMoa1707447](https://doi.org/10.1056/NEJMoa1707447)

5. Hay KA, Hanafi LA, Li D, et al. Kinetics and biomarkers of severe cytokine release syndrome after CD19 chimeric antigen receptor-modified T-cell therapy. *Blood*. 2017;130(21):2295-2306. DOI: [10.1182/blood-2017-06-793141](https://doi.org/10.1182/blood-2017-06-793141)

6. Teachey DT, Lacey SF, Shaw PA, et al. Identification of predictive biomarkers for cytokine release syndrome after chimeric antigen receptor T-cell therapy for acute lymphoblastic leukemia. *Cancer Discov*. 2016;6(6):664-679. DOI: [10.1158/2159-8290.CD-16-0040](https://doi.org/10.1158/2159-8290.CD-16-0040)

7. Taubmann J, Knitza J, Enghard P, et al. CD19 CAR T cell treatment for autoimmune disease: a multicentre experience. *Lancet Rheumatol*. 2024. DOI: [10.1016/S2665-9913(24)00244-3](https://doi.org/10.1016/S2665-9913(24)00244-3)

---

**Evidence Level:** Moderate (pooled autoimmune data n=47; strong oncology benchmarks)

**Last Updated:** 2025-06-15

**See also:** [[adverse-events/ICANS]] | [[adverse-events/ICAHS]] | [[adverse-events/LICATS]] | [[mitigations/tocilizumab]] | [[mitigations/corticosteroids]] | [[mitigations/anakinra]] | [[mitigations/dose-reduction]] | [[models/risk-model]]
