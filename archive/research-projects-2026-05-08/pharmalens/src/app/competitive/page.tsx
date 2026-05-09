'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ZAxis, Label
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { InsightBadge } from '@/components/ui/badge'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'
import type { Company, Financial, MarketData, InsightLabel } from '@/lib/types'
import { Sparkles, Loader2 } from 'lucide-react'

const RANKING_METRICS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'operating_margin', label: 'Operating Margin' },
  { value: 'net_margin', label: 'Net Margin' },
  { value: 'rd_intensity', label: 'R&D Intensity' },
  { value: 'roe', label: 'Return on Equity' },
]

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#0ea5e9', '#a855f7', '#22c55e',
  '#eab308', '#d946ef', '#0284c7', '#dc2626', '#059669',
]

const BUBBLE_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3" />
      <div className="h-96 bg-gray-200 rounded" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  )
}

interface AISegment {
  text: string
  label?: InsightLabel
}

function parseAIResponse(text: string): AISegment[] {
  const segments: AISegment[] = []
  const regex = /\[(FACT|INTERPRETATION|HYPOTHESIS)\]([\s\S]*?)(?=\[(?:FACT|INTERPRETATION|HYPOTHESIS)\]|$)/g
  let match
  let lastIndex = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index).trim() })
    }
    segments.push({
      text: match[2].trim(),
      label: match[1] as InsightLabel,
    })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex).trim() })
  }

  if (segments.length === 0) {
    segments.push({ text })
  }

  return segments.filter(s => s.text.length > 0)
}

