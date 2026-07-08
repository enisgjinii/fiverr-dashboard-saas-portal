import React, { useMemo } from "react"
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/dashboard/stat-card"
import { PageHeader } from "@/components/dashboard/page-header"
import { ChartCard, formatCurrency, formatNumber, chartDefaults } from "@/components/ui/chart"
import {
  DollarSign, ShoppingCart, Users, MessageCircle, Brain, Star, Bell,
  TrendingUp, ArrowRight, RefreshCw, Database, Bot, AlertTriangle, Rocket,
  Wallet, BarChart3, Sparkles, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { EarningsData, OrdersData, ReviewsData, NotificationsData } from "@/types"
import type { DashboardView } from "./layout"

const FIVERR_FEE_RATE = 0.20
const { colors } = chartDefaults

interface OverviewPanelProps {
  earningsData: EarningsData | null
  ordersData: OrdersData | null
  reviewsData: ReviewsData | null
  notificationsData: NotificationsData | null
  contactsCount: number
  messagesCount: number
  aiScore?: number
  healthScore?: number
  opportunitiesCount?: number
  risksCount?: number
  isOnFiverr: boolean
  isFetching: boolean
  onFetchAll: () => void
  onNavigate: (view: DashboardView) => void
}

export function OverviewPanel({
  earningsData,
  ordersData,
  reviewsData,
  notificationsData,
  contactsCount,
  messagesCount,
  aiScore,
  healthScore,
  opportunitiesCount = 0,
  risksCount = 0,
  isOnFiverr,
  isFetching,
  onFetchAll,
  onNavigate,
}: OverviewPanelProps) {
  const metrics = useMemo(() => {
    const txns = earningsData?.data?.transactions ?? []
    const earnings = txns.filter((t) => t.activity === "EARNING")
    const totalNet = earnings.reduce((s, t) => s + (t.amount || 0), 0)
    const totalFees = earnings.reduce(
      (s, t) => s + ((t.amount || 0) * FIVERR_FEE_RATE) / (1 - FIVERR_FEE_RATE),
      0
    )
    const withdrawals = txns.filter((t) => t.activity === "WITHDRAWAL")
    const totalWithdrawn = withdrawals.reduce((s, t) => s + Math.abs(t.amount || 0), 0)
    const uniqueBuyers = new Set(earnings.map((t) => t.from).filter(Boolean)).size

    const monthlyData: Record<string, number> = {}
    earnings.forEach((t) => {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthlyData[key] = (monthlyData[key] || 0) + (t.amount || 0)
    })
    const chartData = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([m, v]) => ({
        month: new Date(m + "-01").toLocaleDateString("en-US", { month: "short" }),
        net: Math.round(v / 100),
      }))

    const orderTxns = (ordersData?.transactions ?? []).filter(
      (t) => t.type === "EARNING" && t.order?.encryptedId
    )
    const orderCount = orderTxns.length || earnings.length

    const avgRating =
      reviewsData?.selling_reviews?.average_valuation ??
      reviewsData?.average_valuation ??
      null
    const reviewCount =
      reviewsData?.selling_reviews?.total_count ??
      reviewsData?.total_count ??
      reviewsData?.selling_reviews?.reviews?.length ??
      0
    const unread = notificationsData?.unreadCount ?? 0

    return {
      totalNet,
      totalFees,
      totalGross: totalNet + totalFees,
      totalWithdrawn,
      uniqueBuyers,
      orderCount,
      chartData,
      avgRating,
      reviewCount,
      unread,
      hasEarnings: txns.length > 0,
    }
  }, [earningsData, ordersData, reviewsData, notificationsData])

  const quickLinks = [
    { id: "earnings" as const, label: "Earnings", desc: "Revenue analytics", icon: DollarSign, color: "text-green-500" },
    { id: "orders" as const, label: "Orders", desc: "Order breakdown", icon: ShoppingCart, color: "text-blue-500" },
    { id: "ai" as const, label: "AI Analysis", desc: "Conversation insights", icon: Bot, color: "text-purple-500" },
    { id: "insights" as const, label: "Insights", desc: "Cross-data analytics", icon: Sparkles, color: "text-amber-500" },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your complete Fiverr business overview — earnings, orders, conversations, and AI insights in one place."
        actions={
          <Button onClick={onFetchAll} disabled={isFetching || !isOnFiverr}>
            {isFetching ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Sync All Data
          </Button>
        }
      />

      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Net Earnings"
          value={metrics.hasEarnings ? formatCurrency(metrics.totalNet / 100) : "—"}
          sublabel={metrics.hasEarnings ? `${metrics.orderCount} orders · ${metrics.uniqueBuyers} buyers` : "Fetch earnings to see"}
          icon={DollarSign}
          accent="success"
          size="lg"
          trend={metrics.totalNet > 0 ? "up" : "neutral"}
          trendLabel={metrics.hasEarnings ? "Lifetime net received" : undefined}
        />
        <StatCard
          label="Gross Revenue"
          value={metrics.hasEarnings ? formatCurrency(metrics.totalGross / 100) : "—"}
          sublabel={metrics.hasEarnings ? `Fees: ${formatCurrency(metrics.totalFees / 100)}` : "Before Fiverr fees"}
          icon={TrendingUp}
          accent="default"
          size="lg"
        />
        <StatCard
          label="Contacts"
          value={formatNumber(contactsCount)}
          sublabel={`${messagesCount} messages loaded`}
          icon={Users}
          accent="info"
          size="lg"
        />
        <StatCard
          label="AI Health"
          value={healthScore !== undefined ? String(healthScore) : "—"}
          sublabel={aiScore !== undefined ? `Comm. score: ${aiScore}` : "Extract a conversation"}
          icon={Brain}
          accent={healthScore && healthScore >= 70 ? "success" : healthScore && healthScore < 40 ? "danger" : "warning"}
          size="lg"
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Orders" value={formatNumber(metrics.orderCount)} icon={ShoppingCart} size="sm" />
        <StatCard
          label="Withdrawn"
          value={metrics.hasEarnings ? formatCurrency(metrics.totalWithdrawn / 100) : "—"}
          icon={Wallet}
          accent="warning"
          size="sm"
        />
        <StatCard
          label="Reviews"
          value={metrics.reviewCount > 0 ? `${metrics.avgRating?.toFixed?.(1) ?? "—"}★` : "—"}
          sublabel={metrics.reviewCount > 0 ? `${metrics.reviewCount} total` : "No reviews"}
          icon={Star}
          size="sm"
        />
        <StatCard
          label="Alerts"
          value={formatNumber(metrics.unread)}
          sublabel="Unread notifications"
          icon={Bell}
          accent={metrics.unread > 0 ? "info" : "default"}
          size="sm"
        />
        <StatCard
          label="Risks"
          value={formatNumber(risksCount)}
          icon={AlertTriangle}
          accent={risksCount > 0 ? "danger" : "default"}
          size="sm"
        />
        <StatCard
          label="Opportunities"
          value={formatNumber(opportunitiesCount)}
          icon={Rocket}
          accent={opportunitiesCount > 0 ? "success" : "default"}
          size="sm"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Revenue Trend" subtitle="Monthly net earnings (last 12 months)">
            {metrics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={metrics.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="overviewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.primary} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-lg)",
                      fontSize: 12,
                    }}
                    formatter={(v) => [`$${Number(v ?? 0)}`, "Net"]}
                  />
                  <Area type="monotone" dataKey="net" stroke={colors.primary} fill="url(#overviewGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">Fetch earnings to see revenue trends</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => onNavigate("earnings")}>
                  Go to Earnings
                </Button>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Quick navigation */}
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/80 transition-colors text-left group"
              >
                <div className={cn("h-9 w-9 rounded-lg bg-muted flex items-center justify-center", link.color)}>
                  <link.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity summary cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Conversation Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contacts synced</span>
              <span className="font-semibold font-tabular">{contactsCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Messages in view</span>
              <span className="font-semibold font-tabular">{messagesCount}</span>
            </div>
            {healthScore !== undefined && (
              <>
                <Progress value={healthScore} className="h-2" />
                <p className="text-xs text-muted-foreground">Conversation health: {healthScore}/100</p>
              </>
            )}
            <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => onNavigate("conversation")}>
              Open Messages <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Revenue Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.hasEarnings ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Gross</p>
                    <p className="text-sm font-bold text-foreground font-tabular">{formatCurrency(metrics.totalGross / 100)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <p className="text-xs text-muted-foreground">Fees</p>
                    <p className="text-sm font-bold text-red-500 font-tabular">-{formatCurrency(metrics.totalFees / 100)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p className="text-sm font-bold text-green-500 font-tabular">{formatCurrency(metrics.totalNet / 100)}</p>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden flex bg-muted">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${metrics.totalGross > 0 ? (metrics.totalNet / metrics.totalGross) * 100 : 0}%` }}
                  />
                  <div
                    className="h-full bg-red-400"
                    style={{ width: `${metrics.totalGross > 0 ? (metrics.totalFees / metrics.totalGross) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  You keep {metrics.totalGross > 0 ? Math.round((metrics.totalNet / metrics.totalGross) * 100) : 0}% after fees
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No earnings data yet</p>
                <Button size="sm" onClick={() => onNavigate("earnings")}>
                  Fetch Earnings
                </Button>
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate("orders")}>
              View Orders <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {!metrics.hasEarnings && !contactsCount && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="py-10 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-primary opacity-60" />
            <h3 className="text-lg font-semibold mb-2">Get started</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Open Fiverr in a browser tab, then sync your data to unlock the full analytics dashboard.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={onFetchAll} disabled={!isOnFiverr || isFetching}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
                Sync All Data
              </Button>
              <Badge variant="outline" className={isOnFiverr ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30"}>
                {isOnFiverr ? "Fiverr tab detected" : "Open Fiverr first"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
