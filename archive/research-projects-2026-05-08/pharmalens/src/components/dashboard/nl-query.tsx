'use client'
import { useState, useRef, useEffect } from 'react'
import { X, Search, Loader2, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { InsightBadge } from '@/components/ui/badge'
import { InsightLabel } from '@/lib/types'

interface NLQueryProps {
  open: boolean
  onClose: () => void
}

interface QueryResponse {
  answer: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  data_points?: Record<string, unknown>[]
  labels?: { text: string; label: InsightLabel }[]
  chart_config?: {
    type: 'bar' | 'line'
    data: Record<string, unknown>[]
    dataKey: string
    xKey: string
    title?: string
  }
}

const CONFIDENCE_STYLES = {
  HIGH: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-red-100 text-red-700',
}

const EXAMPLE_QUERIES = [
  'Which company had the highest R&D intensity in 2024?',
  'Compare AstraZeneca vs Pfizer revenue growth',
  'What drove Eli Lilly\'s revenue increase?',
  'Show me Phase III pipeline by therapeutic area',
]

export function NLQuery({ open, onClose }: NLQueryProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<QueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      // Reset state when closed
      setQuery('')
      setResponse(null)
      setError(null)
    }
  }, [open])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleSubmit = async (questionText: string) => {
    const q = questionText.trim()
    if (!q) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: {} }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: QueryResponse = await res.json()
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(query)
  }

  const handleExampleClick = (example: string) => {
    setQuery(example)
    handleSubmit(example)
  }

  const renderChart = (config: QueryResponse['chart_config']) => {
    if (!config || !config.data || config.data.length === 0) return null

    const Chart = config.type === 'line' ? LineChart : BarChart

    return (
      <div className="mt-4">
        {config.title && (
          <p className="text-xs font-medium text-gray-500 mb-2">{config.title}</p>
        )}
        <ResponsiveContainer width="100%" height={200}>
          <Chart data={config.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey={config.xKey}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            {config.type === 'line' ? (
              <Line
                type="monotone"
                dataKey={config.dataKey}
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3, fill: '#2563eb' }}
              />
            ) : (
              <Bar
                dataKey={config.dataKey}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Search bar */}
        <form onSubmit={handleFormSubmit} className="flex items-center border-b border-gray-200">
          <Search className="h-5 w-5 text-gray-400 ml-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about pharma performance..."
            className="flex-1 px-3 py-4 text-base outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
            disabled={loading}
          />
          {loading && <Loader2 className="h-5 w-5 text-blue-500 mr-3 animate-spin" />}
          <button
            type="button"
            onClick={onClose}
            className="p-2 mr-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </form>

        {/* Content area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Response */}
          {response && (
            <div className="p-5 space-y-4">
              {/* Confidence badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONFIDENCE_STYLES[response.confidence]}`}>
                  {response.confidence} CONFIDENCE
                </span>
              </div>

              {/* Answer */}
              <p className="text-sm text-gray-700 leading-relaxed">
                {response.answer}
              </p>

              {/* Inline labels */}
              {response.labels && response.labels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {response.labels.map((l, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <InsightBadge label={l.label} />
                      <span className="text-xs text-gray-500">{l.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto chart */}
              {response.chart_config && renderChart(response.chart_config)}

              {/* Data points */}
              {response.data_points && response.data_points.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Data Points</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {Object.keys(response.data_points[0]).map(key => (
                            <th key={key} className="text-left py-1.5 px-2 font-medium text-gray-500 uppercase tracking-wider">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {response.data_points.map((row, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="py-1.5 px-2 text-gray-700">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-5">
              <div className="bg-red-50 rounded-lg p-4 text-sm text-red-600">
                Failed to process query: {error}
              </div>
            </div>
          )}

          {/* Example queries (show when no response and not loading) */}
          {!response && !loading && !error && (
            <div className="p-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Try asking
              </p>
              <div className="space-y-1">
                {EXAMPLE_QUERIES.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(example)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                      {example}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="p-8 flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-sm text-gray-500">Analyzing your question...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
