# Immune Effector Cell-Associated Neurotoxicity Syndrome (ICANS)

## Definition

ICANS is a clinical syndrome of neurological toxicity occurring after immune effector cell (IEC) therapy, characterized by a progressive encephalopathy with word-finding difficulty, confusion, dysphasia, aphasia, and in severe cases, seizures, motor deficits, and cerebral edema. It is the second most common acute toxicity of CAR-T therapy after [[adverse-events/CRS]].

## ICE Score Assessment

The **Immune Effector Cell-Associated Encephalopathy (ICE)** score is the standard screening tool for ICANS (replaces the older CARTOX-10).

| Domain | Task | Points |
|--------|------|--------|
| Orientation | Year | 1 |
| Orientation | Month | 1 |
| Orientation | City | 1 |
| Orientation | Hospital | 1 |
| Naming | Name 3 objects | 3 |
| Writing | Write a standard sentence | 1 |
| Attention | Count backwards from 100 by 10 | 1 |
| Following commands | Follow a simple command | 1 |
| **Total** | | **10** |

**Assessment frequency:** Every 8-12 hours during at-risk period (day 0-10); every 4 hours if ICE score declining or CRS active.

## ASTCT Grading Criteria

| Grade | ICE Score | Consciousness | Seizure | Motor Findings | Cerebral Edema |
|-------|-----------|---------------|---------|----------------|----------------|
| **1** | 7-9 | Awakens spontaneously | None | None | None |
| **2** | 3-6 | Awakens to voice | None | None | None |
| **3** | 0-2 | Awakens only to tactile stimulus | Any clinical seizure (focal or generalized) that resolves rapidly, OR non-convulsive seizures on EEG that resolve with intervention | None | Focal/local edema on imaging |
| **4** | 0 (patient unarousable, unable to perform ICE) | Patient unarousable OR requires vigorous/repetitive tactile stimuli, OR obtunded | Life-threatening prolonged seizure (>5 min), OR repetitive clinical or electrical seizures without return to baseline | Deep focal motor weakness (hemiparesis, paraparesis) | Diffuse cerebral edema on imaging; decerebrate/decorticate posturing; cranial nerve VI palsy; papilledema; Cushing's triad |

**Note:** ICANS grade is determined by the most severe event NOT attributable to any other cause. If patient is unarousable and cannot be assessed with ICE, Grade 4 by default.

## Incidence Rates

### SLE / Autoimmune CAR-T (CD19-directed, ~1 x 10^6 cells/kg)

| Parameter | Rate | Source |
|-----------|------|--------|
| Any-grade ICANS | **~3%** (pooled) | Mackensen 2022, Muller 2024, Taubmann 2024 |
| Grade 1-2 ICANS | ~2% | Mild confusion, word-finding difficulty |
| Grade 3+ ICANS | **<2%** (0-1/47 patients) | One possible Grade 3 event across all published cohorts |
| Grade 4-5 ICANS | 0% | No life-threatening or fatal ICANS reported |
| 95% CI for Grade 3+ | 0.2% - 5.8% | Exact binomial (Clopper-Pearson), based on 0-1 events in 47 patients |

### Oncology Comparators

| Product | Indication | Any-grade ICANS | Grade 3+ ICANS | Source |
|---------|-----------|-----------------|----------------|--------|
| Axicabtagene ciloleucel (axi-cel) | DLBCL | 64% | **28%** | ZUMA-1 (Neelapu 2017) |
| Tisagenlecleucel (tisa-cel) | DLBCL | 21% | **12%** | JULIET (Schuster 2019) |
| Lisocabtagene maraleucel (liso-cel) | DLBCL | 30% | **10%** | TRANSCEND (Abramson 2020) |
| Tisagenlecleucel (tisa-cel) | r/r ALL | 40% | **13%** | ELIANA (Maude 2018) |
| Idecabtagene vicleucel (ide-cel) | r/r MM | 18% | **4%** (3% Gr3) | KarMMa (Munshi 2021) |
| Ciltacabtagene autoleucel (cilta-cel) | r/r MM | 21% | **9-10%** | CARTITUDE-1 (Berdeja 2021) |

