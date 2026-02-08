"use client";

/**
 * Bayesian Risk Panel
 *
 * Fetches real Bayesian posterior estimates from the gpuserver1 API
 * and displays them alongside the dashboard's Monte Carlo estimates.
 * Shows posterior distribution summary, credible intervals, and
 * posterior predictive probabilities for the next cohort.
 *
 * @module components/safety/bayesian-panel
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, Loader2, WifiOff, ChevronDown, ChevronUp } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface BayesianEstimate {
  label: string;
  posterior_mean: number;
  posterior_median: number;
  credible_interval_95: [number, number];
  posterior_mode: number;
  posterior_alpha: number;
  posterior_beta: number;
}

interface PredictiveRow {
  k: number;
  probability: number;
  probability_k_or_more: number;
}

interface BayesianPanelProps {
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BayesianPanel({ className }: BayesianPanelProps) {
  const [riskData, setRiskData] = React.useState<{
    crs: BayesianEstimate;
    icans: BayesianEstimate;
  } | null>(null);
  const [predictiveData, setPredictiveData] = React.useState<PredictiveRow[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showPredictive, setShowPredictive] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchBayesian() {
      try {
        setLoading(true);
        setError(null);

        const [riskRes, predRes] = await Promise.all([
          fetch("/api/safety/bayesian?endpoint=risk-model"),
          fetch("/api/safety/bayesian?endpoint=posterior-predictive&n_future=50"),
        ]);

        if (!riskRes.ok || !predRes.ok) {
          throw new Error(`API error: risk=${riskRes.status}, pred=${predRes.status}`);
        }

        const riskJson = await riskRes.json();
        const predJson = await predRes.json();

        if (cancelled) return;

        const crsEst = riskJson.estimates?.crs_grade3plus;
        const icansEst = riskJson.estimates?.icans_grade3plus;

        if (!crsEst || !icansEst) {
          throw new Error("Unexpected response structure from Bayesian API");
        }

        setRiskData({
          crs: {
            label: crsEst.label,
            posterior_mean: crsEst.posterior_mean,
            posterior_median: crsEst.posterior_median,
            credible_interval_95: crsEst.credible_interval_95,
            posterior_mode: crsEst.posterior_mode,
            posterior_alpha: crsEst.posterior_alpha,
            posterior_beta: crsEst.posterior_beta,
          },
          icans: {
            label: icansEst.label,
            posterior_mean: icansEst.posterior_mean,
            posterior_median: icansEst.posterior_median,
            credible_interval_95: icansEst.credible_interval_95,
            posterior_mode: icansEst.posterior_mode,
            posterior_alpha: icansEst.posterior_alpha,
            posterior_beta: icansEst.posterior_beta,
          },
        });

        setPredictiveData(predJson.table?.slice(0, 6) ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to connect");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBayesian();
    return () => { cancelled = true; };
  }, []);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">
              Bayesian Risk Model
              <span className="ml-2 text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
                gpuserver1
              </span>
            </CardTitle>
            <CardDescription>
              Beta-Binomial conjugate posterior (Jeffreys prior, n=47)
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Computing Bayesian posterior on gpuserver1...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">gpuserver1 offline: {error}</span>
          </div>
        )}

        {riskData && !loading && (
          <div className="space-y-4">
            {/* CRS and ICANS estimates side by side */}
            <div className="grid grid-cols-2 gap-4">
              {[riskData.crs, riskData.icans].map((est) => (
                <div
                  key={est.label}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <p className="text-xs font-semibold text-muted-foreground">
                    {est.label}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-emerald-600">
                      {(est.posterior_median * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">median</span>
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mean</span>
                      <span>{(est.posterior_mean * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mode (MAP)</span>
                      <span>{(est.posterior_mode * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">95% CrI</span>
                      <span>
                        [{(est.credible_interval_95[0] * 100).toFixed(2)},{" "}
                        {(est.credible_interval_95[1] * 100).toFixed(1)}]%
                      </span>
                    </div>
                  </div>
                  <div className="pt-1 border-t text-[10px] text-muted-foreground">
                    Beta({est.posterior_alpha.toFixed(1)}, {est.posterior_beta.toFixed(1)})
                  </div>
                </div>
              ))}
            </div>

            {/* Posterior predictive toggle */}
            <button
              onClick={() => setShowPredictive(!showPredictive)}
              className="w-full flex items-center justify-between text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer pt-2"
            >
              <span>Posterior predictive: next 50 patients (CRS)</span>
              {showPredictive ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showPredictive && predictiveData && (
              <div className="rounded-lg bg-muted/50 p-3">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-1 pr-3">Events (k)</th>
                      <th className="pb-1 pr-3">P(Y=k)</th>
                      <th className="pb-1">P(Y &ge; k)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictiveData.map((row) => (
                      <tr key={row.k} className="border-b border-dashed">
                        <td className="py-1 pr-3 font-medium">{row.k}</td>
                        <td className="py-1 pr-3">
                          {(row.probability * 100).toFixed(1)}%
                        </td>
                        <td className="py-1">
                          <span
                            className={
                              row.probability_k_or_more > 0.1
                                ? "text-amber-600 font-medium"
                                : "text-emerald-600"
                            }
                          >
                            {(row.probability_k_or_more * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  Posterior predictive accounts for parameter uncertainty (wider than plug-in binomial).
                </p>
              </div>
            )}

            {/* Model info footer */}
            <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-2">
              <p className="text-[10px] text-violet-800 dark:text-violet-300">
                Exact Beta-Binomial conjugate model with Jeffreys prior Beta(0.5, 0.5).
                Posterior computed on gpuserver1 (RTX 5090) via scipy.stats.
                Unlike the Monte Carlo approximation in the overview, this gives exact credible intervals.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BayesianPanel;
