import React, { useState, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartCard, formatCurrency, formatNumber, chartDefaults } from "@/components/ui/chart"
import { Bell, BellOff, RefreshCw, Loader2, CheckCheck, Mail, MailOpen, MessageSquare, DollarSign, Star, AlertTriangle, Info, Calendar, Clock, ArrowRight, Filter, Eye, EyeOff, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NotificationsData, Notification } from "@/types"

interface NotificationsPanelProps {
  notificationsData: NotificationsData | null
  isFetching: boolean
  isOnFiverr: boolean
  onFetchNotifications: () => void
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`
  return `${Math.floor(diffDay / 30)}mo ago`
}

function getDateGroup(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const oneWeekAgo = today - 6 * 86400000
  const dateTs = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

  if (dateTs === today) return "Today"
  if (dateTs === yesterday) return "Yesterday"
  if (dateTs >= oneWeekAgo) return "This Week"
  return "Earlier"
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "message":
      return <MessageSquare className="h-4 w-4" />
    case "order":
      return <DollarSign className="h-4 w-4" />
    case "review":
      return <Star className="h-4 w-4" />
    case "warning":
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <Info className="h-4 w-4" />
  }
}

function getNotificationTypeBadge(type: string) {
  const labels: Record<string, string> = {
    message: "Message",
    order: "Order",
    review: "Review",
    warning: "Warning",
    system: "System",
  }
  return labels[type] || type
}

const DATE_GROUP_ORDER = ["Today", "Yesterday", "This Week", "Earlier"]

function groupByDate(notifications: Notification[]): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>()
  for (const n of notifications) {
    const key = getDateGroup(n.createdAt || n.timestamp || "")
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(n)
  }
  return groups
}

function aggregateTrend(notifications: Notification[]): { date: string; count: number }[] {
  if (!notifications.length) return []
  const map = new Map<string, number>()
  for (const n of notifications) {
    const d = n.createdAt || n.timestamp || ""
    if (!d) continue
    const day = d.slice(0, 10)
    map.set(day, (map.get(day) || 0) + 1)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date: date.slice(5), count }))
}

export function NotificationsPanel({
  notificationsData,
  isFetching,
  isOnFiverr,
  onFetchNotifications,
}: NotificationsPanelProps) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [markedReadIds, setMarkedReadIds] = useState<Set<string>>(new Set())

  const notifications = notificationsData?.notifications || []
  const unreadCount = notificationsData?.unreadCount ?? 0
  const readCount = notifications.length - unreadCount

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const nId = n.id || ""
      const isUnread = !markedReadIds.has(nId) && !n.read
      if (statusFilter === "unread" && !isUnread) return false
      if (statusFilter === "read" && isUnread) return false
      if (typeFilter !== "all" && n.type !== typeFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const title = (n.title || "").toLowerCase()
        const message = (n.message || n.preview || "").toLowerCase()
        if (!title.includes(q) && !message.includes(q)) return false
      }
      return true
    })
  }, [notifications, statusFilter, typeFilter, searchQuery, markedReadIds])

  const trendData = useMemo(() => aggregateTrend(notifications), [notifications])
  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const markAsRead = (id: string) => {
    setMarkedReadIds((prev) => new Set(prev).add(id))
  }

  const markAllAsRead = () => {
    setMarkedReadIds((prev) => {
      const next = new Set(prev)
      for (const n of notifications) {
        const nId = n.id || ""
        if (!n.read) next.add(nId)
      }
      return next
    })
  }

  if (isFetching) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!notificationsData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">No notifications data yet</p>
        <Button onClick={onFetchNotifications} disabled={!isOnFiverr}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Fetch Notifications
        </Button>
        {!isOnFiverr && (
          <p className="text-xs text-muted-foreground mt-2">Navigate to Fiverr to enable fetching</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onFetchNotifications} disabled={!isOnFiverr}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold">{formatNumber(notifications.length)}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Unread</p>
            <p className="text-2xl font-bold text-primary">{formatNumber(unreadCount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Read</p>
            <p className="text-2xl font-bold">{formatNumber(readCount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
            <SelectItem value="read">Read Only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="message">Message</SelectItem>
            <SelectItem value="order">Order</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>

        <input
          type="text"
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex h-8 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />

        <Button variant="ghost" size="sm" className="h-8 ml-auto" onClick={markAllAsRead}>
          <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
          Mark All Read
        </Button>
      </div>

      {/* Notifications Timeline */}
      {filtered.length > 0 ? (
        <ScrollArea className="h-[360px] pr-2">
          <div className="space-y-1">
            {DATE_GROUP_ORDER.map((group) => {
              const items = grouped.get(group)
              if (!items?.length) return null
              return (
                <div key={group}>
                  <div className="sticky top-0 z-10 bg-background py-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {group}
                    </p>
                  </div>
                  {items.map((n) => {
                    const nId = n.id || ""
                    const isUnread = !markedReadIds.has(nId) && !n.read
                    const isExpanded = expandedIds.has(nId)
                    const icon = getNotificationIcon(n.type)
                    const timeStr = timeAgo(n.createdAt || n.timestamp || "")
                    return (
                      <div
                        key={nId}
                        className={cn(
                          "flex items-start gap-3 rounded-md p-3 transition-colors cursor-pointer hover:bg-accent/50",
                          isUnread && "border-l-2 border-l-primary bg-muted/30"
                        )}
                        onClick={() => toggleExpanded(nId)}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5",
                            isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-sm truncate",
                                isUnread && "font-semibold"
                              )}
                            >
                              {n.title || "Notification"}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {timeStr}
                              </span>
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                          </div>
                          {isExpanded ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              {n.message || n.preview || n.description || ""}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {n.message || n.preview || n.description || ""}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {getNotificationTypeBadge(n.type)}
                            </Badge>
                            {isUnread && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 text-[10px] px-1.5"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(nId)
                                }}
                              >
                                <MailOpen className="h-3 w-3 mr-1" />
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Filter className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No matching notifications</p>
          {(statusFilter !== "all" || typeFilter !== "all" || searchQuery) && (
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() => {
                setStatusFilter("all")
                setTypeFilter("all")
                setSearchQuery("")
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <ChartCard title="Notification Trend" className="mt-2">
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="notifGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  fill="url(#notifGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  )
}