**Key observation:** ICANS in autoimmune CAR-T (~3% any-grade) is **7-20x lower** than CD19-directed products in DLBCL, and comparable to or lower than BCMA-directed products in MM. This is attributable to lower CAR-T dose ([[mitigations/dose-reduction]]) and lower disease/antigen burden.

## Pathophysiology

```
CAR-T activation + CRS
       |
       v
Systemic cytokine elevation (IL-6, IFN-gamma, TNF-alpha)
       |
       v
Blood-Brain Barrier (BBB) disruption
  - Endothelial activation (Ang-2:Ang-1 ratio increase)
  - VWF release from endothelium
  - Tight junction protein degradation
       |
       v
CNS cytokine penetration
  - IL-6 / sIL-6R complex crosses disrupted BBB
  - TNF-alpha direct neurotoxicity
  - IFN-gamma activates CNS-resident macrophages/microglia
       |
       v
Neuroinflammation
  - Microglial activation
  - Astrocyte dysfunction (glutamate excitotoxicity)
  - Pericyte injury
       |
       v
Clinical manifestations
  - Encephalopathy (confusion, word-finding difficulty)
  - Seizures (from cortical excitotoxicity)
  - Cerebral edema (severe/fatal cases)
```

### Mechanistic Distinctions from CRS
- ICANS can occur **independently** of CRS, though severe CRS increases ICANS risk
- IL-6 receptor blockade ([[mitigations/tocilizumab]]) does NOT prevent ICANS and may paradoxically increase serum IL-6 levels (receptor blockade increases free IL-6, which can cross disrupted BBB)
- [[mitigations/corticosteroids]] are the mainstay of ICANS management (cross BBB, suppress neuroinflammation)
- [[mitigations/anakinra]] may address upstream IL-1-mediated BBB disruption

## Risk Factors

### Strongest Predictors
- **High disease/antigen burden** (strongest predictor in oncology; low in autoimmune)
- **Severe CRS** (Grade 3+ CRS precedes most Grade 3+ ICANS)
- **High CAR-T cell dose** (lower dose in autoimmune = lower risk)
- **CD28 costimulatory domain** (faster kinetics, higher peak expansion, more ICANS vs 4-1BB)

### Additional Risk Factors
- Pre-existing neurological conditions (CNS disease, seizure history)
- Young age (higher in pediatric populations)
- High peak CAR-T expansion
- Thrombocytopenia before lymphodepletion
- High baseline inflammatory markers (ferritin, CRP)

### SLE-Specific Considerations
- Neuropsychiatric lupus (NPSLE) history: theoretical increased susceptibility to ICANS due to pre-existing BBB compromise, but NO data yet to confirm
- Anti-NMDAR or anti-ribosomal P antibodies: may lower seizure threshold
- CNS lupus involvement should be assessed and documented before CAR-T infusion

## Temporal Profile

- **Typical onset:** 1-5 days after CRS onset (usually follows CRS); can be concurrent
- **Median onset:** Day 4-6 post-infusion (oncology data)
- **In autoimmune:** Earlier onset (day 2-4) when it occurs, correlating with earlier/milder CRS
- **Duration:** Median 5-14 days; longer for severe grades
- **Biphasic pattern:** Some patients experience initial mild ICANS with CRS, resolution, then recurrence at day 7-10 (rare, primarily reported with axi-cel)
- **Late-onset ICANS:** Rare; described primarily with BCMA-directed products (cilta-cel: delayed neurotoxicity at weeks-months)

## Management Algorithm

