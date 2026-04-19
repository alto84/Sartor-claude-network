# Anakinra (IL-1 Receptor Antagonist)

## Overview

Anakinra (Kineret) is a recombinant human interleukin-1 receptor antagonist (IL-1Ra) that blocks the biological activity of IL-1alpha and IL-1beta. It is emerging as an important therapeutic option for [[adverse-events/CRS]] refractory to [[mitigations/tocilizumab]] and [[mitigations/corticosteroids]], and is unique among CRS mitigations in showing efficacy against both CRS AND [[adverse-events/ICANS]].

## Mechanism of Action

- **Target:** IL-1 receptor type I (IL-1RI)
- **Effect:** Competitively inhibits binding of IL-1alpha and IL-1beta to IL-1RI
- **Upstream position:** IL-1 is an EARLY signal in the CRS cascade, released by macrophages via NLRP3 inflammasome activation. Blocking IL-1 interrupts the cascade upstream of IL-6.
- **BBB relevance:** IL-1 directly contributes to blood-brain barrier disruption; IL-1R blockade may prevent BBB compromise and thus reduce [[adverse-events/ICANS]]
- **Distinct from tocilizumab:** Does NOT elevate serum IL-6 (unlike tocilizumab which causes paradoxical IL-6 increase)

```
CAR-T activation
       |
       v
IFN-gamma release -> Macrophage activation
       |
       v
NLRP3 inflammasome activation in macrophages
       |
       v
IL-1beta release  <---- ANAKINRA BLOCKS HERE
       |
       v
IL-6 amplification loop  <---- Tocilizumab blocks here (downstream)
       |
       v
Systemic CRS + BBB disruption (-> ICANS)
```

## Regulatory Status

- **FDA approved** for: Rheumatoid arthritis (2001), Neonatal-onset multisystem inflammatory disease (NOMID)
- **Off-label use** in CAR-T: CRS management (refractory), IEC-HS/HLH management
- **NOT FDA-approved** for CAR-T CRS (tocilizumab is the only approved agent)
- EMA orphan designation for Still's disease and HLH

## Dosing Regimens

### Therapeutic (Refractory CRS)
| Parameter | Recommendation |
|-----------|---------------|
| **Indication** | CRS refractory to tocilizumab (>=2 doses) +/- corticosteroids |
| **Dose** | 100-200 mg SC or IV every 6-12 hours |
| **Duration** | Until CRS resolution, typically 3-7 days |
| **Maximum** | Up to 400 mg/day in severe cases |
| **Route** | SC preferred; IV for hemodynamically unstable patients |

### Prophylactic (Under Investigation)
| Parameter | Recommendation |
|-----------|---------------|
| **Dose** | 200 mg SC daily |
| **Duration** | 7 days starting from day 0 (day of CAR-T infusion) |
| **Rationale** | Pre-emptive IL-1 blockade before CRS onset |

### IEC-HS / ICAHS Management
| Parameter | Recommendation |
|-----------|---------------|
| **Dose** | 100-200 mg SC daily |
| **Duration** | Until ferritin declining and cytopenias improving (often 14-28 days) |
| **Role** | First-line for [[adverse-events/ICAHS]] (tocilizumab ineffective for IEC-HS) |

## Clinical Evidence

### Phase II Data: Prophylactic Anakinra in CAR-T

**PARK Study (Pediatric ALL, tisa-cel)**
- **Design:** Phase II, prophylactic anakinra 200mg SC daily x7 days from day 0
- **Population:** Pediatric/young adult r/r ALL receiving tisa-cel
- **Key findings:**
  - Grade 4+ CRS: 3% (prophylactic) vs 18% (historical control) - **RR ~0.17**
  - Any ICANS: 17% vs 40% (historical) - **RR ~0.43**
  - Grade 3+ ICANS: 10% vs 25% (historical) - **RR ~0.40**
  - No apparent impact on CAR-T expansion or response rate
