import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { DollarSign, ShoppingCart, Star, Bell, Brain, Settings, ChevronLeft, ChevronRight, BarChart3, Home, RefreshCw, Download, Moon, Sun } from "lucide-react"

export type DashboardView = "earnings" | "orders" | "reviews" | "notifications" | "insights" | "settings"

interface SidebarProps {
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isDark: boolean
  onToggleTheme: () => void
  isOnFiverr: boolean
}

const navItems: { id: DashboardView; label: string; icon: React.ElementType; description: string }[] = [
  { id: "earnings", label: "Earnings", icon: DollarSign, description: "Revenue & transactions" },
  { id: "orders", label: "Orders", icon: ShoppingCart, description: "Order history" },
  { id: "reviews", label: "Reviews", icon: Star, description: "Ratings & feedback" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts & updates" },
  { id: "insights", label: "Insights", icon: Brain, description: "AI analytics" },
  { id: "settings", label: "Settings", icon: Settings, description: "Configuration" },
]

export function Sidebar({ activeView, onViewChange, isCollapsed, onToggleCollapse, isDark, onToggleTheme, isOnFiverr }: SidebarProps) {
  return (
    <div className={cn("relative flex flex-col border-r border-border bg-card transition-all duration-200", isCollapsed ? "w-14" : "w-52")}>
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center">
              <BarChart3 className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="text-xs font-bold">Fiverr Pro</span>
          </div>
        )}
        <button onClick={onToggleCollapse} className={cn("p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors", isCollapsed && "mx-auto")}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-all",
              activeView === item.id
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title={item.description}
          >
            <item.icon className={cn("h-4 w-4 shrink-0", activeView === item.id ? "" : "")} />
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <span>{item.label}</span>
                {activeView === item.id && <p className="text-[8px] opacity-70">{item.description}</p>}
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-2 border-t border-border space-y-1">
        <button
          onClick={onToggleTheme}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          )}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!isCollapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {!isCollapsed && (
          <div className={cn("px-3 py-2 rounded-md text-[9px]", isOnFiverr ? "text-green-500" : "text-muted-foreground")}>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", isOnFiverr ? "bg-green-500" : "bg-muted-foreground")} />
              {isOnFiverr ? "Connected to Fiverr" : "Not on Fiverr"}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
