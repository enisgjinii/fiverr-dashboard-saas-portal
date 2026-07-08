import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, Upload, Trash2, RefreshCw, Palette, FileJson, FileText, FileSpreadsheet, Info, Shield, ExternalLink, Moon, Sun, Monitor, Database, Clock, Bell, Eye } from "lucide-react"

interface SettingsPanelProps {
  isDark: boolean
  onToggleTheme: () => void
  onExportData: (format: "csv" | "json" | "txt") => void
  onClearCache: () => void
  earningsData: any
  ordersData: any
  reviewsData: any
  notificationsData: any
}

export function SettingsPanel({ isDark, onToggleTheme, onExportData, onClearCache, earningsData, ordersData, reviewsData, notificationsData }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = React.useState("appearance")
  const [autoRefresh, setAutoRefresh] = React.useState(false)
  const [refreshInterval, setRefreshInterval] = React.useState("30")

  const hasData = earningsData || ordersData || reviewsData || notificationsData
  const dataSize = [
    earningsData ? `Earnings: ${earningsData?.data?.transactions?.length || 0} transactions` : null,
    ordersData ? `Orders: ${ordersData?.transactions?.length || 0} orders` : null,
    reviewsData ? `Reviews: ${reviewsData?.total_count || reviewsData?.selling_reviews?.total_count || 0} reviews` : null,
    notificationsData ? `Notifications: ${notificationsData?.notifications?.length || 0} notifications` : null,
  ].filter(Boolean)

  const sections = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "export", label: "Export Data", icon: Download },
    { id: "data", label: "Data Management", icon: Database },
    { id: "preferences", label: "Preferences", icon: Eye },
    { id: "about", label: "About", icon: Info },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Settings</h3>
      </div>

      <div className="flex gap-4">
        <div className="w-40 shrink-0 space-y-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-all text-left ${activeSection === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          {activeSection === "appearance" && (
            <Card>
              <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Customize how the dashboard looks</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Dark Mode</Label>
                    <p className="text-[10px] text-muted-foreground">Toggle between light and dark theme</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <Switch checked={isDark} onCheckedChange={onToggleTheme} />
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-0.5">
                  <Label className="text-sm">Font</Label>
                  <p className="text-[10px] text-muted-foreground">Open Sans (system default)</p>
                </div>
                <Separator />
                <div className="space-y-0.5">
                  <Label className="text-sm">Color Scheme</Label>
                  <p className="text-[10px] text-muted-foreground">Black & White — minimal and focused</p>
                  <div className="flex gap-2 mt-2">
                    <div className="h-8 w-8 rounded-full border-2 border-primary bg-background" />
                    <div className="h-8 w-8 rounded-full border-2 border-border bg-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "export" && (
            <Card>
              <CardHeader><CardTitle>Export Data</CardTitle><CardDescription>Download your Fiverr data in various formats</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {dataSize.length > 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <p className="text-xs font-medium">Available Data</p>
                      {dataSize.map((d, i) => <p key={i} className="text-[10px] text-muted-foreground">• {d}</p>)}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => onExportData("json")}>
                        <FileJson className="h-5 w-5" />
                        <span className="text-[10px]">Export JSON</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => onExportData("csv")}>
                        <FileSpreadsheet className="h-5 w-5" />
                        <span className="text-[10px]">Export CSV</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => onExportData("txt")}>
                        <FileText className="h-5 w-5" />
                        <span className="text-[10px]">Export Text</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Download className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Fetch data from other sections first to export</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === "data" && (
            <Card>
              <CardHeader><CardTitle>Data Management</CardTitle><CardDescription>Manage your cached data and storage</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Clear All Cached Data</Label>
                    <p className="text-[10px] text-muted-foreground">Remove all fetched data from local storage</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={onClearCache}>
                    <Trash2 className="h-4 w-4 mr-1" /> Clear
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Auto-refresh Data</Label>
                    <p className="text-[10px] text-muted-foreground">Periodically fetch latest data from Fiverr</p>
                  </div>
                  <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                </div>
                {autoRefresh && (
                  <div className="flex items-center gap-3">
                    <Label className="text-xs shrink-0">Interval:</Label>
                    <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Select interval" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <Clock className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === "preferences" && (
            <Card>
              <CardHeader><CardTitle>Preferences</CardTitle><CardDescription>Configure your dashboard experience</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Default Dashboard View</Label>
                    <p className="text-[10px] text-muted-foreground">Which section to show on load</p>
                  </div>
                  <Select defaultValue="earnings">
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="earnings">Earnings</SelectItem>
                      <SelectItem value="orders">Orders</SelectItem>
                      <SelectItem value="reviews">Reviews</SelectItem>
                      <SelectItem value="insights">Insights</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Compact Mode</Label>
                    <p className="text-[10px] text-muted-foreground">Show more data with less spacing</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Show Charts</Label>
                    <p className="text-[10px] text-muted-foreground">Display visual charts in dashboard</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "about" && (
            <Card>
              <CardHeader><CardTitle>About</CardTitle><CardDescription>Fiverr Conversation Extractor</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-lg font-bold">Fiverr Dashboard</p>
                  <p className="text-xs text-muted-foreground">Version 2.0.0</p>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>A comprehensive Fiverr data analytics dashboard that extracts and visualizes your earnings, orders, reviews, and notifications.</p>
                  <p className="flex items-center gap-2"><Shield className="h-3 w-3" />All data stays local — nothing is sent to external servers</p>
                  <p className="flex items-center gap-2"><Database className="h-3 w-3" />Data is cached in Chrome's local storage</p>
                </div>
                <Separator />
                <div className="text-[10px] text-muted-foreground text-center">
                  <p>Built with React, Tailwind CSS, Shadcn UI, Recharts</p>
                  <p className="mt-1">Black &amp; White theme with Open Sans font</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
