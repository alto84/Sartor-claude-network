import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const VALID_METRICS = [
  'revenue', 'cogs', 'gross_profit', 'rd_expense', 'sga_expense',
  'operating_income', 'net_income', 'diluted_eps', 'total_assets',
  'total_liabilities', 'shareholders_equity', 'cash_and_equivalents',
  'operating_cash_flow', 'capex', 'free_cash_flow', 'gross_margin',
  'operating_margin', 'net_margin', 'rd_intensity', 'roe', 'debt_to_equity',
]

interface TrendRow {
  period: string
  company_name?: string
  value: number | null
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)

    const companyId = searchParams.get('company_id')
    const metric = searchParams.get('metric') || 'revenue'
    const periodType = searchParams.get('period_type') || 'annual'
    const groupBy = searchParams.get('group_by') || 'company'

    if (!VALID_METRICS.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric. Valid metrics: ${VALID_METRICS.join(', ')}` },
        { status: 400 }
      )
    }

    if (periodType !== 'annual' && periodType !== 'quarterly') {
      return NextResponse.json(
        { error: 'period_type must be "annual" or "quarterly"' },
        { status: 400 }
      )
    }

    const periodExpression = periodType === 'annual'
      ? 'f.fiscal_year'
      : "f.fiscal_year || '-Q' || f.fiscal_quarter"

    const conditions: string[] = ['f.period_type = ?']
    const params: (string | number)[] = [periodType]

    if (companyId) {
      conditions.push('f.company_id = ?')
      params.push(Number(companyId))
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    let query: string
    if (groupBy === 'total') {
      query = `
        SELECT
          ${periodExpression} AS period,
          SUM(f.${metric}) AS value
        FROM financials f
        ${whereClause}
        GROUP BY period
        ORDER BY f.fiscal_year ASC, f.fiscal_quarter ASC
      `
    } else {
      query = `
        SELECT
          ${periodExpression} AS period,
          c.name AS company_name,
          f.${metric} AS value
        FROM financials f
        JOIN companies c ON f.company_id = c.id
        ${whereClause}
        ORDER BY f.fiscal_year ASC, f.fiscal_quarter ASC, c.name
      `
    }

    const results = db.prepare(query).all(...params) as TrendRow[]
    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error fetching trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    )
  }
}
