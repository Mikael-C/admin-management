import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: { value: number; positive: boolean }
  className?: string
  iconClassName?: string
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white truncate">
            {value}
          </p>

          {/* Trend badge */}
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {trend.positive ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.positive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {trend.positive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              {description && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {description}
                </span>
              )}
            </div>
          )}

          {/* Plain description (no trend) */}
          {!trend && description && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {/* Right: icon */}
        <div
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
            iconClassName ?? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
