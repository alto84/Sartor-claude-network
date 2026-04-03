# Integrated Risk Assessment Model for Immunologic SAEs in SLE CAR-T

> **Status:** Active | **Version:** 2.0 | **Last Updated:** 2026-02-07
> **Purpose:** Core quantitative methodology for the Proactive Safety Plan (PSP)
> **Scope:** Bayesian risk estimation for immunologic serious adverse events in anti-CD19 CAR-T therapy for systemic lupus erythematosus

---

## 1. Model Specification

### 1.1 Distributional Assumptions

The model uses a **Beta-Binomial framework** for baseline incidence estimation:

- **Prior:** Informative, derived from oncology CAR-T meta-analytic rates, discounted by a biological risk ratio reflecting mechanistic differences between oncologic and autoimmune settings
- **Likelihood:** Binomial(n_events | n_patients, theta)
- **Posterior:** Beta(alpha + events, beta + n - events)

The biological risk ratio discounts oncology-derived rates to account for:
1. Lower CAR-T cell doses in autoimmune protocols (~1x10^6/kg vs. 0.6-6x10^8 total in oncology)
2. Absence of tumor lysis burden
3. Lower pre-treatment inflammatory cytokine milieu
4. Younger patient population with better organ reserve
5. Less intensive prior treatment exposure

### 1.2 Prior Elicitation

#### CRS Grade 3+
- Oncology meta-analytic rate: ~14% (pooled DLBCL across axi-cel, tisa-cel, liso-cel)
- Biological discount factor: 0.15 (based on ~10x lower cell dose, absence of tumor burden, lower baseline inflammation)
- Effective prior: Beta(0.21, 1.29) -- prior mean ~14% but heavily discounted toward lower values
- After observing 1/47 events (Erlangen + Sichuan pooled): Posterior Beta(1.21, 47.29) -- posterior mean ~2.5%

#### ICANS Grade 3+
- Oncology meta-analytic rate: ~12% (pooled DLBCL, higher with axi-cel)
- Biological discount factor: 0.12 (BBB disruption less likely without high-amplitude cytokine release from tumor lysis)
- Effective prior: Beta(0.14, 1.03)
- After observing 0-1/47 events: Posterior Beta(0.14-1.14, 47.03-48.03) -- posterior mean ~1.5%

#### ICAHS
- Prior from oncology BCMA-targeting data (cilta-cel, ide-cel): up to 20% incidence
- Biological discount factor: 0.0 (no BCMA-targeting in anti-CD19 SLE protocols; mechanism is BCMA-mediated hematotoxicity, not a general CAR-T effect)
- Prior: Beta(0.5, 0.5) -- Jeffreys non-informative prior (appropriate given mechanistic irrelevance of oncology comparator)
- After observing 0/47 events: Posterior Beta(0.5, 47.5) -- posterior mean ~1.0%, upper 95% credible bound ~6.1%

### 1.3 Evidence Weighting

Studies are weighted by three dimensions:

1. **Sample size:** Larger studies receive proportionally more weight in meta-analytic pooling
2. **Design quality:** RCTs > single-arm Phase 2 > observational cohorts > case series
3. **Relevance to target population:** Autoimmune CAR-T data weighted highest; oncology data discounted by biological risk ratio

**GRADE evidence levels applied per estimate:**

| Parameter | Evidence Grade | Rationale |
|---|---|---|
| CRS/ICANS rates (autoimmune) | Low-Moderate | Pooled observational data, n=47, heterogeneous populations and CAR constructs |
| CRS/ICANS rates (oncology comparators) | Moderate-High | Phase 2/3 RCTs, large samples (n>500), well-characterized products |
| Mitigation relative risks | Low-Moderate | Derived from oncology interventional data, not validated in autoimmune populations |
| ICAHS incidence | Low | Mechanism-based exclusion of oncology prior; very sparse autoimmune data |
| T-cell malignancy risk | Very Low | Insufficient follow-up in autoimmune cohorts; oncology data confounded by prior therapy |

---

## 2. Mitigation Risk Reduction Model

### 2.1 Individual Mitigations

