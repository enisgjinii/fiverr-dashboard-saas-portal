import { useState } from 'react'
import {
  CheckCircle2, Cloud, CloudOff, Download, ExternalLink, Key, Link2, Loader2,
  RefreshCw, Shield, Upload, Zap, AlertTriangle, ListTodo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/dashboard/page-header'
import { MetricCard } from '../components'
import type { SprintStore } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { SPRINT_TITLE } from '../types'
import { maskApiKey } from '../todoist'
import type { useTodoist } from '../useTodoist'
import { formatShortDate } from '../utils'

type TodoistHook = ReturnType<typeof useTodoist>

interface TodoistPanelProps {
  data: SprintStore
  stats: NonNullable<UseSprintStoreReturn['stats']>
  todoist: TodoistHook
}

export function TodoistPanel({ data, stats, todoist }: TodoistPanelProps) {
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)

  const syncPercent = data.tasks.length
    ? Math.round((todoist.syncedCount / data.tasks.length) * 100)
    : 0

  const handleConnect = async () => {
    if (!apiKeyInput.trim()) return
    const ok = await todoist.connect(apiKeyInput.trim())
    if (ok) {
      setApiKeyInput('')
      await todoist.runSync('both')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Todoist Sync"
        description="Two-way sync between your Growth Sprint tasks and Todoist API v1"
        badge={
          todoist.connected ? (
            <Badge className="bg-green-600/90 gap-1">
              <Cloud className="h-3 w-3" /> Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <CloudOff className="h-3 w-3" /> Not connected
            </Badge>
          )
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Sprint Tasks" value={String(stats.total)} sub={`${stats.completed} done`} icon={ListTodo} />
        <MetricCard label="Synced" value={String(todoist.syncedCount)} sub={`${syncPercent}% linked`} icon={Link2} />
        <MetricCard label="Unsynced" value={String(todoist.unsyncedCount)} sub="need push" icon={Upload} />
        <MetricCard label="Days Left" value={String(stats.day.remaining)} sub={stats.phase.label} icon={Zap} />
      </div>

      {!todoist.connected ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5 text-primary" />
              Connect Todoist
            </CardTitle>
            <CardDescription>
              Paste your Todoist API token from Settings → Integrations → Developer. Stored locally in your browser only — never sent anywhere except Todoist.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm flex gap-2">
              <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                If you shared your API key in chat or committed it anywhere, regenerate it in Todoist after connecting.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="todoist-key">API Token</Label>
              <div className="flex gap-2">
                <Input
                  id="todoist-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder="Paste Todoist API token…"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleConnect()}
                />
                <Button variant="outline" size="sm" onClick={() => setShowKey(!showKey)}>
                  {showKey ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
            <Button onClick={() => void handleConnect()} disabled={!apiKeyInput.trim() || todoist.syncing}>
              {todoist.syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Cloud className="h-4 w-4 mr-2" />}
              Connect & Initial Sync
            </Button>
            {todoist.error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> {todoist.error}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Account</CardTitle>
                  <CardDescription>
                    {todoist.user?.full_name || 'Todoist user'} · {todoist.user?.email}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => void todoist.disconnect()}>
                  Disconnect
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">API Token</p>
                  <p className="font-mono mt-1">{maskApiKey(todoist.config?.apiKey ?? '')}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Project</p>
                  <p className="mt-1 font-medium">{SPRINT_TITLE}</p>
                  {todoist.config?.projectId && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {todoist.config.projectId}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sync coverage</span>
                  <span className="text-muted-foreground">{todoist.syncedCount}/{data.tasks.length} tasks</span>
                </div>
                <Progress value={syncPercent} className="h-2" />
              </div>

              {todoist.config?.lastSyncAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Last sync: {formatShortDate(todoist.config.lastSyncAt)} — {todoist.config.lastSyncMessage}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sync Controls</CardTitle>
              <CardDescription>
                Push sprint tasks to Todoist, pull remote changes, or run a full two-way sync.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void todoist.runSync('both')} disabled={todoist.syncing}>
                  {todoist.syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Two-way Sync
                </Button>
                <Button variant="outline" onClick={() => void todoist.runSync('push')} disabled={todoist.syncing}>
                  <Upload className="h-4 w-4 mr-2" /> Push to Todoist
                </Button>
                <Button variant="outline" onClick={() => void todoist.runSync('pull')} disabled={todoist.syncing}>
                  <Download className="h-4 w-4 mr-2" /> Pull from Todoist
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://todoist.com/app" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" /> Open Todoist
                  </a>
                </Button>
              </div>

              {todoist.lastResult && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><span className="text-muted-foreground">Pushed:</span> {todoist.lastResult.pushed}</div>
                  <div><span className="text-muted-foreground">Pulled:</span> {todoist.lastResult.pulled}</div>
                  <div><span className="text-muted-foreground">Updated:</span> {todoist.lastResult.updated}</div>
                  <div><span className="text-muted-foreground">Completed:</span> {todoist.lastResult.completed}</div>
                  {todoist.lastResult.errors.length > 0 && (
                    <div className="col-span-full text-red-500 text-xs mt-1">
                      {todoist.lastResult.errors.slice(0, 3).join(' · ')}
                    </div>
                  )}
                </div>
              )}

              {todoist.error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> {todoist.error}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Automation</CardTitle>
              <CardDescription>Control when tasks sync automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sync on task complete</p>
                  <p className="text-xs text-muted-foreground">Instantly close/update Todoist when you mark a sprint task done</p>
                </div>
                <Switch
                  checked={todoist.config?.syncOnComplete ?? true}
                  onCheckedChange={(v) => void todoist.updateConfig({ syncOnComplete: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-sync on dashboard load</p>
                  <p className="text-xs text-muted-foreground">Run two-way sync when opening Command Center (coming soon)</p>
                </div>
                <Switch
                  checked={todoist.config?.autoSync ?? true}
                  onCheckedChange={(v) => void todoist.updateConfig({ autoSync: v })}
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Section Mapping</CardTitle>
              <CardDescription>
                Sprint sections 00–09 are auto-created as Todoist sections in your project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(todoist.config?.sectionMap ?? {}).map(([section, todoistId]) => (
                  <div key={section} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span className="font-medium">Section {section}</span>
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{todoistId}</span>
                  </div>
                ))}
                {Object.keys(todoist.config?.sectionMap ?? {}).length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full">
                    Run a sync to create section mappings automatically.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
