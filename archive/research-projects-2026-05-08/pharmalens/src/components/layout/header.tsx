'use client'
import { Search, Bell, Activity } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Role } from '@/lib/types'

interface HeaderProps {
  selectedCompany: string
  onCompanyChange: (company: string) => void
  selectedPeriod: string
  onPeriodChange: (period: string) => void
  selectedComparison: string
  onComparisonChange: (comparison: string) => void
  role: Role
  onRoleChange: (role: Role) => void
  onSearchOpen: () => void
  insightCount?: number
  companyOptions: { value: string; label: string }[]
}

export function Header({
  selectedCompany, onCompanyChange,
  selectedPeriod, onPeriodChange,
  selectedComparison, onComparisonChange,
  role, onRoleChange,
  onSearchOpen, insightCount = 0,
  companyOptions
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">PharmaLens</span>
          </div>
          <span className="hidden sm:inline text-xs text-gray-400 border-l pl-3 ml-1">Enterprise Analytics</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSearchOpen}
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Ask a question...</span>
            <kbd className="hidden lg:inline text-xs bg-gray-200 px-1.5 py-0.5 rounded">&#8984;K</kbd>
          </button>

          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-gray-500" />
            {insightCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                {insightCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 border-t bg-gray-50/50 overflow-x-auto">
        <Select
          label="Entity"
          value={selectedCompany}
          onChange={(e) => onCompanyChange(e.target.value)}
          options={[{ value: 'all', label: 'All Companies' }, ...companyOptions]}
        />
        <Select
          label="Period"
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          options={[
            { value: 'annual', label: 'Annual' },
            { value: 'quarterly', label: 'Quarterly' },
          ]}
        />
        <Select
          label="Compare"
          value={selectedComparison}
          onChange={(e) => onComparisonChange(e.target.value)}
          options={[
            { value: 'yoy', label: 'vs Prior Year' },
            { value: 'budget', label: 'vs Budget' },
            { value: 'forecast', label: 'vs Forecast' },
          ]}
        />
        <div className="ml-auto">
          <Select
            label="Role"
            value={role}
            onChange={(e) => onRoleChange(e.target.value as Role)}
            options={[
              { value: 'ceo', label: 'CEO' },
              { value: 'regional_vp', label: 'Regional VP' },
              { value: 'market_director', label: 'Market Director' },
              { value: 'finance_director', label: 'Finance Director' },
            ]}
          />
        </div>
      </div>
    </header>
  )
}
