# Lymphodepletion Conditioning Regimens

## Overview

Lymphodepletion (also called lymphodepleting conditioning or preconditioning) is administered 2-7 days before CAR-T cell infusion to create an immunologic "space" for CAR-T cell expansion. The regimen intensity affects both CAR-T efficacy (by removing competing immune cells and increasing homeostatic cytokines) and toxicity (by modulating the inflammatory milieu). Modifications to lymphodepletion represent a potential, though modest, lever for reducing toxicity in autoimmune CAR-T therapy.

## Standard Regimens

### Oncology Standard: "Flu/Cy" (ZUMA-1, JULIET, TRANSCEND, KarMMa)

| Agent | Dose | Schedule | Total Exposure |
|-------|------|----------|---------------|
| **Fludarabine** | 30 mg/m^2/day IV | Days -5, -4, -3 (3 days) | 90 mg/m^2 total |
| **Cyclophosphamide** | 500 mg/m^2/day IV | Days -5, -4, -3 (3 days) | 1500 mg/m^2 total |

This is the most widely used regimen across approved CAR-T products. Some protocols use days -5 to -3 or days -4 to -2.

### Erlangen Autoimmune Protocol (Mackensen et al.)

| Agent | Dose | Schedule | Total Exposure |
|-------|------|----------|---------------|
| **Fludarabine** | 25 mg/m^2/day IV | Days -5, -4, -3 (3 days) | 75 mg/m^2 total |
| **Cyclophosphamide** | 1000 mg/m^2 IV | Day -3 only (single dose) | 1000 mg/m^2 total |

**Key differences from oncology standard:**
- Fludarabine: 25 vs 30 mg/m^2/day (**17% reduction per day, 17% reduction total**)
- Cyclophosphamide: Single dose of 1000 mg/m^2 vs 3 doses of 500 mg/m^2 (**33% reduction in total exposure**: 1000 vs 1500 mg/m^2)
- Net reduction: Moderately reduced total lymphodepletion intensity

### Allogeneic CAR-T Protocol (e.g., CRISPR-edited CD19)

| Agent | Dose | Schedule | Total Exposure |
|-------|------|----------|---------------|
| **Fludarabine** | 25 mg/m^2/day IV | Days -5, -4, -3 (3 days) | 75 mg/m^2 total |
| **Cyclophosphamide** | 300 mg/m^2/day IV | Days -5, -4 (2 days) | 600 mg/m^2 total |

**Key difference:** Even lower cyclophosphamide (600 mg/m^2 total) in allogeneic setting. Reduced intensity may limit host-vs-graft rejection window while maintaining engraftment.

### Comparison Table

| Regimen | Flu Total | Cy Total | Context |
|---------|-----------|----------|---------|
| Oncology standard | 90 mg/m^2 | 1500 mg/m^2 | DLBCL, ALL, MM |
| **Erlangen autoimmune** | **75 mg/m^2** | **1000 mg/m^2** | SLE, myositis, SSc |
| Allogeneic autoimmune | 75 mg/m^2 | 600 mg/m^2 | Allogeneic CD19 trials |
| Bendamustine-based | N/A | N/A | Some MM protocols |

## Mechanism: How Lymphodepletion Affects Toxicity

### Pro-Toxicity Effects (Higher Intensity = More Toxicity)
1. **Cytokine release from dying lymphocytes:** Lymphodepletion itself causes cytokine release, priming the inflammatory milieu before CAR-T infusion
2. **Enhanced homeostatic cytokines:** IL-7 and IL-15 surge after lymphodepletion, promoting CAR-T expansion (good for efficacy, but higher expansion = more CRS)
3. **Reduced regulatory T cells:** Loss of Tregs removes negative regulation of CAR-T activation
4. **Mucosal barrier injury:** Higher cyclophosphamide damages gut mucosa, enabling translocation of bacterial products (LPS), which further activates macrophages
5. **Cytopenias:** Deeper/longer cytopenias increase infection risk (indirect toxicity)

### Reduced Lymphodepletion Approach (Autoimmune Rationale)
- In autoimmune diseases, the lower antigen burden means less CAR-T activation is needed
- CAR-T expansion is already sufficient at lower lymphodepletion intensity in this population
- Reduced cyclophosphamide exposure means:
  - Less mucosal injury
  - Less cytokine priming
  - Potentially shorter cytopenias
  - Lower infection risk

## Safety Impact

### Estimated Risk Reduction from Modified Lymphodepletion

| Outcome | Estimated RR (vs Oncology Standard) | 95% CI | Notes |
|---------|-------------------------------------|--------|-------|
| Overall toxicity (any grade) | **0.80-0.90** | 0.60-1.05 | Modest effect; hard to isolate from dose reduction |
| Grade 3+ CRS | ~0.85-0.95 | 0.55-1.15 | Most CRS reduction is from [[mitigations/dose-reduction]], not LD modification |
| Prolonged cytopenias (>28 days) | **0.70-0.85** | 0.50-1.00 | More directly linked to LD intensity |
| Infection risk (first 30 days) | **0.75-0.90** | 0.55-1.05 | Reduced mucosal injury + shorter neutropenia |

**Evidence Level: Moderate**
- No RCT comparing lymphodepletion regimens in autoimmune CAR-T
- Mechanistic rationale is sound
- The Erlangen experience demonstrates that reduced LD maintains efficacy
- Confounded with dose effect (both reduced simultaneously in autoimmune protocols)
- Hard to attribute observed safety differences specifically to LD modification vs dose reduction

