'use client'
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface PhaseSummary {
  phase: string
  count: number
}

const PHASE_ORDER = ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Filed', 'Approved']
const PHASE_COLORS = ['#bfdbfe', '#93bbfd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']

function FunnelSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-6 bg-gray-100 rounded" style={{ width: `${100 - i * 12}%` }} />
        </div>
      ))}
    </div>
  )
}

interface PipelineFunnelProps {
  companyId?: string
}

export function PipelineFunnel({ companyId }: PipelineFunnelProps) {
  const [data, setData] = useState<PhaseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (companyId && companyId !== 'all') {
      params.set('company_id', companyId)
    }

    fetch(`/api/pipeline/summary?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((resp: { data: { by_phase: PhaseSummary[], by_ta: { therapeutic_area: string, count: number }[], total: number } }) => {
        const rows = resp.data?.by_phase || []
        // Sort by defined phase order
        const sorted = PHASE_ORDER.map(phase => {
          const found = rows.find(r =>
            r.phase.toLowerCase().replace(/\s+/g, '') === phase.toLowerCase().replace(/\s+/g, '')
          )
          return { phase, count: found?.count || 0 }
        })
        setData(sorted)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [companyId])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pipeline by Phase</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <FunnelSkeleton />
        ) : error ? (
          <div className="text-sm text-red-500 py-4 text-center">
            Failed to load pipeline: {error}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Horizontal bar chart using Recharts */}
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="phase"
                  tick={{ fontSize: 12, fill: '#4b5563' }}
                  tickLine={false}
                  axisLine={false}
                  width={85}
                />
                <Tooltip
                  formatter={(value) => [`${value} trials`, 'Count']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={PHASE_COLORS[i % PHASE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Phase count badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {data.map((phase, i) => (
                <div
                  key={phase.phase}
                  className="inline-flex items-center gap-1.5 text-xs"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PHASE_COLORS[i] }}
                  />
                  <span className="text-gray-600">{phase.phase}</span>
                  <span
                    className="font-bold text-white text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: PHASE_COLORS[i] }}
                  >
                    {phase.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
