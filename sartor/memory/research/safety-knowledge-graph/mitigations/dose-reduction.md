# CAR-T Cell Dose Reduction

## Overview

Dose reduction is the **single most important driver** of the favorable safety profile observed with CAR-T therapy in autoimmune diseases compared to oncology. The standard autoimmune dose (~1 x 10^6 CAR-T cells/kg) is approximately 5-10x lower than typical oncology doses, and this lower dose is enabled by the fundamentally different disease biology: absence of high tumor/antigen burden, absence of tumor-mediated T-cell exhaustion, and the fact that B-cell depletion (not tumor eradication) is the therapeutic goal.

## Dosing Comparison: Autoimmune vs Oncology

### Autoimmune Indications (CD19-directed)

| Study/Protocol | Dose | Dosing Basis | Product |
|---------------|------|-------------|---------|
| **Erlangen (Mackensen)** | **1 x 10^6 CAR-T cells/kg** | Weight-based | Autologous anti-CD19 (4-1BB) |
| **CASTLE trial** | 1 x 10^6/kg | Weight-based | Zorpocabtagene autoleucel |
| **RESET-SLE (Cabaletta)** | 1 x 10^6/kg (escalation cohorts) | Weight-based | Rese-cel (desmoteplase) |
| **KYV-101 (Kyverna)** | ~1 x 10^6/kg | Weight-based | KYV-101 (fully human) |
| **Chinese cohorts (various)** | 0.5-1 x 10^6/kg | Weight-based | Various CD19 constructs |
| **Allogeneic studies** | 1 x 10^6/kg | Weight-based | CRISPR-edited allogeneic |

**Standard autoimmune dose: ~1 x 10^6 CAR-T cells/kg**
For a 70 kg adult: ~70 million (7 x 10^7) total CAR-T cells

### Oncology Indications

| Product | Indication | Dose | Dosing Basis | Total Cells (70 kg) |
|---------|-----------|------|-------------|---------------------|
| **Axicabtagene ciloleucel (axi-cel)** | DLBCL | 2 x 10^6/kg | Weight-based | ~1.4 x 10^8 (140M) |
| **Tisagenlecleucel (tisa-cel)** | DLBCL | 0.6-6 x 10^8 | Flat dose | Up to 6 x 10^8 (600M) |
| **Tisagenlecleucel (tisa-cel)** | ALL | 0.2-5 x 10^6/kg (ped) | Weight-based | Variable |
| **Lisocabtagene maraleucel (liso-cel)** | DLBCL | 50-110 x 10^6 | Flat dose | ~1 x 10^8 (100M) |
| **Idecabtagene vicleucel (ide-cel)** | MM | 150-450 x 10^6 | Flat dose | Up to 4.5 x 10^8 (450M) |
| **Ciltacabtagene autoleucel (cilta-cel)** | MM | 0.5-1 x 10^8 | Flat dose | Up to 1 x 10^8 (100M) |

### Dose Ratio

| Comparison | Autoimmune Dose | Oncology Dose | Ratio |
|-----------|----------------|---------------|-------|
| vs axi-cel (DLBCL) | 7 x 10^7 | 1.4 x 10^8 | **~2x lower** |
| vs tisa-cel max (DLBCL) | 7 x 10^7 | 6 x 10^8 | **~8.5x lower** |
| vs ide-cel max (MM) | 7 x 10^7 | 4.5 x 10^8 | **~6.4x lower** |
| vs tisa-cel (ALL, pediatric) | ~1 x 10^6/kg | up to 5 x 10^6/kg | **~5x lower** |

## Mechanism: Why Lower Dose Reduces Toxicity

### 1. Reduced Peak CAR-T Expansion
- Lower starting dose = lower absolute peak expansion
- Peak CAR-T levels are the strongest correlate of CRS severity in oncology
- Even with vigorous expansion, the ceiling is lower

### 2. Lower Antigen Burden in Autoimmune Disease
- In DLBCL/ALL: massive tumor burden provides sustained antigen stimulation -> prolonged T-cell activation -> severe CRS
- In SLE: normal or reduced B-cell numbers (many patients are B-cell lymphopenic from prior rituximab)
- Less antigen = less activation = less cytokine release
- The dose reduction and low antigen burden are SYNERGISTIC

### 3. Less Macrophage Activation
- Macrophage activation (driver of IL-6, IL-1) is proportional to T-cell activation intensity
- Lower dose + lower antigen burden = substantially less macrophage activation
- This is why [[adverse-events/ICAHS]] has not been observed in autoimmune CAR-T

### 4. Shorter Duration of Peak Activation
- Lower initial activation means faster return to baseline
- CRS in autoimmune: median duration 3-5 days vs 5-7+ days in oncology
- Earlier resolution reduces cumulative organ injury

## Safety Impact

### Estimated Risk Reduction from Dose Effect

| Outcome | Autoimmune Rate | Oncology Rate (CD19 DLBCL avg) | Estimated RR | Notes |
|---------|-----------------|-------------------------------|-------------|-------|
| Grade 3+ CRS | ~2% | ~10-15% | **0.13-0.20** (~80-87% reduction) | Primarily driven by dose + antigen burden |
| Grade 3+ ICANS | ~2% | ~15-28% | **0.07-0.13** (~87-93% reduction) | |
| Any IEC-HS | 0% | ~3-5% (CD19) | **~0** | Zero events to date |
| Fatal toxicity | 0% | ~1-3% | **~0** | Zero treatment-related deaths |

