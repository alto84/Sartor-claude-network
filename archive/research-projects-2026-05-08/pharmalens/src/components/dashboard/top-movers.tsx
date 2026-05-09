'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface Mover {
  company_id: number
  company_name: string
  ticker: string
  current_value: number
  prior_value: number
  change_pct: number | null
  change_abs: number
  direction: string
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-6 bg-gray-200 rounded" />
          <div className="h-4 flex-1 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

interface TopMoversProps {
  fiscalYear?: number
}

export function TopMovers({ fiscalYear = 2024 }: TopMoversProps) {
  const [data, setData] = useState<Mover[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      metric: 'revenue',
      fiscal_year: String(fiscalYear),
      limit: '5',
    })

    fetch(`/api/financials/movers?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((resp: { data: Mover[] }) => {
        setData(resp.data || [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [fiscalYear])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top Movers (Revenue YoY)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="text-sm text-red-500 py-4 text-center">
            Failed to load: {error}
          </div>
        ) : data.length === 0 ? (
          <div className="text-sm text-gray-400 py-4 text-center">
            No data available
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-8">#</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">FY{fiscalYear} Rev</th>
                <th className="text-right py-2 pl-2 text-xs font-medium text-gray-500 uppercase tracking-wider">YoY</th>
              </tr>
            </thead>
            <tbody>
              {data.map((mover, i) => {
                const changePct = mover.change_pct ?? 0
                const isPositive = changePct >= 0
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-2 text-gray-400 font-medium">{i + 1}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-medium text-gray-900">{mover.company_name}</div>
                      <div className="text-xs text-gray-400">{mover.ticker}</div>
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-700 font-medium tabular-nums">
                      {formatCurrency(mover.current_value * 1e6, true)}
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <span className={`inline-flex items-center gap-1 font-medium tabular-nums ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {isPositive ? '+' : ''}{changePct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
