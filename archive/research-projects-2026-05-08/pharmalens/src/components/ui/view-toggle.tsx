'use client'
import { BarChart3, Table, Columns } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ViewMode } from '@/lib/types'

interface ViewToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const buttons = [
    { value: 'table' as ViewMode, icon: Table, label: 'Table' },
    { value: 'chart' as ViewMode, icon: BarChart3, label: 'Chart' },
    { value: 'split' as ViewMode, icon: Columns, label: 'Split' },
  ]
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {buttons.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            mode === value ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
