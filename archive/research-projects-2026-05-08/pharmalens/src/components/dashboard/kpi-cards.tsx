import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { KPICard as KPICardType } from '@/lib/types'

function KPICard({ title, value, change, changeType, subtitle }: KPICardType) {
  const Icon = changeType === 'positive' ? TrendingUp : changeType === 'negative' ? TrendingDown : Minus
  const changeColor = changeType === 'positive' ? 'text-emerald-600' : changeType === 'negative' ? 'text-red-600' : 'text-gray-500'

  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {change && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${changeColor}`}>
          <Icon className="h-4 w-4" />
          <span>{change}</span>
        </div>
      )}
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </Card>
  )
}

export function KPICards({ cards }: { cards: KPICardType[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <KPICard key={i} {...card} />
      ))}
    </div>
  )
}
