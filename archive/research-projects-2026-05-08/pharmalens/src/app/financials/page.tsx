'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ZAxis, Label
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { ViewToggle } from '@/components/ui/view-toggle'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'
import type { Company, Financial, ViewMode } from '@/lib/types'

const INCOME_METRICS = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'cogs', label: 'COGS' },
  { key: 'gross_profit', label: 'Gross Profit' },
  { key: 'rd_expense', label: 'R&D' },
  { key: 'sga_expense', label: 'SG&A' },
  { key: 'operating_income', label: 'Operating Income' },
  { key: 'net_income', label: 'Net Income' },
] as const

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4',
  '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#0ea5e9', '#a855f7',
  '#22c55e', '#eab308', '#d946ef', '#0284c7', '#dc2626', '#059669'
]

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3" />
      <div className="h-64 bg-gray-200 rounded" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  )
}

export default function FinancialsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [periodType, setPeriodType] = useState<'annual' | 'quarterly'>('annual')
  const [financials, setFinancials] = useState<Financial[]>([])
  const [loading, setLoading] = useState(true)
  const [incomeView, setIncomeView] = useState<ViewMode>('chart')
  const [marginView, setMarginView] = useState<ViewMode>('chart')
  const [rdData, setRdData] = useState<Array<{
    ticker: string
    name: string
    rd_intensity: number
    revenue_growth: number
    rd_spend: number
  }>>([])

  // Fetch companies
  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then(data => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => setCompanies([]))
  }, [])

  // Fetch financials
  const fetchFinancials = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period_type: periodType })
      if (selectedCompany !== 'all') {
        params.set('company_id', selectedCompany)
      }
      const res = await fetch(`/api/financials?${params}`)
      const data = await res.json()
      setFinancials(Array.isArray(data) ? data : [])
    } catch {
      setFinancials([])
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, periodType])

  useEffect(() => {
    fetchFinancials()
  }, [fetchFinancials])

  // Build R&D scatter data from KPIs
  useEffect(() => {
    async function loadRD() {
      try {
        const res = await fetch('/api/financials/kpis?fiscal_year=2024')
        const data = await res.json()
        if (Array.isArray(data)) {
          setRdData(data.map((d: Record<string, unknown>) => ({
            ticker: (d.ticker as string) || '',
            name: (d.company_name as string) || '',
            rd_intensity: Number(d.rd_intensity) || 0,
            revenue_growth: Number(d.revenue_growth) || 0,
            rd_spend: Number(d.rd_expense) || 0,
          })))
        }
      } catch {
        setRdData([])
      }
    }
    loadRD()
  }, [])

  const companyOptions = companies.map(c => ({ value: String(c.id), label: `${c.ticker} - ${c.name}` }))

  // Group financials by period for time series
  const timeSeriesData = (() => {
    if (selectedCompany === 'all') return []
    const sorted = [...financials].sort((a, b) => {
      if (a.fiscal_year !== b.fiscal_year) return a.fiscal_year - b.fiscal_year
      return (a.fiscal_quarter || 0) - (b.fiscal_quarter || 0)
    })
    return sorted.map(f => ({
      period: f.period_label,
      revenue: f.revenue,
      cogs: f.cogs,
      gross_profit: f.gross_profit,
      rd_expense: f.rd_expense,
      sga_expense: f.sga_expense,
      operating_income: f.operating_income,
      net_income: f.net_income,
      gross_margin: f.gross_margin,
      operating_margin: f.operating_margin,
      net_margin: f.net_margin,
    }))
  })()

  // Group financials by company for comparison view
  const comparisonData = (() => {
    if (selectedCompany !== 'all') return []
    const latestByCompany = new Map<number, Financial>()
    financials.forEach(f => {
      const existing = latestByCompany.get(f.company_id)
      if (!existing || f.fiscal_year > existing.fiscal_year) {
        latestByCompany.set(f.company_id, f)
      }
    })
    return Array.from(latestByCompany.values()).sort((a, b) => b.revenue - a.revenue)
  })()

  if (loading && companies.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Income statement analysis and margin trends</p>
        </div>
        <div className="flex items-end gap-3 sm:ml-auto">
          <Select
            label="Company"
            value={selectedCompany}
            onChange={e => setSelectedCompany(e.target.value)}
            options={[{ value: 'all', label: 'All Companies' }, ...companyOptions]}
          />
          <Select
            label="Period"
            value={periodType}
            onChange={e => setPeriodType(e.target.value as 'annual' | 'quarterly')}
            options={[
              { value: 'annual', label: 'Annual' },
              { value: 'quarterly', label: 'Quarterly' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Income Statement Section */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Income Statement</CardTitle>
              <ViewToggle mode={incomeView} onChange={setIncomeView} />
            </CardHeader>
            <CardContent>
              {selectedCompany === 'all' ? (
                /* Comparison table - all companies */
                <div className={cn(
                  incomeView === 'chart' ? 'hidden' : '',
                  incomeView === 'split' ? 'lg:w-1/2 inline-block align-top' : ''
                )}>
                  {(incomeView === 'table' || incomeView === 'split') && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-3 font-medium text-gray-600">Company</th>
                            {INCOME_METRICS.map(m => (
                              <th key={m.key} className="text-right py-3 px-3 font-medium text-gray-600">{m.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.map((f, i) => (
                            <tr key={f.company_id} className={cn("border-b hover:bg-gray-50", i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                              <td className="py-2.5 px-3 font-medium text-gray-900">{f.company_name || `Company ${f.company_id}`}</td>
                              {INCOME_METRICS.map(m => (
                                <td key={m.key} className="text-right py-2.5 px-3 text-gray-700 tabular-nums">
                                  {formatCurrency(f[m.key as keyof Financial] as number, true)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* Single company time series */
                <>
                  {(incomeView === 'table' || incomeView === 'split') && (
                    <div className={cn("overflow-x-auto", incomeView === 'split' ? 'lg:w-1/2 inline-block align-top' : '')}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-3 font-medium text-gray-600">Period</th>
                            {INCOME_METRICS.map(m => (
                              <th key={m.key} className="text-right py-3 px-3 font-medium text-gray-600">{m.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {timeSeriesData.map((row, i) => (
                            <tr key={row.period} className={cn("border-b hover:bg-gray-50", i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                              <td className="py-2.5 px-3 font-medium text-gray-900">{row.period}</td>
                              {INCOME_METRICS.map(m => (
                                <td key={m.key} className="text-right py-2.5 px-3 text-gray-700 tabular-nums">
                                  {formatCurrency(row[m.key as keyof typeof row] as number, true)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {(incomeView === 'chart' || incomeView === 'split') && (
                <div className={cn(incomeView === 'split' ? 'lg:w-1/2 inline-block align-top pl-4' : '')}>
                  {selectedCompany === 'all' ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={comparisonData.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="company_name" tick={{ fontSize: 11 }} width={75} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v), true)} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[0, 2, 2, 0]} />
                        <Bar dataKey="operating_income" name="Operating Income" fill="#10b981" radius={[0, 2, 2, 0]} />
                        <Bar dataKey="net_income" name="Net Income" fill="#8b5cf6" radius={[0, 2, 2, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v), true)} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="gross_profit" name="Gross Profit" fill="#10b981" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="operating_income" name="Operating Income" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="net_income" name="Net Income" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {financials.length === 0 && (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  No financial data available for the selected filters.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Margin Trends Section */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Margin Trends</CardTitle>
              <ViewToggle mode={marginView} onChange={setMarginView} />
            </CardHeader>
            <CardContent>
              {selectedCompany !== 'all' && timeSeriesData.length > 0 ? (
                <>
                  {(marginView === 'table' || marginView === 'split') && (
                    <div className={cn("overflow-x-auto", marginView === 'split' ? 'lg:w-1/2 inline-block align-top' : '')}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-3 font-medium text-gray-600">Period</th>
                            <th className="text-right py-3 px-3 font-medium text-gray-600">Gross Margin</th>
                            <th className="text-right py-3 px-3 font-medium text-gray-600">Operating Margin</th>
                            <th className="text-right py-3 px-3 font-medium text-gray-600">Net Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeSeriesData.map((row, i) => (
                            <tr key={row.period} className={cn("border-b hover:bg-gray-50", i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                              <td className="py-2.5 px-3 font-medium text-gray-900">{row.period}</td>
                              <td className="text-right py-2.5 px-3 tabular-nums">{formatPercent(row.gross_margin)}</td>
                              <td className="text-right py-2.5 px-3 tabular-nums">{formatPercent(row.operating_margin)}</td>
                              <td className="text-right py-2.5 px-3 tabular-nums">{formatPercent(row.net_margin)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {(marginView === 'chart' || marginView === 'split') && (
                    <div className={cn(marginView === 'split' ? 'lg:w-1/2 inline-block align-top pl-4' : '')}>
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v) => formatPercent(Number(v))} />
                          <Legend />
                          <Line type="monotone" dataKey="gross_margin" name="Gross Margin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="operating_margin" name="Operating Margin" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="net_margin" name="Net Margin" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : selectedCompany === 'all' ? (
                /* Show top companies by margin */
                <div>
                  <p className="text-sm text-gray-500 mb-4">Top companies by operating margin (latest year)</p>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={comparisonData.slice(0, 15).sort((a, b) => b.operating_margin - a.operating_margin)}
                      layout="vertical"
                      margin={{ left: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="company_name" tick={{ fontSize: 11 }} width={75} />
                      <Tooltip formatter={(v) => formatPercent(Number(v))} />
                      <Legend />
                      <Bar dataKey="gross_margin" name="Gross Margin" fill="#3b82f6" radius={[0, 2, 2, 0]} />
                      <Bar dataKey="operating_margin" name="Operating Margin" fill="#10b981" radius={[0, 2, 2, 0]} />
                      <Bar dataKey="net_margin" name="Net Margin" fill="#8b5cf6" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  No margin data available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* R&D Analysis Section */}
          <Card>
            <CardHeader>
              <CardTitle>R&D Analysis</CardTitle>
              <p className="text-sm text-gray-500">R&D Intensity vs Revenue Growth (bubble size = total R&D spend)</p>
            </CardHeader>
            <CardContent>
              {rdData.length > 0 ? (
                <ResponsiveContainer width="100%" height={450}>
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      dataKey="rd_intensity"
                      name="R&D Intensity"
                      tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                      tick={{ fontSize: 12 }}
                    >
                      <Label value="R&D Intensity" offset={-10} position="insideBottom" style={{ fontSize: 12, fill: '#6b7280' }} />
                    </XAxis>
                    <YAxis
                      type="number"
                      dataKey="revenue_growth"
                      name="Revenue Growth"
                      tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                      tick={{ fontSize: 12 }}
                    >
                      <Label value="Revenue Growth" angle={-90} position="insideLeft" style={{ fontSize: 12, fill: '#6b7280', textAnchor: 'middle' }} />
                    </YAxis>
                    <ZAxis type="number" dataKey="rd_spend" range={[60, 600]} name="R&D Spend" />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload || payload.length === 0) return null
                        const d = payload[0]?.payload as typeof rdData[0]
                        if (!d) return null
                        return (
                          <div className="bg-white shadow-lg border rounded-lg p-3 text-sm">
                            <p className="font-semibold text-gray-900">{d.ticker}</p>
                            <p className="text-gray-600">{d.name}</p>
                            <p className="mt-1">R&D Intensity: {formatPercent(d.rd_intensity)}</p>
                            <p>Revenue Growth: {formatPercent(d.revenue_growth)}</p>
                            <p>R&D Spend: {formatCurrency(d.rd_spend, true)}</p>
                          </div>
                        )
                      }}
                    />
                    <Scatter data={rdData} fill="#3b82f6">
                      {rdData.map((entry, i) => (
                        <Cell key={entry.ticker} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.7} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  Loading R&D analysis data...
                </div>
              )}
              {/* Legend labels */}
              {rdData.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 px-2">
                  {rdData.map((d, i) => (
                    <span key={d.ticker} className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {d.ticker}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
