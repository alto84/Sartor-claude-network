"use client";

/**
 * Forest Plot
 *
 * Classic meta-analysis forest plot showing individual trial adverse event
 * rates with 95% CI (Wilson score) and a pooled estimate diamond.
 * Renders as responsive SVG. Supports toggling metric and SLE vs Oncology.
 *
 * @module components/safety/forest-plot
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
import { GitBranch } from "lucide-react";
import { adverseEventRates, type AdverseEventRate } from "@/lib/safety-data";

// ============================================================================
// TYPES
// ============================================================================

interface StudyRow {
  name: string;
  n: number;
  events: number;
  rate: number;
  ciLow: number;
  ciHigh: number;
  weight: number;
  year: number;
  indication: string;
}

type MetricKey = "crsGrade3Plus" | "crsAnyGrade" | "icansGrade3Plus" | "icansAnyGrade";

// ============================================================================
// STATISTICAL FUNCTIONS
// ============================================================================

/**
 * Wilson score confidence interval for a binomial proportion.
 * Handles zero-event and full-event edge cases gracefully.
 */
function wilsonCI(x: number, n: number, alpha: number = 0.05): [number, number] {
  if (n === 0) return [0, 100];
  const z = 1.96; // 95% CI
  const p = x / n;

  if (x === 0) {
    // Rule-of-3 upper bound for zero events
    const upper = (1 - Math.pow(alpha / 2, 1 / n)) * 100;
    return [0, upper];
  }
  if (x === n) {
    const lower = Math.pow(alpha / 2, 1 / n) * 100;
    return [lower, 100];
  }

  const denom = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / denom;
  const margin = (z / denom) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [
    Math.max(0, (center - margin)) * 100,
    Math.min(100, (center + margin)) * 100,
  ];
}

// ============================================================================
// DATA PREPARATION
// ============================================================================

function prepareForestData(
  metric: MetricKey,
  includeOncology: boolean,
): { sleStudies: StudyRow[]; oncStudies: StudyRow[]; pooled: StudyRow } {
  const toRow = (r: AdverseEventRate): StudyRow => {
    const rate = r[metric];
    const n = r.nPatients;
    const events = Math.round((rate / 100) * n);
    const [ciLow, ciHigh] = wilsonCI(events, n);
    // Shorten trial name for display
    let name = r.trial
      .replace(" et al. ", " ")
      .replace(/\s\d{4}$/, "");
    if (name.length > 28) name = name.slice(0, 26) + "…";
    return {
      name,
      n,
      events,
      rate,
      ciLow,
      ciHigh,
      weight: n + 1,
      year: r.year,
      indication: r.indication,
    };
  };

  const sleTrials = adverseEventRates
    .filter(r => r.indication === "SLE" && r.trial !== "SLE Pooled Analysis")
    .map(toRow)
    .sort((a, b) => a.year - b.year);

  const oncTrials = includeOncology
    ? adverseEventRates
        .filter(r => r.indication !== "SLE")
        .map(toRow)
        .sort((a, b) => a.year - b.year)
    : [];

  // Pooled estimate for SLE
  const totalN = sleTrials.reduce((s, r) => s + r.n, 0);
  const totalEvents = sleTrials.reduce((s, r) => s + r.events, 0);
  const pooledRow = adverseEventRates.find(
    r => r.indication === "SLE" && r.trial === "SLE Pooled Analysis",
  );
  const pooledRate = pooledRow ? pooledRow[metric] : (totalN > 0 ? (totalEvents / totalN) * 100 : 0);
  const [poolCILow, poolCIHigh] = wilsonCI(
    Math.round((pooledRate / 100) * totalN),
    totalN,
  );

  return {
    sleStudies: sleTrials,
    oncStudies: oncTrials,
    pooled: {
      name: "SLE Pooled",
      n: totalN,
      events: totalEvents,
      rate: pooledRate,
      ciLow: poolCILow,
      ciHigh: poolCIHigh,
      weight: totalN,
      year: 2025,
      indication: "SLE",
    },
  };
}

// ============================================================================
// INDICATION COLORS
// ============================================================================

