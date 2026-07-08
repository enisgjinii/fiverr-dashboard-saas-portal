import React, { useState, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartCard, formatCurrency, formatNumber, chartDefaults } from "@/components/ui/chart"
import { Star, StarHalf, MessageSquare, RefreshCw, Loader2, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, Quote, Search, Calendar, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReviewsData, Review, BreakdownItem } from "@/types"

interface ReviewsPanelProps {
  reviewsData: ReviewsData | null
  isFetching: boolean
  isOnFiverr: boolean
  onFetchReviews: () => void
}

const { colors, margin, textStyle, gridStyle } = chartDefaults

const STAR_COLORS: Record<number, string> = {
  5: colors.green,
  4: colors.gray,
  3: colors.yellow,
  2: colors.orange,
  1: colors.red,
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Rating" },
  { value: "lowest", label: "Lowest Rating" },
] as const

type SortOption = typeof SORT_OPTIONS[number]["value"]

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3 w-3"
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = i < rating
        return (
          <Star
            key={i}
            className={cn(sizeClass, fill ? "fill-yellow-500 text-yellow-500" : "fill-muted text-muted")}
          />
        )
      })}
    </div>
  )
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return dateStr
  }
}

export default function ReviewsPanel({ reviewsData, isFetching, isOnFiverr, onFetchReviews }: ReviewsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null)

  const computed = useMemo(() => {
    if (!reviewsData) return null

    const sellingReviews = reviewsData.selling_reviews
    const buyingReviews = reviewsData.buying_reviews

    const sellingList = sellingReviews?.reviews ?? []
    const buyingList = buyingReviews?.reviews ?? []
    const allReviews = [...sellingList, ...buyingList]

    const totalCount = sellingReviews?.total_count ?? buyingReviews?.total_count ?? reviewsData.total_count ?? allReviews.length
    const avgRating = sellingReviews?.average_valuation ?? buyingReviews?.average_valuation ?? reviewsData.average_valuation ?? 0
    const breakdown = sellingReviews?.breakdown ?? buyingReviews?.breakdown ?? []

    const fiveStarCount = breakdown.find(b => b.average_valuation_value === 5)?.count ?? 0
    const fiveStarPct = totalCount > 0 ? (fiveStarCount / totalCount) * 100 : 0

    const responseRate = null

    const monthlyTrend: Record<string, { total: number; count: number }> = {}
    allReviews.forEach(r => {
      if (!r.created_at) return
      const d = new Date(r.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!monthlyTrend[key]) monthlyTrend[key] = { total: 0, count: 0 }
      monthlyTrend[key].total += r.rating
      monthlyTrend[key].count++
    })

    const trendChartData = Object.entries(monthlyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        avgRating: data.count > 0 ? Number((data.total / data.count).toFixed(1)) : 0,
        count: data.count,
      }))

    const breakdownChartData = [5, 4, 3, 2, 1].map(star => {
      const item = breakdown.find(b => b.average_valuation_value === star)
      return {
        stars: `${star} Star`,
        starValue: star,
        count: item?.count ?? 0,
        percentage: item?.percentage ?? 0,
      }
    })

    return {
      sellingReviews,
      buyingReviews,
      allReviews,
      totalCount,
      avgRating,
      breakdown,
      fiveStarCount,
      fiveStarPct,
      responseRate,
      trendChartData,
      breakdownChartData,
    }
  }, [reviewsData])

  const filteredAndSorted = useMemo(() => {
    if (!computed) return []
    let list = computed.allReviews

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(r => {
        const text = r.text?.toLowerCase() ?? ""
        const buyer = r.buyer_username?.toLowerCase() ?? ""
        const seller = r.seller_username?.toLowerCase() ?? ""
        return text.includes(q) || buyer.includes(q) || seller.includes(q)
      })
    }

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "highest": return b.rating - a.rating
        case "lowest": return a.rating - b.rating
        default: return 0
      }
    })
  }, [computed, searchQuery, sortBy])

  function toggleExpand(id: string) {
    setExpandedReviewId(prev => prev === id ? null : id)
  }

  if (isFetching) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!computed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Star className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No reviews data yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Fetch your Fiverr reviews to see rating breakdowns, trends, and buyer feedback.
        </p>
        <Button onClick={onFetchReviews} disabled={!isOnFiverr} size="lg">
          {!isOnFiverr ? (
            <>Open Fiverr in a tab first</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-2" />Fetch Reviews</>
          )}
        </Button>
      </div>
    )
  }

  const {
    allReviews,
    totalCount,
    avgRating,
    fiveStarCount,
    fiveStarPct,
    responseRate,
    trendChartData,
    breakdownChartData,
  } = computed

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs space-y-1">
        <p className="font-medium text-popover-foreground">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Reviews</h2>
          <Badge variant="outline" className="text-xs">{totalCount}</Badge>
        </div>
        <Button onClick={onFetchReviews} disabled={isFetching || !isOnFiverr} size="sm">
          {isFetching ? (
            <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Fetching...</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-1" />Fetch</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
          <div className="flex justify-center mt-1">
            <StarRating rating={Math.round(avgRating)} size="md" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Average Rating</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold">{formatNumber(totalCount)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Total Reviews</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-green-500">{formatNumber(fiveStarCount)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{fiveStarPct.toFixed(1)}% are 5-star</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold">{responseRate !== null ? `${responseRate.toFixed(0)}%` : "N/A"}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Response Rate</p>
        </Card>
      </div>

      <ChartCard title="Rating Breakdown" subtitle="Distribution of star ratings">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={breakdownChartData} layout="vertical" margin={{ ...margin, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" tick={textStyle} axisLine={false} tickLine={false} width={40} />
            <YAxis type="category" dataKey="stars" tick={textStyle} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={28} name="Reviews">
              {breakdownChartData.map((entry) => (
                <Cell key={entry.starValue} fill={STAR_COLORS[entry.starValue] || colors.gray} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
          {breakdownChartData.map(entry => (
            <span key={entry.starValue} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: STAR_COLORS[entry.starValue] }} />
              {entry.starValue}★ {entry.count} ({entry.percentage.toFixed(1)}%)
            </span>
          ))}
        </div>
      </ChartCard>

      {trendChartData.length > 1 && (
        <ChartCard title="Rating Trend" subtitle="Average rating over time">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendChartData} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={textStyle} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={textStyle} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="avgRating" stroke={colors.primary} strokeWidth={2} dot={{ fill: colors.primary, r: 3 }} name="Avg Rating" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {trendChartData.length} months tracked
            </span>
          </div>
        </ChartCard>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Recent Reviews ({filteredAndSorted.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-7 w-40 rounded-md border border-input bg-background pl-7 pr-2 text-xs outline-none focus:border-ring"
                />
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="h-7 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-ring"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[420px]">
            {filteredAndSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No matching reviews</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredAndSorted.map(review => {
                  const isExpanded = expandedReviewId === review.id
                  const isLongReview = review.text && review.text.length > 200
                  const displayText = isExpanded || !isLongReview ? review.text : review.text.slice(0, 200) + "..."
                  const buyerInitial = review.buyer_username?.charAt(0).toUpperCase() ?? "?"
                  return (
                    <div key={review.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                          {buyerInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-medium truncate">{review.buyer_username || "Anonymous"}</span>
                              <StarRating rating={review.rating} />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(review.created_at)}
                              </span>
                              {review.order_id && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                                  #{review.order_id.slice(0, 8)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {review.text ? (
                            <div className="mt-1">
                              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                                <Quote className="h-3 w-3 inline-block mr-0.5 text-muted-foreground/50 -translate-y-0.5" />
                                {displayText}
                              </p>
                              {isLongReview && (
                                <button
                                  onClick={() => toggleExpand(review.id)}
                                  className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                                >
                                  {isExpanded ? "Show less" : "Read more"}
                                  <ArrowRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs italic text-muted-foreground/60 mt-1">No written review</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            Review Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-4 space-y-2">
            <p className="text-sm">
              You have <span className="font-semibold text-foreground">{formatNumber(totalCount)}</span> reviews with an average of{" "}
              <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span> stars.
            </p>
            <p className="text-sm">
              <span className="font-semibold text-green-500">{formatNumber(fiveStarCount)}</span> reviews are 5-star (
              <span className="font-semibold">{fiveStarPct.toFixed(1)}%</span>).
            </p>
            <p className="text-sm text-muted-foreground">
              {fiveStarPct >= 80
                ? "Excellent rating performance! Most buyers are highly satisfied."
                : fiveStarPct >= 50
                ? "Good rating profile. Focus on maintaining quality to increase 5-star reviews."
                : "Room for improvement in buyer satisfaction. Consider reviewing your service quality."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
