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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";

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
// BETA PDF COMPUTATION (client-side, using Stirling's approximation for lnGamma)
// ============================================================================

function lnGamma(z: number): number {
  // Lanczos approximation for ln(Gamma(z))
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  }
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaPdf(x: number, a: number, b: number): number {
  if (x <= 0 || x >= 1) return 0;
  const lnB = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - lnB);
}

function computePosteriorCurve(
  alpha: number,
  beta: number,
  nPoints: number = 200
): { x: number; density: number }[] {
  // Focus the x-axis range on where the density is meaningful
  const mean = alpha / (alpha + beta);
  const sd = Math.sqrt((alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1)));
  const xMin = Math.max(0, mean - 5 * sd);
  const xMax = Math.min(1, mean + 6 * sd);
  const step = (xMax - xMin) / nPoints;

  const points: { x: number; density: number }[] = [];
  for (let i = 0; i <= nPoints; i++) {
    const x = xMin + i * step;
    points.push({ x: x * 100, density: betaPdf(x, alpha, beta) });
  }
  return points;
}

// ============================================================================
// POSTERIOR DENSITY CHART
// ============================================================================

function PosteriorDensityChart({
  crsAlpha,
  crsBeta,
  icansAlpha,
  icansBeta,
  crsMedian,
  icansMedian,
}: {
  crsAlpha: number;
  crsBeta: number;
  icansAlpha: number;
  icansBeta: number;
  crsMedian: number;
  icansMedian: number;
}) {
  const crsCurve = React.useMemo(
    () => computePosteriorCurve(crsAlpha, crsBeta),
    [crsAlpha, crsBeta]
  );
  const icansCurve = React.useMemo(
    () => computePosteriorCurve(icansAlpha, icansBeta),
    [icansAlpha, icansBeta]
  );

  // Merge both curves into a single dataset for overlay
  const allX = new Set([...crsCurve.map((p) => p.x), ...icansCurve.map((p) => p.x)]);
  const sortedX = Array.from(allX).sort((a, b) => a - b);

  const crsMap = new Map(crsCurve.map((p) => [p.x, p.density]));
  const icansMap = new Map(icansCurve.map((p) => [p.x, p.density]));

  const merged = sortedX.map((x) => ({
    x,
    crs: crsMap.get(x) ?? 0,
    icans: icansMap.get(x) ?? 0,
  }));

  return (
    <div className="h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={merged} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, "dataMax"]}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 10 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <YAxis hide domain={[0, "dataMax"]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const x = payload[0]?.payload?.x;
              return (
                <div className="bg-popover border border-border rounded-lg shadow-lg p-2 text-[11px]">
                  <p className="font-medium">Rate: {x?.toFixed(1)}%</p>
                  {payload.map((entry: { name?: string; value?: number; color?: string }) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span>{entry.name}: {(entry.value ?? 0).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="crs"
            name="CRS posterior"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.2}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="icans"
            name="ICANS posterior"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <ReferenceLine
            x={crsMedian * 100}
            stroke="#10b981"
            strokeDasharray="3 3"
            strokeOpacity={0.7}
          />
          <ReferenceLine
            x={icansMedian * 100}
            stroke="#6366f1"
            strokeDasharray="3 3"
            strokeOpacity={0.7}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
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

            {/* Posterior density curves */}
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Posterior Density (Beta distribution)
              </p>
              <PosteriorDensityChart
                crsAlpha={riskData.crs.posterior_alpha}
                crsBeta={riskData.crs.posterior_beta}
                icansAlpha={riskData.icans.posterior_alpha}
                icansBeta={riskData.icans.posterior_beta}
                crsMedian={riskData.crs.posterior_median}
                icansMedian={riskData.icans.posterior_median}
              />
              <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-6 rounded bg-emerald-500/30 border border-emerald-500" />
                  <span>CRS Gr3+</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-6 rounded bg-indigo-500/20 border border-indigo-500" />
                  <span>ICANS Gr3+</span>
                </div>
                <span className="ml-auto italic">Dashed lines = median</span>
              </div>
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
