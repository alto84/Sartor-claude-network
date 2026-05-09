import { cn } from "@/lib/utils"

interface BadgeProps {
  variant: 'fact' | 'interpretation' | 'hypothesis' | 'default'
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  fact: 'bg-blue-100 text-blue-800 border-blue-200',
  interpretation: 'bg-amber-100 text-amber-800 border-amber-200',
  hypothesis: 'bg-purple-100 text-purple-800 border-purple-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  )
}

export function InsightBadge({ label }: { label: 'FACT' | 'INTERPRETATION' | 'HYPOTHESIS' }) {
  const variant = label === 'FACT' ? 'fact' : label === 'INTERPRETATION' ? 'interpretation' : 'hypothesis'
  return <Badge variant={variant}>{label}</Badge>
}
