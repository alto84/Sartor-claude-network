import { NextResponse } from "next/server";

/**
 * Proxy to the Bayesian safety API running on gpuserver1 (192.168.1.100:5002).
 *
 * GET /api/safety/bayesian?endpoint=risk-model
 * GET /api/safety/bayesian?endpoint=posterior-predictive&n_future=50
 * GET /api/safety/bayesian?endpoint=mitigation-simulation&mitigations=tocilizumab,dose-reduction&target_ae=CRS
 * GET /api/safety/bayesian?endpoint=stopping-rule-power
 */

const BAYESIAN_API_BASE = "http://192.168.1.100:5002";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing 'endpoint' parameter. Options: risk-model, posterior-predictive, mitigation-simulation, stopping-rule-power" },
        { status: 400 }
      );
    }

    // Build the upstream URL, passing through all query params except 'endpoint'
    const upstreamParams = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      if (key !== "endpoint") {
        upstreamParams.set(key, value);
      }
    }
    const qs = upstreamParams.toString();
    const upstreamUrl = `${BAYESIAN_API_BASE}/safety/${endpoint}${qs ? `?${qs}` : ""}`;

    const response = await fetch(upstreamUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Bayesian API returned ${response.status}`, upstream_url: upstreamUrl },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to reach Bayesian API on gpuserver1", detail: message },
      { status: 502 }
    );
  }
}
