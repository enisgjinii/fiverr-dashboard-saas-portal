import React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DollarSign, ShoppingCart, Star, Bell, Brain, Settings, ChevronLeft, ChevronRight,
  BarChart3, Home, RefreshCw, Moon, Sun, Zap, Users, MessageCircle, Bot,
  AlertTriangle, Rocket, Download, Database, LogOut, User, Loader2, CheckCircle2,
  AlertCircle, Play, Pause, MessageSquare,
} from "lucide-react"

export type DashboardView =
  | "overview"
  | "contacts"
  | "conversation"
  | "ai"
  | "risks"
  | "opportunities"
  | "orders"
  | "earnings"
  | "reviews"
  | "notifications"
  | "insights"
  | "stats"
  | "export"
  | "settings"

interface NavItem {
  id: DashboardView
  label: string
  icon: React.ElementType
  badge?: number
}

interface NavGroup {
  label: string
  items: NavItem[]
}

interface DashboardShellProps {
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isDark: boolean
  onToggleTheme: () => void
  isOnFiverr: boolean
  isLive: boolean
  onToggleLive: () => void
  currentUser: { username: string; email?: string }
  onLogout: () => void
  status: { message: string; type: "success" | "error" | "progress" | "idle" }
  lastSync: number
  currentTime: Date
  isFetchingData: boolean
  isLoading: boolean
  onFetchAll: () => void
  onFetchContacts: () => void
  onExtractChat: () => void
  children: React.ReactNode
  headerActions?: React.ReactNode
  pageTitle?: string
  pageBadge?: React.ReactNode
  navBadges?: Partial<Record<DashboardView, number>>
}

const navGroups: NavGroup[] = [
  {
    label: "Home",
    items: [
      { id: "overview", label: "Overview", icon: Home },
      { id: "insights", label: "Insights", icon: Brain },
    ],
  },
  {
    label: "Revenue",
    items: [
      { id: "earnings", label: "Earnings", icon: DollarSign },
      { id: "orders", label: "Orders", icon: ShoppingCart },
      { id: "reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Conversations",
    items: [
      { id: "contacts", label: "Contacts", icon: Users },
      { id: "conversation", label: "Messages", icon: MessageCircle },
      { id: "ai", label: "AI Analysis", icon: Bot },
      { id: "risks", label: "Risks", icon: AlertTriangle },
      { id: "opportunities", label: "Opportunities", icon: Rocket },
    ],
  },
  {
    label: "More",
    items: [
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "stats", label: "Statistics", icon: BarChart3 },
      { id: "export", label: "Export", icon: Download },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
]

function getViewLabel(view: DashboardView): string {
  for (const group of navGroups) {
    const item = group.items.find((i) => i.id === view)
    if (item) return item.label
  }
  return view
}

function StatusIcon({ type }: { type: string }) {
  switch (type) {
    case "success":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
    case "progress":
      return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
    default:
      return null
  }
}

export function DashboardShell({
  activeView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  isDark,
  onToggleTheme,
  isOnFiverr,
  isLive,
  onToggleLive,
  currentUser,
  onLogout,
  status,
  lastSync,
  currentTime,
  isFetchingData,
  isLoading,
  onFetchAll,
  onFetchContacts,
  onExtractChat,
  children,
  headerActions,
  pageTitle,
  pageBadge,
  navBadges,
}: DashboardShellProps) {
  const title = pageTitle ?? getViewLabel(activeView)

  return (
    <div className={cn("flex h-screen overflow-hidden", isDark && "dark")}>
      {/* Sidebar */}
      <aside
        className={cn(
          "relative flex flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-all duration-300 z-20",
          isCollapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                <Zap className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">Fiverr Pro</p>
                <p className="text-[10px] text-muted-foreground">Analytics Dashboard</p>
              </div>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className={cn(
              "p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Connection status */}
        {!isCollapsed && (
          <div className="px-3 py-2.5 border-b border-border space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isOnFiverr ? "bg-green-500 animate-pulse shadow-[0_0_8px] shadow-green-500/50" : "bg-red-500"
                  )}
                />
                <span className={isOnFiverr ? "text-green-500 font-medium" : "text-muted-foreground"}>
                  {isOnFiverr ? "Connected" : "Disconnected"}
                </span>
              </span>
              <span className="text-muted-foreground font-tabular">{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{currentUser.username}</span>
            </div>
            {status.message && (
              <div
                className={cn(
                  "p-2 rounded-lg text-[11px] flex items-center gap-1.5",
                  status.type === "error" && "bg-red-500/10 text-red-500",
                  status.type === "success" && "bg-green-500/10 text-green-600",
                  status.type === "progress" && "bg-primary/10 text-primary"
                )}
              >
                <StatusIcon type={status.type} />
                <span className="truncate">{status.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!isCollapsed && (
                  <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeView === item.id
                    const badge = navBadges?.[item.id]
                    return (
                      <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        title={item.label}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {badge !== undefined && badge > 0 && (
                              <Badge
                                variant={isActive ? "secondary" : "outline"}
                                className="text-[10px] h-5 px-1.5"
                              >
                                {badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-border space-y-2">
          {!isCollapsed ? (
            <>
              <Button
                onClick={onFetchAll}
                disabled={isFetchingData || !isOnFiverr}
                className="w-full"
                size="sm"
              >
                {isFetchingData ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Sync All Data
              </Button>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  onClick={onFetchContacts}
                  disabled={isLoading || !isOnFiverr}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Contacts
                </Button>
                <Button
                  onClick={onExtractChat}
                  disabled={isLoading || !isOnFiverr}
                  variant="outline"
                  size="sm"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  Extract
                </Button>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={onToggleTheme}>
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button
                  variant={isLive ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={onToggleLive}
                >
                  {isLive ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                  Live
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <button
              onClick={onToggleCollapse}
              className="w-full p-2 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <ChevronRight className="h-4 w-4 mx-auto rotate-180" />
            </button>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden gradient-mesh">
        {/* Top bar */}
        <header className="shrink-0 h-16 border-b border-border glass-panel flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-semibold truncate">{title}</h2>
            {pageBadge}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {headerActions}
            <Badge
              variant={isLive ? "default" : "secondary"}
              className="text-xs flex items-center gap-1.5 hidden sm:flex"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isLive ? "bg-red-400 animate-pulse" : "bg-muted-foreground"
                )}
              />
              {isLive ? "Live" : "Offline"}
            </Badge>
            <span className="text-xs text-muted-foreground hidden md:block font-tabular">
              Synced {lastSync ? new Date(lastSync).toLocaleTimeString() : "never"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <ScrollArea className="flex-1">
          <main className="p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</main>
        </ScrollArea>
      </div>
    </div>
  )
}

export { navGroups, getViewLabel }
