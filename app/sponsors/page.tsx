'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSponsors, useUpdateSponsor, useDeleteSponsor, useCreateLead } from '@/lib/hooks'
import { SponsorForm } from '@/components/forms/sponsor-form'
import { MediaAssetFilter } from '@/components/media-asset-filter'
import { format, isBefore, startOfDay, addDays, differenceInDays } from 'date-fns'
import {
  Search,
  MoreHorizontal,
  Trash2,
  Edit,
  UserPlus,
} from 'lucide-react'

function formatCurrency(value: number | null) {
  if (!value) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default'
    case 'expired':
      return 'destructive'
    case 'renewed':
      return 'secondary'
    default:
      return 'outline'
  }
}

export default function SponsorsPage() {
  const [mediaAsset, setMediaAsset] = useState<string | undefined>(undefined)
  const { data: sponsors, isLoading } = useSponsors(mediaAsset)
  const updateSponsor = useUpdateSponsor()
  const deleteSponsor = useDeleteSponsor()
  const createLead = useCreateLead()
  const [search, setSearch] = useState('')

  const today = startOfDay(new Date())
  const thirtyDaysFromNow = addDays(today, 30)

  const handleStatusChange = async (sponsorId: string, status: string) => {
    await updateSponsor.mutateAsync({ id: sponsorId, data: { status } })
  }

  const handleDelete = async (sponsorId: string) => {
    if (confirm('Are you sure you want to delete this sponsor?')) {
      await deleteSponsor.mutateAsync(sponsorId)
    }
  }

  const handleConvertToLead = async (sponsor: NonNullable<typeof sponsors>[number]) => {
    const nextFollowUp = format(addDays(new Date(), 3), 'yyyy-MM-dd')
    await createLead.mutateAsync({
      name: sponsor.contact.name,
      company: sponsor.contact.company,
      email: sponsor.contact.email,
      phone: sponsor.contact.phone,
      notes: `Renewal from existing sponsorship (${formatCurrency(sponsor.value)})`,
      stage: 'new',
      value: sponsor.value,
      nextFollowUp,
      source: 'Renewal',
    })
    alert('Lead created for renewal outreach!')
  }

  const filteredSponsors = sponsors?.filter(
    (sponsor) =>
      sponsor.contact.name.toLowerCase().includes(search.toLowerCase()) ||
      sponsor.contact.company?.toLowerCase().includes(search.toLowerCase()) ||
      sponsor.contact.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Sponsors</h1>
          <p className="text-muted-foreground mt-1">
            Manage active sponsorships and contracts
          </p>
        </div>
        <SponsorForm />
      </div>

      <MediaAssetFilter value={mediaAsset} onChange={setMediaAsset} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Sponsors ({filteredSponsors?.length || 0})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sponsors..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Media Asset</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Contract Period</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSponsors?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No sponsors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSponsors?.map((sponsor) => {
                  const contractEnd = new Date(sponsor.contractEnd)
                  const isExpiring =
                    sponsor.status === 'active' &&
                    contractEnd >= today &&
                    contractEnd <= thirtyDaysFromNow
                  const isExpired =
                    sponsor.status === 'active' && isBefore(contractEnd, today)
                  const daysLeft = differenceInDays(contractEnd, today)

                  return (
                    <TableRow key={sponsor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sponsor.contact.company}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{sponsor.contact.name}</p>
                          {sponsor.contact.email && (
                            <p className="text-sm text-muted-foreground">
                              {sponsor.contact.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sponsor.mediaAssets.map((a) => (
                            <Badge key={a} variant="outline">{a}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 px-2">
                              <Badge variant={getStatusBadgeVariant(sponsor.status)}>
                                {sponsor.status.charAt(0).toUpperCase() + sponsor.status.slice(1)}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleStatusChange(sponsor.id, 'active')}>
                              Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(sponsor.id, 'expired')}>
                              Expired
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(sponsor.id, 'renewed')}>
                              Renewed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>{formatCurrency(sponsor.value)}</TableCell>
                      <TableCell>
                        <div>
                          <p>
                            {format(new Date(sponsor.contractStart), 'MMM d, yyyy')} -{' '}
                            {format(contractEnd, 'MMM d, yyyy')}
                          </p>
                          {isExpired ? (
                            <Badge variant="destructive" className="mt-1">
                              Expired
                            </Badge>
                          ) : isExpiring ? (
                            <Badge
                              variant={daysLeft <= 7 ? 'destructive' : 'secondary'}
                              className="mt-1"
                            >
                              {daysLeft === 0 ? 'Expires today' : `${daysLeft} days left`}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <SponsorForm
                              sponsor={sponsor}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuItem onClick={() => handleConvertToLead(sponsor)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Create Renewal Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(sponsor.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
