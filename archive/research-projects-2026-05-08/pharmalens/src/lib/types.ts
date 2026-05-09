export interface Company {
  id: number
  name: string
  ticker: string
  cik: string | null
  filing_type: string
  hq_country: string
  fiscal_year_end: string
}

export interface Financial {
  id: number
  company_id: number
  company_name?: string
  period_type: 'annual' | 'quarterly'
  period_label: string
  fiscal_year: number
  fiscal_quarter: number | null
  start_date: string
  end_date: string
  currency: string
  revenue: number
  cogs: number
  gross_profit: number
  rd_expense: number
  sga_expense: number
  operating_income: number
  net_income: number
  diluted_eps: number
  total_assets: number
  total_liabilities: number
  shareholders_equity: number
  cash_and_equivalents: number
  operating_cash_flow: number
  capex: number
  free_cash_flow: number
  gross_margin: number
  operating_margin: number
  net_margin: number
  rd_intensity: number
  roe: number
  debt_to_equity: number
}

export interface PipelineEntry {
  id: number
  company_id: number
  company_name?: string
  drug_name: string
  generic_name: string
  therapeutic_area: string
  indication: string
  phase: string
  nct_id: string
  status: string
  enrollment: number
  expected_completion: string
}

export interface Variance {
  id: number
  company_id: number
  company_name?: string
  metric: string
  period: string
  actual: number
  comparator: number
  comparator_type: string
  variance_pct: number
  variance_abs: number
  direction: string
  ai_explanation: string | null
}

export interface MarketData {
  id: number
  therapeutic_area: string
  market_size_b: number
  growth_rate: number
  key_players: string
}

export interface Insight {
  id: number
  company_id: number | null
  company_name?: string
  insight_type: string
  content: string
  label: 'FACT' | 'INTERPRETATION' | 'HYPOTHESIS'
  created_at: string
}

export type InsightLabel = 'FACT' | 'INTERPRETATION' | 'HYPOTHESIS'

export interface KPICard {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  subtitle?: string
}

export interface ChartDataPoint {
  period: string
  [key: string]: string | number
}

export type ViewMode = 'table' | 'chart' | 'split'
export type Role = 'ceo' | 'regional_vp' | 'market_director' | 'finance_director'
