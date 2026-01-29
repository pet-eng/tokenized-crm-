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
import { useCreateSponsor, useUpdateSponsor } from '@/lib/hooks'
import { Sponsor, MEDIA_ASSETS } from '@/lib/types'
import { Plus } from 'lucide-react'
import { format, addMonths } from 'date-fns'

interface SponsorFormProps {
  sponsor?: Sponsor
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function SponsorForm({ sponsor, trigger, onSuccess }: SponsorFormProps) {
  const [open, setOpen] = useState(false)
  const createSponsor = useCreateSponsor()
  const updateSponsor = useUpdateSponsor()

  const today = format(new Date(), 'yyyy-MM-dd')
  const oneYearFromNow = format(addMonths(new Date(), 12), 'yyyy-MM-dd')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = Object.fromEntries(formData.entries())
    data.mediaAssets = formData.getAll('mediaAssets')

    if (sponsor) {
      await updateSponsor.mutateAsync({ id: sponsor.id, data })
    } else {
      await createSponsor.mutateAsync(data as Record<string, unknown>)
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
            Add Sponsor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{sponsor ? 'Edit Sponsor' : 'Add New Sponsor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contact Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={sponsor?.contact.name}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                name="company"
                defaultValue={sponsor?.contact.company || ''}
                required
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
                defaultValue={sponsor?.contact.email || ''}
                placeholder="john@acme.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={sponsor?.contact.phone || ''}
                placeholder="+1 555-1234"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractStart">Contract Start *</Label>
              <Input
                id="contractStart"
                name="contractStart"
                type="date"
                required
                defaultValue={
                  sponsor?.contractStart
                    ? format(new Date(sponsor.contractStart), 'yyyy-MM-dd')
                    : today
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractEnd">Contract End *</Label>
              <Input
                id="contractEnd"
                name="contractEnd"
                type="date"
                required
                defaultValue={
                  sponsor?.contractEnd
                    ? format(new Date(sponsor.contractEnd), 'yyyy-MM-dd')
                    : oneYearFromNow
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Contract Value ($)</Label>
              <Input
                id="value"
                name="value"
                type="number"
                defaultValue={sponsor?.value || ''}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label>Media Assets</Label>
              <div className="flex flex-wrap gap-3">
                {MEDIA_ASSETS.map((asset) => (
                  <label key={asset.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="mediaAssets"
                      value={asset.id}
                      defaultChecked={sponsor?.mediaAssets?.includes(asset.id) ?? asset.id === 'Tokenized'}
                      className="rounded border-input"
                    />
                    {asset.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={sponsor?.status || 'active'}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="renewed">Renewed</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={sponsor?.notes || ''}
              placeholder="Contract details, special terms, etc."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSponsor.isPending || updateSponsor.isPending}>
              {createSponsor.isPending || updateSponsor.isPending ? 'Saving...' : sponsor ? 'Update' : 'Add Sponsor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