| Mitigation | Target AE | Relative Risk (RR) | 95% CI | Source | Evidence Grade |
|---|---|---|---|---|---|
| Tocilizumab prophylaxis | CRS | 0.45 | [0.30, 0.65] | Oncology RCTs (CARTITUDE, ZUMA series) extrapolated | Moderate |
| Corticosteroid prophylaxis | ICANS | 0.55 | [0.35, 0.75] | Observational, oncology standard-of-care protocols | Moderate |
| Anakinra prophylaxis | CRS, ICANS | 0.65 | [0.45, 0.85] | Phase II data, oncology (Park et al.) | Moderate |
| Low-dose protocol (1x10^6/kg) | CRS, ICANS, ICAHS | 0.15 | [0.08, 0.30] | Cross-study comparison (autoimmune vs. oncology dosing) | Strong |
| Modified lymphodepletion | CRS | 0.85 | [0.65, 1.05] | Observational (reduced fludarabine-cyclophosphamide) | Limited |

### 2.2 Combination Rules

**The naive multiplicative model** (RR_combined = RR_1 x RR_2 x ... x RR_n) **assumes independence of mitigations.** This assumption is violated when mitigations share mechanistic pathways.

**Known correlations between mitigations:**

| Pair | Shared Mechanism | Estimated Correlation (rho) |
|---|---|---|
| Tocilizumab + Corticosteroids | Both suppress IL-6 signaling pathway | ~0.5 |
| Tocilizumab + Anakinra | Both target pro-inflammatory cytokine cascade (IL-6 and IL-1) | ~0.4 |
| Corticosteroids + Anakinra | Overlapping broad anti-inflammatory mechanisms | ~0.3 |

**Corrected combination model for correlated mitigations:**

For mitigations i and j with correlation rho_ij:

```
RR_combined = (RR_i * RR_j)^(1 - rho_ij) * min(RR_i, RR_j)^rho_ij
```

*Note: The original formula (v2.0 draft) was `max(RR) + (1-max(RR)) * min(RR)^(1-rho)` but this did not satisfy its stated boundary conditions. Corrected to geometric interpolation on the RR scale.*

**Properties of this model (verified):**
- When rho = 0 (fully independent): reverts to multiplicative model (RR_i x RR_j)
- When rho = 1 (identical mechanism): RR_combined = min(RR_i, RR_j), i.e., only the more effective mitigation contributes
- When 0 < rho < 1: intermediate, with diminishing marginal benefit as correlation increases

**Example:** Tocilizumab (RR=0.45) + Anakinra (RR=0.65), rho=0.4:
- Naive multiplicative: 0.45 x 0.65 = 0.293
- Correlated correction: (0.293)^0.6 x 0.45^0.4 = 0.348 (~19% less benefit than naive)

**For 3+ mitigations:** Apply pairwise combination iteratively, combining the two most correlated mitigations first, then combining the result with the next mitigation.

### 2.3 Uncertainty Quantification

**Monte Carlo simulation framework:**
- N = 10,000 samples per estimate
- Baseline incidence: sampled from Beta(alpha_posterior, beta_posterior)
- Each mitigation RR: sampled from LogNormal(log(RR), SE), where SE is derived from the 95% CI assuming log-normality
- Combination: apply corrected combination formula per sample
- Output: median and 2.5th/97.5th percentiles of the resulting distribution

**Sensitivity analysis parameters:**
- Prior specification: compare informative vs. weakly informative vs. non-informative priors
- Correlation assumptions: vary rho from 0 to 0.8
- Discount factor: vary from 0.05 to 0.50

---

## 3. Current Risk Estimates (as of February 2026)

### 3.1 Baseline Risk (SLE, Standard Autoimmune Protocol, No Additional Mitigations Beyond Low Dose)

| Adverse Event | Point Estimate | 95% CrI | N Events / N Patients | Evidence Grade |
|---|---|---|---|---|
| CRS Grade 3+ | 2.5% | [0.4%, 7.3%] | 1/47 | Low-Moderate |
| ICANS Grade 3+ | 1.5% | [0.1%, 5.5%] | <1/47 | Low-Moderate |
| ICAHS (any grade) | 1.0% | [0.0%, 6.1%] | 0/47 | Low |
| LICATS (any, Grade 1-2) | 77% | [61%, 88%] | 30/39 | Moderate |
| Prolonged cytopenia (Grade 3+) | ~100% (neutropenia) | N/A | 47/47 | Moderate |
| Infections (any) | ~15% | [5%, 30%] | ~7/47 | Low-Moderate |
| T-cell malignancy | Unknown | [0%, 6.1%] | 0/47 | Very Low (insufficient follow-up) |

**Notes on baseline estimates:**
- Prolonged cytopenia (neutropenia) is an expected pharmacologic effect of lymphodepleting conditioning, not an unexpected toxicity. All patients receive G-CSF support.
- LICATS (Laboratory Immune Cell-Associated Toxicity of the Skin) is common but clinically mild (Grade 1-2) and typically self-limited.
- T-cell malignancy risk cannot be estimated with current data; the upper bound of 6.1% is the rule-of-three estimate (3/n) for n=47.