const indicationColors: Record<string, { fill: string; stroke: string; label: string }> = {
  SLE: { fill: "#10b981", stroke: "#059669", label: "SLE (Autoimmune)" },
  DLBCL: { fill: "#f59e0b", stroke: "#d97706", label: "DLBCL" },
  ALL: { fill: "#ef4444", stroke: "#dc2626", label: "ALL" },
  MM: { fill: "#8b5cf6", stroke: "#7c3aed", label: "Multiple Myeloma" },
};

// ============================================================================
// FOREST PLOT COMPONENT
// ============================================================================

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "crsGrade3Plus", label: "Gr3+ CRS" },
  { key: "crsAnyGrade", label: "Any CRS" },
  { key: "icansGrade3Plus", label: "Gr3+ ICANS" },
  { key: "icansAnyGrade", label: "Any ICANS" },
];

export function ForestPlot({ className }: { className?: string }) {
  const [metric, setMetric] = React.useState<MetricKey>("crsGrade3Plus");
  const [showOncology, setShowOncology] = React.useState(false);

  const { sleStudies, oncStudies, pooled } = prepareForestData(metric, showOncology);
  const metricLabel = METRICS.find(m => m.key === metric)?.label ?? metric;

  // Layout constants
  const leftCol = 180;
  const plotWidth = 320;
  const rightCol = 110;
  const rowH = 26;
  const headerH = 28;
  const footerH = 36;
  const sectionGap = 8;

  // Build row list: SLE studies, gap, oncology studies (if shown), gap, pooled
  const allRows: (StudyRow | "sle-header" | "onc-header" | "pooled-sep")[] = [];
  allRows.push("sle-header");
  allRows.push(...sleStudies);
  if (showOncology && oncStudies.length > 0) {
    allRows.push("onc-header");
    allRows.push(...oncStudies);
  }
  allRows.push("pooled-sep");

  // Calculate SVG height
  const dataRowCount = sleStudies.length + oncStudies.length + 1; // +1 pooled
  const headerCount = 1 + (showOncology ? 1 : 0); // section headers
  const svgHeight =
    headerH +
    dataRowCount * rowH +
    headerCount * (rowH * 0.8) +
    sectionGap * 2 +
    footerH +
    20;

  // X scale
  const allCIs = [...sleStudies, ...oncStudies, pooled].map(s => s.ciHigh);
  const xMax = Math.min(100, Math.max(25, Math.ceil(Math.max(...allCIs, 10) / 10) * 10 + 5));
  const xScale = (v: number) => leftCol + (v / xMax) * plotWidth;

  // Weight -> square size
  const maxWeight = Math.max(...sleStudies.map(s => s.weight), ...oncStudies.map(s => s.weight));
  const sqSize = (w: number) => 4 + (w / maxWeight) * 10;

  // Compute y positions for each row
  let curY = headerH;
  const rowPositions: { row: typeof allRows[number]; y: number }[] = [];
  for (const row of allRows) {
    if (row === "sle-header" || row === "onc-header") {
      curY += sectionGap;
      rowPositions.push({ row, y: curY });
      curY += rowH * 0.8;
    } else if (row === "pooled-sep") {
      curY += sectionGap;
      rowPositions.push({ row, y: curY });
      curY += rowH;
    } else {
      rowPositions.push({ row, y: curY });
      curY += rowH;
    }
  }
  const totalHeight = curY + footerH;
  const svgWidth = leftCol + plotWidth + rightCol;

  // Tick marks for X axis
  const step = xMax <= 30 ? 5 : 10;
  const ticks = Array.from({ length: Math.floor(xMax / step) + 1 }, (_, i) => i * step);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-emerald-600" />
              Forest Plot: {metricLabel} by Study
            </CardTitle>
            <CardDescription className="text-xs">
              Individual study rates with 95% CI and pooled SLE estimate
            </CardDescription>
          </div>
          <div className="flex gap-1 flex-wrap">
            {METRICS.map(m => (
              <Button
                key={m.key}
                variant={metric === m.key ? "default" : "outline"}
                size="sm"
                onClick={() => setMetric(m.key)}
                className={`text-[10px] h-6 px-2 ${
                  metric === m.key ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                }`}
              >
                {m.label}
              </Button>
            ))}
            <Button
              variant={showOncology ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOncology(!showOncology)}
              className={`text-[10px] h-6 px-2 ml-1 ${
                showOncology ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
              }`}
            >
              {showOncology ? "Hide" : "Show"} Oncology
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <svg
          width="100%"
          viewBox={`0 0 ${svgWidth} ${totalHeight}`}
          className="font-sans select-none"
          role="img"
          aria-label={`Forest plot of ${metricLabel} rates in CAR-T studies`}
        >
          {/* Column headers */}
          <text x={4} y={headerH - 10} fontSize="9.5" fontWeight="600" className="fill-foreground">
            Study
          </text>
          <text
            x={leftCol + plotWidth / 2}
            y={headerH - 10}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="600"
            className="fill-foreground"
          >
            {metricLabel} Rate (%) [95% CI]
          </text>
          <text
            x={leftCol + plotWidth + 8}
            y={headerH - 10}
            fontSize="9.5"
            fontWeight="600"
            className="fill-foreground"
          >
            Events/N
          </text>

          {/* Separator under header */}
          <line x1={0} y1={headerH - 2} x2={svgWidth} y2={headerH - 2} stroke="currentColor" strokeOpacity={0.2} />

          {/* Grid lines */}
          {ticks.map(tick => (
            <g key={`tick-${tick}`}>
              <line
                x1={xScale(tick)}
                y1={headerH}
                x2={xScale(tick)}
                y2={totalHeight - footerH}
                stroke="currentColor"
                strokeOpacity={tick === 0 ? 0.3 : 0.06}
                strokeDasharray={tick === 0 ? undefined : "2,3"}
              />
              <text
                x={xScale(tick)}
                y={totalHeight - footerH + 12}
                textAnchor="middle"
                fontSize="8"
                className="fill-muted-foreground"
                fillOpacity={0.7}
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Rows */}
          {rowPositions.map(({ row, y }, idx) => {
            if (row === "sle-header") {
              return (
                <g key="sle-header">
                  <text x={4} y={y + 14} fontSize="9" fontWeight="700" fill="#059669">
                    SLE / Autoimmune ({sleStudies.length} studies)
                  </text>
                  <line x1={0} y1={y + 18} x2={leftCol - 8} y2={y + 18} stroke="#059669" strokeOpacity={0.3} />
                </g>
              );
            }

            if (row === "onc-header") {
              return (
                <g key="onc-header">
                  <text x={4} y={y + 14} fontSize="9" fontWeight="700" fill="#d97706">
                    Oncology Comparators ({oncStudies.length} studies)
                  </text>
                  <line x1={0} y1={y + 18} x2={leftCol - 8} y2={y + 18} stroke="#d97706" strokeOpacity={0.3} />
                </g>
              );
            }

            if (row === "pooled-sep") {
              const py = y + rowH / 2;
              const diamondH = 7;
              const colors = indicationColors.SLE;
              return (
                <g key="pooled">
                  <line x1={0} y1={y - 2} x2={svgWidth} y2={y - 2} stroke="currentColor" strokeOpacity={0.25} strokeWidth={0.5} />
                  <text x={4} y={py + 4} fontSize="9.5" fontWeight="700" className="fill-foreground">
                    Pooled SLE (n={pooled.n})
                  </text>
                  {/* Diamond */}
                  <polygon
                    points={`
                      ${xScale(pooled.rate)},${py - diamondH}
                      ${xScale(Math.min(pooled.ciHigh, xMax))},${py}
                      ${xScale(pooled.rate)},${py + diamondH}
                      ${xScale(pooled.ciLow)},${py}
                    `}
                    fill={colors.fill}
                    fillOpacity={0.6}
                    stroke={colors.stroke}
                    strokeWidth={1.5}
                  />
                  <text
                    x={leftCol + plotWidth + 8}
                    y={py + 4}
                    fontSize="9.5"
                    fontWeight="700"
                    className="fill-foreground"
                  >
                    {pooled.events}/{pooled.n}
                  </text>
                  <text
                    x={svgWidth - 2}
                    y={py + 4}
                    textAnchor="end"
                    fontSize="8"
                    className="fill-muted-foreground"
                  >
                    {pooled.rate.toFixed(1)} [{pooled.ciLow.toFixed(1)}-{pooled.ciHigh.toFixed(1)}]
                  </text>
                </g>
              );
            }

            // Data row
            const study = row;
            const cy = y + rowH / 2;
            const sq = sqSize(study.weight);
            const colors = indicationColors[study.indication] ?? indicationColors.SLE;
            const dataIdx = idx;

            return (
              <g key={`${study.name}-${study.indication}-${idx}`}>
                {/* Alternating row bg */}
                {dataIdx % 2 === 0 && (
                  <rect x={0} y={y} width={svgWidth} height={rowH} fill="currentColor" fillOpacity={0.015} />
                )}

                {/* Study name */}
                <text x={8} y={cy + 3.5} fontSize="9" className="fill-foreground">
                  {study.name}
                </text>
                {/* Year */}
                <text x={leftCol - 8} y={cy + 3.5} textAnchor="end" fontSize="7.5" className="fill-muted-foreground">
                  {study.year}
                </text>

                {/* CI line */}
                <line
                  x1={xScale(study.ciLow)}
                  y1={cy}
                  x2={xScale(Math.min(study.ciHigh, xMax))}
                  y2={cy}
                  stroke={colors.stroke}
                  strokeWidth={1.5}
                  strokeOpacity={0.8}
                />
                {/* CI caps */}
                <line
                  x1={xScale(study.ciLow)}
                  y1={cy - 3}
                  x2={xScale(study.ciLow)}
                  y2={cy + 3}
                  stroke={colors.stroke}
                  strokeWidth={1.5}
                  strokeOpacity={0.8}
                />
                {study.ciHigh <= xMax ? (
                  <line
                    x1={xScale(study.ciHigh)}
                    y1={cy - 3}
                    x2={xScale(study.ciHigh)}
                    y2={cy + 3}
                    stroke={colors.stroke}
                    strokeWidth={1.5}
                    strokeOpacity={0.8}
                  />
                ) : (
                  /* Arrow indicating CI extends beyond chart */
                  <polygon
                    points={`${xScale(xMax)},${cy} ${xScale(xMax) - 5},${cy - 3} ${xScale(xMax) - 5},${cy + 3}`}
                    fill={colors.stroke}
                    fillOpacity={0.8}
                  />
                )}

                {/* Point estimate (square, size proportional to weight) */}
                <rect
                  x={xScale(study.rate) - sq / 2}
                  y={cy - sq / 2}
                  width={sq}
                  height={sq}
                  fill={colors.fill}
                  rx={1}
                />

                {/* Events / N */}
                <text
                  x={leftCol + plotWidth + 8}
                  y={cy + 3.5}
                  fontSize="9"
                  className="fill-foreground"
                >
                  {study.events}/{study.n}
                </text>
                {/* CI text */}
                <text
                  x={svgWidth - 2}
                  y={cy + 3.5}
                  textAnchor="end"
                  fontSize="7.5"
                  className="fill-muted-foreground"
                >
                  [{study.ciLow.toFixed(1)}-{study.ciHigh.toFixed(1)}]
                </text>
              </g>
            );
          })}

          {/* X-axis label */}
          <text
            x={leftCol + plotWidth / 2}
            y={totalHeight - 6}
            textAnchor="middle"
            fontSize="8.5"
            className="fill-muted-foreground"
          >
            {metricLabel} Rate (%)
          </text>

          {/* Legend (when oncology is shown) */}
          {showOncology && (
            <g>
              {Object.entries(indicationColors)
                .filter(([key]) => key === "SLE" || oncStudies.some(s => s.indication === key))
                .map(([key, val], i) => {
                  const lx = leftCol + 4 + i * 100;
                  const ly = totalHeight - 22;
                  return (
                    <g key={key}>
                      <rect x={lx} y={ly - 4} width={8} height={8} fill={val.fill} rx={1} />
                      <text x={lx + 12} y={ly + 3} fontSize="8" className="fill-muted-foreground">
                        {val.label}
                      </text>
                    </g>
                  );
                })}
            </g>
          )}
        </svg>

        {/* Footer note */}
        <p className="text-[10px] text-muted-foreground mt-1 italic px-1">
          CI = Wilson score interval (rule-of-3 for zero events). Square size proportional to study weight (n).
          Diamond = pooled SLE estimate.
          {metric === "crsGrade3Plus" &&
            " All 7 individual SLE studies report 0% Grade 3+ CRS, with the pooled estimate reflecting aggregate analysis."}
        </p>
      </CardContent>
    </Card>
  );
}
