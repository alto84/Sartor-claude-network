'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BarChart3, FlaskConical, Swords, Home } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/financials', label: 'Financials', icon: BarChart3 },
  { href: '/pipeline', label: 'Pipeline', icon: FlaskConical },
  { href: '/competitive', label: 'Competitive', icon: Swords },
]

export function NavTabs() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-1 px-4 py-1 border-b bg-white">
      {tabs.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            pathname === href
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
