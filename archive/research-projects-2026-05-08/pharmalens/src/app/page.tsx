'use client'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TopMovers } from '@/components/dashboard/top-movers'
import { VarianceHighlights } from '@/components/dashboard/variance-highlights'
import { PipelineFunnel } from '@/components/dashboard/pipeline-funnel'
import { InsightFeed } from '@/components/dashboard/insight-feed'
import { NLQuery } from '@/components/dashboard/nl-query'
import { NavTabs } from '@/components/layout/nav-tabs'
import { Role, KPICard } from '@/lib/types'

interface CompanyOption {
  value: string
  label: string
}

export default function DashboardPage() {
  // Filter state
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('annual')
  const [selectedComparison, setSelectedComparison] = useState('yoy')
  const [role, setRole] = useState<Role>('ceo')

  // NL query modal
  const [nlQueryOpen, setNlQueryOpen] = useState(false)

  // Company list for dropdown
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([])

  // KPI data
  const [kpiCards, setKpiCards] = useState<KPICard[]>([])
  const [kpiLoading, setKpiLoading] = useState(true)

  // Fetch company list
  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.ok ? res.json() : { data: [] })
      .then((resp: { data: { id: number; name: string; ticker: string }[] }) => {
        const companies = resp.data || []
        setCompanyOptions(
          companies.map(c => ({ value: String(c.id), label: `${c.name} (${c.ticker})` }))
        )
      })
      .catch(() => setCompanyOptions([]))
  }, [])

  // Fetch KPI data
  useEffect(() => {
    setKpiLoading(true)
    fetch('/api/financials/kpis?fiscal_year=2024')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((resp: { data: {
        fiscal_year?: number
        total_revenue?: number
        revenue_yoy_change?: number | null
        avg_operating_margin?: number
        margin_yoy_change?: number | null
        total_rd_spend?: number
        total_phase3_trials?: number
      } }) => {
        const data = resp.data
        // Revenue is in millions in the DB, so $800,000M = $800B
        const totalRevM = data.total_revenue || 0
        const totalRevDisplay = totalRevM >= 1000 ? `$${(totalRevM / 1000).toFixed(1)}B` : `$${totalRevM.toFixed(0)}M`
        const rdSpendM = data.total_rd_spend || 0
        const rdDisplay = rdSpendM >= 1000 ? `$${(rdSpendM / 1000).toFixed(1)}B` : `$${rdSpendM.toFixed(0)}M`
        const cards: KPICard[] = [
          {
            title: 'Total Revenue',
            value: totalRevDisplay,
            change: data.revenue_yoy_change != null
              ? `${data.revenue_yoy_change >= 0 ? '+' : ''}${data.revenue_yoy_change.toFixed(1)}% YoY`
              : undefined,
            changeType: data.revenue_yoy_change != null
              ? (data.revenue_yoy_change >= 0 ? 'positive' : 'negative')
              : 'neutral',
            subtitle: `FY${data.fiscal_year || 2024} Aggregate`,
          },
          {
            title: 'Avg Operating Margin',
            value: data.avg_operating_margin != null
              ? `${(data.avg_operating_margin * 100).toFixed(1)}%`
              : '--',
            change: data.margin_yoy_change != null
              ? `${data.margin_yoy_change >= 0 ? '+' : ''}${(data.margin_yoy_change * 100).toFixed(0)}bps YoY`
              : undefined,
            changeType: data.margin_yoy_change != null
              ? (data.margin_yoy_change >= 0 ? 'positive' : 'negative')
              : 'neutral',
            subtitle: 'Across 20 companies',
          },
          {
            title: 'Total R&D Spend',
            value: rdDisplay,
            subtitle: 'FY2024 Aggregate',
          },
          {
            title: 'Phase III Trials',
            value: data.total_phase3_trials != null ? String(data.total_phase3_trials) : '--',
            subtitle: 'Active across pipeline',
          },
        ]
        setKpiCards(cards)
        setKpiLoading(false)
      })
      .catch(() => {
        // Provide empty placeholder cards on error
        setKpiCards([
          { title: 'Total Revenue', value: '--', subtitle: 'Unable to load' },
          { title: 'Avg Operating Margin', value: '--', subtitle: 'Unable to load' },
          { title: 'Avg R&D Intensity', value: '--', subtitle: 'Unable to load' },
          { title: 'Pipeline Programs', value: '--', subtitle: 'Unable to load' },
        ])
        setKpiLoading(false)
      })
  }, [selectedCompany])

  // Keyboard shortcut: Ctrl+K / Cmd+K opens NL query
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setNlQueryOpen(prev => !prev)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        selectedComparison={selectedComparison}
        onComparisonChange={setSelectedComparison}
        role={role}
        onRoleChange={setRole}
        onSearchOpen={() => setNlQueryOpen(true)}
        companyOptions={companyOptions}
      />
      <NavTabs />

      <main className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards - full width */}
        <section>
          {kpiLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border bg-white shadow-sm p-5 space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-7 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <KPICards cards={kpiCards} />
          )}
        </section>

        {/* Revenue Chart (2/3) + Top Movers (1/3) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart
              companyId={selectedCompany !== 'all' ? selectedCompany : undefined}
              periodType={selectedPeriod}
            />
          </div>
          <div className="lg:col-span-1">
            <TopMovers fiscalYear={2024} />
          </div>
        </section>

        {/* Variance Highlights (1/2) + Pipeline Funnel (1/2) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <VarianceHighlights
            companyId={selectedCompany !== 'all' ? selectedCompany : undefined}
          />
          <PipelineFunnel
            companyId={selectedCompany !== 'all' ? selectedCompany : undefined}
          />
        </section>

        {/* AI Insight Feed - full width */}
        <section>
          <InsightFeed limit={5} />
        </section>
      </main>

      {/* NL Query Modal */}
      <NLQuery open={nlQueryOpen} onClose={() => setNlQueryOpen(false)} />
    </div>
  )
}