export default function CompetitivePage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [financials, setFinancials] = useState<Financial[]>([])
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [rankingMetric, setRankingMetric] = useState('revenue')
  const [selectedPeers, setSelectedPeers] = useState<string[]>([])
  const [peerTrendMetric, setPeerTrendMetric] = useState('revenue')
  const [peerTrends, setPeerTrends] = useState<Record<string, Financial[]>>({})

  // AI analysis
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/companies').then(r => r.json()),
      fetch('/api/financials?period_type=annual').then(r => r.json()),
      fetch('/api/market').then(r => r.json()),
    ])
      .then(([companiesData, financialsData, marketDataResult]) => {
        setCompanies(Array.isArray(companiesData) ? companiesData : [])
        setFinancials(Array.isArray(financialsData) ? financialsData : [])
        setMarketData(Array.isArray(marketDataResult) ? marketDataResult : [])
      })
      .catch(() => {
        setCompanies([])
        setFinancials([])
        setMarketData([])
      })
      .finally(() => setLoading(false))
  }, [])

  // Get latest financial per company for rankings
  const latestFinancials = useMemo(() => {
    const latestByCompany = new Map<number, Financial>()
    financials.forEach(f => {
      const existing = latestByCompany.get(f.company_id)
      if (!existing || f.fiscal_year > existing.fiscal_year) {
        latestByCompany.set(f.company_id, f)
      }
    })
    return Array.from(latestByCompany.values())
  }, [financials])

  // Ranking data
  const rankingData = useMemo(() => {
    const isPercentMetric = ['operating_margin', 'net_margin', 'rd_intensity', 'roe'].includes(rankingMetric)
    return latestFinancials
      .map(f => ({
        company: f.company_name || `Company ${f.company_id}`,
        company_id: f.company_id,
        value: f[rankingMetric as keyof Financial] as number,
        isPercent: isPercentMetric,
      }))
      .sort((a, b) => b.value - a.value)
  }, [latestFinancials, rankingMetric])

  // Peer comparison data
  const togglePeer = (companyId: string) => {
    setSelectedPeers(prev => {
      if (prev.includes(companyId)) return prev.filter(p => p !== companyId)
      if (prev.length >= 5) return prev
      return [...prev, companyId]
    })
  }

  // Fetch peer trend data
  useEffect(() => {
    if (selectedPeers.length === 0) {
      setPeerTrends({})
      return
    }
    const fetchAll = async () => {
      const results: Record<string, Financial[]> = {}
      await Promise.all(
        selectedPeers.map(async companyId => {
          try {
            const res = await fetch(`/api/financials?company_id=${companyId}&period_type=annual`)
            const data = await res.json()
            results[companyId] = Array.isArray(data) ? data : []
          } catch {
            results[companyId] = []
          }
        })
      )
      setPeerTrends(results)
    }
    fetchAll()
  }, [selectedPeers])

  // Build peer trend chart data
  const peerTrendData = useMemo(() => {
    if (selectedPeers.length === 0) return []
    const allYears = new Set<number>()
    Object.values(peerTrends).forEach(fins => {
      fins.forEach(f => allYears.add(f.fiscal_year))
    })
    const years = Array.from(allYears).sort()
    return years.map(year => {
      const point: Record<string, string | number> = { period: String(year) }
      selectedPeers.forEach(cid => {
        const fins = peerTrends[cid] || []
        const f = fins.find(fin => fin.fiscal_year === year)
        const company = companies.find(c => c.id === Number(cid))
        const name = company?.ticker || `Co ${cid}`
        if (f) {
          point[name] = f[peerTrendMetric as keyof Financial] as number
        }
      })
      return point
    })
  }, [peerTrends, selectedPeers, peerTrendMetric, companies])

  // Peer comparison table
  const peerComparisonTable = useMemo(() => {
    return selectedPeers.map(cid => {
      const company = companies.find(c => c.id === Number(cid))
      const latest = latestFinancials.find(f => f.company_id === Number(cid))
      return {
        id: cid,
        name: company?.name || `Company ${cid}`,
        ticker: company?.ticker || '',
        revenue: latest?.revenue || 0,
        gross_margin: latest?.gross_margin || 0,
        operating_margin: latest?.operating_margin || 0,
        net_margin: latest?.net_margin || 0,
        rd_intensity: latest?.rd_intensity || 0,
        roe: latest?.roe || 0,
      }
    })
  }, [selectedPeers, companies, latestFinancials])

  // Market landscape bubble data
  const bubbleData = useMemo(() => {
    return marketData.map((m, i) => ({
      name: m.therapeutic_area,
      market_size: m.market_size_b,
      growth_rate: m.growth_rate,
      trials: 20 + Math.floor(Math.random() * 80), // Placeholder - real data would come from pipeline count
      fill: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
    }))
  }, [marketData])

  // AI analysis handler
  const handleAIAnalysis = async () => {
    setAiLoading(true)
    setAiResponse('')
    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Compare the top 5 companies by operating efficiency. Analyze their operating margins, R&D intensity, and SG&A ratios. Tag each statement as [FACT], [INTERPRETATION], or [HYPOTHESIS].',
          context: {
            companies: latestFinancials.slice(0, 5).map(f => ({
              name: f.company_name,
              revenue: f.revenue,
              operating_margin: f.operating_margin,
              rd_intensity: f.rd_intensity,
              net_margin: f.net_margin,
            })),
          },
        }),
      })
      const data = await res.json()
      setAiResponse(data.response || data.answer || 'No response received.')
    } catch {
      setAiResponse('Failed to get AI analysis. Please try again.')
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Competitive Landscape</h1>
        <p className="text-sm text-gray-500 mt-1">Rankings, peer comparisons, and market landscape analysis</p>
      </div>

      {/* Company Rankings */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Company Rankings</CardTitle>
          <Select
            value={rankingMetric}
            onChange={e => setRankingMetric(e.target.value)}
            options={RANKING_METRICS}
          />
        </CardHeader>
        <CardContent>
          {rankingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(400, rankingData.length * 28)}>
              <BarChart data={rankingData} layout="vertical" margin={{ left: 100, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tickFormatter={v => rankingData[0]?.isPercent ? `${(v * 100).toFixed(0)}%` : formatCurrency(v, true)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis type="category" dataKey="company" tick={{ fontSize: 11 }} width={95} />
                <Tooltip
                  formatter={(v) => rankingData[0]?.isPercent ? formatPercent(Number(v)) : formatCurrency(Number(v), true)}
                />
                <Bar dataKey="value" name={RANKING_METRICS.find(m => m.value === rankingMetric)?.label || rankingMetric} radius={[0, 4, 4, 0]}>
                  {rankingData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data available.</div>
          )}
        </CardContent>
      </Card>

      {/* Peer Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Peer Comparison</CardTitle>
          <p className="text-sm text-gray-500">Select 2-5 companies to compare (click to toggle)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company selector chips */}
          <div className="flex flex-wrap gap-2">
            {companies.map(c => {
              const isSelected = selectedPeers.includes(String(c.id))
              return (
                <button
                  key={c.id}
                  onClick={() => togglePeer(String(c.id))}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  )}
                >
                  {c.ticker}
                </button>
              )
            })}
          </div>

          {selectedPeers.length >= 2 && (
            <>
              {/* Trend metric selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Trend metric:</span>
                <Select
                  value={peerTrendMetric}
                  onChange={e => setPeerTrendMetric(e.target.value)}
                  options={RANKING_METRICS}
                />
              </div>

              {/* Multi-series line chart */}
              {peerTrendData.length > 0 && (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={peerTrendData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={v => {
                        const isPercent = ['operating_margin', 'net_margin', 'rd_intensity', 'roe'].includes(peerTrendMetric)
                        return isPercent ? `${(v * 100).toFixed(0)}%` : formatCurrency(v, true)
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(v) => {
                        const val = Number(v)
                        const isPercent = ['operating_margin', 'net_margin', 'rd_intensity', 'roe'].includes(peerTrendMetric)
                        return isPercent ? formatPercent(val) : formatCurrency(val, true)
                      }}
                    />
                    <Legend />
                    {selectedPeers.map((cid, i) => {
                      const company = companies.find(c => c.id === Number(cid))
                      const name = company?.ticker || `Co ${cid}`
                      return (
                        <Line
                          key={cid}
                          type="monotone"
                          dataKey={name}
                          stroke={CHART_COLORS[i % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* Side-by-side comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-3 font-medium text-gray-600">Metric</th>
                      {peerComparisonTable.map(p => (
                        <th key={p.id} className="text-right py-3 px-3 font-medium text-gray-600">{p.ticker || p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'revenue', label: 'Revenue', format: (v: number) => formatCurrency(v, true) },
                      { key: 'gross_margin', label: 'Gross Margin', format: formatPercent },
                      { key: 'operating_margin', label: 'Operating Margin', format: formatPercent },
                      { key: 'net_margin', label: 'Net Margin', format: formatPercent },
                      { key: 'rd_intensity', label: 'R&D Intensity', format: formatPercent },
                      { key: 'roe', label: 'ROE', format: formatPercent },
                    ].map((metric, i) => (
                      <tr key={metric.key} className={cn("border-b", i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                        <td className="py-2.5 px-3 font-medium text-gray-900">{metric.label}</td>
                        {peerComparisonTable.map(p => (
                          <td key={p.id} className="text-right py-2.5 px-3 text-gray-700 tabular-nums">
                            {metric.format(p[metric.key as keyof typeof p] as number)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedPeers.length < 2 && selectedPeers.length > 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Select at least 2 companies to see comparison.
            </div>
          )}
          {selectedPeers.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Click company tickers above to start comparing.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Landscape */}
      <Card>
        <CardHeader>
          <CardTitle>Market Landscape</CardTitle>
          <p className="text-sm text-gray-500">Therapeutic areas by market size and growth rate</p>
        </CardHeader>
        <CardContent>
          {bubbleData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={450}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    dataKey="market_size"
                    name="Market Size ($B)"
                    tick={{ fontSize: 12 }}
                  >
                    <Label value="Market Size ($B)" offset={-10} position="insideBottom" style={{ fontSize: 12, fill: '#6b7280' }} />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="growth_rate"
                    name="Growth Rate"
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 12 }}
                  >
                    <Label value="Growth Rate" angle={-90} position="insideLeft" style={{ fontSize: 12, fill: '#6b7280', textAnchor: 'middle' }} />
                  </YAxis>
                  <ZAxis type="number" dataKey="trials" range={[80, 500]} name="Active Trials" />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload || payload.length === 0) return null
                      const d = payload[0]?.payload as typeof bubbleData[0]
                      if (!d) return null
                      return (
                        <div className="bg-white shadow-lg border rounded-lg p-3 text-sm">
                          <p className="font-semibold text-gray-900">{d.name}</p>
                          <p className="mt-1">Market Size: ${d.market_size.toFixed(1)}B</p>
                          <p>Growth Rate: {formatPercent(d.growth_rate)}</p>
                          <p>Active Trials: {d.trials}</p>
                        </div>
                      )
                    }}
                  />
                  <Scatter data={bubbleData} fill="#3b82f6">
                    {bubbleData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} fillOpacity={0.7} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 px-2">
                {bubbleData.map(d => (
                  <span key={d.name} className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No market data available.</div>
          )}
        </CardContent>
      </Card>

      {/* AI Competitive Analysis */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>AI Competitive Analysis</CardTitle>
          <button
            onClick={handleAIAnalysis}
            disabled={aiLoading}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              aiLoading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {aiLoading ? 'Analyzing...' : 'Ask AI'}
          </button>
        </CardHeader>
        <CardContent>
          {aiResponse ? (
            <div className="space-y-3">
              {parseAIResponse(aiResponse).map((segment, i) => (
                <div key={i} className="flex gap-2">
                  {segment.label && (
                    <div className="flex-shrink-0 pt-0.5">
                      <InsightBadge label={segment.label} />
                    </div>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed">{segment.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Sparkles className="h-8 w-8 mb-3" />
              <p className="text-sm">Click &quot;Ask AI&quot; to generate a competitive analysis comparing the top 5 companies by operating efficiency.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
