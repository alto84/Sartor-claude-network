import { NextResponse } from "next/server";

/**
 * Proxy to the FAERS signal detection API running on gpuserver1 (192.168.1.100:5002).
 *
 * GET /api/safety/faers?endpoint=faers-signals&products=KYMRIAH,YESCARTA
 * GET /api/safety/faers?endpoint=faers-summary
 */

const SAFETY_API_BASE = "http://192.168.1.100:5002";

const VALID_ENDPOINTS = ["faers-signals", "faers-summary"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint || !VALID_ENDPOINTS.includes(endpoint)) {
      return NextResponse.json(
        {
          error: `Missing or invalid 'endpoint' parameter. Options: ${VALID_ENDPOINTS.join(", ")}`,
        },
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
    const upstreamUrl = `${SAFETY_API_BASE}/safety/${endpoint}${qs ? `?${qs}` : ""}`;

    const response = await fetch(upstreamUrl, {
      // FAERS queries can be slow (multiple openFDA calls), allow 60s
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `FAERS API returned ${response.status}`,
          upstream_url: upstreamUrl,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        // Cache for 1 hour on CDN, stale-while-revalidate for 2 hours
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to reach FAERS API on gpuserver1",
        detail: message,
      },
      { status: 502 }
    );
  }
}
