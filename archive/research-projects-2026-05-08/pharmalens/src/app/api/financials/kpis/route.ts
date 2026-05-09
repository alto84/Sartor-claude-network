import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface KpiRow {
  total_revenue: number | null
  avg_operating_margin: number | null
  total_rd_spend: number | null
}

interface CountRow {
  count: number
}

interface YearRow {
  max_year: number
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)

    let fiscalYear: number
    const yearParam = searchParams.get('fiscal_year')

    if (yearParam) {
      fiscalYear = Number(yearParam)
    } else {
      // Get the latest fiscal year
      const latestRow = db.prepare(
        "SELECT MAX(fiscal_year) AS max_year FROM financials WHERE period_type = 'annual'"
      ).get() as YearRow | undefined
      fiscalYear = latestRow?.max_year ?? new Date().getFullYear()
    }

    const priorYear = fiscalYear - 1

    // Current year KPIs
    const currentKpis = db.prepare(`
      SELECT
        SUM(revenue) AS total_revenue,
        AVG(operating_margin) AS avg_operating_margin,
        SUM(rd_expense) AS total_rd_spend
      FROM financials
      WHERE period_type = 'annual' AND fiscal_year = ?
    `).get(fiscalYear) as KpiRow | undefined

    // Prior year KPIs for YoY comparison
    const priorKpis = db.prepare(`
      SELECT
        SUM(revenue) AS total_revenue,
        AVG(operating_margin) AS avg_operating_margin,
        SUM(rd_expense) AS total_rd_spend
      FROM financials
      WHERE period_type = 'annual' AND fiscal_year = ?
    `).get(priorYear) as KpiRow | undefined

    // Phase III trial count from pipeline
    const phase3 = db.prepare(`
      SELECT COUNT(*) AS count FROM pipeline WHERE phase = 'Phase III'
    `).get() as CountRow | undefined

    const totalRevenue = currentKpis?.total_revenue ?? 0
    const priorRevenue = priorKpis?.total_revenue ?? 0
    const currentMargin = currentKpis?.avg_operating_margin ?? 0
    const priorMargin = priorKpis?.avg_operating_margin ?? 0

    const revenueYoyChange = priorRevenue !== 0
      ? ((totalRevenue - priorRevenue) / Math.abs(priorRevenue)) * 100
      : null

    const marginYoyChange = priorMargin !== null && currentMargin !== null
      ? currentMargin - priorMargin
      : null

    return NextResponse.json({
      data: {
        fiscal_year: fiscalYear,
        total_revenue: totalRevenue,
        avg_operating_margin: currentMargin,
        total_rd_spend: currentKpis?.total_rd_spend ?? 0,
        total_phase3_trials: phase3?.count ?? 0,
        revenue_yoy_change: revenueYoyChange !== null
          ? Math.round(revenueYoyChange * 100) / 100
          : null,
        margin_yoy_change: marginYoyChange !== null
          ? Math.round(marginYoyChange * 100) / 100
          : null,
      },
    })
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI data' },
      { status: 500 }
    )
  }
}
