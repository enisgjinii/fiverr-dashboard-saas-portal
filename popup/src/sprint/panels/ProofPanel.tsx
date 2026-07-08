import { useMemo, useState } from 'react'
import { ImageIcon, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { GigTrack, ProofAsset, ProofAssetType } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { getTodayKey } from '../utils'
import { EmptyState, FilterBar } from '../components'

interface ProofPanelProps {
  proofAssets: ProofAsset[]
  gigs: GigTrack[]
  upsertProof: UseSprintStoreReturn['upsertProof']
  deleteProof: UseSprintStoreReturn['deleteProof']
}

type ProofForm = Partial<ProofAsset> & { title: string; type: ProofAssetType }

const proofTypes: ProofAssetType[] = [
  'profile_screenshot',
  'gig_screenshot',
  'demo_screenshot',
  'analytics_screenshot',
  'case_study',
  'video_proof',
  'thumbnail',
  'before_after',
]

const emptyProof = (): ProofForm => ({
  title: '',
  type: 'demo_screenshot',
  relatedGig: '',
  date: getTodayKey(),
  fileUrl: '',
  notes: '',
})

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <textarea
      className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function ProofPanel({ proofAssets, gigs, upsertProof, deleteProof }: ProofPanelProps) {
  const [form, setForm] = useState<ProofForm>(() => emptyProof())
  const [typeFilter, setTypeFilter] = useState<ProofAssetType | 'all'>('all')
  const [gigFilter, setGigFilter] = useState<string>('all')

  const visible = useMemo(
    () =>
      proofAssets.filter((asset) => {
        if (typeFilter !== 'all' && asset.type !== typeFilter) return false
        if (gigFilter !== 'all' && asset.relatedGig !== gigFilter) return false
        return true
      }),
    [gigFilter, proofAssets, typeFilter]
  )

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    await upsertProof(form)
    setForm(emptyProof())
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Add Proof Asset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-2">
          <div className="grid gap-3 md:grid-cols-5">
            <Input value={form.title} placeholder="Title" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ProofAssetType }))}>
              {proofTypes.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
            </select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.relatedGig ?? ''} onChange={(event) => setForm((current) => ({ ...current, relatedGig: event.target.value }))}>
              <option value="">No related gig</option>
              {gigs.map((gig) => <option key={gig.id} value={gig.id}>{gig.lane}</option>)}
            </select>
            <Input type="date" value={form.date ?? ''} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
            <Button onClick={handleSubmit}>Add Asset</Button>
          </div>
          <Input value={form.fileUrl ?? ''} placeholder="Asset URL" onChange={(event) => setForm((current) => ({ ...current, fileUrl: event.target.value }))} />
          <Textarea value={form.notes ?? ''} placeholder="Notes" onChange={(value) => setForm((current) => ({ ...current, notes: value }))} />
        </CardContent>
      </Card>

      <FilterBar>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as ProofAssetType | 'all')}>
          <option value="all">All types</option>
          {proofTypes.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
        </select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={gigFilter} onChange={(event) => setGigFilter(event.target.value)}>
          <option value="all">All gigs</option>
          {gigs.map((gig) => <option key={gig.id} value={gig.id}>{gig.lane}</option>)}
        </select>
        <Badge variant="outline">{visible.length} assets</Badge>
      </FilterBar>

      {visible.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="flex h-40 items-center justify-center bg-muted/40">
                {asset.fileUrl ? (
                  <img src={asset.fileUrl} alt={asset.title} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                )}
              </div>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{asset.title}</p>
                    <p className="text-xs text-muted-foreground">{asset.date}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteProof(asset.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{asset.type.replaceAll('_', ' ')}</Badge>
                  {asset.relatedGig && <Badge variant="secondary">{gigs.find((gig) => gig.id === asset.relatedGig)?.lane ?? asset.relatedGig}</Badge>}
                </div>
                {asset.notes && <p className="text-xs text-muted-foreground">{asset.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState title="No proof assets yet" desc="Add screenshots, thumbnails, case studies, and video proof as they are created." />
        </Card>
      )}
    </div>
  )
}
