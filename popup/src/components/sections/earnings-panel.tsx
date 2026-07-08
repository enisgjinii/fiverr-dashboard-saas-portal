import React, { useState, useMemo } from "react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartCard, formatCurrency, formatNumber, formatPercent, kFormat, chartDefaults } from "@/components/ui/chart"
import { ArrowUpRight, ArrowDownLeft, DollarSign, TrendingUp, TrendingDown, Users, Calendar, Download, Filter, Search, ChevronDown, ChevronUp, Eye, EyeOff, PieChart as PieChartIcon, BarChart3, LineChart, Wallet, CreditCard, ArrowRight, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EarningsData, Transaction } from "@/types"

const FIVERR_FEE_RATE = 0.20
const { colors, margin, textStyle, gridStyle } = chartDefaults

interface EarningsPanelProps {
  earningsData: EarningsData | null
  isFetching: boolean
  isOnFiverr: boolean
  onFetchEarnings: () => void
}

const tabs = ['overview', 'yearly', 'monthly', 'buyers', 'types', 'withdrawals', 'transactions'] as const
type Tab = typeof tabs[number]

function computeFee(net: number) {
  const gross = net / (1 - FIVERR_FEE_RATE)
  return { gross, fee: gross - net }
}

export default function EarningsPanel({ earningsData, isFetching, isOnFiverr, onFetchEarnings }: EarningsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const computed = useMemo(() => {
    if (!earningsData?.data?.transactions) return null

    const txns = earningsData.data.transactions
    const counters = earningsData.data.countersPerActivity || []
    const pagesLoaded = earningsData.data.pagesLoaded || 1

    const earnings = txns.filter(t => t.activity === 'EARNING')
    const withdrawals = txns.filter(t => t.activity === 'WITHDRAWAL')
    const purchases = txns.filter(t => t.activity === 'PURCHASE')
    const reversals = txns.filter(t => t.activity === 'EARNING_REVERSED')

    const totalGrossEarnings = earnings.reduce((s, t) => s + (t.amount || 0), 0)
    const totalReversed = reversals.reduce((s, t) => s + Math.abs(t.amount || 0), 0)
    const totalEarned = totalGrossEarnings - totalReversed
    const totalWithdrawn = withdrawals.reduce((s, t) => s + Math.abs(t.amount || 0), 0)
    const totalPurchases = purchases.reduce((s, t) => s + Math.abs(t.amount || 0), 0)
    const totalFeesPaid = earnings.reduce((s, t) => s + (t.amount || 0) * FIVERR_FEE_RATE / (1 - FIVERR_FEE_RATE), 0) - reversals.reduce((s, t) => s + (Math.abs(t.amount || 0)) * FIVERR_FEE_RATE / (1 - FIVERR_FEE_RATE), 0)
    const totalGrossAmount = totalEarned + totalFeesPaid
    const balance = totalEarned - totalWithdrawn - totalPurchases
    const avgOrder = earnings.length > 0 ? totalEarned / earnings.length : 0
    const avgFee = earnings.length > 0 ? totalFeesPaid / earnings.length : 0
    const biggestOrder = earnings.length > 0 ? Math.max(...earnings.map(t => t.amount || 0)) : 0
    const smallestOrder = earnings.length > 0 ? Math.min(...earnings.map(t => t.amount || 0)) : 0
    const effectiveTakeRate = totalGrossAmount > 0 ? (totalFeesPaid / totalGrossAmount) * 100 : 0
    const uniqueBuyers = [...new Set(earnings.map(t => t.from).filter(Boolean))]
    const earliestDate = txns.length > 0 ? new Date(txns[txns.length - 1].date) : new Date()
    const latestDate = txns.length > 0 ? new Date(txns[0].date) : new Date()
    const daysActive = Math.max(1, Math.ceil((latestDate.getTime() - earliestDate.getTime()) / 86400000))

    const yearlyData: Record<string, { earned: number; grossEarned: number; feesPaid: number; withdrawn: number; spent: number; count: number; orders: number }> = {}
    const monthlyData: Record<string, { earned: number; grossEarned: number; feesPaid: number; withdrawn: number; spent: number; count: number }> = {}

    txns.forEach(t => {
      const d = new Date(t.date)
      const yKey = String(d.getFullYear())
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!yearlyData[yKey]) yearlyData[yKey] = { earned: 0, grossEarned: 0, feesPaid: 0, withdrawn: 0, spent: 0, count: 0, orders: 0 }
      if (!monthlyData[mKey]) monthlyData[mKey] = { earned: 0, grossEarned: 0, feesPaid: 0, withdrawn: 0, spent: 0, count: 0 }
      if (t.activity === 'EARNING') {
        const net = t.amount || 0
        const { gross, fee } = computeFee(net)
        yearlyData[yKey].earned += net; yearlyData[yKey].grossEarned += gross; yearlyData[yKey].feesPaid += fee; yearlyData[yKey].orders++
        monthlyData[mKey].earned += net; monthlyData[mKey].grossEarned += gross; monthlyData[mKey].feesPaid += fee
      } else if (t.activity === 'EARNING_REVERSED') {
        const net = Math.abs(t.amount || 0)
        const { gross, fee } = computeFee(net)
        yearlyData[yKey].earned -= net; yearlyData[yKey].grossEarned -= gross; yearlyData[yKey].feesPaid -= fee
        monthlyData[mKey].earned -= net; monthlyData[mKey].grossEarned -= gross; monthlyData[mKey].feesPaid -= fee
      } else if (t.activity === 'WITHDRAWAL') {
        yearlyData[yKey].withdrawn += Math.abs(t.amount || 0)
        monthlyData[mKey].withdrawn += Math.abs(t.amount || 0)
      } else if (t.activity === 'PURCHASE') {
        yearlyData[yKey].spent += Math.abs(t.amount || 0)
        monthlyData[mKey].spent += Math.abs(t.amount || 0)
      }
      yearlyData[yKey].count++; monthlyData[mKey].count++
    })

    const sortedYears = Object.keys(yearlyData).sort()
    const sortedMonths = Object.keys(monthlyData).sort().reverse()
    const maxYearlyEarned = Math.max(...sortedYears.map(y => yearlyData[y].earned), 1)
    const maxMonthlyEarned = Math.max(...sortedMonths.map(m => monthlyData[m].earned), 1)

    const buyerStats: Record<string, { total: number; count: number; first: string; last: string }> = {}
    earnings.forEach(t => {
      const b = t.from || 'Unknown'
      if (!buyerStats[b]) buyerStats[b] = { total: 0, count: 0, first: t.date, last: t.date }
      buyerStats[b].total += t.amount || 0
      buyerStats[b].count++
      if (t.date < buyerStats[b].first) buyerStats[b].first = t.date
      if (t.date > buyerStats[b].last) buyerStats[b].last = t.date
    })

    const topBuyers = Object.entries(buyerStats).sort((a, b) => b[1].total - a[1].total).slice(0, 15)
    const repeatBuyers = Object.entries(buyerStats).filter(([, s]) => s.count > 1).sort((a, b) => b[1].count - a[1].count)

    const typeStats: Record<string, { total: number; count: number }> = {}
    earnings.forEach(t => {
      const tp = t.orderableItem || 'OTHER'
      if (!typeStats[tp]) typeStats[tp] = { total: 0, count: 0 }
      typeStats[tp].total += t.amount || 0
      typeStats[tp].count++
    })

    const monthlySorted = Object.entries(monthlyData).sort((a, b) => b[1].earned - a[1].earned)
    const bestMonth = monthlySorted[0]
    const tips = earnings.filter(t => t.orderableItem === 'TIP')
    const totalTips = tips.reduce((s, t) => s + (t.amount || 0), 0)

    const yearlyChartData = sortedYears.map(y => ({
      year: y,
      gross: Math.round(yearlyData[y].grossEarned / 100 * 100) / 100,
      fees: Math.round(yearlyData[y].feesPaid / 100 * 100) / 100,
      net: Math.round(yearlyData[y].earned / 100 * 100) / 100,
      orders: yearlyData[y].orders,
    }))

    const monthlyChartData = [...Object.entries(monthlyData)]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([m, d]) => ({
        month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        net: Math.round(d.earned / 100 * 100) / 100,
        fees: Math.round(d.feesPaid / 100 * 100) / 100,
        gross: Math.round(d.grossEarned / 100 * 100) / 100,
      }))

    const typeChartData = Object.entries(typeStats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([type, s]) => ({
        type: type.length > 18 ? type.slice(0, 16) + '...' : type,
        net: Math.round(s.total / 100 * 100) / 100,
        count: s.count,
      }))

    const topBuyersChartData = topBuyers.slice(0, 10).map(([name, s]) => ({
      name: name.length > 14 ? name.slice(0, 12) + '...' : name,
      net: Math.round(s.total / 100 * 100) / 100,
    }))

    return {
      txns, earnings, withdrawals, purchases, reversals, counters, pagesLoaded,
      totalEarned, totalWithdrawn, totalPurchases, totalFeesPaid, totalGrossAmount,
      balance, avgOrder, avgFee, biggestOrder, smallestOrder, effectiveTakeRate,
      uniqueBuyers, daysActive, totalTips, tips,
      yearlyData, monthlyData, sortedYears, sortedMonths, maxYearlyEarned, maxMonthlyEarned,
      topBuyers, repeatBuyers, buyerStats, typeStats,
      bestMonth, yearlyChartData, monthlyChartData, typeChartData, topBuyersChartData,
    }
  }, [earningsData])

  if (isFetching) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="shrink-0 w-36">
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  if (!computed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No earnings data yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Fetch your complete transaction history to see detailed earnings analytics, charts, and fee breakdowns.
        </p>
        <Button onClick={onFetchEarnings} disabled={!isOnFiverr} size="lg">
          {!isOnFiverr ? (
            <>Open Fiverr in a tab first</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-2" />Fetch Earnings</>
          )}
        </Button>
      </div>
    )
  }

  const {
    txns, earnings, withdrawals, purchases, reversals, counters, pagesLoaded,
    totalEarned, totalWithdrawn, totalPurchases, totalFeesPaid, totalGrossAmount,
    balance, avgOrder, avgFee, biggestOrder, smallestOrder, effectiveTakeRate,
    uniqueBuyers, daysActive, totalTips, tips,
    yearlyData, monthlyData, sortedYears, sortedMonths, maxYearlyEarned, maxMonthlyEarned,
    topBuyers, repeatBuyers, buyerStats, typeStats,
    bestMonth, yearlyChartData, monthlyChartData, typeChartData, topBuyersChartData,
  } = computed

  const metricCards = [
    { label: 'Gross Revenue', value: totalGrossAmount, formatter: formatCurrency, color: 'text-foreground', icon: TrendingUp, trend: totalGrossAmount > 0 ? 'up' as const : 'neutral' as const },
    { label: 'Fiverr Fees', value: -totalFeesPaid, formatter: formatCurrency, color: 'text-red-500', icon: TrendingDown, trend: 'down' as const },
    { label: 'Net Received', value: totalEarned, formatter: formatCurrency, color: 'text-green-500', icon: TrendingUp, trend: totalEarned > 0 ? 'up' as const : 'neutral' as const },
    { label: 'Balance', value: balance, formatter: formatCurrency, color: balance >= 0 ? 'text-green-500' : 'text-red-500', icon: Wallet, trend: balance >= 0 ? 'up' as const : 'down' as const },
    { label: 'Avg Order', value: avgOrder, formatter: formatCurrency, color: 'text-foreground', icon: DollarSign },
    { label: 'Total Orders', value: earnings.length, formatter: formatNumber, color: 'text-foreground', icon: BarChart3 },
    { label: 'Unique Buyers', value: uniqueBuyers.length, formatter: formatNumber, color: 'text-foreground', icon: Users },
  ]

  const pieData = [
    { name: 'Gross Revenue', value: Math.round(totalGrossAmount / 100 * 100) / 100, color: colors.primary },
    { name: `Fees (${effectiveTakeRate.toFixed(1)}%)`, value: Math.round(totalFeesPaid / 100 * 100) / 100, color: colors.red },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs space-y-1">
        <p className="font-medium text-popover-foreground">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: ${Number(entry.value).toFixed(2)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* Summary Bar */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {metricCards.map((card, i) => {
          const Icon = card.icon
          const val = card.formatter(card.value / 100)
          return (
            <Card key={i} className="shrink-0 min-w-[140px] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={cn("h-4 w-4", card.color || 'text-muted-foreground')} />
                {card.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
                {card.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
              </div>
              <p className={cn("text-lg font-bold truncate", card.color)}>{val}</p>
              <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
            </Card>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Revenue Trend" subtitle="Monthly earned amounts over time">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyChartData} margin={margin}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={textStyle} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
              <YAxis tick={textStyle} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="gross" stroke={colors.gray} fill="none" strokeWidth={1} strokeDasharray="4 4" name="Gross" />
              <Area type="monotone" dataKey="net" stroke={colors.primary} fill="url(#revenueGrad)" strokeWidth={2} name="Net" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fee Analysis" subtitle="Gross vs Fiverr fees">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={28}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Buyers" subtitle="Top 10 buyers by revenue">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topBuyersChartData} layout="vertical" margin={margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={textStyle} axisLine={false} tickLine={false} width={40} />
              <YAxis type="category" dataKey="name" tick={textStyle} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="net" fill={colors.primary} radius={[0, 3, 3, 0]} name="Net" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Earnings by Type" subtitle="Order type breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeChartData} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="type" tick={textStyle} axisLine={false} tickLine={false} />
              <YAxis tick={textStyle} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="net" fill={colors.primary} radius={[3, 3, 0, 0]} name="Net" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border rounded-lg p-1 bg-muted/50 mb-4 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                activeTab === tab
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Yearly Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedYears.map(year => (
                  <div key={year} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{year}</span>
                      <span className="text-green-500 font-bold">{formatCurrency(yearlyData[year].earned / 100)} net</span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${(yearlyData[year].earned / maxYearlyEarned) * 100}%` }} />
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>{yearlyData[year].orders} orders</span>
                      <span className="text-red-400">-{formatCurrency(yearlyData[year].feesPaid / 100)} fees</span>
                      <span className="text-orange-500">-{formatCurrency(yearlyData[year].withdrawn / 100)} withdrawn</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-4 gap-3">
              <Card className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Effective Take Rate</p>
                <p className="text-lg font-bold text-red-500">{formatPercent(effectiveTakeRate)}</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Avg Fee / Order</p>
                <p className="text-lg font-bold text-red-400">{formatCurrency(avgFee / 100)}</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Days Active</p>
                <p className="text-lg font-bold">{daysActive}</p>
              </Card>
              {bestMonth && (
                <Card className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Best Month</p>
                  <p className="text-lg font-bold text-green-500">{formatCurrency(bestMonth[1].earned / 100)}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(bestMonth[0] + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                </Card>
              )}
            </div>

            {counters.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {counters.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-[10px]">
                        <span className="font-medium">{c.activity}</span>
                        <Badge variant="secondary" className="text-[10px]">{c.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'yearly' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Yearly Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-auto">
              {sortedYears.map(year => {
                const yEarned = yearlyData[year].earned
                const yFees = yearlyData[year].feesPaid
                const yGross = yearlyData[year].grossEarned
                const yWithdrawn = yearlyData[year].withdrawn
                const yAvg = yearlyData[year].orders > 0 ? yEarned / yearlyData[year].orders : 0
                const yFeeRate = yGross > 0 ? (yFees / yGross) * 100 : 0
                return (
                  <div key={year} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">{year}</span>
                      <span className="text-sm font-bold text-green-500">{formatCurrency(yEarned / 100)} net</span>
                    </div>
                    <div className="h-5 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${(yEarned / maxYearlyEarned) * 100}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="text-center">
                        <span className="text-green-500 font-bold">{formatCurrency(yGross / 100)}</span><br />
                        <span className="text-muted-foreground">Gross</span>
                      </div>
                      <div className="text-center">
                        <span className="text-red-400 font-bold">-{formatCurrency(yFees / 100)}</span><br />
                        <span className="text-muted-foreground">Fees ({yFeeRate.toFixed(1)}%)</span>
                      </div>
                      <div className="text-center">
                        <span className="text-foreground font-bold">{formatCurrency(yEarned / 100)}</span><br />
                        <span className="text-muted-foreground">Net</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-[10px] text-muted-foreground">
                      <span>{yearlyData[year].orders} orders</span>
                      <span>Avg: {formatCurrency(yAvg / 100)}/order</span>
                      <span className="text-orange-500">-{formatCurrency(yWithdrawn / 100)} withdrawn</span>
                      {yearlyData[year].spent > 0 && <span className="text-red-500">-{formatCurrency(yearlyData[year].spent / 100)} spent</span>}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {activeTab === 'monthly' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-auto">
              {sortedMonths.map(month => (
                <div key={month} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    <span className="text-green-500 font-bold">{formatCurrency(monthlyData[month].earned / 100)} net</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${(monthlyData[month].earned / maxMonthlyEarned) * 100}%` }} />
                  </div>
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span>{monthlyData[month].count} txns</span>
                    <span className="text-red-400">-{formatCurrency(monthlyData[month].feesPaid / 100)} fees</span>
                    <span className="text-orange-500">-{formatCurrency(monthlyData[month].withdrawn / 100)} withdrawn</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === 'buyers' && (
          <div className="space-y-4">
            {repeatBuyers.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Repeat Buyers ({repeatBuyers.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {repeatBuyers.slice(0, 10).map(([name, stats]) => {
                    const { gross, fee } = computeFee(stats.total)
                    return (
                      <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                            <span className="text-[10px] font-bold">{name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium">{name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {stats.count} orders · Gross: {formatCurrency(gross / 100)} · Fees: {formatCurrency(fee / 100)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-green-500">{formatCurrency(stats.total / 100)} net</span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">All Buyers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-auto">
                {topBuyers.map(([name, stats], i) => {
                  const { gross, fee } = computeFee(stats.total)
                  return (
                    <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">#{i + 1}</span>
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold">{name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium">{name}</p>
                          <p className="text-[10px] text-muted-foreground">{stats.count} order{stats.count !== 1 ? 's' : ''} · Fees: {formatCurrency(fee / 100)}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-green-500">{formatCurrency(stats.total / 100)} net</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'types' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Earnings by Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(typeStats).sort((a, b) => b[1].total - a[1].total).map(([type, stats]) => {
                const { gross, fee } = computeFee(stats.total)
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{type}</span>
                      <span className="text-green-500 font-bold">{formatCurrency(stats.total / 100)} ({stats.count})</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(stats.total / totalEarned) * 100}%` }} />
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>Gross: {formatCurrency(gross / 100)}</span>
                      <span className="text-red-400">Fees: {formatCurrency(fee / 100)}</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {activeTab === 'withdrawals' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-auto">
              {withdrawals.length > 0 ? withdrawals.map((w, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{w.from || 'PayPal'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(w.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {w.withdrawalStatus || 'Completed'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-orange-500">-{formatCurrency(Math.abs(w.amount) / 100)}</span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No withdrawals</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'transactions' && (
          <Card>
            <CardContent className="space-y-2 max-h-96 overflow-auto p-4">
              <div className="p-3 rounded-lg bg-muted/50 border mb-2">
                <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
                  <div>
                    <p className="text-green-500 font-bold text-sm">{formatCurrency(totalGrossAmount / 100)}</p>
                    <p className="text-muted-foreground">Total Gross</p>
                  </div>
                  <div>
                    <p className="text-red-500 font-bold text-sm">-{formatCurrency(totalFeesPaid / 100)}</p>
                    <p className="text-muted-foreground">Total Fiverr Fees (20%)</p>
                  </div>
                  <div>
                    <p className="text-green-500 font-bold text-sm">{formatCurrency(totalEarned / 100)}</p>
                    <p className="text-muted-foreground">Total Net Received</p>
                  </div>
                </div>
              </div>
              {txns.map((t, i) => {
                const isEarning = t.activity === 'EARNING'
                const net = t.amount || 0
                const { gross, fee } = isEarning ? computeFee(net) : { gross: 0, fee: 0 }
                const isPositive = net > 0
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", isPositive ? 'bg-green-500/20' : 'bg-red-500/20')}>
                        {isPositive ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownLeft className="h-4 w-4 text-red-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {t.activity}{t.from ? ` from ${t.from}` : t.service || ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {t.order?.encryptedId ? ` · ${t.order.encryptedId}` : ''}
                          {t.orderableItem ? ` · ${t.orderableItem}` : ''}
                        </p>
                        {isEarning && (
                          <p className="text-[10px] text-red-400">
                            Gross: {formatCurrency(gross / 100)} - Fee: {formatCurrency(fee / 100)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-sm font-bold", isPositive ? 'text-green-500' : 'text-red-500')}>
                        {isPositive ? '+' : ''}{formatCurrency(net / 100)}
                      </span>
                      {isEarning && <p className="text-[10px] text-red-400">-{formatCurrency(fee / 100)} fee</p>}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fee Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Fee Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Gross</p>
              <p className="text-lg font-bold text-green-500">{formatCurrency(totalGrossAmount / 100)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Fees Paid</p>
              <p className="text-lg font-bold text-red-500">-{formatCurrency(totalFeesPaid / 100)}</p>
              <p className="text-[10px] text-muted-foreground">({formatPercent(effectiveTakeRate)} of gross)</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Effective Take Rate</p>
              <p className="text-lg font-bold text-red-400">{formatPercent(effectiveTakeRate)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Net</p>
              <p className="text-lg font-bold text-green-500">{formatCurrency(totalEarned / 100)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg Fee / Order</p>
              <p className="text-lg font-bold text-red-400">{formatCurrency(avgFee / 100)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
