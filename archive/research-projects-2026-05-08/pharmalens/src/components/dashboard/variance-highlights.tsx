'use client'
import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Variance } from '@/lib/types'
import { formatPercent } from '@/lib/utils'

function VarianceSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-gray-100 p-4 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-12" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

interface VarianceHighlightsProps {
  companyId?: string
}

export function VarianceHighlights({ companyId }: VarianceHighlightsProps) {
  const [variances, setVariances] = useState<Variance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ min_variance_pct: '5' })
    if (companyId && companyId !== 'all') {
      params.set('company_id', companyId)
    }

    fetch(`/api/variances?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((resp: { data: Variance[] }) => {
        // Sort by absolute variance pct descending, take top 5
        const sorted = (resp.data || [])
          .sort((a, b) => Math.abs(b.variance_pct) - Math.abs(a.variance_pct))
          .slice(0, 5)
        setVariances(sorted)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [companyId])

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Variance Highlights</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <VarianceSkeleton />
        ) : error ? (
          <div className="text-sm text-red-500 py-4 text-center">
            Failed to load variances: {error}
          </div>
        ) : variances.length === 0 ? (
          <div className="text-sm text-gray-400 py-4 text-center">
            No significant variances found
          </div>
        ) : (
          <div className="space-y-2">
            {variances.map((v) => {
              const isFavorable = v.direction === 'favorable' || (v.direction as string) === 'up'
              const isExpanded = expandedId === v.id

              return (
                <div key={v.id} className="group">
                  <button
                    onClick={() => toggleExpand(v.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-all hover:shadow-sm ${
                      isFavorable
                        ? 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50'
                        : 'border-red-100 bg-red-50/50 hover:bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {v.company_name}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {v.metric.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {v.period} vs {v.comparator_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className={`inline-flex items-center gap-1 text-sm font-bold tabular-nums ${
                          isFavorable ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {isFavorable ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {v.variance_pct > 0 ? '+' : ''}{formatPercent(v.variance_pct / 100)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expandable explanation */}
                  {isExpanded && (
                    <div className={`mt-1 rounded-lg p-3 text-xs leading-relaxed ${
                      isFavorable ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {v.ai_explanation || (
                        <span className="italic text-gray-500">
                          AI explanation not yet generated for this variance.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
