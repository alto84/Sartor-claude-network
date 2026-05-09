import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)

    const companyId = searchParams.get('company_id')
    const phase = searchParams.get('phase')
    const therapeuticArea = searchParams.get('therapeutic_area')
    const status = searchParams.get('status')

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (companyId) {
      conditions.push('p.company_id = ?')
      params.push(Number(companyId))
    }

    if (phase) {
      conditions.push('p.phase = ?')
      params.push(phase)
    }

    if (therapeuticArea) {
      conditions.push('p.therapeutic_area = ?')
      params.push(therapeuticArea)
    }

    if (status) {
      conditions.push('p.status = ?')
      params.push(status)
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    const query = `
      SELECT
        p.*,
        c.name AS company_name
      FROM pipeline p
      JOIN companies c ON p.company_id = c.id
      ${whereClause}
      ORDER BY
        CASE p.phase
          WHEN 'Phase I' THEN 1
          WHEN 'Phase I/II' THEN 2
          WHEN 'Phase II' THEN 3
          WHEN 'Phase II/III' THEN 4
          WHEN 'Phase III' THEN 5
          WHEN 'Filed' THEN 6
          WHEN 'Approved' THEN 7
          ELSE 8
        END,
        c.name
    `

    const results = db.prepare(query).all(...params)
    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error fetching pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline data' },
      { status: 500 }
    )
  }
}
