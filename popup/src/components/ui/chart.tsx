import React from "react"
import { cn } from "@/lib/utils"

const THEME = {
  line: 'hsl(0, 0%, 50%)',
  area: 'hsl(0, 0%, 50%)',
  bar: 'hsl(0, 0%, 50%)',
  text: 'var(--color-muted-foreground)',
  grid: 'var(--color-border)',
  tooltip: {
    bg: 'var(--color-popover)',
    border: 'var(--color-border)',
    text: 'var(--color-popover-foreground)',
  }
}

export const chartDefaults = {
  margin: { top: 10, right: 10, left: 0, bottom: 0 },
  colors: {
    primary: 'hsl(152, 68%, 42%)',
    secondary: 'hsl(152, 45%, 55%)',
    tertiary: 'hsl(152, 30%, 35%)',
    red: 'hsl(0, 72%, 51%)',
    green: 'hsl(152, 68%, 42%)',
    yellow: 'hsl(38, 92%, 50%)',
    blue: 'hsl(210, 80%, 52%)',
    purple: 'hsl(270, 50%, 55%)',
    orange: 'hsl(30, 80%, 50%)',
    gray: 'hsl(220, 10%, 55%)',
  },
  get tick() { return { fill: 'var(--color-muted-foreground)', fontSize: 11 } },
  get textStyle() { return { fill: 'var(--color-muted-foreground)', fontSize: 11 } },
  get gridStyle() { return { stroke: 'var(--color-border)', strokeDasharray: '3 3' } },
}

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function ChartCard({ title, subtitle, children, className, action }: ChartCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div className="flex items-center justify-between p-4 pb-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className="p-4 pt-2">
        {children}
      </div>
    </div>
  )
}

export function formatCurrency(value: number, decimals = 2) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercent(value: number, decimals = 1) {
  return `${value.toFixed(decimals)}%`
}

export function kFormat(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}
