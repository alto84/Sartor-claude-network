"""
Test script for the Predictive Safety Platform (PSP) API.

Calls each endpoint and prints formatted results.
Run the API first:  python safety_api.py
Then run this:      python test_safety_api.py
"""

from __future__ import annotations

import json
import sys

import requests

BASE_URL = "http://localhost:5002"


def _fmt(obj: dict | list, indent: int = 2) -> str:
    """Pretty-print a JSON-serializable object."""
    return json.dumps(obj, indent=indent, default=str)


def _get(path: str, params: dict | None = None) -> dict:
    """Issue a GET request and return the parsed JSON response."""
    url = f"{BASE_URL}{path}"
    print(f"\n{'='*72}")
    print(f"GET {url}")
    if params:
        print(f"    params: {params}")
    print("-" * 72)

    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data
    except requests.ConnectionError:
        print("ERROR: Could not connect. Is the API running on port 5002?")
        sys.exit(1)
    except requests.HTTPError as exc:
        print(f"ERROR: HTTP {exc.response.status_code}")
        print(exc.response.text)
        sys.exit(1)


def test_health() -> None:
    """Test the health check endpoint."""
    print("\n" + "#" * 72)
    print("# TEST: Health Check")
    print("#" * 72)

    data = _get("/health")
    print(f"Status:  {data['status']}")
    print(f"Service: {data['service']}")
    print(f"Version: {data['version']}")
    print(f"Models:  {data['models_loaded']}")
    assert data["status"] == "healthy", "Health check failed!"
    print("PASS")


def test_risk_model() -> None:
    """Test the Bayesian risk model endpoint."""
    print("\n" + "#" * 72)
    print("# TEST: Bayesian Risk Model")
    print("#" * 72)

    data = _get("/safety/risk-model")
    print(f"Model: {data['model']}")
    print(f"Prior: {data['prior']}")

    for key, estimate in data["estimates"].items():
        print(f"\n  {estimate['label']} ({key}):")
        print(f"    Observed: {estimate['observed_events']}/{estimate['observed_n']}")
        print(f"    Posterior: Beta({estimate['posterior_alpha']}, {estimate['posterior_beta']})")
        print(f"    Mean:   {estimate['posterior_mean']:.4f}")
        print(f"    Median: {estimate['posterior_median']:.4f}")
        ci = estimate["credible_interval_95"]
        print(f"    95% CI: [{ci[0]:.4f}, {ci[1]:.4f}]")
        if estimate.get("posterior_mode") is not None:
            print(f"    Mode:   {estimate['posterior_mode']:.4f}")
        else:
            print("    Mode:   N/A (boundary mode)")

    assert "crs_grade3plus" in data["estimates"], "Missing CRS estimate"
    assert "icans_grade3plus" in data["estimates"], "Missing ICANS estimate"
    print("\nPASS")


def test_posterior_predictive() -> None:
    """Test the posterior predictive endpoint."""
    print("\n" + "#" * 72)
    print("# TEST: Posterior Predictive Distribution")
    print("#" * 72)

    # Test for CRS with 50 future patients
    data = _get(
        "/safety/posterior-predictive",
        params={"n_future": 50, "event_type": "crs_grade3plus"},
    )
    print(f"Event type: {data['event_type']}")
    print(f"Future patients: {data['n_future']}")
    print(f"Posterior: Beta({data['posterior_alpha']}, {data['posterior_beta']})")
    print("\n  k | P(Y=k)    | P(Y<=k)   | P(Y>=k)")
    print("  " + "-" * 48)
    for row in data["table"][:8]:  # Show first 8 rows
        print(
            f"  {row['k']:2d} | {row['probability']:.6f} | "
            f"{row['cumulative_probability']:.6f} | "
            f"{row['probability_k_or_more']:.6f}"
        )

    assert len(data["table"]) > 0, "Empty predictive table"
    assert abs(data["table"][0]["probability_k_or_more"] - 1.0) < 0.01, \
        "P(Y>=0) should be ~1.0"
    print("\nPASS")