### 3.2 With Recommended Mitigations (Tocilizumab Prophylaxis + Corticosteroid Prophylaxis)

| Adverse Event | Mitigated Estimate | 95% CrI | Reduction from Baseline |
|---|---|---|---|
| CRS Grade 3+ | ~1.1% | [0.1%, 4.2%] | ~55% reduction |
| ICANS Grade 3+ | ~0.8% | [0.05%, 3.8%] | ~47% reduction |

**Calculation (CRS example):**
- Baseline: 2.5%
- Tocilizumab RR = 0.45 (targets CRS directly)
- Corticosteroid prophylaxis: minimal additional CRS reduction (corr ~0.5 with tocilizumab via IL-6 pathway)
- Combined RR for CRS: ~0.45 (dominated by tocilizumab; corticosteroid contribution marginal for CRS)
- Mitigated rate: 2.5% x 0.45 = ~1.1%

---

## 4. Known Limitations

1. **Small sample size (n=47)** produces wide credible intervals; precision will improve substantially with Phase 2 trial data (CASTLE, RESET-SLE)
2. **Mitigation RRs extrapolated from oncology** settings and have not been validated in autoimmune patient populations
3. **Correlation estimates between mitigations** are based on mechanistic reasoning and expert judgment, not empirical measurement
4. **No individual patient-level data (IPD)** available for meta-regression; all estimates based on aggregate published data
5. **Publication bias:** Negative results and safety events may be under-reported in early case series
6. **Heterogeneity across studies:** Different CAR constructs (YTB323, MB-CART19, CT103A), different doses, different conditioning regimens, different patient populations
7. **No competing risk modeling:** Death from infection or disease flare prevents observation of late toxicities (e.g., T-cell malignancy)
8. **Cross-indication extrapolation:** Pooling SLE patients with SSc and IIM patients introduces population heterogeneity
9. **Follow-up duration:** Maximum follow-up is ~39 months (Erlangen); insufficient for rare late events

---

## 5. Planned Enhancements

- [ ] Bayesian meta-regression incorporating patient-level covariates (age, disease duration, prior treatment lines, baseline CRP)
- [ ] Hierarchical model pooling across autoimmune indications (SLE, SSc, IIM, ANCA vasculitis) with indication-level random effects
- [ ] Time-to-event modeling with competing risks (infection death, disease flare, T-cell malignancy)
- [ ] Integration of real-time data from TriNetX/Optum as autoimmune CAR-T real-world data accrues
- [ ] Formal sensitivity analysis: leave-one-out study influence, prior sensitivity (informative vs. Jeffreys vs. Haldane), discount factor sensitivity
- [ ] External validation against Phase 2 data from CASTLE trial (BMS, expected 2026-2027) and RESET-SLE (Cabaletta Bio)
- [ ] Network meta-analysis incorporating indirect comparisons across CAR constructs
- [ ] Decision-analytic model (cost-effectiveness) incorporating quality-adjusted life years and long-term safety

---

## 6. Cross-References

### Adverse Events
- [[adverse-events/CRS]] -- Cytokine Release Syndrome
- [[adverse-events/ICANS]] -- Immune Effector Cell-Associated Neurotoxicity Syndrome
- [[adverse-events/ICAHS]] -- Immune Effector Cell-Associated Hematotoxicity Syndrome
- [[adverse-events/LICATS]] -- Laboratory Immune Cell-Associated Toxicity of the Skin
- [[adverse-events/prolonged-cytopenias]] -- Prolonged Cytopenias
- [[adverse-events/infections]] -- Infections
- [[adverse-events/t-cell-malignancy]] -- T-Cell Malignancy

### Mitigations
- [[mitigations/tocilizumab]] -- IL-6R blockade for CRS prophylaxis/treatment
- [[mitigations/corticosteroids]] -- Broad anti-inflammatory for ICANS prophylaxis/treatment
- [[mitigations/anakinra]] -- IL-1R antagonist for CRS/ICANS prophylaxis
- [[mitigations/dose-reduction]] -- Low-dose CAR-T protocol
- [[mitigations/lymphodepletion]] -- Modified lymphodepleting conditioning

### Data Sources & Trials
- [[trials/active-trials]] -- Active clinical trials in autoimmune CAR-T
- [[data-sources/README]] -- Data source inventory and quality assessment

---
*Model specification v2.0. Next scheduled update: upon publication of CASTLE Phase 2 interim data or accrual of n>100 autoimmune CAR-T safety events.*
