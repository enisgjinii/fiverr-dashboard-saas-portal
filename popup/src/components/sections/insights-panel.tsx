import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartCard, formatCurrency, formatNumber, formatPercent, chartDefaults } from "@/components/ui/chart"
import { TrendingUp, TrendingDown, Lightbulb, AlertTriangle, CheckCircle, Target, Zap, Brain, BarChart3, LineChart, PieChart as PieChartIcon, Activity, Award, Clock, DollarSign, Users, ShoppingCart, Star, ArrowUpRight, ArrowDownRight, Sparkles, Rocket, Shield, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EarningsData, OrdersData, ReviewsData, NotificationsData } from "@/types"

const FIVERR_FEE_RATE = 0.20

interface InsightsPanelProps {
  earningsData: EarningsData | null
  ordersData: OrdersData | null
  reviewsData: ReviewsData | null
  notificationsData: NotificationsData | null
}

function computeFee(net: number) {
  const gross = net / (1 - FIVERR_FEE_RATE)
  return { gross, fee: gross - net }
}

interface MetricCard {
  icon: React.ElementType
  label: string
  value: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

interface Insight {
  type: 'positive' | 'warning' | 'negative' | 'suggestion'
  icon: React.ElementType
  title: string
  description: string
}

function getHealthColor(score: number) {
  if (score >= 70) return 'text-green-500'
  if (score >= 40) return 'text-yellow-500'
  return 'text-red-500'
}

function getProgressColor(score: number) {
  if (score >= 70) return 'bg-green-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function InsightsPanel({ earningsData, ordersData, reviewsData, notificationsData }: InsightsPanelProps) {
  const hasData = earningsData?.data?.transactions?.length || ordersData?.transactions?.length || reviewsData?.selling_reviews?.reviews?.length || reviewsData?.reviews?.length || notificationsData?.notifications?.length

  const computed = useMemo(() => {
    const earnings = earningsData?.data?.transactions?.filter(t => t.activity === 'EARNING') || []
    const txns = earningsData?.data?.transactions || ordersData?.transactions || []
    const reviews = reviewsData?.selling_reviews?.reviews || reviewsData?.reviews || []
    const notifications = notificationsData?.notifications || []
    const unreadCount = notificationsData?.unreadCount || 0

    const totalEarned = earnings.reduce((s, t) => s + (t.amount || 0), 0)
    const totalFeesPaid = earnings.reduce((s, t) => s + (t.amount || 0) * FIVERR_FEE_RATE / (1 - FIVERR_FEE_RATE), 0)
    const totalGrossAmount = totalEarned + totalFeesPaid
    const effectiveTakeRate = totalGrossAmount > 0 ? (totalFeesPaid / totalGrossAmount) * 100 : 0
    const avgOrder = earnings.length > 0 ? totalEarned / earnings.length : 0
    const uniqueBuyers = [...new Set(earnings.map(t => t.from).filter(Boolean))]

    const earliestDate = txns.length > 0 ? new Date(txns[txns.length - 1].date) : new Date()
    const latestDate = txns.length > 0 ? new Date(txns[0].date) : new Date()
    const daysActive = Math.max(1, Math.ceil((latestDate.getTime() - earliestDate.getTime()) / 86400000))

    const monthlyBuckets: Record<string, { earned: number; count: number }> = {}
    earnings.forEach(t => {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyBuckets[key]) monthlyBuckets[key] = { earned: 0, count: 0 }
      monthlyBuckets[key].earned += t.amount || 0
      monthlyBuckets[key].count++
    })

    const sortedMonths = Object.keys(monthlyBuckets).sort()
    const last3Months = sortedMonths.slice(-3)
    const prev3Months = sortedMonths.slice(-6, -3)
    const last3Earned = last3Months.reduce((s, m) => s + monthlyBuckets[m].earned, 0)
    const prev3Earned = prev3Months.reduce((s, m) => s + monthlyBuckets[m].earned, 0)
    const earningsGrowth = prev3Earned > 0 ? ((last3Earned - prev3Earned) / prev3Earned) * 100 : 0

    const ordersPerMonth = daysActive > 0 ? earnings.length / (daysActive / 30) : 0
    const revenuePerDay = daysActive > 0 ? totalEarned / daysActive : 0

    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : (reviewsData?.selling_reviews?.average_valuation || reviewsData?.average_valuation || 0)
    const fiveStarRate = reviews.length > 0
      ? (reviews.filter(r => r.rating === 5).length / reviews.length) * 100
      : 0

    const repeatBuyers = uniqueBuyers.length > 0
      ? uniqueBuyers.filter(b => earnings.filter(t => t.from === b).length > 1).length
      : 0
    const buyerRetention = uniqueBuyers.length > 0 ? (repeatBuyers / uniqueBuyers.length) * 100 : 0

    const orderTypes: Record<string, { total: number; count: number }> = {}
    earnings.forEach(t => {
      const tp = t.orderableItem || 'OTHER'
      if (!orderTypes[tp]) orderTypes[tp] = { total: 0, count: 0 }
      orderTypes[tp].total += t.amount || 0
      orderTypes[tp].count++
    })
    const topEarningType = Object.entries(orderTypes).sort((a, b) => b[1].total - a[1].total)[0]

    const bestMonth = sortedMonths.length > 0
      ? sortedMonths.reduce((a, b) => monthlyBuckets[a].earned > monthlyBuckets[b].earned ? a : b)
      : null

    const isMoMUp = sortedMonths.length >= 2
      ? monthlyBuckets[sortedMonths[sortedMonths.length - 1]]?.earned >= monthlyBuckets[sortedMonths[sortedMonths.length - 2]]?.earned
      : null

    const feeEfficiencyScore = Math.max(0, Math.min(20, 20 - (effectiveTakeRate - 16) * 2))

    const healthScore = Math.round(
      Math.min(30, (avgRating / 5) * 30) +
      Math.min(25, Math.max(0, (earningsGrowth / 50) * 25)) +
      Math.min(25, (ordersPerMonth / 10) * 25) +
      feeEfficiencyScore
    )

    return {
      earnings, txns, reviews, notifications,
      totalEarned, totalFeesPaid, totalGrossAmount, effectiveTakeRate,
      avgOrder, uniqueBuyers, daysActive, avgRating, fiveStarRate,
      repeatBuyers, buyerRetention, earningsGrowth, ordersPerMonth,
      revenuePerDay, orderTypes, topEarningType, bestMonth,
      monthlyBuckets, sortedMonths, isMoMUp, unreadCount,
      healthScore, feeEfficiencyScore,
    }
  }, [earningsData, ordersData, reviewsData, notificationsData])

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Brain className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No data to analyze</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Fetch your data from other sections to see insights
        </p>
      </div>
    )
  }

  const {
    earnings, txns, reviews, notifications,
    totalEarned, totalFeesPaid, totalGrossAmount, effectiveTakeRate,
    avgOrder, uniqueBuyers, daysActive, avgRating, fiveStarRate,
    repeatBuyers, buyerRetention, earningsGrowth, ordersPerMonth,
    revenuePerDay, orderTypes, topEarningType, bestMonth,
    monthlyBuckets, sortedMonths, isMoMUp, unreadCount,
    healthScore, feeEfficiencyScore,
  } = computed

  const metricCards: MetricCard[] = [
    {
      icon: TrendingUp,
      label: 'Earnings Trend',
      value: earningsGrowth >= 0 ? `+${earningsGrowth.toFixed(1)}% MoM` : `${earningsGrowth.toFixed(1)}% MoM`,
      trend: earningsGrowth >= 0 ? 'up' : 'down',
      trendValue: `${Math.abs(earningsGrowth).toFixed(1)}%`,
    },
    {
      icon: DollarSign,
      label: 'Avg Order Value',
      value: formatCurrency(avgOrder / 100),
    },
    {
      icon: Star,
      label: 'Review Rating',
      value: `${avgRating.toFixed(1)} stars`,
      trend: avgRating >= 4 ? 'up' : avgRating >= 3 ? 'neutral' : 'down',
    },
    {
      icon: BarChart3,
      label: 'Order Frequency',
      value: `${ordersPerMonth.toFixed(1)} /mo`,
    },
    {
      icon: Shield,
      label: 'Fee Efficiency',
      value: formatPercent(effectiveTakeRate),
      trend: effectiveTakeRate <= FIVERR_FEE_RATE * 100 ? 'up' : 'down',
    },
    {
      icon: Users,
      label: 'Buyer Retention',
      value: formatPercent(buyerRetention),
      trend: buyerRetention >= 30 ? 'up' : buyerRetention >= 15 ? 'neutral' : 'down',
    },
  ]

  const insights: Insight[] = []

  if (earnings.length > 0) {
    insights.push({
      type: avgOrder > 0 ? 'positive' : 'warning',
      icon: DollarSign,
      title: 'Order Value Analysis',
      description: `Your average order value is ${formatCurrency(avgOrder / 100)}. ${avgOrder > 50 ? 'Above typical range — premium positioning is working.' : 'Consider bundling services to increase value.'}`,
    })
  }

  if (repeatBuyers > 0) {
    insights.push({
      type: 'suggestion',
      icon: Lightbulb,
      title: 'Repeat Buyer Opportunity',
      description: `You have ${repeatBuyers} repeat buyer${repeatBuyers > 1 ? 's' : ''} (${formatPercent(buyerRetention)} of total). Consider offering loyalty discounts or exclusive packages.`,
    })
  }

  if (reviews.length > 0) {
    insights.push({
      type: fiveStarRate >= 80 ? 'positive' : fiveStarRate >= 50 ? 'suggestion' : 'negative',
      icon: fiveStarRate >= 80 ? CheckCircle : fiveStarRate >= 50 ? Lightbulb : AlertTriangle,
      title: 'Review Quality',
      description: fiveStarRate >= 80
        ? `Your 5-star rate is ${formatPercent(fiveStarRate)} — keep up the great work!`
        : `Your 5-star rate is ${formatPercent(fiveStarRate)}. Focus on exceeding buyer expectations to improve ratings.`,
    })
  }

  if (totalFeesPaid > 0) {
    insights.push({
      type: effectiveTakeRate <= FIVERR_FEE_RATE * 100 ? 'positive' : 'negative',
      icon: effectiveTakeRate <= FIVERR_FEE_RATE * 100 ? CheckCircle : AlertTriangle,
      title: 'Fee Analysis',
      description: `Fiverr fees totaled ${formatCurrency(totalFeesPaid / 100)} this period (${formatPercent(effectiveTakeRate)} of gross revenue).`,
    })
  }

  if (bestMonth && monthlyBuckets[bestMonth]) {
    const monthDate = new Date(bestMonth + '-01')
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    insights.push({
      type: 'positive',
      icon: Award,
      title: 'Best Performing Month',
      description: `Your busiest month was ${monthName} with ${formatCurrency(monthlyBuckets[bestMonth].earned / 100)} earned.`,
    })
  }

  if (topEarningType) {
    insights.push({
      type: 'suggestion',
      icon: Target,
      title: 'Top Revenue Category',
      description: `You earn the most from "${topEarningType[0]}" (${formatCurrency(topEarningType[1].total / 100)}). Focus marketing efforts here.`,
    })
  }

  if (notifications.length > 0) {
    insights.push({
      type: unreadCount > 5 ? 'warning' : 'positive',
      icon: unreadCount > 5 ? AlertTriangle : CheckCircle,
      title: 'Notification Activity',
      description: unreadCount > 0
        ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}. ${unreadCount > 5 ? 'Consider reviewing them to stay on top of buyer inquiries.' : 'Stay responsive to maintain your response rate.'}`
        : 'All caught up on notifications.',
    })
  }

  if (daysActive > 0) {
    const hasReviewText = reviews.some(r => r.text && r.text.length > 20)
    if (hasReviewText) {
      const positiveKeywords = ['great', 'amazing', 'excellent', 'perfect', 'love', 'fast', 'professional', 'recommend']
      const negativeKeywords = ['slow', 'poor', 'bad', 'terrible', 'awful', 'unresponsive', 'delay', 'issue']
      let positiveCount = 0
      let negativeCount = 0
      reviews.forEach(r => {
        const text = (r.text || '').toLowerCase()
        positiveKeywords.forEach(k => { if (text.includes(k)) positiveCount++ })
        negativeKeywords.forEach(k => { if (text.includes(k)) negativeCount++ })
      })
      if (positiveCount > 0 || negativeCount > 0) {
        const sentimentRatio = positiveCount / Math.max(1, positiveCount + negativeCount)
        insights.push({
          type: sentimentRatio >= 0.7 ? 'positive' : sentimentRatio >= 0.4 ? 'suggestion' : 'negative',
          icon: sentimentRatio >= 0.7 ? CheckCircle : AlertTriangle,
          title: 'Review Sentiment',
          description: sentimentRatio >= 0.7
            ? `Positive sentiment detected in ${formatPercent(sentimentRatio * 100)} of reviews. Buyers are happy with your service.`
            : `Only ${formatPercent(sentimentRatio * 100)} of reviews show positive sentiment. Consider addressing common feedback.`,
        })
      }
    }
  }

  const kpiItems = [
    { label: 'Revenue per Day', value: formatCurrency(revenuePerDay / 100) },
    { label: 'Orders per Month', value: formatNumber(Math.round(ordersPerMonth)) },
    { label: 'Average Rating', value: avgRating.toFixed(1) },
    { label: 'Fee to Revenue Ratio', value: formatPercent(effectiveTakeRate) },
    { label: 'Days Active on Fiverr', value: formatNumber(daysActive) },
    { label: 'Earnings Growth Rate', value: `${earningsGrowth >= 0 ? '+' : ''}${earningsGrowth.toFixed(1)}%` },
  ]

  const recommendations: { icon: React.ElementType; title: string; description: string }[] = []

  if (topEarningType) {
    recommendations.push({
      icon: Rocket,
      title: `Double down on "${topEarningType[0]}"`,
      description: `This category generates ${formatCurrency(topEarningType[1].total / 100)}. Create more offerings in this area to maximize revenue.`,
    })
  }

  if (buyerRetention < 30 && uniqueBuyers.length > 3) {
    recommendations.push({
      icon: Users,
      title: 'Improve buyer retention',
      description: `Only ${formatPercent(buyerRetention)} of your buyers return. Consider follow-up messages or loyalty discounts to encourage repeat business.`,
    })
  }

  if (avgRating < 4.5 && reviews.length > 0) {
    recommendations.push({
      icon: Star,
      title: 'Boost your rating',
      description: `Your average rating is ${avgRating.toFixed(1)}. Review feedback from lower-rated orders and address recurring issues.`,
    })
  }

  if (effectiveTakeRate > FIVERR_FEE_RATE * 100 + 2) {
    recommendations.push({
      icon: Shield,
      title: 'Optimize fee structure',
      description: `Your effective fee rate (${formatPercent(effectiveTakeRate)}) is above standard. Review your pricing to minimize fee impact.`,
    })
  }

  if (sortedMonths.length >= 2 && isMoMUp === false) {
    recommendations.push({
      icon: TrendingUp,
      title: 'Reverse the earnings trend',
      description: 'Your month-over-month earnings are declining. Consider promoting your gigs or updating your offerings.',
    })
  }

  const insightColorMap = {
    positive: { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-500' },
    warning: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    negative: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-500' },
    suggestion: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500' },
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-foreground" />
        <h2 className="text-lg font-bold text-foreground">AI Analytics & Insights</h2>
      </div>

      {/* Business Health Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative h-28 w-28">
              <Progress
                value={healthScore}
                className={cn("h-28 w-28 [&>*]:rounded-full", getProgressColor(healthScore))}
                style={{ transform: 'rotate(-90deg)' }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-3xl font-bold", getHealthColor(healthScore))}>
                  {healthScore}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  / 100
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Business Health Score</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {healthScore >= 70 ? 'Strong performance across all metrics' : healthScore >= 40 ? 'Room for improvement' : 'Requires attention'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {metricCards.map((card, i) => {
          const Icon = card.icon
          return (
            <Card key={i} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-[10px] text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">{card.value}</p>
              {card.trend && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {card.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                  {card.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                  {card.trend === 'neutral' && <Activity className="h-3 w-3 text-muted-foreground" />}
                  {card.trendValue && <span className="text-[10px] text-muted-foreground">{card.trendValue}</span>}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight, i) => {
              const colors = insightColorMap[insight.type]
              const Icon = insight.icon
              return (
                <div
                  key={i}
                  className={cn("flex items-start gap-3 p-3 rounded-lg border-l-4", colors.border, colors.bg)}
                >
                  <div className={cn("mt-0.5", colors.text)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{insight.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* KPIs Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Key Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {kpiItems.map((kpi, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-sm font-bold text-foreground">{kpi.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Rocket className="h-4 w-4 text-muted-foreground" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((rec, i) => {
              const Icon = rec.icon
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{rec.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