def test_mitigation_simulation() -> None:
    """Test the Monte Carlo mitigation simulation endpoint."""
    print("\n" + "#" * 72)
    print("# TEST: Mitigation Simulation (Monte Carlo)")
    print("#" * 72)

    # Test with tocilizumab + anakinra for CRS
    data = _get(
        "/safety/mitigation-simulation",
        params={"mitigations": "tocilizumab,anakinra", "ae_type": "CRS"},
    )
    print(f"Requested: {data['mitigations_requested']}")
    print(f"Available: {data['available_mitigations']}")

    for ae, result in data["results"].items():
        print(f"\n  {ae}:")
        print(f"    Baseline mean:        {result['baseline_posterior_mean']:.4f}")
        print(f"    Mitigations applied:  {result['mitigations_applied']}")
        print(f"    Samples:              {result['n_samples']:,}")
        print(f"    Mitigated risk mean:  {result['mitigated_risk_mean']:.6f}")
        print(f"    Mitigated risk median:{result['mitigated_risk_median']:.6f}")
        print(f"    95% CI: [{result['mitigated_risk_p2_5']:.6f}, {result['mitigated_risk_p97_5']:.6f}]")
        print(f"    Relative reduction:   {result['relative_reduction_mean']:.1%}")
        print(f"    Histogram bins:       {len(result['histogram_bins'])} edges, "
              f"{len(result['histogram_counts'])} counts")

    assert len(data["results"]) > 0, "No simulation results"
    print("\nPASS")

    # Also test with all mitigations for ICANS
    print("\n  --- Additional: all mitigations for ICANS ---")
    data2 = _get(
        "/safety/mitigation-simulation",
        params={
            "mitigations": "tocilizumab,corticosteroids,anakinra,dose-reduction,lymphodepletion-modification",
            "ae_type": "ICANS",
        },
    )
    for ae, result in data2["results"].items():
        print(f"\n  {ae}:")
        print(f"    Mitigations applied:  {result['mitigations_applied']}")
        print(f"    Mitigated risk mean:  {result['mitigated_risk_mean']:.6f}")
        print(f"    Relative reduction:   {result['relative_reduction_mean']:.1%}")
    print("  PASS")


def test_stopping_rule_power() -> None:
    """Test the stopping rule power analysis endpoint."""
    print("\n" + "#" * 72)
    print("# TEST: Stopping Rule Power Analysis")
    print("#" * 72)

    data = _get(
        "/safety/stopping-rule-power",
        params={"true_rate_min": 0.02, "true_rate_max": 0.25, "n_points": 10},
    )

    for rule in data["rules"]:
        print(f"\n  Rule: {rule['description']}")
        print(f"    Threshold: >= {rule['threshold']} events in {rule['cohort_size']} patients")
        print("    True Rate -> P(Trigger)")
        for rate, prob in zip(rule["true_rates"], rule["trigger_probabilities"]):
            bar = "#" * int(prob * 40)
            print(f"      {rate:.3f} -> {prob:.4f}  {bar}")

    assert len(data["rules"]) == 3, f"Expected 3 rules, got {len(data['rules'])}"
    print("\nPASS")


def main() -> None:
    """Run all tests sequentially."""
    print("=" * 72)
    print("Predictive Safety Platform (PSP) - API Test Suite")
    print(f"Target: {BASE_URL}")
    print("=" * 72)

    tests = [
        test_health,
        test_risk_model,
        test_posterior_predictive,
        test_mitigation_simulation,
        test_stopping_rule_power,
    ]

    passed = 0
    failed = 0

    for test_fn in tests:
        try:
            test_fn()
            passed += 1
        except AssertionError as exc:
            print(f"\nFAIL: {exc}")
            failed += 1
        except Exception as exc:
            print(f"\nERROR: {type(exc).__name__}: {exc}")
            failed += 1

    print("\n" + "=" * 72)
    print(f"Results: {passed} passed, {failed} failed, {passed + failed} total")
    print("=" * 72)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