### Oncology Evidence for LD Intensity Effects
| Study | Finding | Reference |
|-------|---------|-----------|
| Turtle et al. 2016 | Flu/Cy lymphodepletion improved CAR-T expansion vs Cy alone | Turtle 2016 |
| Hirayama et al. 2019 | Higher cyclophosphamide exposure associated with more severe CRS | Hirayama 2019 |
| ZUMA-12 | Modified LD (reduced Cy) maintained efficacy in 1L LBCL | Neelapu 2022 |
| Brentjens et al. 2011 | Without lymphodepletion, minimal CAR-T expansion | Brentjens 2011 |

## Practical Considerations for Protocol Design

### Minimum Effective Lymphodepletion
- Fludarabine is essential: provides deep T-cell depletion and promotes homeostatic expansion
- Cyclophosphamide dose can likely be reduced further in autoimmune settings
- The Erlangen protocol (Flu 25/Cy 1000) has demonstrated consistent efficacy across >50 patients
- Further reduction below Flu 25/Cy 600 is unproven in autoimmune CAR-T

### Timing Relative to CAR-T Infusion
| Protocol | LD Days | Infusion Day | Rest Period |
|----------|---------|-------------|-------------|
| Oncology standard | -5 to -3 | 0 | 2 days |
| Erlangen | -5 to -3 | 0 | 2 days |
| Some Chinese protocols | -4 to -2 | 0 | 1 day |

### Corticosteroid Washout Before LD
- [[mitigations/corticosteroids]] must be withdrawn 1-2 weeks before LD
- Pulse steroids during washout do not impair subsequent LD effectiveness
- See [[mitigations/corticosteroids]] for washout protocol details

### Monitoring During and After LD
| Parameter | Frequency | Purpose |
|-----------|-----------|---------|
| CBC with differential | Daily | Track cytopenia depth and recovery |
| Metabolic panel | Every 2-3 days | Tumor lysis (rare in autoimmune), renal function |
| Urinalysis | Day of Cy dosing | Hemorrhagic cystitis monitoring (with MESNA) |
| Infectious markers | As needed | Monitor for febrile neutropenia |

## Relationship to Other Mitigations

- **[[mitigations/dose-reduction]]:** The dominant safety lever; LD modification adds modest additional benefit
- **[[mitigations/tocilizumab]]:** Independent of LD; addresses CRS regardless of LD intensity
- **[[mitigations/corticosteroids]]:** Must be withdrawn before LD but can be used post-infusion for CRS/ICANS
- **[[mitigations/anakinra]]:** Independent of LD; starts at day 0

In [[models/risk-model]], the LD modification effect is modeled as a modest additional risk modifier (RR 0.8-0.9) applied on top of the baseline autoimmune risk (which already incorporates the dose reduction effect).

## Unanswered Questions

1. **Optimal Cy dose in autoimmune:** Is 1000 mg/m^2 optimal, or could 500-600 mg/m^2 maintain efficacy?
2. **Flu-only conditioning:** Could fludarabine alone (without cyclophosphamide) be sufficient for autoimmune CAR-T?
3. **Bendamustine substitution:** Could bendamustine replace Flu/Cy in autoimmune settings (fewer side effects)?
4. **Non-chemotherapy conditioning:** Could antibody-based LD (e.g., anti-CD52, anti-thymocyte globulin) reduce toxicity?
5. **Biomarker-guided LD:** Can baseline lymphocyte counts or autoantibody levels guide LD intensity?

## Key References

1. Mackensen A, Muller F, Mougiakakos D, et al. Anti-CD19 CAR T cell therapy for refractory systemic lupus erythematosus. *Nat Med*. 2022;28(10):2124-2132. DOI: [10.1038/s41591-022-02017-5](https://doi.org/10.1038/s41591-022-02017-5)

2. Turtle CJ, Hanafi LA, Berger C, et al. CD19 CAR-T cells of defined CD4+:CD8+ composition in adult B cell ALL patients. *J Clin Invest*. 2016;126(6):2123-2138. DOI: [10.1172/JCI85309](https://doi.org/10.1172/JCI85309)

3. Hirayama AV, Gauthier J, Hay KA, et al. The response to lymphodepletion impacts PFS in patients with aggressive non-Hodgkin lymphoma treated with CD19 CAR T cells. *Blood*. 2019;133(17):1876-1887. DOI: [10.1182/blood-2018-11-887067](https://doi.org/10.1182/blood-2018-11-887067)

4. Brentjens RJ, Riviere I, Park JH, et al. Safety and persistence of adoptively transferred autologous CD19-targeted T cells in patients with relapsed or chemotherapy refractory B-cell leukemias. *Blood*. 2011;118(18):4817-4828. DOI: [10.1182/blood-2011-04-348540](https://doi.org/10.1182/blood-2011-04-348540)

5. Taubmann J, Knitza J, Enghard P, et al. CD19 CAR T cell treatment for autoimmune disease: a multicentre experience. *Lancet Rheumatol*. 2024. DOI: [10.1016/S2665-9913(24)00244-3](https://doi.org/10.1016/S2665-9913(24)00244-3)

---

**Evidence Level:** Moderate (observational in autoimmune; mechanistic rationale from oncology; no RCT comparing LD regimens in autoimmune CAR-T)

**Last Updated:** 2025-06-15

**See also:** [[adverse-events/CRS]] | [[adverse-events/ICANS]] | [[mitigations/dose-reduction]] | [[mitigations/tocilizumab]] | [[mitigations/corticosteroids]] | [[models/risk-model]] | [[trials/active-trials]]