**Estimated overall risk reduction attributable to dose effect: ~80-90% reduction in Grade 3+ CRS compared to high-dose oncology protocols.**

This estimate combines the effects of:
- Lower absolute CAR-T cell number (~5-10x)
- Lower antigen burden (synergistic)
- Different patient population (younger, fitter, no prior intensive chemotherapy)

### Evidence Level: **Strong**
- Consistent across ALL autoimmune CAR-T studies (Erlangen, Chinese cohorts, multi-center)
- Strong mechanistic rationale (dose-exposure-response)
- Supported by dose-escalation data in oncology showing dose-dependent toxicity
- Corroborated by the liso-cel experience (lowest oncology dose -> lowest oncology CRS)

## Why Low Dose Works in Autoimmune Disease

In oncology, higher doses are needed because:
1. Large tumor burden requires more effector cells
2. Tumor microenvironment suppresses T-cell function
3. Prior chemotherapy impairs T-cell fitness
4. Goal is tumor eradication (high bar)

In autoimmune disease:
1. **Low target burden:** Normal or reduced B-cell counts (often after prior rituximab)
2. **No immunosuppressive microenvironment:** B cells in autoimmune disease do not create an immunosuppressive milieu like tumors do
3. **Better T-cell fitness:** Patients are younger, less pre-treated, T cells are healthier
4. **Lower therapeutic bar:** Complete B-cell depletion is achievable with fewer CAR-T cells
5. **4-1BB constructs preferred:** Slower but more sustained expansion; lower peak activation

## Dose Optimization Considerations

### Could Even Lower Doses Work?
- Some Chinese studies have used 0.5 x 10^6/kg with apparent efficacy
- Further dose reduction could further reduce CRS risk but may risk:
  - Incomplete B-cell depletion
  - Shorter duration of B-cell aplasia
  - Need for retreatment
- No formal dose-finding studies have been completed in autoimmune indications

### Could Higher Doses Be Needed?
- Patients with very high autoantibody titers or extensive tissue-resident B cells may need higher doses
- BCMA-directed CAR-T for refractory autoimmune disease (plasma cell targeting) may require different dosing
- Allogeneic CAR-T may require dose adjustment for host-mediated rejection

## Relationship to Other Mitigations

The dose effect is the **foundation** upon which other mitigations operate:

- [[mitigations/tocilizumab]]: Additional CRS reduction on top of already-low baseline
- [[mitigations/corticosteroids]]: Additional ICANS reduction on top of already-low baseline
- [[mitigations/anakinra]]: Additional CRS+ICANS reduction
- [[mitigations/lymphodepletion]]: Modulating the immune environment before the already-low dose

In [[models/risk-model]], the dose reduction effect is **already incorporated into the baseline risk estimates** for autoimmune CAR-T. The other mitigations provide additional risk reduction on top of this baseline.

## Key References

1. Mackensen A, Muller F, Mougiakakos D, et al. Anti-CD19 CAR T cell therapy for refractory systemic lupus erythematosus. *Nat Med*. 2022;28(10):2124-2132. DOI: [10.1038/s41591-022-02017-5](https://doi.org/10.1038/s41591-022-02017-5)

2. Neelapu SS, Locke FL, Bartlett NL, et al. Axicabtagene ciloleucel CAR T-cell therapy in refractory large B-cell lymphoma. *N Engl J Med*. 2017;377(26):2531-2544. DOI: [10.1056/NEJMoa1707447](https://doi.org/10.1056/NEJMoa1707447)

3. Munshi NC, Anderson LD Jr, Shah N, et al. Idecabtagene vicleucel in relapsed and refractory multiple myeloma. *N Engl J Med*. 2021;384(8):705-716. DOI: [10.1056/NEJMoa2024850](https://doi.org/10.1056/NEJMoa2024850)

4. Wang W, He S, Zhang W, et al. BCMA-CD19 compound CAR T cell therapy in patients with refractory systemic lupus erythematosus. *Cell Rep Med*. 2024. DOI: [10.1016/j.xcrm.2024.101566](https://doi.org/10.1016/j.xcrm.2024.101566)

5. Abramson JS, Palomba ML, Gordon LI, et al. Lisocabtagene maraleucel for patients with relapsed or refractory large B-cell lymphomas (TRANSCEND NHL 001). *Lancet*. 2020;396(10254):839-852. DOI: [10.1016/S0140-6736(20)31366-0](https://doi.org/10.1016/S0140-6736(20)31366-0)

6. Taubmann J, Knitza J, Enghard P, et al. CD19 CAR T cell treatment for autoimmune disease: a multicentre experience. *Lancet Rheumatol*. 2024. DOI: [10.1016/S2665-9913(24)00244-3](https://doi.org/10.1016/S2665-9913(24)00244-3)

---

**Evidence Level:** Strong (consistent across all autoimmune studies; strong mechanistic rationale; corroborated by oncology dose-response data)

**Last Updated:** 2025-06-15

**See also:** [[adverse-events/CRS]] | [[adverse-events/ICANS]] | [[adverse-events/ICAHS]] | [[mitigations/tocilizumab]] | [[mitigations/corticosteroids]] | [[mitigations/lymphodepletion]] | [[models/risk-model]]
