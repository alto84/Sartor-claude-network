"""
Predictive Safety Platform (PSP) - FastAPI Backend
====================================================

Statistical Models Used
-----------------------

1. **Bayesian Risk Estimation (Beta-Binomial Conjugate Model)**
   - Prior: Beta(0.5, 0.5) — Jeffreys non-informative prior
   - Likelihood: Binomial(n, theta) where theta is the true event rate
   - Posterior: Beta(alpha + events, beta + n - events)
   - This is the conjugate update for binomial data, giving exact posteriors.

2. **Posterior Predictive Distribution (Beta-Binomial)**
   - Integrates over posterior uncertainty in theta to predict future counts.
   - P(Y=k | data) = C(n_future, k) * B(alpha_post + k, beta_post + n_future - k)
                                       / B(alpha_post, beta_post)
   - Where B is the Beta function. This accounts for parameter uncertainty,
     unlike a plug-in binomial prediction.

3. **Monte Carlo Mitigation Simulation**
   - Baseline risk: sampled from Beta posterior
   - Mitigation relative risks: sampled from LogNormal distributions
     parameterized to match published confidence intervals
   - Combined mitigated risk = baseline * product(RR_i) for applicable mitigations
   - 50,000 Monte Carlo samples propagate full uncertainty through the pipeline.

4. **Stopping Rule Power Analysis**
   - Given a hypothetical true event rate, computes the probability that
     a predefined stopping rule triggers using the binomial CDF.
   - P(trigger) = P(X >= threshold | n, p_true) = 1 - CDF(threshold - 1)

Context: CAR-T cell therapy for SLE (systemic lupus erythematosus).
Observed data from clinical program: 47 patients treated.
- Grade 3+ CRS: 1 event in 47 patients
- Grade 3+ ICANS: ~0 events in 47 patients (modeled as 0.7 for partial/borderline)

Port: 5002 (avoids conflict with dashboard on 5000 and gateway on 5001)
"""

from __future__ import annotations

import math
import time
import logging
from enum import Enum
from typing import Optional

import httpx
import numpy as np
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from scipy import stats
from scipy.special import betaln

logger = logging.getLogger("psp")

# ---------------------------------------------------------------------------
# Application setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Predictive Safety Platform (PSP)",
    description="Bayesian safety analytics for CAR-T cell therapy in SLE",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Constants and observed data
# ---------------------------------------------------------------------------

# Jeffreys non-informative prior for binomial proportion
PRIOR_ALPHA: float = 0.5
PRIOR_BETA: float = 0.5

# Observed clinical data
N_PATIENTS: int = 47

OBSERVED_DATA: dict[str, dict[str, float]] = {
    "crs_grade3plus": {
        "events": 1.0,
        "n": float(N_PATIENTS),
        "label": "Grade 3+ CRS",
    },
    "icans_grade3plus": {
        "events": 0.7,
        "n": float(N_PATIENTS),
        "label": "Grade 3+ ICANS",
    },
}

# Monte Carlo configuration
MC_SAMPLES: int = 50_000
RNG_SEED: int = 42

# ---------------------------------------------------------------------------
# Mitigation catalog — matches safety-data.ts
# ---------------------------------------------------------------------------


class AETarget(str, Enum):
    CRS = "CRS"
    ICANS = "ICANS"
    ICAHS = "ICAHS"


class MitigationDef(BaseModel):
    """Definition of a risk-mitigation strategy."""

    id: str
    label: str
    rr: float = Field(..., description="Point estimate of relative risk")
    ci_low: float = Field(..., description="Lower bound of 95% CI for RR")
    ci_high: float = Field(..., description="Upper bound of 95% CI for RR")
    targets: list[str] = Field(..., description="Adverse event types affected")


MITIGATIONS: dict[str, MitigationDef] = {
    "tocilizumab": MitigationDef(
        id="tocilizumab",
        label="Tocilizumab (anti-IL-6R)",
        rr=0.45,
        ci_low=0.30,
        ci_high=0.65,
        targets=["CRS"],
    ),
    "corticosteroids": MitigationDef(
        id="corticosteroids",
        label="Corticosteroids",
        rr=0.55,
        ci_low=0.35,
        ci_high=0.75,
        targets=["ICANS"],
    ),
    "anakinra": MitigationDef(
        id="anakinra",
        label="Anakinra (IL-1 blockade)",
        rr=0.65,
        ci_low=0.45,
        ci_high=0.85,
        targets=["CRS", "ICANS"],
    ),
    "dose-reduction": MitigationDef(
        id="dose-reduction",
        label="CAR-T Dose Reduction",
        rr=0.15,
        ci_low=0.08,
        ci_high=0.30,
        targets=["CRS", "ICANS", "ICAHS"],
    ),
    "lymphodepletion-modification": MitigationDef(
        id="lymphodepletion-modification",
        label="Lymphodepletion Modification",
        rr=0.85,
        ci_low=0.65,
        ci_high=1.05,
        targets=["CRS"],
    ),
}

# ---------------------------------------------------------------------------
# Stopping rules catalog
# ---------------------------------------------------------------------------


