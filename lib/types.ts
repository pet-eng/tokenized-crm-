export interface Contact {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Lead {
  id: string
  contactId: string
  contact: Contact
  stage: string
  value: number | null
  probability: number | null
  nextFollowUp: string | null
  followUpNotes: string | null
  source: string | null
  holdReason: string | null
  mediaAssets: string[]
  createdAt: string
  updatedAt: string
}

export interface Sponsor {
  id: string
  contactId: string
  contact: Contact
  contractStart: string
  contractEnd: string
  value: number | null
  status: string
  notes: string | null
  mediaAssets: string[]
  createdAt: string
  updatedAt: string
}

export interface Stats {
  totalLeads: number
  activeSponsors: number
  leadsNeedingFollowUp: number
  overdueLeads: number
  expiringSoon: number
  pipelineValue: number
}

export const MEDIA_ASSETS = [
  { id: 'Tokenized', label: 'Tokenized' },
  { id: 'Sporting Crypto', label: 'Sporting Crypto' },
  { id: 'Fintech Brainfood', label: 'Fintech Brainfood' },
  { id: 'Predicted', label: 'Predicted' },
] as const

export type MediaAsset = typeof MEDIA_ASSETS[number]['id']

export const STAGES = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'on_hold', label: 'On Hold' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
] as const

export type Stage = typeof STAGES[number]['id']
