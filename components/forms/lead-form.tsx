'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useCreateLead, useUpdateLead } from '@/lib/hooks'
import { Lead, STAGES, MEDIA_ASSETS } from '@/lib/types'
import { Plus } from 'lucide-react'
import { format, addDays } from 'date-fns'

interface LeadFormProps {
  lead?: Lead
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function LeadForm({ lead, trigger, onSuccess }: LeadFormProps) {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState(lead?.stage || 'new')
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()

  const defaultFollowUp = format(addDays(new Date(), 3), 'yyyy-MM-dd')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    if (lead) {
      await updateLead.mutateAsync({ id: lead.id, data })
    } else {
      await createLead.mutateAsync(data)
    }

    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={lead?.contact.name}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                defaultValue={lead?.contact.company || ''}
                placeholder="Acme Inc"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={lead?.contact.email || ''}
                placeholder="john@acme.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={lead?.contact.phone || ''}
                placeholder="+1 555-1234"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Deal Value ($)</Label>
              <Input
                id="value"
                name="value"
                type="number"
                defaultValue={lead?.value || ''}
                placeholder="10000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <select
                id="stage"
                name="stage"
                defaultValue={lead?.stage || 'new'}
                onChange={(e) => setStage(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {STAGES.filter((s) => s.id !== 'won' && s.id !== 'lost').map(
                  (s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {stage === 'on_hold' && (
            <div className="space-y-2">
              <Label htmlFor="holdReason">Hold Reason</Label>
              <Input
                id="holdReason"
                name="holdReason"
                defaultValue={lead?.holdReason || ''}
                placeholder="e.g. Revisit Q3, budget cycle mismatch"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mediaAsset">Media Asset</Label>
              <select
                id="mediaAsset"
                name="mediaAsset"
                defaultValue={lead?.mediaAsset || 'Tokenized'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {MEDIA_ASSETS.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                defaultValue={lead?.source || ''}
                placeholder="Website, Referral, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextFollowUp">Next Follow-up</Label>
            <Input
              id="nextFollowUp"
              name="nextFollowUp"
              type="date"
              defaultValue={
                lead?.nextFollowUp
                  ? format(new Date(lead.nextFollowUp), 'yyyy-MM-dd')
                  : defaultFollowUp
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={lead?.contact.notes || ''}
              placeholder="Additional notes..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLead.isPending || updateLead.isPending}>
              {createLead.isPending || updateLead.isPending ? 'Saving...' : lead ? 'Update' : 'Add Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
