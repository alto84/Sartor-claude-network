"use client";

/**
 * FAERS Signal Detection Panel
 *
 * Fetches real-world safety signal data from the gpuserver1 FAERS API
 * and displays disproportionality metrics (PRR, ROR, IC, EBGM) for CAR-T products.
 *
 * @module components/safety/faers-signals
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
import { Button } from "@/components/ui/button";
import {
  Database,
  Loader2,
  WifiOff,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// TYPES (matching actual gpuserver1 API response)
// ============================================================================

interface SignalMetrics {
  a: number;
  b: number;
  c: number;
  d: number;
  prr: number;
  prr_ci_lower: number;
  prr_ci_upper: number;
  ror: number;
  ror_ci_lower: number;
  ror_ci_upper: number;
  ic: number;
  ic025: number;
  ebgm: number;
  chi_squared: number;
  signal_detected: boolean;
  signal_strength: string;
}

interface SignalResult {
  product_brand: string;
  product_generic: string;
  adverse_event: string;
  ae_group: string;
  metrics: SignalMetrics;
}

interface FAERSResponse {
  products_queried: string[];
  total_signals_detected: number;
  signals: SignalResult[];
  query_timestamp?: string;
  cache_age_seconds?: number;
}

// ============================================================================
// SIGNAL STRENGTH BADGE
// ============================================================================

function SignalBadge({ strength }: { strength: string }) {
  const s = strength.charAt(0).toUpperCase() + strength.slice(1);
  const styles: Record<string, string> = {
    Strong: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    Moderate: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    Weak: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    None: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
        styles[s] ?? styles.None
      }`}
    >
      {s === "None" ? "No Signal" : `${s}`}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FAERSSignals({ className }: { className?: string }) {
  const [data, setData] = React.useState<FAERSResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<string>("all");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/safety/faers?endpoint=faers-signals");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch FAERS data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter signals by product
  const filteredSignals = React.useMemo(() => {
    if (!data?.signals) return [];
    const signals = selectedProduct === "all"
      ? data.signals
      : data.signals.filter(s => s.product_brand === selectedProduct);
    // Sort: detected signals first, then by PRR descending
    return [...signals].sort((a, b) => {
      if (a.metrics.signal_detected !== b.metrics.signal_detected)
        return b.metrics.signal_detected ? 1 : -1;
      return b.metrics.prr - a.metrics.prr;
    });
  }, [data, selectedProduct]);

  const products = React.useMemo(() => {
    if (!data?.signals) return [];
    return [...new Set(data.signals.map(s => s.product_brand))];
  }, [data]);

  const detectedCount = filteredSignals.filter(s => s.metrics.signal_detected).length;

  // Compute per-product report counts from signal data
  const productCounts = React.useMemo(() => {
    if (!data?.signals) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const s of data.signals) {
      const total = s.metrics.a + s.metrics.b;
      const existing = counts.get(s.product_brand) ?? 0;
      if (total > existing) counts.set(s.product_brand, total);
    }
    return counts;
  }, [data]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-600" />
              FAERS Signal Detection
              {data && (
                <span className="text-[10px] font-normal text-muted-foreground ml-1">
                  ({data.total_signals_detected} signals from {data.products_queried.length} products)
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Disproportionality analysis of FDA Adverse Event Reporting System for CAR-T products
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-7 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading state */}
        {loading && !data && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Querying FDA FAERS database via gpuserver1...</span>
          </div>
        )}

        {/* Error state */}
        {error && !data && (
          <div className="flex items-center gap-2 py-4 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <WifiOff className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-amber-800 dark:text-amber-300">
                FAERS API unavailable
              </p>
              <p className="text-amber-600 dark:text-amber-400 mt-0.5">
                {error}. Signal detection requires the gpuserver1 FAERS endpoint.
              </p>
            </div>
          </div>
        )}

        {/* Data loaded */}
        {data && (
          <div className="space-y-3">
            {/* Product summary cards */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              {products.map(p => {
                const reports = productCounts.get(p) ?? 0;
                const isSelected = selectedProduct === p;
                return (
                  <div
                    key={p}
                    className={`rounded-lg border p-2 text-center cursor-pointer transition-colors ${
                      isSelected
                        ? "border-purple-400 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-600"
                        : "hover:border-purple-300 dark:hover:border-purple-700"
                    }`}
                    onClick={() => setSelectedProduct(isSelected ? "all" : p)}
                  >
                    <p className="text-[10px] font-medium truncate">{p}</p>
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {reports.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-muted-foreground">reports</p>
                  </div>
                );
              })}
            </div>

            {/* Signal count */}
            <div className="flex items-center gap-2 text-xs">
              {detectedCount > 0 ? (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="font-medium">{detectedCount} statistical signal(s) detected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="font-medium">No disproportionate signals in current selection</span>
                </div>
              )}
              <span className="text-muted-foreground ml-auto">
                {filteredSignals.length} drug-event pairs
              </span>
            </div>

            {/* Signal table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-2">Product</th>
                    <th className="pb-2 pr-2">Adverse Event</th>
                    <th className="pb-2 pr-2 text-right">PRR</th>
                    <th className="pb-2 pr-2 text-right">ROR</th>
                    <th className="pb-2 pr-2 text-right">IC</th>
                    <th className="pb-2 pr-2 text-right">EBGM</th>
                    <th className="pb-2 pr-2 text-right">Cases</th>
                    <th className="pb-2">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {(expanded ? filteredSignals : filteredSignals.slice(0, 12)).map(
                    (s, i) => (
                      <tr
                        key={`${s.product_brand}-${s.adverse_event}-${i}`}
                        className={`border-b border-dashed ${
                          s.metrics.signal_detected ? "bg-amber-50/50 dark:bg-amber-950/10" : ""
                        }`}
                      >
                        <td className="py-1.5 pr-2 font-medium text-[10px]">{s.product_brand}</td>
                        <td className="py-1.5 pr-2 text-[10px]">{s.adverse_event}</td>
                        <td className="py-1.5 pr-2 text-right font-mono text-[10px]">
                          {s.metrics.prr >= 100
                            ? s.metrics.prr.toFixed(0)
                            : s.metrics.prr.toFixed(1)}
                        </td>
                        <td className="py-1.5 pr-2 text-right font-mono text-[10px]">
                          {s.metrics.ror >= 100
                            ? s.metrics.ror.toFixed(0)
                            : s.metrics.ror.toFixed(1)}
                        </td>
                        <td className="py-1.5 pr-2 text-right font-mono text-[10px]">
                          {s.metrics.ic.toFixed(2)}
                        </td>
                        <td className="py-1.5 pr-2 text-right font-mono text-[10px]">
                          {s.metrics.ebgm >= 100
                            ? s.metrics.ebgm.toFixed(0)
                            : s.metrics.ebgm.toFixed(1)}
                        </td>
                        <td className="py-1.5 pr-2 text-right">{s.metrics.a.toLocaleString()}</td>
                        <td className="py-1.5">
                          <SignalBadge strength={s.metrics.signal_strength} />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Expand/collapse */}
            {filteredSignals.length > 12 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-xs w-full"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" /> Show fewer
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" /> Show all{" "}
                    {filteredSignals.length} signals
                  </>
                )}
              </Button>
            )}

            {/* Methodology note */}
            <div className="text-[10px] text-muted-foreground italic pt-2 border-t space-y-0.5">
              <p>
                Signal criteria: PRR {"\u2265"} 2.0 AND {"\u03C7"}{"\u00B2"} {"\u2265"} 4.0 AND cases {"\u2265"} 3
                (Evans et al. 2001). IC = Information Component (Bate 1998). EBGM = Empirical Bayes Geometric Mean (DuMouchel 1999).
              </p>
              <p>
                Data source: FDA FAERS via openFDA API.
                {data.cache_age_seconds != null && ` Cache age: ${Math.floor(data.cache_age_seconds / 60)}min.`}
                {" "}Queried {data.products_queried.length} CAR-T products.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
