'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStats, useLeads, useSponsors, useUpdateLead } from '@/lib/hooks'
import { LeadForm } from '@/components/forms/lead-form'
import { MediaAssetFilter } from '@/components/media-asset-filter'
import { CountdownTimer, ContractCountdown } from '@/components/countdown-timer'
import {
  Building2,
  DollarSign,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { format, isToday, isBefore, startOfDay, endOfDay, addDays, differenceInDays } from 'date-fns'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function Dashboard() {
  const [mediaAsset, setMediaAsset] = useState<string | undefined>(undefined)
  const { data: stats, isLoading: statsLoading } = useStats(mediaAsset)
  const { data: leads, isLoading: leadsLoading } = useLeads(mediaAsset)
  const { data: sponsors, isLoading: sponsorsLoading } = useSponsors(mediaAsset)
  const updateLead = useUpdateLead()

  const today = startOfDay(new Date())

  const overdueLeads = leads?.filter(
    (lead) =>
      lead.nextFollowUp &&
      isBefore(new Date(lead.nextFollowUp), today) &&
      lead.stage !== 'won' &&
      lead.stage !== 'lost' &&
      lead.stage !== 'on_hold'
  ) || []

  const todayLeads = leads?.filter(
    (lead) =>
      lead.nextFollowUp &&
      isToday(new Date(lead.nextFollowUp)) &&
      lead.stage !== 'won' &&
      lead.stage !== 'lost' &&
      lead.stage !== 'on_hold'
  ) || []

  const activeSponsors = sponsors?.filter((s) => s.status === 'active') || []
  const totalSponsorRevenue = activeSponsors.reduce((sum, s) => sum + (s.value || 0), 0)

  const handleSnooze = async (leadId: string) => {
    const nextFollowUp = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    await updateLead.mutateAsync({ id: leadId, data: { nextFollowUp } })
  }

  if (statsLoading || leadsLoading || sponsorsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <LeadForm />
      </div>

      <MediaAssetFilter value={mediaAsset} onChange={setMediaAsset} />

      {/* Revenue & Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Active Sponsor Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-700">
              {formatCurrency(totalSponsorRevenue)}
            </div>
            <p className="text-sm text-green-600 mt-1">
              from {activeSponsors.length} active sponsor{activeSponsors.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pipeline Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.pipelineValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalLeads || 0} active leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Needs Attention
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.overdueLeads || 0) + (stats?.leadsNeedingFollowUp || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              follow-ups pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sponsors */}
      {activeSponsors.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Active Sponsors
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeSponsors.map((sponsor) => {
              const contractEnd = new Date(sponsor.contractEnd)
              const contractStart = new Date(sponsor.contractStart)
              const totalDays = differenceInDays(contractEnd, contractStart)
              const daysElapsed = differenceInDays(today, contractStart)
              const progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100))
              const daysLeft = differenceInDays(contractEnd, today)
              const isExpiringSoon = daysLeft <= 30 && daysLeft >= 0

              return (
                <Card
                  key={sponsor.id}
                  className={isExpiringSoon ? 'border-orange-300 bg-orange-50/50' : ''}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{sponsor.contact.company}</h3>
                        <p className="text-sm text-muted-foreground">{sponsor.contact.email}</p>
                      </div>
                      {isExpiringSoon && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Expiring Soon
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-2xl font-bold text-green-600">
                            {formatCurrency(sponsor.value || 0)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            contract value
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Contract Progress</span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isExpiringSoon ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Time Remaining</p>
                          <ContractCountdown endDate={contractEnd} />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Ends</p>
                          <p className="font-medium">{format(contractEnd, 'MMM d, yyyy')}</p>
                        </div>
                      </div>

                      {sponsor.notes && (
                        <p className="text-sm text-muted-foreground pt-2 border-t line-clamp-2">
                          {sponsor.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Follow-ups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today&apos;s Follow-ups
              {todayLeads.length > 0 && (
                <Badge variant="secondary">{todayLeads.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayLeads.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No follow-ups scheduled for today
              </p>
            ) : (
              <div className="space-y-3">
                {todayLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{lead.contact.company || lead.contact.name}</p>
                          {lead.contact.company && lead.contact.name !== lead.contact.company && (
                            <p className="text-sm text-muted-foreground">
                              {lead.contact.name}
                            </p>
                          )}
                        </div>
                      </div>
                      {lead.followUpNotes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {lead.followUpNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Time left today</p>
                        <CountdownTimer targetDate={endOfDay(new Date())} />
                      </div>
                      <div className="flex items-center gap-1">
                        {lead.contact.email && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`mailto:${lead.contact.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {lead.contact.phone && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`tel:${lead.contact.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSnooze(lead.id)}
                        >
                          Tomorrow
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Overdue
              {overdueLeads.length > 0 && (
                <Badge variant="destructive">{overdueLeads.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueLeads.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No overdue follow-ups
              </p>
            ) : (
              <div className="space-y-3">
                {overdueLeads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                  >
                    <div>
                      <p className="font-medium">{lead.contact.company || lead.contact.name}</p>
                      {lead.contact.company && lead.contact.name !== lead.contact.company && (
                        <p className="text-sm text-muted-foreground">
                          {lead.contact.name}
                        </p>
                      )}
                      <p className="text-xs text-destructive mt-1 font-medium">
                        {Math.abs(
                          differenceInDays(new Date(lead.nextFollowUp!), today)
                        )}{' '}
                        days overdue
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSnooze(lead.id)}
                      >
                        Snooze
                      </Button>
                      <LeadForm
                        lead={lead}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
                {overdueLeads.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{overdueLeads.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
