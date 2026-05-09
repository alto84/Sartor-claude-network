import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface PhaseRow {
  phase: string
  count: number
}

interface TaRow {
  therapeutic_area: string
  count: number
}

interface TotalRow {
  total: number
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)

    const companyId = searchParams.get('company_id')

    const condition = companyId ? 'WHERE company_id = ?' : ''
    const params: number[] = companyId ? [Number(companyId)] : []

    // Count by phase
    const byPhase = db.prepare(`
      SELECT phase, COUNT(*) AS count
      FROM pipeline
      ${condition}
      GROUP BY phase
      ORDER BY
        CASE phase
          WHEN 'Phase I' THEN 1
          WHEN 'Phase I/II' THEN 2
          WHEN 'Phase II' THEN 3
          WHEN 'Phase II/III' THEN 4
          WHEN 'Phase III' THEN 5
          WHEN 'Filed' THEN 6
          WHEN 'Approved' THEN 7
          ELSE 8
        END
    `).all(...params) as PhaseRow[]

    // Count by therapeutic area
    const byTa = db.prepare(`
      SELECT therapeutic_area, COUNT(*) AS count
      FROM pipeline
      ${condition}
      GROUP BY therapeutic_area
      ORDER BY count DESC
    `).all(...params) as TaRow[]

    // Total count
    const totalRow = db.prepare(`
      SELECT COUNT(*) AS total
      FROM pipeline
      ${condition}
    `).get(...params) as TotalRow | undefined

    return NextResponse.json({
      data: {
        by_phase: byPhase,
        by_ta: byTa,
        total: totalRow?.total ?? 0,
      },
    })
  } catch (error) {
    console.error('Error fetching pipeline summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline summary' },
      { status: 500 }
    )
  }
}
