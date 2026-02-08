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
from enum import Enum
from typing import Optional

import numpy as np
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from scipy import stats
from scipy.special import betaln

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
