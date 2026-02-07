import { NextResponse } from "next/server";
import {
  adverseEventRates,
  mitigationStrategies,
  clinicalTrials,
  dataSources,
  getComparisonChartData,
  getTrialSummary,
  getSLEBaselineRiskAssessment,
  calculateMitigatedRisk,
  getAdverseEventsByIndication,
  getAutoimmuneSLETrials,
} from "@/lib/safety-data";

/**
 * GET /api/safety
 *
 * Returns the full safety dashboard dataset including:
 * - adverseEventRates: All AE rate data across indications
 * - mitigationStrategies: Available risk mitigation approaches
 * - clinicalTrials: Active and completed CAR-T trial statuses
 * - dataSources: Available safety data sources and their characteristics
 * - comparisonChartData: Pre-formatted data for cross-indication comparison charts
 * - trialSummary: Aggregate trial status counts
 * - sleBaselineRisk: Default SLE risk assessment with standard mitigations
 * - sleTrialBreakdown: Individual SLE trial-level AE data
 *
 * Optional query parameters:
 * - indication: Filter AE rates by indication (e.g., "SLE", "DLBCL", "ALL", "MM")
 * - mitigations: Comma-separated mitigation IDs to calculate custom mitigated risk
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const indicationFilter = searchParams.get("indication");
    const mitigationParam = searchParams.get("mitigations");

    // Build the response payload
    const payload: Record<string, unknown> = {
      adverseEventRates: indicationFilter
        ? getAdverseEventsByIndication(indicationFilter)
        : adverseEventRates,
      mitigationStrategies,
      clinicalTrials,
      dataSources,
      comparisonChartData: getComparisonChartData(),
      trialSummary: getTrialSummary(),
      sleBaselineRisk: getSLEBaselineRiskAssessment(),
      sleTrialBreakdown: getAutoimmuneSLETrials(),
    };

    // If custom mitigations requested, calculate and include custom risk assessment
    if (mitigationParam) {
      const selectedMitigationIds = mitigationParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      const baseline = getSLEBaselineRiskAssessment().baselineRisks;
      payload.customMitigatedRisk = calculateMitigatedRisk(
        baseline,
        selectedMitigationIds
      );
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Safety API error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve safety data" },
      { status: 500 }
    );
  }
}
