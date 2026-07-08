import React, { useState, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartCard, formatCurrency, formatNumber, kFormat, chartDefaults } from "@/components/ui/chart"
import { ShoppingCart, Search, Download, Filter, RefreshCw, Loader2, TrendingUp, ChevronDown, ChevronUp, DollarSign, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OrdersData, Transaction } from "@/types"

interface OrdersPanelProps {
  ordersData: OrdersData | null
  isFetching: boolean
  isOnFiverr: boolean
  onFetchOrders: () => void
}

function computeFee(orderNet: number): number {
  const gross = orderNet / 0.8
  return gross - orderNet
}

function computeGross(orderNet: number): number {
  return orderNet / 0.8
}

const ORDER_BUCKETS = [
  { key: "0-50", label: "$0-$50", min: 0, max: 50 },
  { key: "50-100", label: "$50-$100", min: 50, max: 100 },
  { key: "100-200", label: "$100-$200", min: 100, max: 200 },
  { key: "200-500", label: "$200-$500", min: 200, max: 500 },
  { key: "500+", label: "$500+", min: 500, max: Infinity },
]

export function OrdersPanel({ ordersData, isFetching, isOnFiverr, onFetchOrders }: OrdersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const txns: Transaction[] = useMemo(() => {
    if (!ordersData) return []
    return ordersData.transactions.filter(
      (t) => t.type === "EARNING" && t.order?.encryptedId
    )
  }, [ordersData])

  const filteredTxns = useMemo(() => {
    if (!searchQuery.trim()) return txns
    const q = searchQuery.toLowerCase()
    return txns.filter((t) => {
      const buyerName = t.order?.buyer?.username?.toLowerCase() ?? ""
      const orderId = t.order?.encryptedId?.toLowerCase() ?? ""
      return buyerName.includes(q) || orderId.includes(q)
    })
  }, [txns, searchQuery])

  const metrics = useMemo(() => {
    const totalNet = txns.reduce((sum, t) => sum + t.amount, 0)
    const totalFees = txns.reduce((sum) => sum + computeFee(sum), 0)
    const count = txns.length
    return {
      totalNet,
      totalFees,
      totalGross: totalNet / 0.8,
      avgOrder: count > 0 ? totalNet / count : 0,
      avgFee: count > 0 ? (totalNet / count) * 0.25 : 0,
      count,
    }
  }, [txns])

  const chartBuckets = useMemo(() => {
    const rawBuckets = ORDER_BUCKETS.map((b) => ({
      label: b.label,
      count: 0,
    }))
    for (const t of txns) {
      const netUsd = t.amount / 100
      for (let i = 0; i < ORDER_BUCKETS.length; i++) {
        const b = ORDER_BUCKETS[i]
        if (netUsd >= b.min && netUsd < b.max) {
          rawBuckets[i].count++
          break
        }
      }
    }
    return rawBuckets
  }, [txns])

  function toggleOrder(id: string) {
    setExpandedOrderId((prev) => (prev === id ? null : id))
  }

  if (isFetching) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ordersData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingCart className="h-12 w-12 mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-1">No orders data yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Fetch your Fiverr orders to see the breakdown.
          </p>
          <Button onClick={onFetchOrders} disabled={!isOnFiverr}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Fetch Orders
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Orders</h2>
          {ordersData.derivedFrom === "earnings" && (
            <Badge variant="outline" className="text-xs">
              Derived from earnings
            </Badge>
          )}
        </div>
        <Button onClick={onFetchOrders} disabled={isFetching || !isOnFiverr} size="sm">
          {isFetching ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              Fetch
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <div className="text-xl font-bold">
              {formatNumber(metrics.count)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Gross Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <div className="text-xl font-bold">
              {formatCurrency(metrics.totalGross / 100)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Fiverr Fees
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <div className="text-xl font-bold text-red-500">
              -{formatCurrency(metrics.totalFees / 100)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Net Received
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <div className="text-xl font-bold text-green-500">
              {formatCurrency(metrics.totalNet / 100)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Avg Net/Order
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <div className="text-xl font-bold">
              {formatCurrency(metrics.avgOrder / 100)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Avg Fee/Order
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <div className="text-xl font-bold text-red-500">
              {formatCurrency(metrics.avgFee / 100)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by buyer name or order ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <ChartCard title="Orders Value Distribution" icon={TrendingUp}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartBuckets} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={chartDefaults.tick} />
            <YAxis allowDecimals={false} tick={chartDefaults.tick} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: 13,
              }}
              formatter={(value: number) => [value, "Orders"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {chartBuckets.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === chartBuckets.length - 1 ? "hsl(var(--destructive))" : "hsl(var(--foreground))"}
                  fillOpacity={0.8 - i * 0.1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Orders ({filteredTxns.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[420px]">
            {filteredTxns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No matching orders</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTxns.map((txn) => {
                  const order = txn.order!
                  const netCents = txn.amount
                  const grossCents = computeGross(netCents)
                  const feeCents = computeFee(netCents)
                  const isExpanded = expandedOrderId === order.encryptedId
                  const buyerName = order.buyer?.username ?? "Unknown"
                  const avatarInitial = buyerName.charAt(0).toUpperCase()
                  const dateStr = order.date
                    ? new Date(order.date).toLocaleDateString()
                    : ""
                  return (
                    <div key={order.encryptedId}>
                      <button
                        onClick={() => toggleOrder(order.encryptedId)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {avatarInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {buyerName}
                            </span>
                            {txn.type && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {txn.type}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate font-mono">{order.encryptedId}</span>
                            {dateStr && <span>{dateStr}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-green-500">
                            {formatCurrency(netCents / 100)}
                          </div>
                          <div className="text-xs text-red-500">
                            -{formatCurrency(feeCents / 100)}
                          </div>
                        </div>
                        <div className="shrink-0 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 pt-1 bg-muted/20">
                          <div className="grid grid-cols-3 gap-4 rounded-md border p-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Gross</p>
                              <p className="font-medium">{formatCurrency(grossCents / 100)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Fee</p>
                              <p className="font-medium text-red-500">
                                -{formatCurrency(feeCents / 100)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Net</p>
                              <p className="font-medium text-green-500">
                                {formatCurrency(netCents / 100)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {metrics.count > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fee Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Gross</span>
                <span className="font-semibold">{formatCurrency(metrics.totalGross / 100)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fiverr Fee (20%)</span>
                <span className="font-semibold text-red-500">
                  -{formatCurrency(metrics.totalFees / 100)}
                </span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between text-sm">
                <span className="font-medium">Net Received</span>
                <span className="font-semibold text-green-500 text-base">
                  {formatCurrency(metrics.totalNet / 100)}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              You earned <span className="font-medium text-foreground">{formatCurrency(metrics.totalNet / 100)}</span> net from{" "}
              <span className="font-medium text-foreground">{formatNumber(metrics.count)}</span> orders.{" "}
              Fiverr took <span className="font-medium text-red-500">{formatCurrency(metrics.totalFees / 100)}</span> in fees (
              {metrics.totalGross > 0
                ? Math.round((metrics.totalFees / metrics.totalGross) * 100)
                : 0}
              %).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
