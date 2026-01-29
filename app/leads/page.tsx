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
import { useLeads, useUpdateLead, useDeleteLead } from '@/lib/hooks'
import { LeadForm } from '@/components/forms/lead-form'
import { MediaAssetFilter } from '@/components/media-asset-filter'
import { STAGES } from '@/lib/types'
import { format, isBefore, startOfDay, isToday } from 'date-fns'
import {
  Search,
  MoreHorizontal,
  ArrowUpDown,
  Trash2,
  Edit,
  Calendar,
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

function getStageLabel(stageId: string) {
  return STAGES.find((s) => s.id === stageId)?.label || stageId
}

function getStageBadgeVariant(stage: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (stage) {
    case 'won':
      return 'default'
    case 'lost':
      return 'destructive'
    case 'on_hold':
    case 'proposal':
    case 'negotiation':
      return 'secondary'
    default:
      return 'outline'
  }
}

type SortField = 'name' | 'value' | 'stage' | 'nextFollowUp'
type SortDirection = 'asc' | 'desc'

export default function LeadsPage() {
  const [mediaAsset, setMediaAsset] = useState<string | undefined>(undefined)
  const { data: leads, isLoading } = useLeads(mediaAsset)
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('nextFollowUp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const today = startOfDay(new Date())

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleStageChange = async (leadId: string, stage: string) => {
    await updateLead.mutateAsync({ id: leadId, data: { stage } })
  }

  const handleDelete = async (leadId: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      await deleteLead.mutateAsync(leadId)
    }
  }

  const filteredLeads = leads
    ?.filter(
      (lead) =>
        lead.contact.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.contact.company?.toLowerCase().includes(search.toLowerCase()) ||
        lead.contact.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.contact.name.localeCompare(b.contact.name)
          break
        case 'value':
          comparison = (a.value || 0) - (b.value || 0)
          break
        case 'stage':
          const stageOrder = STAGES.map((s) => s.id as string)
          comparison = stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage)
          break
        case 'nextFollowUp':
          if (!a.nextFollowUp && !b.nextFollowUp) comparison = 0
          else if (!a.nextFollowUp) comparison = 1
          else if (!b.nextFollowUp) comparison = -1
          else comparison = new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime()
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

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
          <h1 className="text-3xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Manage your sales pipeline
          </p>
        </div>
        <LeadForm />
      </div>

      <MediaAssetFilter value={mediaAsset} onChange={setMediaAsset} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Leads ({filteredLeads?.length || 0})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
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
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Media Asset</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => handleSort('stage')}
                  >
                    Stage
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Hold Reason</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => handleSort('value')}
                  >
                    Value
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => handleSort('nextFollowUp')}
                  >
                    Follow-up
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads?.map((lead) => {
                  const isOverdue =
                    lead.nextFollowUp &&
                    isBefore(new Date(lead.nextFollowUp), today) &&
                    lead.stage !== 'won' &&
                    lead.stage !== 'lost' &&
                    lead.stage !== 'on_hold'
                  const isDueToday =
                    lead.nextFollowUp &&
                    isToday(new Date(lead.nextFollowUp)) &&
                    lead.stage !== 'won' &&
                    lead.stage !== 'lost' &&
                    lead.stage !== 'on_hold'

                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.contact.name}</p>
                          {lead.contact.email && (
                            <p className="text-sm text-muted-foreground">
                              {lead.contact.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{lead.contact.company || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.mediaAsset}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 px-2">
                              <Badge variant={getStageBadgeVariant(lead.stage)}>
                                {getStageLabel(lead.stage)}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {STAGES.map((stage) => (
                              <DropdownMenuItem
                                key={stage.id}
                                onClick={() => handleStageChange(lead.id, stage.id)}
                              >
                                {stage.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        {lead.stage === 'on_hold' && lead.holdReason ? (
                          <span className="text-sm text-amber-600 italic">{lead.holdReason}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(lead.value)}</TableCell>
                      <TableCell>
                        {lead.nextFollowUp ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span
                              className={
                                isOverdue
                                  ? 'text-destructive'
                                  : isDueToday
                                  ? 'text-primary font-medium'
                                  : ''
                              }
                            >
                              {format(new Date(lead.nextFollowUp), 'MMM d, yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <LeadForm
                              lead={lead}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(lead.id)}
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
