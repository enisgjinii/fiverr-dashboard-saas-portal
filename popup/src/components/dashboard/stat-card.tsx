import React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  sublabel?: string
  icon?: React.ElementType
  trend?: "up" | "down" | "neutral"
  trendLabel?: string
  accent?: "default" | "success" | "danger" | "warning" | "info"
  className?: string
  size?: "sm" | "md" | "lg"
}

const accentStyles = {
  default: "from-card to-card border-border",
  success: "from-green-500/10 to-emerald-500/5 border-green-500/20",
  danger: "from-red-500/10 to-rose-500/5 border-red-500/20",
  warning: "from-amber-500/10 to-orange-500/5 border-amber-500/20",
  info: "from-blue-500/10 to-cyan-500/5 border-blue-500/20",
}

const iconAccent = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-500/15 text-green-500",
  danger: "bg-red-500/15 text-red-500",
  warning: "bg-amber-500/15 text-amber-500",
  info: "bg-blue-500/15 text-blue-500",
}

const valueAccent = {
  default: "text-foreground",
  success: "text-green-500",
  danger: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
}

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  trend,
  trendLabel,
  accent = "default",
  className,
  size = "md",
}: StatCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 stat-glow transition-all hover:shadow-md",
        accentStyles[accent],
        size === "lg" && "p-5",
        size === "sm" && "p-3",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p
            className={cn(
              "font-tabular font-bold tracking-tight mt-1",
              valueAccent[accent],
              size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl"
            )}
          >
            {value}
          </p>
          {sublabel && <p className="text-xs text-muted-foreground mt-1 truncate">{sublabel}</p>}
        </div>
        {Icon && (
          <div className={cn("shrink-0 rounded-lg p-2.5", iconAccent[accent])}>
            <Icon className={cn(size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
          </div>
        )}
      </div>
      {trend && trendLabel && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/60">
          <TrendIcon
            className={cn(
              "h-3.5 w-3.5",
              trend === "up" && "text-green-500",
              trend === "down" && "text-red-500",
              trend === "neutral" && "text-muted-foreground"
            )}
          />
          <span className="text-[11px] text-muted-foreground">{trendLabel}</span>
        </div>
      )}
    </div>
  )
}
