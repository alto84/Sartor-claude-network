"use client";

/**
 * Evidence Accrual Curve
 *
 * Shows how Bayesian posterior distributions for CRS/ICANS evolve as studies
 * are published over time. Includes projected CI narrowing for upcoming Phase 2 trials.
 *
 * @module components/safety/evidence-accrual
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
import { TrendingUp, Eye } from "lucide-react";

// ============================================================================
// DATA: Chronological study accrual for SLE CAR-T
// ============================================================================

interface StudyDataPoint {
  label: string;
  year: number;
  quarter: string;
  nNewPatients: number;
  nCumulativePatients: number;
  crsGrade3PlusEvents: number;  // cumulative
  icansGrade3PlusEvents: number;
  isProjected?: boolean;
}

// Chronological order based on publication dates
const studyTimeline: StudyDataPoint[] = [
  // Historical published data
  {
    label: "Mackensen et al.",
    year: 2022,
    quarter: "Q4 2022",
    nNewPatients: 5,
    nCumulativePatients: 5,
    crsGrade3PlusEvents: 0,
    icansGrade3PlusEvents: 0,
  },
  {
    label: "Muller et al.",
    year: 2024,
    quarter: "Q1 2024",
    nNewPatients: 15,
    nCumulativePatients: 20,
    crsGrade3PlusEvents: 0,
    icansGrade3PlusEvents: 0,
  },
  {
    label: "Jin / Co-infusion / Cabaletta",
    year: 2024,
    quarter: "Q3 2024",
    nNewPatients: 17,
    nCumulativePatients: 37,
    crsGrade3PlusEvents: 1,
    icansGrade3PlusEvents: 0,
  },
  {
    label: "CASTLE / BMS / Expanded",
    year: 2025,
    quarter: "Q1 2025",
    nNewPatients: 10,
    nCumulativePatients: 47,
    crsGrade3PlusEvents: 1,
    icansGrade3PlusEvents: 0,
  },
  // Projected future data (Phase 2 trials)
  {
    label: "CASTLE Ph2 interim",
    year: 2026,
    quarter: "Q3 2026",
    nNewPatients: 30,
    nCumulativePatients: 77,
    crsGrade3PlusEvents: 2,
    icansGrade3PlusEvents: 1,
    isProjected: true,
  },
  {
    label: "RESET-SLE Ph2",
    year: 2027,
    quarter: "Q1 2027",
    nNewPatients: 50,
    nCumulativePatients: 127,
    crsGrade3PlusEvents: 3,
    icansGrade3PlusEvents: 1,
    isProjected: true,
  },
  {
    label: "Pooled Ph2 data",
    year: 2028,
    quarter: "Q1 2028",
    nNewPatients: 73,
    nCumulativePatients: 200,
    crsGrade3PlusEvents: 4,
    icansGrade3PlusEvents: 2,
    isProjected: true,
  },
];

// ============================================================================
// BAYESIAN POSTERIOR COMPUTATION
// ============================================================================

interface PosteriorEstimate {
  mean: number;
  ciLow: number;
  ciHigh: number;
  ciWidth: number;
}

/**
 * Compute Beta posterior with informative prior.
 * Prior: Beta(alpha0, beta0) from discounted oncology data.
 * Posterior: Beta(alpha0 + events, beta0 + n - events).
 */
function computePosterior(
  priorAlpha: number,
  priorBeta: number,
  events: number,
  n: number
): PosteriorEstimate {
  const a = priorAlpha + events;
  const b = priorBeta + (n - events);
  const mean = a / (a + b);

  // Credible interval via normal approximation of Beta
  const variance = (a * b) / ((a + b) ** 2 * (a + b + 1));
  const sd = Math.sqrt(variance);
  const ciLow = Math.max(0, mean - 1.96 * sd);
  const ciHigh = Math.min(1, mean + 1.96 * sd);

  return {
    mean: mean * 100,
    ciLow: ciLow * 100,
    ciHigh: ciHigh * 100,
    ciWidth: (ciHigh - ciLow) * 100,
  };
}

// Priors from risk-model.md v2.0
const CRS_PRIOR = { alpha: 0.21, beta: 1.29 };   // Discounted oncology ~14%
const ICANS_PRIOR = { alpha: 0.14, beta: 1.03 };  // Discounted oncology ~12%

// ============================================================================
// SVG CHART
// ============================================================================

