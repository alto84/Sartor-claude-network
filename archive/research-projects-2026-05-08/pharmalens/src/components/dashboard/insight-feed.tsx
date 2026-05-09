'use client'
import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { InsightBadge } from '@/components/ui/badge'
import { Insight, InsightLabel } from '@/lib/types'

const BORDER_COLORS: Record<InsightLabel, string> = {
  FACT: 'border-l-blue-500',
  INTERPRETATION: 'border-l-amber-500',
  HYPOTHESIS: 'border-l-purple-500',
}

function InsightSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-l-4 border-l-gray-200 rounded-r-lg bg-gray-50 p-4 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}

interface InsightFeedProps {
  limit?: number
}

export function InsightFeed({ limit = 5 }: InsightFeedProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`/api/insights?limit=${limit}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((resp: { data: Insight[] }) => {
        setInsights(resp.data || [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [limit])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <CardTitle>AI Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <InsightSkeleton />
        ) : error ? (
          <div className="text-sm text-red-500 py-4 text-center">
            Failed to load insights: {error}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-sm text-gray-400 py-4 text-center">
            No insights available
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`border-l-4 ${BORDER_COLORS[insight.label]} rounded-r-lg bg-gray-50/70 p-4 hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <InsightBadge label={insight.label} />
                  {insight.company_name && (
                    <span className="text-xs text-gray-500 font-medium">{insight.company_name}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{insight.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
