import { CheckCircle2, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import type { ProfileChanges, SkillAction, SkillItem, SprintStore } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { RECOMMENDED_DESCRIPTION, RECOMMENDED_TITLE, TRUST_LINE } from '../seed'
import { computeProfileScore } from '../utils'

interface ProfilePanelProps {
  data: SprintStore
  profile: ProfileChanges
  skills: SkillItem[]
  updateProfile: UseSprintStoreReturn['updateProfile']
  updateSkill: UseSprintStoreReturn['updateSkill']
}

const skillActions: SkillAction[] = ['keep', 'review', 'remove']

function Textarea({
  value,
  onChange,
  rows = 5,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <textarea
      className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function ScreenshotPreview({ url, label }: { url: string; label: string }) {
  if (!url.trim()) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
        <ImageIcon className="mr-2 h-4 w-4" />
        {label} preview
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={label}
      className="h-36 w-full rounded-lg border object-cover"
      onError={(event) => {
        event.currentTarget.style.display = 'none'
      }}
    />
  )
}

export function ProfilePanel({ data, profile, skills, updateProfile, updateSkill }: ProfilePanelProps) {
  const score = profile.profileScore ?? computeProfileScore(data)
  const strongSkills = skills.filter((skill) => skill.category === 'strong')
  const weakSkills = skills.filter((skill) => skill.category === 'weak')

  return (
    <div className="space-y-5">
      <Card className="border-primary/20">
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_260px]">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge>Profile Cleanup</Badge>
              <Badge variant="outline">{strongSkills.length} strong skills</Badge>
              <Badge variant="outline">{weakSkills.length} weak skills</Badge>
            </div>
            <h2 className="text-xl font-bold">Fiverr Profile Readiness</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tighten positioning around Shopify configurators, AI automation, and custom portals.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completeness</span>
              <span className="font-bold">{score}%</span>
            </div>
            <Progress value={score} className="h-2" />
            <Button size="sm" className="w-full" onClick={() => updateProfile({ newTitle: RECOMMENDED_TITLE, newDescription: RECOMMENDED_DESCRIPTION, trustLine: TRUST_LINE })}>
              Apply Recommended Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Before</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            <Input value={profile.previousTitle} placeholder="Previous title" onChange={(event) => updateProfile({ previousTitle: event.target.value })} />
            <Textarea value={profile.previousDescription} placeholder="Previous description" onChange={(value) => updateProfile({ previousDescription: value })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">After</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            <Input value={profile.newTitle} placeholder="Recommended title" onChange={(event) => updateProfile({ newTitle: event.target.value })} />
            <Textarea value={profile.newDescription} placeholder="Recommended description" onChange={(value) => updateProfile({ newDescription: value })} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Trust & Cleanup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-2">
            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <input type="checkbox" checked={profile.trustLineAdded} onChange={(event) => updateProfile({ trustLineAdded: event.target.checked })} />
              <span>
                <span className="font-medium">Trust line added</span>
                <span className="mt-1 block text-xs text-muted-foreground">{profile.trustLine || TRUST_LINE}</span>
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <input type="checkbox" checked={profile.weakServicesRemoved} onChange={(event) => updateProfile({ weakServicesRemoved: event.target.checked })} />
              Weak/general services removed
            </label>
            <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <input type="checkbox" checked={profile.skillsUpdated} onChange={(event) => updateProfile({ skillsUpdated: event.target.checked })} />
              Skill list updated
            </label>
            <Textarea value={profile.notes} rows={4} placeholder="Profile notes" onChange={(value) => updateProfile({ notes: value })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Skills Matrix</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 p-4 pt-2 sm:grid-cols-2">
            {skills.map((skill) => (
              <div key={skill.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{skill.name}</p>
                  <Badge variant="outline" className={cn('text-[10px]', skill.category === 'weak' && 'border-amber-500/30 text-amber-500')}>
                    {skill.category}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {skillActions.map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant={skill.action === action ? 'default' : 'outline'}
                      className="h-7 flex-1 text-[11px]"
                      onClick={() => updateSkill(skill.id, { action })}
                    >
                      {action === skill.action && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Screenshots</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 pt-2 md:grid-cols-2">
          <div className="space-y-2">
            <Input value={profile.beforeScreenshotUrl} placeholder="Before screenshot URL" onChange={(event) => updateProfile({ beforeScreenshotUrl: event.target.value })} />
            <ScreenshotPreview url={profile.beforeScreenshotUrl} label="Before screenshot" />
          </div>
          <div className="space-y-2">
            <Input value={profile.afterScreenshotUrl} placeholder="After screenshot URL" onChange={(event) => updateProfile({ afterScreenshotUrl: event.target.value })} />
            <ScreenshotPreview url={profile.afterScreenshotUrl} label="After screenshot" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