const CHART_W = 680;
const CHART_H = 300;
const MARGIN = { top: 25, right: 30, bottom: 55, left: 55 };
const PW = CHART_W - MARGIN.left - MARGIN.right;
const PH = CHART_H - MARGIN.top - MARGIN.bottom;

export function EvidenceAccrual({ className }: { className?: string }) {
  const [showICans, setShowICans] = React.useState(true);

  // Compute posteriors at each timepoint
  const crsTrack = studyTimeline.map((s) =>
    computePosterior(CRS_PRIOR.alpha, CRS_PRIOR.beta, s.crsGrade3PlusEvents, s.nCumulativePatients)
  );
  const icansTrack = studyTimeline.map((s) =>
    computePosterior(ICANS_PRIOR.alpha, ICANS_PRIOR.beta, s.icansGrade3PlusEvents, s.nCumulativePatients)
  );

  // Scale functions
  const xScale = (i: number) => MARGIN.left + (i / (studyTimeline.length - 1)) * PW;
  const maxY = Math.max(
    ...crsTrack.map((t) => t.ciHigh),
    ...(showICans ? icansTrack.map((t) => t.ciHigh) : [])
  );
  const yMax = Math.ceil(maxY / 5) * 5 || 15;
  const yScale = (v: number) => MARGIN.top + PH - (v / yMax) * PH;

  // First projected index
  const projectedStart = studyTimeline.findIndex((s) => s.isProjected);

  // CI area path builder
  function ciAreaPath(track: PosteriorEstimate[]): string {
    const upper = track.map((t, i) => `${xScale(i)},${yScale(t.ciHigh)}`).join(" L");
    const lower = [...track].reverse().map((t, i) => {
      const idx = track.length - 1 - i;
      return `${xScale(idx)},${yScale(t.ciLow)}`;
    }).join(" L");
    return `M${upper} L${lower} Z`;
  }

  // Mean line builder
  function meanPath(track: PosteriorEstimate[]): string {
    return track.map((t, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(t.mean)}`).join(" ");
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              Evidence Accrual Curve
            </CardTitle>
            <CardDescription className="text-xs">
              Bayesian posterior evolution as SLE CAR-T data accumulates (n=5 {"\u2192"} n=200 projected)
            </CardDescription>
          </div>
          <button
            onClick={() => setShowICans(!showICans)}
            className="text-[10px] px-2 py-1 rounded border hover:bg-muted transition-colors flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            {showICans ? "Hide" : "Show"} ICANS
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" style={{ maxHeight: 320 }}>
          {/* Y-axis gridlines and labels */}
          {Array.from({ length: 4 }, (_, i) => {
            const val = (yMax / 3) * i;
            return (
              <g key={`y-${i}`}>
                <line
                  x1={MARGIN.left}
                  y1={yScale(val)}
                  x2={CHART_W - MARGIN.right}
                  y2={yScale(val)}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeDasharray={i > 0 ? "4,4" : undefined}
                />
                <text
                  x={MARGIN.left - 8}
                  y={yScale(val)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  fontSize={9}
                >
                  {val.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Y-axis label */}
          <text
            x={12}
            y={MARGIN.top + PH / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize={9}
            transform={`rotate(-90, 12, ${MARGIN.top + PH / 2})`}
          >
            Posterior Estimate (%)
          </text>

          {/* Projected zone background */}
          {projectedStart > 0 && (
            <rect
              x={xScale(projectedStart) - 6}
              y={MARGIN.top}
              width={CHART_W - MARGIN.right - xScale(projectedStart) + 6}
              height={PH}
              fill="currentColor"
              fillOpacity={0.03}
              rx={4}
            />
          )}
          {projectedStart > 0 && (
            <text
              x={xScale(projectedStart) + (CHART_W - MARGIN.right - xScale(projectedStart)) / 2}
              y={MARGIN.top + 12}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={8}
              fontStyle="italic"
            >
              Projected (Phase 2 trials)
            </text>
          )}

          {/* Projected divider line */}
          {projectedStart > 0 && (
            <line
              x1={xScale(projectedStart) - 6}
              y1={MARGIN.top}
              x2={xScale(projectedStart) - 6}
              y2={MARGIN.top + PH}
              stroke="currentColor"
              strokeOpacity={0.15}
              strokeDasharray="6,3"
            />
          )}

          {/* CRS CI band */}
          <path
            d={ciAreaPath(crsTrack)}
            fill="#10b981"
            fillOpacity={0.12}
          />

          {/* ICANS CI band */}
          {showICans && (
            <path
              d={ciAreaPath(icansTrack)}
              fill="#6366f1"
              fillOpacity={0.1}
            />
          )}

          {/* CRS mean line */}
          <path
            d={meanPath(crsTrack)}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ICANS mean line */}
          {showICans && (
            <path
              d={meanPath(icansTrack)}
              fill="none"
              stroke="#6366f1"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6,3"
            />
          )}

          {/* Data points and labels */}
          {studyTimeline.map((s, i) => (
            <g key={i}>
              {/* CRS point */}
              <circle
                cx={xScale(i)}
                cy={yScale(crsTrack[i].mean)}
                r={s.isProjected ? 3 : 4}
                fill={s.isProjected ? "white" : "#10b981"}
                stroke="#10b981"
                strokeWidth={2}
              />

              {/* ICANS point */}
              {showICans && (
                <circle
                  cx={xScale(i)}
                  cy={yScale(icansTrack[i].mean)}
                  r={s.isProjected ? 3 : 4}
                  fill={s.isProjected ? "white" : "#6366f1"}
                  stroke="#6366f1"
                  strokeWidth={2}
                />
              )}

              {/* X-axis labels */}
              <text
                x={xScale(i)}
                y={MARGIN.top + PH + 14}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={8}
                fontWeight={s.isProjected ? 400 : 500}
                fontStyle={s.isProjected ? "italic" : "normal"}
              >
                {s.quarter}
              </text>
              <text
                x={xScale(i)}
                y={MARGIN.top + PH + 25}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={7}
              >
                n={s.nCumulativePatients}
              </text>
              <text
                x={xScale(i)}
                y={MARGIN.top + PH + 36}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={7}
                fontStyle="italic"
              >
                {s.label.length > 18 ? s.label.slice(0, 16) + "\u2026" : s.label}
              </text>

              {/* CI width annotation */}
              <text
                x={xScale(i)}
                y={yScale(crsTrack[i].ciHigh) - 6}
                textAnchor="middle"
                className="fill-emerald-600"
                fontSize={7}
                fontWeight={600}
              >
                {"\u00B1"}{(crsTrack[i].ciWidth / 2).toFixed(1)}
              </text>
            </g>
          ))}

          {/* Legend */}
          <g transform={`translate(${MARGIN.left + 8}, ${MARGIN.top + 6})`}>
            <line x1={0} y1={0} x2={16} y2={0} stroke="#10b981" strokeWidth={2} />
            <circle cx={8} cy={0} r={3} fill="#10b981" />
            <text x={20} y={0} dominantBaseline="middle" fontSize={9} className="fill-foreground">
              CRS Grade 3+
            </text>
            {showICans && (
              <>
                <line x1={100} y1={0} x2={116} y2={0} stroke="#6366f1" strokeWidth={2} strokeDasharray="4,3" />
                <circle cx={108} cy={0} r={3} fill="#6366f1" />
                <text x={120} y={0} dominantBaseline="middle" fontSize={9} className="fill-foreground">
                  ICANS Grade 3+
                </text>
              </>
            )}
          </g>
        </svg>

        {/* Summary statistics */}
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Current CI Width (CRS)</p>
            <p className="text-sm font-bold text-emerald-600">
              {crsTrack[projectedStart - 1].ciWidth.toFixed(1)}pp
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Projected at n=200</p>
            <p className="text-sm font-bold text-indigo-600">
              {crsTrack[crsTrack.length - 1].ciWidth.toFixed(1)}pp
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">CI Narrowing</p>
            <p className="text-sm font-bold text-amber-600">
              {((1 - crsTrack[crsTrack.length - 1].ciWidth / crsTrack[projectedStart - 1].ciWidth) * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <p className="text-[9px] text-muted-foreground italic mt-2">
          Shaded bands show 95% credible intervals. Projected events assume rates consistent with current posteriors.
          Informative priors from discounted oncology data (CRS: Beta(0.21, 1.29); ICANS: Beta(0.14, 1.03)).
          Confidence improves as {"\u221A"}n; n=200 would yield clinically actionable precision.
        </p>
      </CardContent>
    </Card>
  );
}
