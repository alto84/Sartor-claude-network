import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)

    const companyId = searchParams.get('company_id')
    const periodType = searchParams.get('period_type')
    const fiscalYear = searchParams.get('fiscal_year')
    const metricParam = searchParams.get('metric')

    // Determine which columns to select
    const baseColumns = [
      'f.id',
      'f.company_id',
      'c.name AS company_name',
      'f.period_type',
      'f.period_label',
      'f.fiscal_year',
      'f.fiscal_quarter',
      'f.start_date',
      'f.end_date',
      'f.currency',
    ]

    const allMetricColumns = [
      'revenue', 'cogs', 'gross_profit', 'rd_expense', 'sga_expense',
      'operating_income', 'net_income', 'diluted_eps', 'total_assets',
      'total_liabilities', 'shareholders_equity', 'cash_and_equivalents',
      'operating_cash_flow', 'capex', 'free_cash_flow', 'gross_margin',
      'operating_margin', 'net_margin', 'rd_intensity', 'roe', 'debt_to_equity',
    ]

    let metricColumns: string[]
    if (metricParam) {
      const requested = metricParam.split(',').map(m => m.trim())
      metricColumns = requested.filter(m => allMetricColumns.includes(m))
      if (metricColumns.length === 0) {
        return NextResponse.json(
          { error: `Invalid metric(s). Valid metrics: ${allMetricColumns.join(', ')}` },
          { status: 400 }
        )
      }
    } else {
      metricColumns = allMetricColumns
    }

    const selectColumns = [
      ...baseColumns,
      ...metricColumns.map(m => `f.${m}`),
    ].join(', ')

    // Build WHERE clauses
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (companyId && companyId !== 'all') {
      conditions.push('f.company_id = ?')
      params.push(Number(companyId))
    }

    if (periodType) {
      conditions.push('f.period_type = ?')
      params.push(periodType)
    }

    if (fiscalYear) {
      conditions.push('f.fiscal_year = ?')
      params.push(Number(fiscalYear))
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    const query = `
      SELECT ${selectColumns}
      FROM financials f
      JOIN companies c ON f.company_id = c.id
      ${whereClause}
      ORDER BY f.fiscal_year DESC, f.fiscal_quarter DESC
    `

    const results = db.prepare(query).all(...params)
    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error fetching financials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    )
  }
}