1. **Grade 1 (ICE 7-9):** Close monitoring (ICE q8h). Supportive care. Treat underlying CRS with [[mitigations/tocilizumab]] if present. Consider [[mitigations/corticosteroids]] if persistent >24h.
2. **Grade 2 (ICE 3-6):** [[mitigations/corticosteroids]]: Dexamethasone 10mg IV q6-12h. Tocilizumab ONLY if concurrent CRS (will not help ICANS alone). Seizure prophylaxis (levetiracetam 500-750mg BID). Neurology consult. EEG monitoring.
3. **Grade 3 (ICE 0-2 or seizure):** High-dose [[mitigations/corticosteroids]]: Dexamethasone 10mg IV q6h, OR methylprednisolone 1 mg/kg IV q12h. Anti-seizure management. ICU admission. Neuro-imaging (MRI brain). Consider [[mitigations/anakinra]] if refractory.
4. **Grade 4 (unarousable/cerebral edema):** Methylprednisolone 1-2 g IV (pulse). ICU with neuro-critical care. Intubation for airway protection. ICP monitoring if cerebral edema. Consider additional immunosuppression.

## Relationship to Other Adverse Events

- Usually preceded by [[adverse-events/CRS]] (70-80% of ICANS cases have prior CRS)
- Can occur independently of CRS (~20-30% of cases)
- Distinguished from [[adverse-events/ICAHS]] by neurological (vs hematologic/hepatic) predominance
- Mechanistically unrelated to [[adverse-events/LICATS]] (different timing, mechanism, and target organs)
- Severe CRS + severe ICANS overlap syndrome requires combined [[mitigations/tocilizumab]] + [[mitigations/corticosteroids]]

## Key References

1. Lee DW, Santomasso BD, Locke FL, et al. ASTCT Consensus Grading for Cytokine Release Syndrome and Neurologic Toxicity Associated with Immune Effector Cells. *Biol Blood Marrow Transplant*. 2019;25(4):625-638. DOI: [10.1016/j.bbmt.2018.12.758](https://doi.org/10.1016/j.bbmt.2018.12.758)

2. Santomasso BD, Park JH, Salloum D, et al. Clinical and biologic correlates of neurotoxicity associated with CAR T-cell therapy in patients with B-cell acute lymphoblastic leukemia. *Cancer Discov*. 2018;8(8):958-971. DOI: [10.1158/2159-8290.CD-17-1319](https://doi.org/10.1158/2159-8290.CD-17-1319)

3. Gust J, Hay KA, Hanafi LA, et al. Endothelial activation and blood-brain barrier disruption in neurotoxicity after adoptive immunotherapy with CD19 CAR-T cells. *Cancer Discov*. 2017;7(12):1404-1419. DOI: [10.1158/2159-8290.CD-17-0698](https://doi.org/10.1158/2159-8290.CD-17-0698)

4. Neelapu SS, Tummala S, Kebriaei P, et al. Chimeric antigen receptor T-cell therapy - assessment and management of toxicities. *Nat Rev Clin Oncol*. 2018;15(1):47-62. DOI: [10.1038/nrclinonc.2017.148](https://doi.org/10.1038/nrclinonc.2017.148)

5. Mackensen A, Muller F, Mougiakakos D, et al. Anti-CD19 CAR T cell therapy for refractory systemic lupus erythematosus. *Nat Med*. 2022;28(10):2124-2132. DOI: [10.1038/s41591-022-02017-5](https://doi.org/10.1038/s41591-022-02017-5)

6. Abramson JS, Palomba ML, Gordon LI, et al. Lisocabtagene maraleucel for patients with relapsed or refractory large B-cell lymphomas (TRANSCEND NHL 001). *Lancet*. 2020;396(10254):839-852. DOI: [10.1016/S0140-6736(20)31366-0](https://doi.org/10.1016/S0140-6736(20)31366-0)

---

**Evidence Level:** Low-Moderate (very few ICANS events in autoimmune CAR-T; pathophysiology and management extrapolated from oncology)

**Last Updated:** 2025-06-15

**See also:** [[adverse-events/CRS]] | [[adverse-events/ICAHS]] | [[adverse-events/LICATS]] | [[mitigations/corticosteroids]] | [[mitigations/tocilizumab]] | [[mitigations/anakinra]] | [[mitigations/dose-reduction]] | [[models/risk-model]]
