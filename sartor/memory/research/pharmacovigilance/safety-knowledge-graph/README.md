# Safety Knowledge Graph: CAR-T Therapy in SLE

## Overview

This knowledge graph is a structured, cross-referenced safety knowledge base for chimeric antigen receptor T-cell (CAR-T) therapy applied to systemic lupus erythematosus (SLE) and related autoimmune indications. It synthesizes adverse event profiles, mitigation strategies, quantitative risk models, active clinical trials, and data source assessments into an interconnected markdown-based reference system.

The graph is designed to support:
- Pharmacovigilance planning for CAR-T in autoimmune diseases
- Risk-benefit assessments for regulatory submissions
- Safety protocol design for clinical trials
- Real-world evidence strategy development

## Directory Structure

```
safety-knowledge-graph/
|-- README.md                          # This file (master index)
|-- adverse-events/
|   |-- CRS.md                         # Cytokine Release Syndrome
|   |-- ICANS.md                       # Immune effector Cell-Associated Neurotoxicity Syndrome
|   |-- ICAHS.md                       # Immune effector Cell-Associated HLH-like Syndrome
|   |-- LICATS.md                      # Local Immune effector Cell-Associated Toxicity Syndrome
|-- mitigations/
|   |-- tocilizumab.md                 # Anti-IL-6R therapy
|   |-- corticosteroids.md             # Steroid-based management
|   |-- anakinra.md                    # IL-1 receptor antagonist
|   |-- dose-reduction.md             # CAR-T dose optimization
|   |-- lymphodepletion.md            # Conditioning regimen modifications
|-- models/
|   |-- risk-model.md                  # Integrated quantitative risk model
|-- trials/
|   |-- active-trials.md              # Active Phase I-II trials
|-- data-sources/
|   |-- README.md                      # Data source inventory and assessment
```

## File Index

### Adverse Events
- [[adverse-events/CRS]] - Cytokine Release Syndrome (ASTCT grading, rates, pathophysiology, biomarkers)
- [[adverse-events/ICANS]] - Immune effector Cell-Associated Neurotoxicity Syndrome (ICE score, grading, rates)
- [[adverse-events/ICAHS]] - Immune effector Cell-Associated HLH-like Syndrome (IEC-HS; macrophage activation)
- [[adverse-events/LICATS]] - Local Immune effector Cell-Associated Toxicity Syndrome (novel 2025 entity)

### Mitigation Strategies
- [[mitigations/tocilizumab]] - Anti-IL-6 receptor antibody for CRS management
- [[mitigations/corticosteroids]] - Steroid-based management for ICANS and CRS
- [[mitigations/anakinra]] - IL-1 receptor antagonist for refractory CRS
- [[mitigations/dose-reduction]] - CAR-T cell dose optimization for autoimmune indications
- [[mitigations/lymphodepletion]] - Conditioning regimen modification strategies

### Models
- [[models/risk-model]] - Integrated quantitative risk assessment model for CRS/ICANS in SLE CAR-T

### Trials
- [[trials/active-trials]] - Registry of active Phase I-II CAR-T trials in SLE

### Data Sources
- [[data-sources/README]] - Inventory and assessment of pharmacovigilance and RWE data sources

## Methodology

### Evidence Grading

Evidence levels used throughout this knowledge graph:

| Level | Definition | Criteria |
|-------|-----------|----------|
| **Strong** | High confidence in estimate | RCTs, large prospective cohorts (n>200), consistent across multiple studies, meta-analyses |
| **Moderate** | Reasonable confidence, some uncertainty | Phase II trials, medium cohorts (n=50-200), observational studies with controls, consistent mechanistic rationale |
| **Low** | Suggestive but substantial uncertainty | Case series (n<50), single-center studies, expert consensus, extrapolation from related populations |
| **Very Low** | Preliminary/speculative | Case reports, in vitro data, theoretical extrapolation only |

### Risk Estimate Derivation

Quantitative risk estimates in [[models/risk-model]] are derived through:

1. **Pooled incidence calculation**: Events/total patients across all published autoimmune CAR-T studies, with exact binomial 95% confidence intervals (Clopper-Pearson method)
2. **Oncology benchmarking**: Comparison to established rates from pivotal oncology CAR-T trials (ZUMA-1, JULIET, TRANSCEND, KarMMa, CARTITUDE)
3. **Risk ratio estimation**: Mitigation effect sizes derived from oncology interventional studies (prophylactic tocilizumab RCTs, anakinra Phase II) and adapted for autoimmune context
4. **Mechanistic adjustment**: Where direct autoimmune data are absent, estimates are adjusted based on known biological differences (lower antigen burden, lower CAR-T dose, different patient fitness)
5. **Uncertainty quantification**: Wide confidence intervals reflect small sample sizes; all estimates flagged with data maturity indicators

### Limitations

- Autoimmune CAR-T data are from <200 total treated patients across all indications (as of early 2025)
- No RCTs exist in autoimmune CAR-T; all data are from single-arm studies
- Risk model estimates should be considered preliminary and will require updating as Phase I/II trial data mature
- Cross-indication extrapolation (oncology to autoimmune) introduces systematic uncertainty
- Publication bias likely favors favorable safety outcomes in early reports

---

**Last Updated:** 2025-06-15

**Maintainer:** Sartor Research Module

**Version:** 1.0
