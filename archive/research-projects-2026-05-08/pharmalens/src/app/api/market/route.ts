import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)

    const therapeuticArea = searchParams.get('therapeutic_area')

    let query: string
    const params: string[] = []

    if (therapeuticArea) {
      query = 'SELECT * FROM market_data WHERE therapeutic_area = ? ORDER BY market_size_b DESC'
      params.push(therapeuticArea)
    } else {
      query = 'SELECT * FROM market_data ORDER BY market_size_b DESC'
    }

    const results = db.prepare(query).all(...params)
    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error fetching market data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    )
  }
}