class StoppingRule(BaseModel):
    """A predefined stopping rule for the clinical program."""

    id: str
    description: str
    threshold: int  # >= this many events triggers the rule
    cohort_size: int  # evaluated over first N patients
    grade: str


STOPPING_RULES: list[StoppingRule] = [
    StoppingRule(
        id="rule_crs_grade4_10",
        description=">=2 Grade 4+ CRS in first 10 patients",
        threshold=2,
        cohort_size=10,
        grade="Grade 4+ CRS",
    ),
    StoppingRule(
        id="rule_crs_grade3_20",
        description=">=3 Grade 3+ CRS in first 20 patients",
        threshold=3,
        cohort_size=20,
        grade="Grade 3+ CRS",
    ),
    StoppingRule(
        id="rule_death",
        description="Any treatment-related death",
        threshold=1,
        cohort_size=N_PATIENTS,
        grade="Treatment-related death",
    ),
]

# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class PosteriorEstimate(BaseModel):
    """Posterior summary for a single adverse event type."""

    label: str
    prior_alpha: float
    prior_beta: float
    observed_events: float
    observed_n: int
    posterior_alpha: float
    posterior_beta: float
    posterior_mean: float
    posterior_median: float
    credible_interval_95: list[float]
    posterior_mode: Optional[float]


class RiskModelResponse(BaseModel):
    """Full response for the risk-model endpoint."""

    model: str = "Beta-Binomial conjugate"
    prior: str = "Jeffreys Beta(0.5, 0.5)"
    estimates: dict[str, PosteriorEstimate]


class PredictiveEntry(BaseModel):
    """One row in the posterior predictive table."""

    k: int
    probability: float
    cumulative_probability: float
    probability_k_or_more: float


class PosteriorPredictiveResponse(BaseModel):
    """Response for posterior predictive endpoint."""

    n_future: int
    event_type: str
    posterior_alpha: float
    posterior_beta: float
    table: list[PredictiveEntry]


class MitigationSimulationResult(BaseModel):
    """Result of a Monte Carlo mitigation simulation for one AE type."""

    ae_type: str
    baseline_posterior_mean: float
    mitigations_applied: list[str]
    n_samples: int
    mitigated_risk_mean: float
    mitigated_risk_median: float
    mitigated_risk_p2_5: float
    mitigated_risk_p97_5: float
    relative_reduction_mean: float
    histogram_bins: list[float]
    histogram_counts: list[int]


class MitigationSimulationResponse(BaseModel):
    """Full response for mitigation simulation."""

    mitigations_requested: list[str]
    available_mitigations: list[str]
    results: dict[str, MitigationSimulationResult]


class StoppingRulePowerEntry(BaseModel):
    """Power analysis for a single stopping rule at various true rates."""

    rule_id: str
    description: str
    threshold: int
    cohort_size: int
    true_rates: list[float]
    trigger_probabilities: list[float]


class StoppingRulePowerResponse(BaseModel):
    """Full response for stopping rule power analysis."""

    true_rates_evaluated: list[float]
    rules: list[StoppingRulePowerEntry]


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    service: str
    version: str
    models_loaded: bool


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------


def _compute_posterior(events: float, n: float) -> tuple[float, float]:
    """Return posterior (alpha, beta) given Jeffreys prior and observed data."""
    alpha_post = PRIOR_ALPHA + events
    beta_post = PRIOR_BETA + (n - events)
    return alpha_post, beta_post


def _safe_float(value: float) -> float:
    """Replace NaN/Inf with None-safe values (0.0 for NaN, large cap for Inf)."""
    if math.isnan(value):
        return 0.0
    if math.isinf(value):
        return 1.0 if value > 0 else 0.0
    return round(value, 8)


def _lognormal_params_from_ci(
    rr: float, ci_low: float, ci_high: float
) -> tuple[float, float]:
    """
    Derive LogNormal(mu, sigma) parameters from a point estimate and 95% CI.

    The CI is assumed symmetric on the log scale:
        log(ci_high) - log(rr) ~ log(rr) - log(ci_low) ~ 1.96 * sigma

    We average the two estimates of sigma for robustness when the CI is
    not perfectly symmetric on the log scale.
    """
    log_rr = math.log(max(rr, 1e-10))
    log_low = math.log(max(ci_low, 1e-10))
    log_high = math.log(max(ci_high, 1e-10))

    sigma_from_low = (log_rr - log_low) / 1.96
    sigma_from_high = (log_high - log_rr) / 1.96
    sigma = max((sigma_from_low + sigma_from_high) / 2.0, 1e-6)
    mu = log_rr

    return mu, sigma


