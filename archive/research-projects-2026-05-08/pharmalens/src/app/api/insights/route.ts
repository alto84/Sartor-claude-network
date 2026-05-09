import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)

    const companyId = searchParams.get('company_id')
    const label = searchParams.get('label')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number(limitParam) : 10

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (companyId) {
      conditions.push('i.company_id = ?')
      params.push(Number(companyId))
    }

    if (label) {
      conditions.push('i.label = ?')
      params.push(label)
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    const query = `
      SELECT
        i.*,
        c.name AS company_name
      FROM insights i
      JOIN companies c ON i.company_id = c.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ?
    `

    params.push(limit)
    const results = db.prepare(query).all(...params)
    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}
