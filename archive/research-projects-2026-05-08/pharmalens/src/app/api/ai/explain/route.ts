import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface ExplainBody {
  company_id: number
  metric: string
  period: string
}

interface CompanyRow {
  name: string
  ticker: string
}

interface FinancialRow {
  fiscal_year: number
  revenue: number | null
  operating_margin: number | null
  net_income: number | null
  rd_expense: number | null
  gross_margin: number | null
  operating_income: number | null
  free_cash_flow: number | null
  [key: string]: string | number | null | undefined
}

interface VarianceRow {
  metric: string
  variance_pct: number
  variance_abs: number
  direction: string
  ai_explanation: string | null
  comparator_type: string | null
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  return `$${value.toLocaleString()}`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExplainBody
    const { company_id, metric, period } = body

    if (!company_id || !metric || !period) {
      return NextResponse.json(
        { error: 'company_id, metric, and period are required' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get company info
    const company = db.prepare(
      'SELECT name, ticker FROM companies WHERE id = ?'
    ).get(company_id) as CompanyRow | undefined

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Parse fiscal year from period (e.g., "FY2024", "2024", "Q3 2024")
    const yearMatch = period.match(/(\d{4})/)
    const fiscalYear = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear()

    // Fetch current and prior year financials
    const currentFinancials = db.prepare(`
      SELECT * FROM financials
      WHERE company_id = ? AND period_type = 'annual' AND fiscal_year = ?
    `).get(company_id, fiscalYear) as FinancialRow | undefined

    const priorFinancials = db.prepare(`
      SELECT * FROM financials
      WHERE company_id = ? AND period_type = 'annual' AND fiscal_year = ?
    `).get(company_id, fiscalYear - 1) as FinancialRow | undefined

    // Look for existing variance records
    const existingVariances = db.prepare(`
      SELECT * FROM variances
      WHERE company_id = ? AND metric LIKE ?
      ORDER BY ABS(variance_pct) DESC
    `).all(company_id, `%${metric.replace(/_/g, '%')}%`) as VarianceRow[]

    // Determine if the metric is a margin/percentage
    const isMarginMetric = ['operating_margin', 'gross_margin', 'net_margin', 'rd_intensity', 'roe'].includes(metric)

    // Compute the variance ourselves from financials
    const currentVal = currentFinancials?.[metric] as number | null
    const priorVal = priorFinancials?.[metric] as number | null

    let changePct: number | null = null
    let changeAbs: number | null = null
    let direction: string = 'flat'

    if (currentVal != null && priorVal != null) {
      changeAbs = currentVal - priorVal
      if (priorVal !== 0) {
        changePct = (changeAbs / Math.abs(priorVal)) * 100
      }
      if (changeAbs > 0) direction = 'increase'
      else if (changeAbs < 0) direction = 'decrease'
    }

    // Build explanation
    const fmtMetric = metric.replace(/_/g, ' ')

    let explanation: string
    if (existingVariances.length > 0 && existingVariances[0].ai_explanation) {
      explanation = existingVariances[0].ai_explanation
    } else if (currentVal != null && priorVal != null) {
      const fmtCurrent = isMarginMetric ? formatPercent(currentVal) : formatCurrency(currentVal)
      const fmtPrior = isMarginMetric ? formatPercent(priorVal) : formatCurrency(priorVal)
      explanation = `${company.name}'s ${fmtMetric} moved from ${fmtPrior} in FY${fiscalYear - 1} to ${fmtCurrent} in FY${fiscalYear}, representing a ${changePct !== null ? `${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%` : 'N/A'} change. `

      if (direction === 'increase') {
        explanation += 'This improvement may be attributed to favorable product mix, new launches, or market expansion.'
      } else if (direction === 'decrease') {
        explanation += 'This decline may reflect competitive pressures, patent expirations, pricing headwinds, or portfolio restructuring.'
      } else {
        explanation += 'The metric remained relatively stable year-over-year.'
      }
    } else {
      explanation = `Insufficient data to fully explain the change in ${fmtMetric} for ${company.name} in ${period}. The metric may not be available for the requested period.`
    }

    // Build root causes
    interface RootCause {
      cause: string
      label: 'FACT' | 'INTERPRETATION' | 'HYPOTHESIS'
      probability: number
    }

    const rootCauses: RootCause[] = []

    // Add fact-based root cause if we have the data
    if (currentVal != null && priorVal != null) {
      const fmtCurrent = isMarginMetric ? formatPercent(currentVal) : formatCurrency(currentVal)
      const fmtPrior = isMarginMetric ? formatPercent(priorVal) : formatCurrency(priorVal)
      rootCauses.push({
        cause: `${fmtMetric} changed from ${fmtPrior} to ${fmtCurrent} (${changePct !== null ? `${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%` : 'N/A'}).`,
        label: 'FACT',
        probability: 1.0,
      })
    }

    // Add variance-based causes
    for (const v of existingVariances.slice(0, 2)) {
      if (v.ai_explanation) {
        rootCauses.push({
          cause: v.ai_explanation,
          label: 'INTERPRETATION',
          probability: 0.75,
        })
      }
    }

    // Add contextual hypotheses based on the metric and direction
    if (metric === 'revenue') {
      if (direction === 'increase') {
        rootCauses.push({
          cause: 'Revenue growth could be driven by new product launches, geographic expansion, or favorable pricing.',
          label: 'HYPOTHESIS',
          probability: 0.6,
        })
        rootCauses.push({
          cause: 'Organic growth vs. acquisition-driven growth should be distinguished for a clearer picture.',
          label: 'HYPOTHESIS',
          probability: 0.5,
        })
      } else if (direction === 'decrease') {
        rootCauses.push({
          cause: 'Revenue decline may stem from loss of exclusivity on key products, generic competition, or unfavorable currency impact.',
          label: 'HYPOTHESIS',
          probability: 0.65,
        })
        rootCauses.push({
          cause: 'Potential portfolio rationalization or divestitures could explain part of the decline.',
          label: 'HYPOTHESIS',
          probability: 0.4,
        })
      }
    } else if (metric === 'operating_margin' || metric === 'gross_margin') {
      if (direction === 'increase') {
        rootCauses.push({
          cause: 'Margin expansion could reflect improved product mix, cost optimization programs, or operating leverage.',
          label: 'HYPOTHESIS',
          probability: 0.6,
        })
      } else if (direction === 'decrease') {
        rootCauses.push({
          cause: 'Margin compression may result from increased competition, higher input costs, or investment in new launches.',
          label: 'HYPOTHESIS',
          probability: 0.65,
        })
      }
    } else if (metric === 'rd_expense') {
      rootCauses.push({
        cause: 'Changes in R&D spending often reflect pipeline investment decisions, late-stage clinical trial costs, or strategic reprioritization.',
        label: 'HYPOTHESIS',
        probability: 0.7,
      })
    } else {
      rootCauses.push({
        cause: `Changes in ${fmtMetric} should be analyzed alongside other financial metrics and qualitative disclosures for full context.`,
        label: 'HYPOTHESIS',
        probability: 0.5,
      })
    }

    // Build recommended actions
    const recommendedActions: string[] = [
      `Review ${company.name}'s earnings call transcript for management commentary on ${fmtMetric}.`,
      `Compare ${fmtMetric} trends against peer group benchmarks.`,
      `Analyze quarterly breakdown to identify if the change is concentrated in specific periods.`,
    ]

    if (metric === 'revenue') {
      recommendedActions.push('Segment revenue by product/geography to isolate growth drivers.')
    } else if (metric.includes('margin')) {
      recommendedActions.push('Decompose margin drivers by analyzing cost components (COGS, SG&A, R&D).')
    } else if (metric === 'rd_expense') {
      recommendedActions.push('Map R&D spending to pipeline phases to assess investment efficiency.')
    }

    recommendedActions.push(`Monitor upcoming catalysts (pipeline readouts, regulatory decisions) that may impact future ${fmtMetric}.`)

    return NextResponse.json({
      explanation,
      root_causes: rootCauses,
      recommended_actions: recommendedActions,
    })
  } catch (error) {
    console.error('Error generating explanation:', error)
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}