def _beta_binomial_pmf(k: int, n: int, alpha: float, beta_param: float) -> float:
    """
    Probability mass function for the Beta-Binomial distribution.

    P(Y=k | n, alpha, beta) = C(n,k) * B(k+alpha, n-k+beta) / B(alpha, beta)

    Uses log-space arithmetic via scipy.special.betaln and
    scipy.special.gammaln for numerical stability.
    """
    from scipy.special import gammaln

    log_comb = gammaln(n + 1) - gammaln(k + 1) - gammaln(n - k + 1)
    log_beta_num = betaln(k + alpha, n - k + beta_param)
    log_beta_den = betaln(alpha, beta_param)
    log_pmf = log_comb + log_beta_num - log_beta_den
    return math.exp(log_pmf)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Service health check."""
    return HealthResponse(
        status="healthy",
        service="Predictive Safety Platform (PSP)",
        version="1.0.0",
        models_loaded=True,
    )


@app.get("/safety/risk-model", response_model=RiskModelResponse, tags=["Risk Model"])
async def get_risk_model() -> RiskModelResponse:
    """
    Bayesian risk estimates for Grade 3+ CRS and ICANS.

    Uses a Beta-Binomial conjugate model with Jeffreys prior Beta(0.5, 0.5).
    Returns posterior mean, median, mode, and 95% credible interval for each
    adverse event type.
    """
    estimates: dict[str, PosteriorEstimate] = {}

    for key, data in OBSERVED_DATA.items():
        events = data["events"]
        n = data["n"]
        alpha_post, beta_post = _compute_posterior(events, n)

        dist = stats.beta(alpha_post, beta_post)

        # Posterior mode exists when alpha > 1 and beta > 1
        if alpha_post > 1 and beta_post > 1:
            mode = (alpha_post - 1) / (alpha_post + beta_post - 2)
        else:
            mode = None

        ci_low, ci_high = dist.ppf(0.025), dist.ppf(0.975)

        estimates[key] = PosteriorEstimate(
            label=data["label"],
            prior_alpha=PRIOR_ALPHA,
            prior_beta=PRIOR_BETA,
            observed_events=events,
            observed_n=int(n),
            posterior_alpha=_safe_float(alpha_post),
            posterior_beta=_safe_float(beta_post),
            posterior_mean=_safe_float(dist.mean()),
            posterior_median=_safe_float(dist.median()),
            credible_interval_95=[_safe_float(ci_low), _safe_float(ci_high)],
            posterior_mode=_safe_float(mode) if mode is not None else None,
        )

    return RiskModelResponse(estimates=estimates)


@app.get(
    "/safety/posterior-predictive",
    response_model=PosteriorPredictiveResponse,
    tags=["Risk Model"],
)
async def get_posterior_predictive(
    n_future: int = Query(
        default=50,
        ge=1,
        le=500,
        description="Number of future patients to predict over",
    ),
    event_type: str = Query(
        default="crs_grade3plus",
        description="Which AE type to predict (crs_grade3plus or icans_grade3plus)",
    ),
) -> PosteriorPredictiveResponse:
    """
    Posterior predictive distribution for future patients.

    Computes P(Y=k | data) for k = 0, 1, ..., min(n_future, 20) using the
    Beta-Binomial posterior predictive distribution. This properly propagates
    uncertainty in the event rate through to predictions.
    """
    if event_type not in OBSERVED_DATA:
        event_type = "crs_grade3plus"

    data = OBSERVED_DATA[event_type]
    alpha_post, beta_post = _compute_posterior(data["events"], data["n"])

    # Compute PMF for k = 0..min(n_future, 20) to keep response size reasonable
    max_k = min(n_future, 20)
    table: list[PredictiveEntry] = []
    cumulative = 0.0

    for k in range(max_k + 1):
        prob = _beta_binomial_pmf(k, n_future, alpha_post, beta_post)
        prob = _safe_float(prob)
        cumulative += prob
        table.append(
            PredictiveEntry(
                k=k,
                probability=_safe_float(prob),
                cumulative_probability=_safe_float(min(cumulative, 1.0)),
                probability_k_or_more=_safe_float(max(1.0 - cumulative + prob, 0.0)),
            )
        )

    # Correct: P(k or more) = 1 - P(k-1 or fewer) = 1 - cumulative up to k-1
    # Recalculate properly
    cumsum = 0.0
    for entry in table:
        entry.probability_k_or_more = _safe_float(max(1.0 - cumsum, 0.0))
        cumsum += entry.probability

    return PosteriorPredictiveResponse(
        n_future=n_future,
        event_type=event_type,
        posterior_alpha=_safe_float(alpha_post),
        posterior_beta=_safe_float(beta_post),
        table=table,
    )


@app.get(
    "/safety/mitigation-simulation",
    response_model=MitigationSimulationResponse,
    tags=["Mitigation"],
)
async def get_mitigation_simulation(
    mitigations: str = Query(
        default="tocilizumab",
        description="Comma-separated list of mitigation IDs to apply",
    ),
    ae_type: str = Query(
        default="CRS",
        description="Adverse event type to simulate (CRS, ICANS, ICAHS)",
    ),
) -> MitigationSimulationResponse:
    """
    Monte Carlo simulation of mitigated risk with full uncertainty propagation.

    For each of 50,000 samples:
    1. Draw baseline risk theta ~ Beta(alpha_post, beta_post)
    2. For each applicable mitigation, draw RR_i ~ LogNormal(mu_i, sigma_i)
    3. Mitigated risk = theta * product(RR_i)
    4. Clip to [0, 1]

    Returns summary statistics and a histogram of the mitigated risk distribution.
    """
    rng = np.random.default_rng(RNG_SEED)

    requested_ids = [m.strip() for m in mitigations.split(",") if m.strip()]
    valid_ids = [m for m in requested_ids if m in MITIGATIONS]

    # Map AE types to observed data keys
    ae_to_data_key: dict[str, str] = {
        "CRS": "crs_grade3plus",
        "ICANS": "icans_grade3plus",
        "ICAHS": "crs_grade3plus",  # Use CRS as proxy for ICAHS baseline
    }

    results: dict[str, MitigationSimulationResult] = {}

    # Simulate for the requested AE type
    ae_types_to_sim = [ae_type] if ae_type in ae_to_data_key else ["CRS", "ICANS"]

    for ae in ae_types_to_sim:
        data_key = ae_to_data_key.get(ae, "crs_grade3plus")
        obs = OBSERVED_DATA[data_key]
        alpha_post, beta_post = _compute_posterior(obs["events"], obs["n"])

        # Step 1: Sample baseline risk from posterior
        baseline_samples = rng.beta(alpha_post, beta_post, size=MC_SAMPLES)

        # Step 2: Apply applicable mitigations
        applicable = [
            MITIGATIONS[mid] for mid in valid_ids if ae in MITIGATIONS[mid].targets
        ]
        applied_names = [m.id for m in applicable]

        combined_rr = np.ones(MC_SAMPLES)
        for mitigation in applicable:
            mu, sigma = _lognormal_params_from_ci(
                mitigation.rr, mitigation.ci_low, mitigation.ci_high
            )
            rr_samples = rng.lognormal(mean=mu, sigma=sigma, size=MC_SAMPLES)
            # Clip RR to reasonable range [0.01, 2.0] to prevent extreme outliers
            rr_samples = np.clip(rr_samples, 0.01, 2.0)
            combined_rr *= rr_samples

        # Step 3: Compute mitigated risk
        mitigated = baseline_samples * combined_rr
        mitigated = np.clip(mitigated, 0.0, 1.0)

        # Step 4: Summary statistics
        baseline_mean = float(np.mean(baseline_samples))
        mit_mean = float(np.mean(mitigated))
        mit_median = float(np.median(mitigated))
        mit_p2_5 = float(np.percentile(mitigated, 2.5))
        mit_p97_5 = float(np.percentile(mitigated, 97.5))

        # Relative reduction
        rel_reduction = 1.0 - (mit_mean / baseline_mean) if baseline_mean > 0 else 0.0

        # Histogram (30 bins from 0 to max observed + margin)
        hist_max = min(float(np.percentile(mitigated, 99.5)) * 1.2, 1.0)
        hist_max = max(hist_max, 0.01)
        counts, bin_edges = np.histogram(mitigated, bins=30, range=(0.0, hist_max))

        results[ae] = MitigationSimulationResult(
            ae_type=ae,
            baseline_posterior_mean=_safe_float(baseline_mean),
            mitigations_applied=applied_names,
            n_samples=MC_SAMPLES,
            mitigated_risk_mean=_safe_float(mit_mean),
            mitigated_risk_median=_safe_float(mit_median),
            mitigated_risk_p2_5=_safe_float(mit_p2_5),
            mitigated_risk_p97_5=_safe_float(mit_p97_5),
            relative_reduction_mean=_safe_float(rel_reduction),
            histogram_bins=[_safe_float(float(b)) for b in bin_edges.tolist()],
            histogram_counts=[int(c) for c in counts.tolist()],
        )

    return MitigationSimulationResponse(
        mitigations_requested=requested_ids,
        available_mitigations=list(MITIGATIONS.keys()),
        results=results,
    )


@app.get(
    "/safety/stopping-rule-power",
    response_model=StoppingRulePowerResponse,
    tags=["Stopping Rules"],
)
async def get_stopping_rule_power(
    true_rate_min: float = Query(
        default=0.01,
        ge=0.001,
        le=0.5,
        description="Minimum true event rate to evaluate",
    ),
    true_rate_max: float = Query(
        default=0.30,
        ge=0.01,
        le=0.99,
        description="Maximum true event rate to evaluate",
    ),
    n_points: int = Query(
        default=20,
        ge=5,
        le=100,
        description="Number of true rate points to evaluate",
    ),
) -> StoppingRulePowerResponse:
    """
    Power analysis for predefined stopping rules.

    For each stopping rule and each hypothetical true event rate, computes:
        P(rule triggers) = P(X >= threshold | n = cohort_size, p = true_rate)
                         = 1 - CDF_binom(threshold - 1, cohort_size, true_rate)

    This tells us how likely we are to stop the trial when the true rate
    is at a given level, characterizing the operating characteristics of
    our safety monitoring plan.
    """
    true_rates = np.linspace(true_rate_min, true_rate_max, n_points).tolist()

    rules_output: list[StoppingRulePowerEntry] = []

    for rule in STOPPING_RULES:
        trigger_probs: list[float] = []
        for p_true in true_rates:
            # P(X >= threshold) = 1 - P(X <= threshold - 1)
            prob_trigger = 1.0 - stats.binom.cdf(
                rule.threshold - 1, rule.cohort_size, p_true
            )
            trigger_probs.append(_safe_float(float(prob_trigger)))

        rules_output.append(
            StoppingRulePowerEntry(
                rule_id=rule.id,
                description=rule.description,
                threshold=rule.threshold,
                cohort_size=rule.cohort_size,
                true_rates=[_safe_float(r) for r in true_rates],
                trigger_probabilities=trigger_probs,
            )
        )

    return StoppingRulePowerResponse(
        true_rates_evaluated=[_safe_float(r) for r in true_rates],
        rules=rules_output,
    )


# ---------------------------------------------------------------------------
# FAERS Signal Detection — Constants
# ---------------------------------------------------------------------------

OPENFDA_BASE = "https://api.fda.gov/drug/event.json"

# CAR-T products: brand name -> generic name mapping
CART_PRODUCTS: dict[str, str] = {
    "KYMRIAH": "tisagenlecleucel",
    "YESCARTA": "axicabtagene ciloleucel",
    "TECARTUS": "brexucabtagene autoleucel",
    "BREYANZI": "lisocabtagene maraleucel",
    "ABECMA": "idecabtagene vicleucel",
    "CARVYKTI": "ciltacabtagene autoleucel",
}

# Target adverse events (MedDRA preferred terms, uppercased for matching)
CART_TARGET_AES: list[str] = [
    "CYTOKINE RELEASE SYNDROME",
    "CYTOKINE STORM",
    "IMMUNE EFFECTOR CELL-ASSOCIATED NEUROTOXICITY SYNDROME",
    "NEUROTOXICITY",
    "ENCEPHALOPATHY",
    "TREMOR",
    "APHASIA",
    "INFECTION",
    "PNEUMONIA",
    "SEPSIS",
    "FEBRILE NEUTROPENIA",
    "NEUTROPENIA",
    "THROMBOCYTOPENIA",
    "ANAEMIA",
    "PANCYTOPENIA",
    "LEUKOPENIA",
    "LYMPHOPENIA",
    "HAEMOPHAGOCYTIC LYMPHOHISTIOCYTOSIS",
    "MACROPHAGE ACTIVATION SYNDROME",
]

# Group labels for cleaner reporting
AE_GROUP_MAP: dict[str, str] = {
    "CYTOKINE RELEASE SYNDROME": "Cytokine Release Syndrome",
    "CYTOKINE STORM": "Cytokine Release Syndrome",
    "IMMUNE EFFECTOR CELL-ASSOCIATED NEUROTOXICITY SYNDROME": "Neurotoxicity (ICANS)",
    "NEUROTOXICITY": "Neurotoxicity (ICANS)",
    "ENCEPHALOPATHY": "Neurotoxicity (ICANS)",
    "TREMOR": "Neurotoxicity (ICANS)",
    "APHASIA": "Neurotoxicity (ICANS)",
    "INFECTION": "Infections",
    "PNEUMONIA": "Infections",
    "SEPSIS": "Infections",
    "FEBRILE NEUTROPENIA": "Cytopenias",
    "NEUTROPENIA": "Cytopenias",
    "THROMBOCYTOPENIA": "Cytopenias",
    "ANAEMIA": "Cytopenias",
    "PANCYTOPENIA": "Cytopenias",
    "LEUKOPENIA": "Cytopenias",
    "LYMPHOPENIA": "Cytopenias",
    "HAEMOPHAGOCYTIC LYMPHOHISTIOCYTOSIS": "HLH / MAS",
    "MACROPHAGE ACTIVATION SYNDROME": "HLH / MAS",
}

# 24-hour cache: key -> (timestamp, data)
_faers_cache: dict[str, tuple[float, object]] = {}
CACHE_TTL_SECONDS: int = 86400  # 24 hours


def _cache_get(key: str) -> object | None:
    """Return cached value if still valid, else None."""
    if key in _faers_cache:
        ts, data = _faers_cache[key]
        if time.time() - ts < CACHE_TTL_SECONDS:
            return data
        del _faers_cache[key]
    return None


def _cache_set(key: str, data: object) -> None:
    """Store value in cache with current timestamp."""
    _faers_cache[key] = (time.time(), data)


# ---------------------------------------------------------------------------
# FAERS Signal Detection — Response Models
# ---------------------------------------------------------------------------


class DisproportionalityMetrics(BaseModel):
    """Disproportionality signal metrics for a drug-AE pair."""

    a: int = Field(..., description="Target drug + target AE count")
    b: int = Field(..., description="Target drug + other AEs count")
    c: int = Field(..., description="Other drugs + target AE count")
    d: int = Field(..., description="Other drugs + other AEs count")
    prr: float = Field(..., description="Proportional Reporting Ratio")
    prr_ci_lower: float = Field(..., description="PRR 95% CI lower bound")
    prr_ci_upper: float = Field(..., description="PRR 95% CI upper bound")
    ror: float = Field(..., description="Reporting Odds Ratio")
    ror_ci_lower: float = Field(..., description="ROR 95% CI lower bound")
    ror_ci_upper: float = Field(..., description="ROR 95% CI upper bound")
    ic: float = Field(..., description="Information Component (IC)")
    ic025: float = Field(..., description="IC lower 95% credible interval")
    ebgm: float = Field(..., description="Empirical Bayes Geometric Mean (simplified)")
    chi_squared: float = Field(..., description="Chi-squared statistic")
    signal_detected: bool = Field(
        ..., description="True if PRR>=2 AND chi2>=4 AND a>=3"
    )
    signal_strength: str = Field(
        ..., description="none / weak / moderate / strong"
    )


class FAERSSignalEntry(BaseModel):
    """One signal entry for a product-AE pair."""

    product_brand: str
    product_generic: str
    adverse_event: str
    ae_group: str
    metrics: DisproportionalityMetrics


class FAERSSignalResponse(BaseModel):
    """Full response for the FAERS signal detection endpoint."""

    products_queried: list[str]
    total_signals_detected: int
    signals: list[FAERSSignalEntry]
    query_timestamp: str
    cached: bool
    data_source: str = "FDA Adverse Event Reporting System (FAERS) via openFDA"


class FAERSSummaryProduct(BaseModel):
    """Summary for a single CAR-T product."""

    brand_name: str
    generic_name: str
    total_reports: int
    top_adverse_events: list[dict[str, object]]


class FAERSSummaryResponse(BaseModel):
    """Quick summary of FAERS data for CAR-T products."""

    products: list[FAERSSummaryProduct]
    total_cart_reports: int
    query_timestamp: str
    cached: bool
    data_source: str = "FDA Adverse Event Reporting System (FAERS) via openFDA"


# ---------------------------------------------------------------------------
# FAERS Signal Detection — Helper Functions
# ---------------------------------------------------------------------------


async def _openfda_count_reactions(
    brand_name: str,
    limit: int = 100,
) -> list[dict[str, object]]:
    """
    Query openFDA for reaction counts for a given brand name.
    Returns list of {term: str, count: int}.
    """
    params = {
        "search": f'patient.drug.openfda.brand_name:"{brand_name}"',
        "count": "patient.reaction.reactionmeddrapt.exact",
        "limit": str(limit),
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(OPENFDA_BASE, params=params)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("results", [])
        elif resp.status_code == 404:
            # No results found for this product
            return []
        else:
            logger.warning(
                "openFDA returned %d for %s: %s",
                resp.status_code,
                brand_name,
                resp.text[:200],
            )
            return []


async def _openfda_total_reports(brand_name: str) -> int:
    """Get total number of FAERS reports for a brand name."""
    params = {
        "search": f'patient.drug.openfda.brand_name:"{brand_name}"',
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(OPENFDA_BASE, params=params)
        if resp.status_code == 200:
            data = resp.json()
            meta = data.get("meta", {}).get("results", {})
            return meta.get("total", 0)
        return 0


async def _openfda_total_reports_all() -> int:
    """Get the approximate total number of all FAERS reports (for background rate)."""
    cache_key = "faers_total_all"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    # Query a very common reaction to get the total from meta
    params = {
        "search": 'patient.reaction.reactionmeddrapt:"NAUSEA"',
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(OPENFDA_BASE, params=params)
        if resp.status_code == 200:
            data = resp.json()
            # Total reports in the FAERS database is in the millions
            total = data.get("meta", {}).get("results", {}).get("total", 0)
            # Use this as a rough denominator; a more accurate approach
            # would sum all reports, but this is a reasonable approximation
            # for disproportionality analysis.
            # The actual total FAERS reports is ~30 million; we use a
            # conservative estimate.
            estimated_total = max(total * 10, 20_000_000)
            _cache_set(cache_key, estimated_total)
            return estimated_total
    return 20_000_000  # fallback estimate


async def _openfda_ae_background_count(ae_term: str) -> int:
    """Get total FAERS reports for a specific AE across all drugs."""
    cache_key = f"faers_bg_{ae_term}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    params = {
        "search": f'patient.reaction.reactionmeddrapt:"{ae_term}"',
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(OPENFDA_BASE, params=params)
        if resp.status_code == 200:
            data = resp.json()
            total = data.get("meta", {}).get("results", {}).get("total", 0)
            _cache_set(cache_key, total)
            return total
    return 0


def _compute_disproportionality(
    a: int, b: int, c: int, d: int
) -> DisproportionalityMetrics:
    """
    Compute all disproportionality metrics from a 2x2 contingency table.

    a = target drug + target AE
    b = target drug + other AEs
    c = other drugs + target AE
    d = other drugs + other AEs
    N = a + b + c + d
    """
    N = a + b + c + d

    # PRR = (a/(a+b)) / (c/(c+d))
    if (a + b) > 0 and (c + d) > 0 and c > 0:
        rate_drug = a / (a + b)
        rate_other = c / (c + d)
        prr = rate_drug / rate_other if rate_other > 0 else 0.0
    else:
        prr = 0.0

    # PRR 95% CI: ln(PRR) +/- 1.96 * sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d))
    if a > 0 and (a + b) > 0 and c > 0 and (c + d) > 0 and prr > 0:
        se_ln_prr = math.sqrt(
            (1 / a) - (1 / (a + b)) + (1 / c) - (1 / (c + d))
        )
        ln_prr = math.log(prr)
        prr_ci_lower = math.exp(ln_prr - 1.96 * se_ln_prr)
        prr_ci_upper = math.exp(ln_prr + 1.96 * se_ln_prr)
    else:
        prr_ci_lower = 0.0
        prr_ci_upper = 0.0

    # ROR = (a*d) / (b*c)
    if b > 0 and c > 0:
        ror = (a * d) / (b * c)
    else:
        ror = 0.0

    # ROR 95% CI: ln(ROR) +/- 1.96 * sqrt(1/a + 1/b + 1/c + 1/d)
    if a > 0 and b > 0 and c > 0 and d > 0 and ror > 0:
        se_ln_ror = math.sqrt(1 / a + 1 / b + 1 / c + 1 / d)
        ln_ror = math.log(ror)
        ror_ci_lower = math.exp(ln_ror - 1.96 * se_ln_ror)
        ror_ci_upper = math.exp(ln_ror + 1.96 * se_ln_ror)
    else:
        ror_ci_lower = 0.0
        ror_ci_upper = 0.0

    # IC (Information Component) = log2(a * N / ((a+b) * (a+c)))
    # With Bayesian correction (add 0.5 to avoid log(0)):
    a_adj = a + 0.5
    b_adj = b + 0.5
    c_adj = c + 0.5
    d_adj = d + 0.5
    N_adj = a_adj + b_adj + c_adj + d_adj
    expected = ((a_adj + b_adj) * (a_adj + c_adj)) / N_adj
    ic = math.log2(a_adj / expected) if expected > 0 else 0.0

    # IC 95% lower bound (IC025) — simplified approximation
    # Variance of IC ~ 1 / (a + 0.5) for the Bayesian shrinkage estimate
    if a > 0:
        ic_var = 1.0 / a_adj
        ic025 = ic - 1.96 * math.sqrt(ic_var)
    else:
        ic025 = ic

    # EBGM (simplified) — Empirical Bayes Geometric Mean
    # Simplified: EBGM ~ (a + 0.5) / E where E = (a+b)*(a+c)/N
    # A full implementation uses a mixture prior; this is the shrinkage estimate
    E = ((a + b) * (a + c)) / N if N > 0 else 1
    if E > 0 and a > 0:
        # Simple shrinkage: weight observed by sample size
        ebgm = (a + 0.5) / (E + 0.5)
    else:
        ebgm = 0.0

    # Chi-squared (Yates-corrected 2x2)
    if N > 0:
        expected_a = (a + b) * (a + c) / N
        expected_b = (a + b) * (b + d) / N
        expected_c = (c + d) * (a + c) / N
        expected_d = (c + d) * (b + d) / N

        chi2 = 0.0
        for obs, exp in [
            (a, expected_a),
            (b, expected_b),
            (c, expected_c),
            (d, expected_d),
        ]:
            if exp > 0:
                # Yates correction
                chi2 += (abs(obs - exp) - 0.5) ** 2 / exp
    else:
        chi2 = 0.0

    # Signal detection: PRR >= 2 AND chi2 >= 4 AND a >= 3
    signal_detected = prr >= 2.0 and chi2 >= 4.0 and a >= 3

    # Signal strength classification
    if not signal_detected:
        signal_strength = "none"
    elif prr >= 5.0 and ic025 > 0 and a >= 10:
        signal_strength = "strong"
    elif prr >= 3.0 and chi2 >= 10.0 and a >= 5:
        signal_strength = "moderate"
    else:
        signal_strength = "weak"

    return DisproportionalityMetrics(
        a=a,
        b=b,
        c=c,
        d=d,
        prr=_safe_float(prr),
        prr_ci_lower=_safe_float(prr_ci_lower),
        prr_ci_upper=_safe_float(prr_ci_upper),
        ror=_safe_float(ror),
        ror_ci_lower=_safe_float(ror_ci_lower),
        ror_ci_upper=_safe_float(ror_ci_upper),
        ic=_safe_float(ic),
        ic025=_safe_float(ic025),
        ebgm=_safe_float(ebgm),
        chi_squared=_safe_float(chi2),
        signal_detected=signal_detected,
        signal_strength=signal_strength,
    )


# ---------------------------------------------------------------------------
# FAERS Signal Detection — Endpoints
# ---------------------------------------------------------------------------


@app.get(
    "/safety/faers-signals",
    response_model=FAERSSignalResponse,
    tags=["FAERS Signal Detection"],
)
async def get_faers_signals(
    products: str = Query(
        default="",
        description=(
            "Comma-separated list of product names (brand or generic). "
            "Leave empty to query all CAR-T products."
        ),
    ),
) -> FAERSSignalResponse:
    """
    FAERS disproportionality signal detection for CAR-T products.

    Queries the openFDA FAERS database and computes PRR, ROR, IC (BCPNN),
    and simplified EBGM for each product-AE pair. Returns signal strength
    indicators based on standard pharmacovigilance thresholds.

    Signal criteria: PRR >= 2 AND chi-squared >= 4 AND case count >= 3
    """
    import datetime

    # Determine which products to query
    if products.strip():
        requested = [p.strip().upper() for p in products.split(",") if p.strip()]
        # Match against brand names or generic names
        brands_to_query: list[str] = []
        for req in requested:
            # Check brand names
            if req in CART_PRODUCTS:
                brands_to_query.append(req)
            else:
                # Check generic names
                for brand, generic in CART_PRODUCTS.items():
                    if req.lower() in generic.lower() or generic.lower().startswith(req.lower()):
                        brands_to_query.append(brand)
                        break
        if not brands_to_query:
            # Fall back to all if none matched
            brands_to_query = list(CART_PRODUCTS.keys())
    else:
        brands_to_query = list(CART_PRODUCTS.keys())

    # Check cache
    cache_key = f"faers_signals_{'_'.join(sorted(brands_to_query))}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    # Get approximate total FAERS database size
    N_total = await _openfda_total_reports_all()

    signals: list[FAERSSignalEntry] = []

    for brand in brands_to_query:
        generic = CART_PRODUCTS[brand]

        # Get reaction counts for this product
        reactions = await _openfda_count_reactions(brand, limit=100)
        if not reactions:
            continue

        # Total reports for this drug (sum of all reaction counts gives
        # total drug-reaction pairs, but we need total reports)
        total_drug_reports = await _openfda_total_reports(brand)
        if total_drug_reports == 0:
            continue

        # Build a lookup: AE term -> count for this drug
        drug_ae_counts: dict[str, int] = {}
        total_drug_ae_pairs = 0
        for r in reactions:
            term = r.get("term", "").upper()
            count = r.get("count", 0)
            drug_ae_counts[term] = count
            total_drug_ae_pairs += count

        # For each target AE, compute disproportionality
        for target_ae in CART_TARGET_AES:
            # a = reports with this drug AND this AE
            a = drug_ae_counts.get(target_ae, 0)
            if a == 0:
                # Skip AEs not reported for this drug
                continue

            # b = reports with this drug but NOT this AE
            b = total_drug_reports - a

            # c = reports with this AE but NOT this drug (background)
            total_ae_reports = await _openfda_ae_background_count(target_ae)
            c = max(total_ae_reports - a, 0)

            # d = reports with neither this drug nor this AE
            d = max(N_total - a - b - c, 0)

            # Ensure non-negative
            b = max(b, 0)

            metrics = _compute_disproportionality(a, b, c, d)

            ae_group = AE_GROUP_MAP.get(target_ae, "Other")

            signals.append(
                FAERSSignalEntry(
                    product_brand=brand,
                    product_generic=generic,
                    adverse_event=target_ae.title(),
                    ae_group=ae_group,
                    metrics=metrics,
                )
            )

    # Sort: detected signals first, then by PRR descending
    signals.sort(
        key=lambda s: (not s.metrics.signal_detected, -s.metrics.prr)
    )

    total_detected = sum(1 for s in signals if s.metrics.signal_detected)

    response = FAERSSignalResponse(
        products_queried=[f"{b} ({CART_PRODUCTS[b]})" for b in brands_to_query],
        total_signals_detected=total_detected,
        signals=signals,
        query_timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        cached=False,
        data_source="FDA Adverse Event Reporting System (FAERS) via openFDA",
    )

    _cache_set(cache_key, response)
    return response


@app.get(
    "/safety/faers-summary",
    response_model=FAERSSummaryResponse,
    tags=["FAERS Signal Detection"],
)
async def get_faers_summary() -> FAERSSummaryResponse:
    """
    Quick summary of total FAERS reports for all CAR-T products.

    Returns total report counts and top reported adverse events for each
    CAR-T product in the FDA FAERS database.
    """
    import datetime

    cache_key = "faers_summary_all"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    product_summaries: list[FAERSSummaryProduct] = []
    total_all = 0

    for brand, generic in CART_PRODUCTS.items():
        total_reports = await _openfda_total_reports(brand)
        total_all += total_reports

        top_aes: list[dict[str, object]] = []
        if total_reports > 0:
            reactions = await _openfda_count_reactions(brand, limit=20)
            for r in reactions[:10]:
                top_aes.append(
                    {
                        "term": r.get("term", ""),
                        "count": r.get("count", 0),
                        "group": AE_GROUP_MAP.get(
                            r.get("term", "").upper(), "Other"
                        ),
                    }
                )

        product_summaries.append(
            FAERSSummaryProduct(
                brand_name=brand,
                generic_name=generic,
                total_reports=total_reports,
                top_adverse_events=top_aes,
            )
        )

    # Sort by total reports descending
    product_summaries.sort(key=lambda p: -p.total_reports)

    response = FAERSSummaryResponse(
        products=product_summaries,
        total_cart_reports=total_all,
        query_timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        cached=False,
        data_source="FDA Adverse Event Reporting System (FAERS) via openFDA",
    )

    _cache_set(cache_key, response)
    return response


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "safety_api:app",
        host="0.0.0.0",
        port=5002,
        reload=True,
        log_level="info",
    )
