import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface QueryBody {
  question: string
  context?: {
    company_id?: number
    fiscal_year?: number
  }
}

interface CompanyRow {
  id: number
  name: string
  ticker: string
}

interface FinancialRow {
  company_id: number
  company_name: string
  fiscal_year: number
  revenue: number | null
  operating_margin: number | null
  net_income: number | null
  rd_expense: number | null
  gross_margin: number | null
  net_margin: number | null
  operating_income: number | null
  free_cash_flow: number | null
  [key: string]: string | number | null | undefined
}

interface VarianceRow {
  company_name: string
  metric: string
  period: string
  variance_pct: number
  variance_abs: number
  direction: string
  ai_explanation: string | null
}

interface YearRow {
  max_year: number
}

type LabelType = 'FACT' | 'INTERPRETATION' | 'HYPOTHESIS'

interface LabeledStatement {
  text: string
  type: LabelType
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`
  }
  return `$${value.toLocaleString()}`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

const METRIC_KEYWORDS: Record<string, string> = {
  revenue: 'revenue',
  sales: 'revenue',
  'top line': 'revenue',
  margin: 'operating_margin',
  'operating margin': 'operating_margin',
  'gross margin': 'gross_margin',
  'net margin': 'net_margin',
  profit: 'net_income',
  'net income': 'net_income',
  'operating income': 'operating_income',
  'r&d': 'rd_expense',
  'research': 'rd_expense',
  'rd spend': 'rd_expense',
  'cash flow': 'free_cash_flow',
  'free cash flow': 'free_cash_flow',
}

function detectMetric(question: string): string {
  const lower = question.toLowerCase()
  for (const [keyword, metric] of Object.entries(METRIC_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return metric
    }
  }
  return 'revenue'
}

function isMarginMetric(metric: string): boolean {
  return ['operating_margin', 'gross_margin', 'net_margin', 'rd_intensity', 'roe'].includes(metric)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QueryBody
    const { question, context } = body

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'question is required and must be a string' },
        { status: 400 }
      )
    }

    const db = getDb()
    const lower = question.toLowerCase()

    // Get companies for name matching
    const companies = db.prepare('SELECT id, name, ticker FROM companies').all() as CompanyRow[]

    // Detect which company the user might be asking about
    let targetCompanyId = context?.company_id ?? null
    let targetCompanyName: string | null = null
    for (const c of companies) {
      if (lower.includes(c.name.toLowerCase()) || lower.includes(c.ticker.toLowerCase())) {
        targetCompanyId = c.id
        targetCompanyName = c.name
        break
      }
    }

    // Detect which metric
    const metric = detectMetric(question)
    const isMargin = isMarginMetric(metric)

    // Get latest year
    const latestRow = db.prepare(
      "SELECT MAX(fiscal_year) AS max_year FROM financials WHERE period_type = 'annual'"
    ).get() as YearRow | undefined
    const latestYear = context?.fiscal_year ?? latestRow?.max_year ?? new Date().getFullYear()

    // Pattern: "highest/lowest/top/bottom X"
    if (/\b(highest|largest|top|best|most|leading)\b/.test(lower) ||
        /\b(lowest|smallest|bottom|worst|least)\b/.test(lower)) {
      const isDescending = /\b(highest|largest|top|best|most|leading)\b/.test(lower)
      const direction = isDescending ? 'DESC' : 'ASC'
      const dirWord = isDescending ? 'highest' : 'lowest'

      const ranked = db.prepare(`
        SELECT f.company_id, c.name AS company_name, f.fiscal_year, f.${metric} AS value
        FROM financials f
        JOIN companies c ON f.company_id = c.id
        WHERE f.period_type = 'annual' AND f.fiscal_year = ? AND f.${metric} IS NOT NULL
        ORDER BY f.${metric} ${direction}
        LIMIT 5
      `).all(latestYear) as { company_name: string; value: number; fiscal_year: number }[]

      if (ranked.length === 0) {
        return NextResponse.json({
          answer: `No data found for ${metric.replace(/_/g, ' ')} in ${latestYear}.`,
          data_points: [],
          labels: [{ text: 'No data available for the requested query.', type: 'FACT' }],
          chart_config: null,
          confidence: 'LOW',
        })
      }

      const top = ranked[0]
      const formattedValue = isMargin ? formatPercent(top.value) : formatCurrency(top.value)

      const labels: LabeledStatement[] = [
        {
          text: `${top.company_name} had the ${dirWord} ${metric.replace(/_/g, ' ')} at ${formattedValue} in FY${latestYear}.`,
          type: 'FACT',
        },
        {
          text: `This ranking is based on reported annual figures across ${ranked.length} companies in the dataset.`,
          type: 'FACT',
        },
      ]

      if (ranked.length >= 2) {
        const gap = Math.abs(ranked[0].value - ranked[1].value)
        const formattedGap = isMargin ? formatPercent(gap) : formatCurrency(gap)
        labels.push({
          text: `The gap between #1 and #2 is ${formattedGap}, suggesting ${gap / Math.abs(ranked[0].value) > 0.2 ? 'significant' : 'modest'} differentiation.`,
          type: 'INTERPRETATION',
        })
      }

      return NextResponse.json({
        answer: `${top.company_name} had the ${dirWord} ${metric.replace(/_/g, ' ')} in FY${latestYear} at ${formattedValue}.`,
        data_points: ranked,
        labels,
        chart_config: {
          type: 'bar' as const,
          data: ranked.map(r => ({
            company: r.company_name,
            value: isMargin ? Math.round(r.value * 10000) / 100 : r.value,
          })),
          xKey: 'company',
          yKey: 'value',
        },
        confidence: 'HIGH',
      })
    }

    // Pattern: "compare X vs Y" or "X compared to Y"
    if (/\b(compare|vs|versus|compared to|against)\b/.test(lower) && companies.length >= 2) {
      const matchedCompanies: CompanyRow[] = []
      for (const c of companies) {
        if (lower.includes(c.name.toLowerCase()) || lower.includes(c.ticker.toLowerCase())) {
          matchedCompanies.push(c)
        }
        if (matchedCompanies.length >= 2) break
      }

      if (matchedCompanies.length >= 2) {
        const data = matchedCompanies.map(c => {
          const row = db.prepare(`
            SELECT f.${metric} AS value
            FROM financials f
            WHERE f.company_id = ? AND f.period_type = 'annual' AND f.fiscal_year = ?
          `).get(c.id, latestYear) as { value: number } | undefined
          return { company_name: c.name, ticker: c.ticker, value: row?.value ?? null }
        })

        const v0 = data[0].value
        const v1 = data[1].value
        const fmtMetric = metric.replace(/_/g, ' ')

        const labels: LabeledStatement[] = data
          .filter(d => d.value !== null)
          .map(d => ({
            text: `${d.company_name} reported ${fmtMetric} of ${isMargin ? formatPercent(d.value!) : formatCurrency(d.value!)} in FY${latestYear}.`,
            type: 'FACT' as LabelType,
          }))

        if (v0 !== null && v1 !== null) {
          const diff = v0 - v1
          const pctDiff = v1 !== 0 ? (diff / Math.abs(v1)) * 100 : null
          labels.push({
            text: `${data[0].company_name} is ${diff > 0 ? 'higher' : 'lower'} by ${isMargin ? formatPercent(Math.abs(diff)) : formatCurrency(Math.abs(diff))}${pctDiff !== null ? ` (${Math.abs(pctDiff).toFixed(1)}%)` : ''}.`,
            type: 'FACT',
          })
          labels.push({
            text: `Differences in ${fmtMetric} may reflect distinct strategic priorities, portfolio mix, or geographic footprint.`,
            type: 'INTERPRETATION',
          })
        }

        return NextResponse.json({
          answer: `Comparing ${data[0].company_name} vs ${data[1].company_name} on ${fmtMetric} for FY${latestYear}.`,
          data_points: data,
          labels,
          chart_config: {
            type: 'bar' as const,
            data: data.map(d => ({
              company: d.company_name,
              value: isMargin && d.value !== null ? Math.round(d.value * 10000) / 100 : d.value,
            })),
            xKey: 'company',
            yKey: 'value',
          },
          confidence: 'HIGH',
        })
      }
    }

    // Pattern: "trend" or "over time" or "history"
    if (/\b(trend|over time|history|historical|growth|trajectory|evolution)\b/.test(lower)) {
      const conditions: string[] = ["f.period_type = 'annual'"]
      const params: (string | number)[] = []

      if (targetCompanyId) {
        conditions.push('f.company_id = ?')
        params.push(targetCompanyId)
      }

      const trendData = db.prepare(`
        SELECT f.fiscal_year AS period, c.name AS company_name, f.${metric} AS value
        FROM financials f
        JOIN companies c ON f.company_id = c.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY f.fiscal_year ASC, c.name
      `).all(...params) as { period: number; company_name: string; value: number }[]

      const labels: LabeledStatement[] = [
        {
          text: `Showing ${metric.replace(/_/g, ' ')} trend${targetCompanyName ? ` for ${targetCompanyName}` : ' across all companies'}.`,
          type: 'FACT',
        },
      ]

      if (trendData.length >= 2) {
        const firstVal = trendData[0].value
        const lastVal = trendData[trendData.length - 1].value
        if (firstVal && lastVal) {
          const totalChange = ((lastVal - firstVal) / Math.abs(firstVal)) * 100
          labels.push({
            text: `Overall change from ${trendData[0].period} to ${trendData[trendData.length - 1].period}: ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}%.`,
            type: 'FACT',
          })
          labels.push({
            text: `${totalChange > 0 ? 'Growth' : 'Decline'} trajectory may ${Math.abs(totalChange) > 20 ? 'indicate structural shifts in competitive positioning' : 'reflect typical industry dynamics'}.`,
            type: 'INTERPRETATION',
          })
        }
      }

      return NextResponse.json({
        answer: `${metric.replace(/_/g, ' ')} trend data${targetCompanyName ? ` for ${targetCompanyName}` : ''}.`,
        data_points: trendData,
        labels,
        chart_config: {
          type: 'line' as const,
          data: trendData.map(d => ({
            period: d.period,
            company: d.company_name,
            value: isMargin ? Math.round(d.value * 10000) / 100 : d.value,
          })),
          xKey: 'period',
          yKey: 'value',
        },
        confidence: 'HIGH',
      })
    }

    // Pattern: "why" or "explain" or "change"
    if (/\b(why|explain|reason|cause|change|decline|drop|increase|surge|jump)\b/.test(lower)) {
      const varConditions: string[] = []
      const varParams: (string | number)[] = []

      if (targetCompanyId) {
        varConditions.push('v.company_id = ?')
        varParams.push(targetCompanyId)
      }

      const varMetric = metric.replace(/_/g, ' ')
      varConditions.push("v.metric LIKE ?")
      varParams.push(`%${varMetric}%`)

      const varWhereClause = varConditions.length > 0
        ? `WHERE ${varConditions.join(' AND ')}`
        : ''

      const variances = db.prepare(`
        SELECT v.*, c.name AS company_name
        FROM variances v
        JOIN companies c ON v.company_id = c.id
        ${varWhereClause}
        ORDER BY ABS(v.variance_pct) DESC
        LIMIT 5
      `).all(...varParams) as VarianceRow[]

      if (variances.length > 0) {
        const top = variances[0]
        const labels: LabeledStatement[] = [
          {
            text: `${top.company_name} showed a ${top.variance_pct > 0 ? '+' : ''}${Number(top.variance_pct).toFixed(1)}% variance in ${top.metric} for ${top.period}.`,
            type: 'FACT',
          },
          {
            text: `The direction of this variance is ${top.direction}.`,
            type: 'FACT',
          },
        ]

        if (top.ai_explanation) {
          labels.push({
            text: top.ai_explanation,
            type: 'INTERPRETATION',
          })
        }

        labels.push({
          text: 'Multiple factors typically contribute to such variances, including market dynamics, competitive actions, and operational changes.',
          type: 'HYPOTHESIS',
        })

        return NextResponse.json({
          answer: top.ai_explanation
            ? `${top.company_name}: ${top.ai_explanation}`
            : `${top.company_name} experienced a ${top.variance_pct > 0 ? 'positive' : 'negative'} ${Number(Math.abs(top.variance_pct)).toFixed(1)}% variance in ${top.metric}.`,
          data_points: variances,
          labels,
          chart_config: null,
          confidence: variances.length > 0 ? 'MEDIUM' : 'LOW',
        })
      }

      // Fall back to YoY comparison if no variance data
      if (targetCompanyId) {
        const current = db.prepare(`
          SELECT f.${metric} AS value FROM financials f
          WHERE f.company_id = ? AND f.period_type = 'annual' AND f.fiscal_year = ?
        `).get(targetCompanyId, latestYear) as { value: number } | undefined

        const prior = db.prepare(`
          SELECT f.${metric} AS value FROM financials f
          WHERE f.company_id = ? AND f.period_type = 'annual' AND f.fiscal_year = ?
        `).get(targetCompanyId, latestYear - 1) as { value: number } | undefined

        if (current?.value != null && prior?.value != null) {
          const change = current.value - prior.value
          const changePct = prior.value !== 0 ? (change / Math.abs(prior.value)) * 100 : null

          return NextResponse.json({
            answer: `${targetCompanyName}'s ${metric.replace(/_/g, ' ')} changed by ${changePct !== null ? `${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%` : 'N/A'} from FY${latestYear - 1} to FY${latestYear}.`,
            data_points: [
              { period: latestYear - 1, value: prior.value },
              { period: latestYear, value: current.value },
            ],
            labels: [
              {
                text: `${metric.replace(/_/g, ' ')} went from ${isMargin ? formatPercent(prior.value) : formatCurrency(prior.value)} to ${isMargin ? formatPercent(current.value) : formatCurrency(current.value)}.`,
                type: 'FACT' as LabelType,
              },
              {
                text: 'The change could be driven by portfolio performance, market conditions, or strategic decisions.',
                type: 'HYPOTHESIS' as LabelType,
              },
            ],
            chart_config: null,
            confidence: 'MEDIUM',
          })
        }
      }
    }

    // Default / general query: return summary of the company or overall
    if (targetCompanyId && targetCompanyName) {
      const financials = db.prepare(`
        SELECT f.*, c.name AS company_name
        FROM financials f
        JOIN companies c ON f.company_id = c.id
        WHERE f.company_id = ? AND f.period_type = 'annual'
        ORDER BY f.fiscal_year DESC
        LIMIT 1
      `).get(targetCompanyId) as FinancialRow | undefined

      if (financials) {
        const labels: LabeledStatement[] = []
        if (financials.revenue != null) {
          labels.push({ text: `FY${financials.fiscal_year} revenue: ${formatCurrency(financials.revenue)}.`, type: 'FACT' })
        }
        if (financials.operating_margin != null) {
          labels.push({ text: `Operating margin: ${formatPercent(financials.operating_margin)}.`, type: 'FACT' })
        }
        if (financials.rd_expense != null) {
          labels.push({ text: `R&D spending: ${formatCurrency(financials.rd_expense)}.`, type: 'FACT' })
        }
        if (financials.net_income != null) {
          labels.push({ text: `Net income: ${formatCurrency(financials.net_income)}.`, type: 'FACT' })
        }
        labels.push({
          text: 'Performance should be evaluated in the context of pipeline maturity and therapeutic area dynamics.',
          type: 'INTERPRETATION',
        })

        return NextResponse.json({
          answer: `Summary for ${targetCompanyName} (FY${financials.fiscal_year}): Revenue ${formatCurrency(financials.revenue ?? 0)}, Operating Margin ${formatPercent(financials.operating_margin ?? 0)}, R&D ${formatCurrency(financials.rd_expense ?? 0)}.`,
          data_points: [financials],
          labels,
          chart_config: null,
          confidence: 'HIGH',
        })
      }
    }

    // Truly generic fallback
    const allFinancials = db.prepare(`
      SELECT c.name AS company_name, f.revenue, f.operating_margin, f.rd_expense
      FROM financials f
      JOIN companies c ON f.company_id = c.id
      WHERE f.period_type = 'annual' AND f.fiscal_year = ?
      ORDER BY f.revenue DESC
    `).all(latestYear) as { company_name: string; revenue: number; operating_margin: number; rd_expense: number }[]

    return NextResponse.json({
      answer: `Here is a summary of ${allFinancials.length} companies for FY${latestYear}. Try asking about specific companies, metrics, trends, or comparisons for more detailed analysis.`,
      data_points: allFinancials,
      labels: [
        { text: `Data covers ${allFinancials.length} companies for FY${latestYear}.`, type: 'FACT' },
        { text: 'For more specific insights, try questions like "Which company has the highest revenue?" or "Compare Pfizer vs Novartis".', type: 'INTERPRETATION' },
      ],
      chart_config: allFinancials.length > 0
        ? {
            type: 'bar' as const,
            data: allFinancials.map(r => ({ company: r.company_name, value: r.revenue })),
            xKey: 'company',
            yKey: 'value',
          }
        : null,
      confidence: 'MEDIUM',
    })
  } catch (error) {
    console.error('Error processing AI query:', error)
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    )
  }
}
