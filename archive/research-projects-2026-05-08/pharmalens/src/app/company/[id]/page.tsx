'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'
import type { Company, Financial, PipelineEntry, Variance } from '@/lib/types'
import { ArrowLeft, TrendingUp, TrendingDown, Sparkles, Loader2 } from 'lucide-react'

const PHASE_ORDER = ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Filed', 'Approved']
const PHASE_COLORS: Record<string, string> = {
  'Preclinical': '#94a3b8',
  'Phase I': '#3b82f6',
  'Phase II': '#8b5cf6',
  'Phase III': '#f59e0b',
  'Filed': '#f97316',
  'Approved': '#10b981',
}

const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸', 'US': '🇺🇸', 'USA': '🇺🇸',
  'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
  'Switzerland': '🇨🇭', 'France': '🇫🇷',
  'Germany': '🇩🇪', 'Japan': '🇯🇵',
  'Denmark': '🇩🇰', 'Ireland': '🇮🇪',
  'Belgium': '🇧🇪', 'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪', 'Israel': '🇮🇱',
  'India': '🇮🇳', 'China': '🇨🇳',
  'Australia': '🇦🇺', 'Canada': '🇨🇦',
  'South Korea': '🇰🇷', 'Spain': '🇪🇸',
  'Italy': '🇮🇹',
}

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🏳️'
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-gray-200 rounded w-1/2" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  )
}

function KPIBox({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </Card>
  )
}

