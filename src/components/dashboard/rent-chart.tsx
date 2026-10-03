'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import { formatCurrency } from '@/lib/utils'

interface MonthlyRentData {
  month: string
  amount: number
}

interface RentChartProps {
  data: MonthlyRentData[]
}

interface TooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      <p className="text-blue-600 dark:text-blue-400 font-semibold">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

export function RentChart({ data }: RentChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const gridColor = isDark ? '#374151' : '#E5E7EB'       // gray-700 / gray-200
  const axisColor = isDark ? '#9CA3AF' : '#6B7280'        // gray-400 / gray-500
  const barColor = isDark ? '#3B82F6' : '#2563EB'         // blue-500 / blue-600
  const barHoverColor = isDark ? '#60A5FA' : '#1D4ED8'    // blue-400 / blue-700

  const hasData = data && data.length > 0 && data.some((d) => d.amount > 0)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Monthly Rent Collected
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Last 6 months overview
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No rent data available yet
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: 16, bottom: 4 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: axisColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => {
                if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`
                if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`
                return `₦${value}`
              }}
              width={68}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
            />
            <Bar
              dataKey="amount"
              fill={barColor}
              radius={[6, 6, 0, 0]}
              activeBar={{ fill: barHoverColor }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
