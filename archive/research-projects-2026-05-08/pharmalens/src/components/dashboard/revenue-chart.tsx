'use client'
import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ViewToggle } from '@/components/ui/view-toggle'
import { ViewMode, ChartDataPoint } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface RevenueChartProps {
  companyId?: string
  periodType: string
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#a855f7', '#f43f5e']

interface TrendRow {
  period: string
  company_name: string
  value: number
}

function formatBillions(value: number): string {
  // Values are stored in millions in the DB
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}B`
  return `$${value.toFixed(0)}M`
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-64 bg-gray-100 rounded" />
    </div>
  )
}

export function RevenueChart({ companyId, periodType }: RevenueChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('chart')
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      metric: 'revenue',
      period_type: periodType,
      group_by: 'company',
    })
    if (companyId && companyId !== 'all') {
      params.set('company_id', companyId)
    }

    fetch(`/api/financials/trends?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((resp: { data: TrendRow[] }) => {
        const rows = resp.data || []
        // Identify top 5 companies by total revenue
        const totals: Record<string, number> = {}
        for (const row of rows) {
          totals[row.company_name] = (totals[row.company_name] || 0) + row.value
        }
        const topCompanies = Object.entries(totals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name]) => name)

        setCompanies(topCompanies)

        // Pivot data: each period becomes a row with company columns
        const periodMap: Record<string, ChartDataPoint> = {}
        for (const row of rows) {
          if (!topCompanies.includes(row.company_name)) continue
          if (!periodMap[row.period]) {
            periodMap[row.period] = { period: row.period }
          }
          periodMap[row.period][row.company_name] = row.value
        }

        const chartData = Object.values(periodMap).sort((a, b) =>
          String(a.period).localeCompare(String(b.period))
        )
        setData(chartData)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [companyId, periodType])

  const renderChart = () => (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tickFormatter={(v: number) => formatBillions(v)}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          width={70}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value), true), '']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
        />
        {companies.map((company, i) => (
          <Area
            key={company}
            type="monotone"
            dataKey={company}
            stackId="1"
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )

  const renderTable = () => (
    <div className="overflow-x-auto max-h-80">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
            {companies.map(c => (
              <th key={c} className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 font-medium text-gray-900">{row.period}</td>
              {companies.map(c => (
                <td key={c} className="py-2 px-3 text-right text-gray-700">
                  {typeof row[c] === 'number' ? formatCurrency(row[c] as number, true) : '--'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Revenue Trends</CardTitle>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-sm text-red-500">
            Failed to load revenue data: {error}
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-gray-400">
            No revenue data available
          </div>
        ) : (
          <>
            {viewMode === 'chart' && renderChart()}
            {viewMode === 'table' && renderTable()}
            {viewMode === 'split' && (
              <div className="space-y-4">
                {renderChart()}
                {renderTable()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