export default function CompanyDetailPage() {
  const params = useParams()
  const companyId = params.id as string

  const [company, setCompany] = useState<Company | null>(null)
  const [financials, setFinancials] = useState<Financial[]>([])
  const [pipeline, setPipeline] = useState<PipelineEntry[]>([])
  const [variances, setVariances] = useState<Variance[]>([])
  const [loading, setLoading] = useState(true)
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (!companyId) return

    setLoading(true)
    Promise.all([
      fetch('/api/companies').then(r => r.json()),
      fetch(`/api/financials?company_id=${companyId}&period_type=annual`).then(r => r.json()),
      fetch(`/api/pipeline?company_id=${companyId}`).then(r => r.json()),
      fetch(`/api/variances?company_id=${companyId}`).then(r => r.json()),
    ])
      .then(([companiesData, financialsData, pipelineData, variancesData]) => {
        const allCompanies = Array.isArray(companiesData) ? companiesData : []
        const found = allCompanies.find((c: Company) => c.id === Number(companyId))
        setCompany(found || null)
        setFinancials(Array.isArray(financialsData) ? financialsData : [])
        setPipeline(Array.isArray(pipelineData) ? pipelineData : [])
        setVariances(Array.isArray(variancesData) ? variancesData : [])
      })
      .catch(() => {
        setCompany(null)
        setFinancials([])
        setPipeline([])
        setVariances([])
      })
      .finally(() => setLoading(false))
  }, [companyId])

  // Sort financials by year
  const sortedFinancials = useMemo(() => {
    return [...financials].sort((a, b) => a.fiscal_year - b.fiscal_year)
  }, [financials])

  // Latest year data for KPIs
  const latest = sortedFinancials.length > 0 ? sortedFinancials[sortedFinancials.length - 1] : null

  // Time series data
  const trendData = sortedFinancials.map(f => ({
    period: f.period_label || String(f.fiscal_year),
    revenue: f.revenue,
    operating_income: f.operating_income,
    net_income: f.net_income,
  }))

  const marginData = sortedFinancials.map(f => ({
    period: f.period_label || String(f.fiscal_year),
    gross_margin: f.gross_margin,
    operating_margin: f.operating_margin,
    net_margin: f.net_margin,
  }))

  const balanceData = sortedFinancials.map(f => ({
    period: f.period_label || String(f.fiscal_year),
    total_assets: f.total_assets,
    total_liabilities: f.total_liabilities,
    shareholders_equity: f.shareholders_equity,
  }))

  // Pipeline funnel
  const funnelData = useMemo(() => {
    const counts = new Map<string, number>()
    PHASE_ORDER.forEach(p => counts.set(p, 0))
    pipeline.forEach(p => {
      counts.set(p.phase, (counts.get(p.phase) || 0) + 1)
    })
    return PHASE_ORDER.map(phase => ({
      phase,
      count: counts.get(phase) || 0,
      fill: PHASE_COLORS[phase] || '#94a3b8',
    })).filter(d => d.count > 0)
  }, [pipeline])

  // AI query handler
  const handleAIQuery = async () => {
    if (!aiQuestion.trim() || !company) return
    setAiLoading(true)
    setAiResponse('')
    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: aiQuestion,
          context: {
            company_id: companyId,
            company_name: company.name,
            ticker: company.ticker,
            latest_financials: latest ? {
              revenue: latest.revenue,
              operating_margin: latest.operating_margin,
              net_margin: latest.net_margin,
              rd_intensity: latest.rd_intensity,
            } : null,
          },
        }),
      })
      const data = await res.json()
      setAiResponse(data.response || data.answer || 'No response received.')
    } catch {
      setAiResponse('Failed to get AI response. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <LoadingSkeleton />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p className="text-lg">Company not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Company Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getFlag(company.hq_country)}</span>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <span className="text-lg font-medium text-gray-500">{company.ticker}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">{company.hq_country}</span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-500">Filing: {company.filing_type}</span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-500">FY End: {company.fiscal_year_end}</span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      {latest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIBox
            title="Revenue"
            value={formatCurrency(latest.revenue, true)}
            subtitle={`FY${latest.fiscal_year}`}
          />
          <KPIBox
            title="Operating Margin"
            value={formatPercent(latest.operating_margin)}
            subtitle={`Op. Income: ${formatCurrency(latest.operating_income, true)}`}
          />
          <KPIBox
            title="Net Margin"
            value={formatPercent(latest.net_margin)}
            subtitle={`Net Income: ${formatCurrency(latest.net_income, true)}`}
          />
          <KPIBox
            title="R&D Intensity"
            value={formatPercent(latest.rd_intensity)}
            subtitle={`R&D: ${formatCurrency(latest.rd_expense, true)}`}
          />
        </div>
      )}

      {/* Financial Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v), true)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="operating_income" name="Operating Income" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="net_income" name="Net Income" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No financial trend data available.</div>
          )}
        </CardContent>
      </Card>

      {/* Margin Analysis + Balance Sheet Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Margin Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {marginData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={marginData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatPercent(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="gross_margin" name="Gross Margin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="operating_margin" name="Operating Margin" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="net_margin" name="Net Margin" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No margin data.</div>
            )}
          </CardContent>
        </Card>

        {/* Balance Sheet */}
        <Card>
          <CardHeader>
            <CardTitle>Balance Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={balanceData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v), true)} />
                  <Legend />
                  <Bar dataKey="total_assets" name="Total Assets" fill="#3b82f6" stackId="balance" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="total_liabilities" name="Total Liabilities" fill="#ef4444" stackId="debt" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="shareholders_equity" name="Equity" fill="#10b981" stackId="debt" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No balance sheet data.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview ({pipeline.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          {funnelData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="phase" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" name="Trials" radius={[0, 4, 4, 0]}>
                    {funnelData.map(entry => (
                      <Cell key={entry.phase} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="overflow-y-auto max-h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Drug</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Phase</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">TA</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipeline.slice(0, 20).map((entry, i) => (
                      <tr key={entry.id} className={cn("border-b", i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                        <td className="py-2 px-3 font-medium text-gray-900 truncate max-w-[150px]">{entry.drug_name}</td>
                        <td className="py-2 px-3">
                          <span
                            className="inline-block px-2 py-0.5 text-xs font-medium rounded-full text-white"
                            style={{ backgroundColor: PHASE_COLORS[entry.phase] || '#94a3b8' }}
                          >
                            {entry.phase}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-700 truncate max-w-[120px]">{entry.therapeutic_area}</td>
                        <td className="py-2 px-3 text-gray-700">{entry.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pipeline.length > 20 && (
                  <p className="text-xs text-gray-400 text-center py-2">Showing 20 of {pipeline.length} entries</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No pipeline data for this company.</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Variances */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Variances</CardTitle>
        </CardHeader>
        <CardContent>
          {variances.length > 0 ? (
            <div className="space-y-3">
              {variances.slice(0, 10).map(v => (
                <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {v.direction === 'favorable' ? (
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 capitalize">{v.metric.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-500">{v.period}</span>
                      <Badge variant={v.direction === 'favorable' ? 'fact' : 'hypothesis'}>
                        {v.direction === 'favorable' ? '+' : ''}{formatPercent(v.variance_pct / 100)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>Actual: {formatCurrency(v.actual, true)}</span>
                      <span>{v.comparator_type}: {formatCurrency(v.comparator, true)}</span>
                    </div>
                    {v.ai_explanation && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{v.ai_explanation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 text-gray-400 text-sm">No variances flagged for this company.</div>
          )}
        </CardContent>
      </Card>

      {/* Ask AI */}
      <Card>
        <CardHeader>
          <CardTitle>Ask about {company.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={aiQuestion}
              onChange={e => setAiQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAIQuery()}
              placeholder={`Ask a question about ${company.name}...`}
              className="flex-1 h-10 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAIQuery}
              disabled={aiLoading || !aiQuestion.trim()}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                aiLoading || !aiQuestion.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Ask
            </button>
          </div>
          {aiResponse && (
            <div className="p-4 rounded-lg bg-gray-50 border">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
