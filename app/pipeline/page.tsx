'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLeads, useUpdateLead } from '@/lib/hooks'
import { LeadForm } from '@/components/forms/lead-form'
import { MediaAssetFilter } from '@/components/media-asset-filter'
import { STAGES } from '@/lib/types'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { format, isBefore, startOfDay, isToday, addDays } from 'date-fns'
import { Calendar, DollarSign, AlertCircle } from 'lucide-react'

function formatCurrency(value: number | null) {
  if (!value) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const ACTIVE_STAGES = STAGES.filter((s) => s.id !== 'won' && s.id !== 'lost' && s.id !== 'on_hold')

export default function PipelinePage() {
  const [mediaAsset, setMediaAsset] = useState<string | undefined>(undefined)
  const { data: leads, isLoading } = useLeads(mediaAsset)
  const updateLead = useUpdateLead()

  const today = startOfDay(new Date())

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const leadId = result.draggableId
    const newStage = result.destination.droppableId

    await updateLead.mutateAsync({ id: leadId, data: { stage: newStage } })
  }

  const handleScheduleFollowUp = async (leadId: string) => {
    const nextFollowUp = format(addDays(new Date(), 3), 'yyyy-MM-dd')
    await updateLead.mutateAsync({ id: leadId, data: { nextFollowUp } })
  }

  const getLeadsByStage = (stageId: string) => {
    return leads?.filter((lead) => lead.stage === stageId) || []
  }

  const getStageValue = (stageId: string) => {
    const stageLeads = getLeadsByStage(stageId)
    return stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
  }

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
          <h1 className="text-3xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Drag and drop leads between stages
          </p>
        </div>
        <LeadForm />
      </div>

      <MediaAssetFilter value={mediaAsset} onChange={setMediaAsset} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ACTIVE_STAGES.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id)
            const stageValue = getStageValue(stage.id)

            return (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {stage.label}
                      </CardTitle>
                      <Badge variant="secondary">{stageLeads.length}</Badge>
                    </div>
                    {stageValue > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(stageValue)}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] space-y-2 rounded-lg p-2 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-muted' : ''
                          }`}
                        >
                          {stageLeads.map((lead, index) => {
                            const isOverdue =
                              lead.nextFollowUp &&
                              isBefore(new Date(lead.nextFollowUp), today)
                            const isDueToday =
                              lead.nextFollowUp &&
                              isToday(new Date(lead.nextFollowUp))

                            return (
                              <Draggable
                                key={lead.id}
                                draggableId={lead.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`rounded-lg border bg-card p-3 shadow-sm transition-shadow ${
                                      snapshot.isDragging ? 'shadow-lg' : ''
                                    } ${isOverdue ? 'border-destructive/50' : ''}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">
                                          {lead.contact.name}
                                        </p>
                                        {lead.contact.company && (
                                          <p className="text-sm text-muted-foreground truncate">
                                            {lead.contact.company}
                                          </p>
                                        )}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {lead.mediaAssets.map((a) => (
                                            <Badge key={a} variant="outline" className="text-xs">
                                              {a}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                      <LeadForm
                                        lead={lead}
                                        trigger={
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                          >
                                            <span className="sr-only">Edit</span>
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="h-3 w-3"
                                            >
                                              <path d="M12 20h9" />
                                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                            </svg>
                                          </Button>
                                        }
                                      />
                                    </div>

                                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                      {lead.value && (
                                        <div className="flex items-center gap-1">
                                          <DollarSign className="h-3 w-3" />
                                          {formatCurrency(lead.value)}
                                        </div>
                                      )}
                                      {lead.nextFollowUp ? (
                                        <div
                                          className={`flex items-center gap-1 ${
                                            isOverdue
                                              ? 'text-destructive'
                                              : isDueToday
                                              ? 'text-primary font-medium'
                                              : ''
                                          }`}
                                        >
                                          {isOverdue && (
                                            <AlertCircle className="h-3 w-3" />
                                          )}
                                          <Calendar className="h-3 w-3" />
                                          {format(
                                            new Date(lead.nextFollowUp),
                                            'MMM d'
                                          )}
                                        </div>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 px-1 text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleScheduleFollowUp(lead.id)
                                          }}
                                        >
                                          + Follow-up
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            )
          })}

          {/* On Hold column */}
          <div className="flex-shrink-0 w-72">
            <Card className="h-full bg-amber-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-amber-700">
                    On Hold
                  </CardTitle>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    {getLeadsByStage('on_hold').length}
                  </Badge>
                </div>
                {getStageValue('on_hold') > 0 && (
                  <p className="text-xs text-amber-600">
                    {formatCurrency(getStageValue('on_hold'))}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <Droppable droppableId="on_hold">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[100px] space-y-2 rounded-lg p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-amber-100' : ''
                      }`}
                    >
                      {getLeadsByStage('on_hold').map((lead, index) => (
                        <Draggable
                          key={lead.id}
                          draggableId={lead.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="rounded-lg border border-amber-200 bg-white p-2 text-sm"
                            >
                              <p className="font-medium">{lead.contact.name}</p>
                              {lead.contact.company && (
                                <p className="text-muted-foreground text-xs">
                                  {lead.contact.company}
                                </p>
                              )}
                              {lead.holdReason && (
                                <p className="text-xs text-amber-600 mt-1 italic">
                                  {lead.holdReason}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>

          {/* Won/Lost columns */}
          <div className="flex-shrink-0 w-72">
            <Card className="h-full bg-green-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-green-700">
                    Won
                  </CardTitle>
                  <Badge variant="default" className="bg-green-600">
                    {getLeadsByStage('won').length}
                  </Badge>
                </div>
                {getStageValue('won') > 0 && (
                  <p className="text-xs text-green-600">
                    {formatCurrency(getStageValue('won'))}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <Droppable droppableId="won">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[100px] space-y-2 rounded-lg p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-green-100' : ''
                      }`}
                    >
                      {getLeadsByStage('won').map((lead, index) => (
                        <Draggable
                          key={lead.id}
                          draggableId={lead.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="rounded-lg border border-green-200 bg-white p-2 text-sm"
                            >
                              <p className="font-medium">{lead.contact.name}</p>
                              {lead.value && (
                                <p className="text-green-600">
                                  {formatCurrency(lead.value)}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>

          <div className="flex-shrink-0 w-72">
            <Card className="h-full bg-red-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-red-700">
                    Lost
                  </CardTitle>
                  <Badge variant="destructive">
                    {getLeadsByStage('lost').length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Droppable droppableId="lost">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[100px] space-y-2 rounded-lg p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-red-100' : ''
                      }`}
                    >
                      {getLeadsByStage('lost').map((lead, index) => (
                        <Draggable
                          key={lead.id}
                          draggableId={lead.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="rounded-lg border border-red-200 bg-white p-2 text-sm"
                            >
                              <p className="font-medium">{lead.contact.name}</p>
                              {lead.contact.company && (
                                <p className="text-muted-foreground text-xs">
                                  {lead.contact.company}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}
