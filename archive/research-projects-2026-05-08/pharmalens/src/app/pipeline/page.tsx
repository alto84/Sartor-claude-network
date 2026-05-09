'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Company, PipelineEntry } from '@/lib/types'
import { ChevronUp, ChevronDown } from 'lucide-react'

const PHASE_ORDER = ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Filed', 'Approved']
const PHASE_COLORS: Record<string, string> = {
  'Preclinical': '#94a3b8',
  'Phase I': '#3b82f6',
  'Phase II': '#8b5cf6',
  'Phase III': '#f59e0b',
  'Filed': '#f97316',
  'Approved': '#10b981',
}
const PIE_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#0ea5e9', '#a855f7', '#22c55e',
]

type SortKey = 'drug_name' | 'company_name' | 'phase' | 'therapeutic_area' | 'indication' | 'status' | 'enrollment' | 'expected_completion'
type SortDir = 'asc' | 'desc'

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
      <div className="h-96 bg-gray-200 rounded" />
    </div>
  )
}

export default function PipelinePage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [pipeline, setPipeline] = useState<PipelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [selectedPhase, setSelectedPhase] = useState('all')
  const [selectedTA, setSelectedTA] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('drug_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then(data => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => setCompanies([]))
  }, [])

  const fetchPipeline = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCompany !== 'all') params.set('company_id', selectedCompany)
      if (selectedPhase !== 'all') params.set('phase', selectedPhase)
      if (selectedTA !== 'all') params.set('therapeutic_area', selectedTA)
      const res = await fetch(`/api/pipeline?${params}`)
      const data = await res.json()
      setPipeline(Array.isArray(data) ? data : [])
    } catch {
      setPipeline([])
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, selectedPhase, selectedTA])

  useEffect(() => {
    fetchPipeline()
  }, [fetchPipeline])

  // Extract unique therapeutic areas
  const therapeuticAreas = useMemo(() => {
    const tas = new Set(pipeline.map(p => p.therapeutic_area))
    return Array.from(tas).sort()
  }, [pipeline])

  // Funnel data
  const funnelData = useMemo(() => {
    const counts = new Map<string, number>()
    PHASE_ORDER.forEach(p => counts.set(p, 0))
    pipeline.forEach(p => {
      const current = counts.get(p.phase) || 0
      counts.set(p.phase, current + 1)
    })
    return PHASE_ORDER.map(phase => ({
      phase,
      count: counts.get(phase) || 0,
      fill: PHASE_COLORS[phase] || '#94a3b8',
    }))
  }, [pipeline])

  // TA distribution for pie
  const taDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    pipeline.forEach(p => {
      counts.set(p.therapeutic_area, (counts.get(p.therapeutic_area) || 0) + 1)
    })
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [pipeline])

  // Heatmap data: companies x phases
  const heatmapData = useMemo(() => {
    const companyPhaseMap = new Map<string, Map<string, number>>()
    pipeline.forEach(p => {
      const companyName = p.company_name || `Company ${p.company_id}`
      if (!companyPhaseMap.has(companyName)) {
        companyPhaseMap.set(companyName, new Map())
      }
      const phases = companyPhaseMap.get(companyName)!
      phases.set(p.phase, (phases.get(p.phase) || 0) + 1)
    })
    return Array.from(companyPhaseMap.entries())
      .map(([company, phases]) => {
        const row: Record<string, string | number> = { company }
        let total = 0
        PHASE_ORDER.forEach(phase => {
          const count = phases.get(phase) || 0
          row[phase] = count
          total += count
        })
        row.total = total
        return row
      })
      .sort((a, b) => (b.total as number) - (a.total as number))
  }, [pipeline])

  const maxHeatVal = useMemo(() => {
    let max = 0
    heatmapData.forEach(row => {
      PHASE_ORDER.forEach(phase => {
        const v = row[phase] as number
        if (v > max) max = v
      })
    })
    return max || 1
  }, [heatmapData])

  // Sorted table data
  const sortedPipeline = useMemo(() => {
    const sorted = [...pipeline]
    sorted.sort((a, b) => {
      let aVal = a[sortKey] as string | number
      let bVal = b[sortKey] as string | number
      if (sortKey === 'phase') {
        aVal = PHASE_ORDER.indexOf(a.phase)
        bVal = PHASE_ORDER.indexOf(b.phase)
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
    return sorted
  }, [pipeline, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronUp className="h-3 w-3 text-gray-300" />
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />
  }

  const companyOptions = companies.map(c => ({ value: String(c.id), label: `${c.ticker} - ${c.name}` }))

  const phaseVariant = (phase: string): 'fact' | 'interpretation' | 'hypothesis' | 'default' => {
    if (phase === 'Approved' || phase === 'Filed') return 'fact'
    if (phase === 'Phase III' || phase === 'Phase II') return 'interpretation'
    if (phase === 'Phase I') return 'hypothesis'
    return 'default'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">Clinical trial tracking and therapeutic area analysis</p>
        </div>
        <div className="flex items-end gap-3 sm:ml-auto flex-wrap">
          <Select
            label="Company"
            value={selectedCompany}
            onChange={e => setSelectedCompany(e.target.value)}
            options={[{ value: 'all', label: 'All Companies' }, ...companyOptions]}
          />
          <Select
            label="Phase"
            value={selectedPhase}
            onChange={e => setSelectedPhase(e.target.value)}
            options={[{ value: 'all', label: 'All Phases' }, ...PHASE_ORDER.map(p => ({ value: p, label: p }))]}
          />
          <Select
            label="Therapeutic Area"
            value={selectedTA}
            onChange={e => setSelectedTA(e.target.value)}
            options={[{ value: 'all', label: 'All Areas' }, ...therapeuticAreas.map(ta => ({ value: ta, label: ta }))]}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Funnel + Pie Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                {funnelData.some(d => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="phase" tick={{ fontSize: 12 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" name="Trials" radius={[0, 4, 4, 0]}>
                        {funnelData.map((entry) => (
                          <Cell key={entry.phase} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No pipeline data available.</div>
                )}
              </CardContent>
            </Card>

            {/* TA Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Therapeutic Area Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {taDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={taDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {taDistribution.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data available.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trial Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Entries ({sortedPipeline.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedPipeline.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        {([
                          ['drug_name', 'Drug Name'],
                          ['company_name', 'Company'],
                          ['phase', 'Phase'],
                          ['therapeutic_area', 'TA'],
                          ['indication', 'Indication'],
                          ['status', 'Status'],
                          ['enrollment', 'Enrollment'],
                          ['expected_completion', 'Expected Completion'],
                        ] as [SortKey, string][]).map(([key, label]) => (
                          <th
                            key={key}
                            className="text-left py-3 px-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none whitespace-nowrap"
                            onClick={() => handleSort(key)}
                          >
                            <span className="inline-flex items-center gap-1">
                              {label}
                              <SortIcon column={key} />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPipeline.map((entry, i) => (
                        <tr key={entry.id} className={cn("border-b hover:bg-gray-50", i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                          <td className="py-2.5 px-3 font-medium text-gray-900">{entry.drug_name}</td>
                          <td className="py-2.5 px-3 text-gray-700">{entry.company_name || `Company ${entry.company_id}`}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant={phaseVariant(entry.phase)}>{entry.phase}</Badge>
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">{entry.therapeutic_area}</td>
                          <td className="py-2.5 px-3 text-gray-700 max-w-xs truncate">{entry.indication}</td>
                          <td className="py-2.5 px-3 text-gray-700">{entry.status}</td>
                          <td className="py-2.5 px-3 text-gray-700 tabular-nums text-right">{entry.enrollment?.toLocaleString() || '-'}</td>
                          <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">{entry.expected_completion || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  No pipeline entries match the selected filters.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Heatmap</CardTitle>
              <p className="text-sm text-gray-500">Companies x Phases (color intensity = trial count)</p>
            </CardHeader>
            <CardContent>
              {heatmapData.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    {/* Header row */}
                    <div className="grid gap-px" style={{ gridTemplateColumns: `160px repeat(${PHASE_ORDER.length}, 1fr)` }}>
                      <div className="py-2 px-3 text-xs font-medium text-gray-600 bg-gray-50">Company</div>
                      {PHASE_ORDER.map(phase => (
                        <div key={phase} className="py-2 px-3 text-xs font-medium text-gray-600 bg-gray-50 text-center">
                          {phase}
                        </div>
                      ))}
                    </div>
                    {/* Data rows */}
                    {heatmapData.map(row => (
                      <div
                        key={row.company as string}
                        className="grid gap-px border-b"
                        style={{ gridTemplateColumns: `160px repeat(${PHASE_ORDER.length}, 1fr)` }}
                      >
                        <div className="py-2 px-3 text-sm font-medium text-gray-900 truncate">{row.company as string}</div>
                        {PHASE_ORDER.map(phase => {
                          const count = row[phase] as number
                          const intensity = count / maxHeatVal
                          const bg = count === 0
                            ? 'bg-gray-50'
                            : ''
                          return (
                            <div
                              key={phase}
                              className={cn("py-2 px-3 text-sm text-center font-medium", bg)}
                              style={count > 0 ? {
                                backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.7})`,
                                color: intensity > 0.5 ? 'white' : '#1e3a5f',
                              } : undefined}
                            >
                              {count || '-'}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data for heatmap.</div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
