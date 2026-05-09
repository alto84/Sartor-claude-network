import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)

    const companyId = searchParams.get('company_id')
    const metric = searchParams.get('metric')
    const direction = searchParams.get('direction')
    const minVariancePct = searchParams.get('min_variance_pct')

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (companyId) {
      conditions.push('v.company_id = ?')
      params.push(Number(companyId))
    }

    if (metric) {
      conditions.push('v.metric = ?')
      params.push(metric)
    }

    if (direction) {
      conditions.push('v.direction = ?')
      params.push(direction)
    }

    if (minVariancePct) {
      conditions.push('ABS(v.variance_pct) >= ?')
      params.push(Number(minVariancePct))
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    const query = `
      SELECT
        v.*,
        c.name AS company_name
      FROM variances v
      JOIN companies c ON v.company_id = c.id
      ${whereClause}
      ORDER BY ABS(v.variance_pct) DESC
    `

    const results = db.prepare(query).all(...params)
    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error fetching variances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variance data' },
      { status: 500 }
    )
  }
}
