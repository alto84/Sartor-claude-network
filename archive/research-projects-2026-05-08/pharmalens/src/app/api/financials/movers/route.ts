import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const VALID_METRICS = [
  'revenue', 'cogs', 'gross_profit', 'rd_expense', 'sga_expense',
  'operating_income', 'net_income', 'diluted_eps', 'total_assets',
  'total_liabilities', 'shareholders_equity', 'cash_and_equivalents',
  'operating_cash_flow', 'capex', 'free_cash_flow', 'gross_margin',
  'operating_margin', 'net_margin', 'rd_intensity', 'roe', 'debt_to_equity',
]

interface MoverRow {
  company_id: number
  company_name: string
  ticker: string
  current_value: number | null
  prior_value: number | null
}

interface YearRow {
  max_year: number
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)

    const metric = searchParams.get('metric') || 'revenue'
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number(limitParam) : 5

    if (!VALID_METRICS.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric. Valid metrics: ${VALID_METRICS.join(', ')}` },
        { status: 400 }
      )
    }

    let fiscalYear: number
    const yearParam = searchParams.get('fiscal_year')

    if (yearParam) {
      fiscalYear = Number(yearParam)
    } else {
      const latestRow = db.prepare(
        "SELECT MAX(fiscal_year) AS max_year FROM financials WHERE period_type = 'annual'"
      ).get() as YearRow | undefined
      fiscalYear = latestRow?.max_year ?? new Date().getFullYear()
    }

    const priorYear = fiscalYear - 1

    const query = `
      SELECT
        curr.company_id,
        c.name AS company_name,
        c.ticker,
        curr.${metric} AS current_value,
        prev.${metric} AS prior_value
      FROM financials curr
      JOIN companies c ON curr.company_id = c.id
      LEFT JOIN financials prev
        ON curr.company_id = prev.company_id
        AND prev.period_type = 'annual'
        AND prev.fiscal_year = ?
      WHERE curr.period_type = 'annual'
        AND curr.fiscal_year = ?
        AND curr.${metric} IS NOT NULL
        AND prev.${metric} IS NOT NULL
        AND prev.${metric} != 0
      ORDER BY ABS((curr.${metric} - prev.${metric}) / ABS(prev.${metric})) DESC
      LIMIT ?
    `

    const results = db.prepare(query).all(priorYear, fiscalYear, limit) as MoverRow[]

    const movers = results.map(row => {
      const currentValue = row.current_value ?? 0
      const priorValue = row.prior_value ?? 0
      const changeAbs = currentValue - priorValue
      const changePct = priorValue !== 0
        ? (changeAbs / Math.abs(priorValue)) * 100
        : null

      return {
        company_id: row.company_id,
        company_name: row.company_name,
        ticker: row.ticker,
        current_value: currentValue,
        prior_value: priorValue,
        change_pct: changePct !== null ? Math.round(changePct * 100) / 100 : null,
        change_abs: Math.round(changeAbs * 100) / 100,
        direction: changeAbs >= 0 ? 'up' : 'down',
      }
    })

    return NextResponse.json({ data: movers, fiscal_year: fiscalYear })
  } catch (error) {
    console.error('Error fetching movers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top movers' },
      { status: 500 }
    )
  }
}