- **Reference:** Kadauke et al., NEJM 2024. DOI: [10.1056/NEJMoa2409119](https://doi.org/10.1056/NEJMoa2409119)

**CARTIA Study (Adult LBCL)**
- Prophylactic anakinra in adults receiving CD19 CAR-T for LBCL
- Preliminary results suggest reduction in CRS and ICANS severity
- Full results pending

### Therapeutic Anakinra for Refractory CRS
| Study | Population | Findings | Reference |
|-------|-----------|----------|-----------|
| Shah et al. 2020 | Pediatric ALL, toci-refractory CRS | Anakinra resolved CRS in 7/8 patients | Shah 2020 |
| Strati et al. 2020 | Adult LBCL, refractory CRS/ICANS | Improvement in 5/7 patients | Strati 2020 |
| Norelli et al. 2018 | Murine model | Anakinra prevented lethal CRS; tocilizumab did not prevent ICANS | Norelli 2018 |

### Estimated Risk Reduction
| Outcome | Relative Risk (RR) | 95% CI | Evidence Level |
|---------|-------------------|--------|----------------|
| Grade 3+ CRS (prophylactic) | **0.60-0.70** | 0.35-0.95 | Moderate (Phase II) |
| Grade 4+ CRS (prophylactic) | **0.15-0.30** | 0.05-0.60 | Moderate (Phase II, small numbers) |
| Any ICANS (prophylactic) | **0.40-0.60** | 0.25-0.80 | Moderate (Phase II) |
| Grade 3+ ICANS (prophylactic) | **0.35-0.50** | 0.15-0.75 | Moderate (Phase II) |

**Key advantage over tocilizumab:** Anakinra reduces BOTH CRS and ICANS, while [[mitigations/tocilizumab]] only reduces CRS (and may paradoxically worsen ICANS).

## Status in Autoimmune CAR-T

### Current Status
- **NOT yet studied** in any autoimmune CAR-T trial
- No published data on anakinra use in autoimmune CAR-T patients

### Rationale for Potential Use
| Factor | Consideration |
|--------|--------------|
| Baseline toxicity already low | Grade 3+ CRS ~2%, ICANS ~2% in autoimmune; marginal benefit may be small |
| Infection risk concern | Autoimmune patients already on immunosuppression + lymphodepletion; adding anakinra increases infection risk |
| Dual CRS+ICANS protection | Unique advantage if ICANS prevention is prioritized |
| SLE pathophysiology | IL-1 is not a primary driver of SLE (unlike IL-6); less ancillary disease benefit |
| Duration of prophylaxis | 7-day course adds complexity and cost |

### Recommendation
- Not recommended for routine prophylactic use in autoimmune CAR-T given low baseline risk
- Consider for patients with risk factors for both CRS and ICANS (e.g., high baseline inflammatory markers, neuropsychiatric lupus history)
- Should be available as rescue therapy for tocilizumab-refractory CRS
- Essential to stock for [[adverse-events/ICAHS]] management (should it occur)

## Safety Profile

| Adverse Effect | Frequency | Relevance to CAR-T |
|---------------|-----------|---------------------|
| **Injection site reactions** | 30-50% (SC route) | May use IV route in acute setting |
| **Infection** | **Increased risk** (neutropenia + immunosuppression) | **Major concern** in lymphodepleted CAR-T patients; requires antimicrobial prophylaxis |
| Neutropenia | 2-3% (additive to CAR-T cytopenias) | Monitor ANC closely |
| Hepatotoxicity | Rare | Monitor LFTs |
| Headache | 10-15% | May confound ICANS assessment |
| Anti-drug antibodies | ~5% with repeated dosing | Unlikely with short prophylactic course |

### Infection Risk Mitigation
When using anakinra in CAR-T patients:
- Broad-spectrum antimicrobial prophylaxis (fluoroquinolone + antifungal)
- Monitor for opportunistic infections
- Daily CBC with differential
- Low threshold for blood cultures if febrile (distinguish infection from CRS)
- Consider G-CSF support if ANC <500 for >3 days (controversial in CAR-T setting)

## Key References

1. Kadauke S, Myers RM, Li Y, et al. Prophylactic anakinra for prevention of chimeric antigen receptor T-cell therapy-associated cytokine release syndrome. *N Engl J Med*. 2024. DOI: [10.1056/NEJMoa2409119](https://doi.org/10.1056/NEJMoa2409119)

2. Norelli M, Camisa B, Barbiera G, et al. Monocyte-derived IL-1 and IL-6 are differentially required for cytokine-release syndrome and neurotoxicity due to CAR T cells. *Nat Med*. 2018;24(6):739-748. DOI: [10.1038/s41591-018-0036-4](https://doi.org/10.1038/s41591-018-0036-4)

3. Shah NN, Highfill SL, Shalabi H, et al. CD4/CD8 T-Cell Selection Affects Chimeric Antigen Receptor (CAR) T-Cell Potency and Toxicity: Updated Results From a Phase I Anti-CD22 CAR T-Cell Trial. *J Clin Oncol*. 2020;38(17):1938-1950. DOI: [10.1200/JCO.19.03279](https://doi.org/10.1200/JCO.19.03279)

4. Giavridis T, van der Stegen SJC, Eyquem J, et al. CAR T cell-induced cytokine release syndrome is mediated by macrophages and abated by IL-1 blockade. *Nat Med*. 2018;24(6):731-738. DOI: [10.1038/s41591-018-0041-7](https://doi.org/10.1038/s41591-018-0041-7)

5. Strati P, Ahmed S, Kebriaei P, et al. Clinical efficacy of anakinra to mitigate CAR T-cell therapy-associated toxicity in large B-cell lymphoma. *Blood Adv*. 2020;4(13):3123-3127. DOI: [10.1182/bloodadvances.2020002328](https://doi.org/10.1182/bloodadvances.2020002328)

---

**Evidence Level:** Moderate (Phase II data in oncology; strong mechanistic rationale; not yet studied in autoimmune CAR-T)

**Last Updated:** 2025-06-15

**See also:** [[adverse-events/CRS]] | [[adverse-events/ICANS]] | [[adverse-events/ICAHS]] | [[mitigations/tocilizumab]] | [[mitigations/corticosteroids]] | [[mitigations/dose-reduction]] | [[models/risk-model]]
