'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lead, Sponsor, Stats } from './types'

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export function useLeads(mediaAsset?: string) {
  return useQuery({
    queryKey: ['leads', mediaAsset],
    queryFn: () => fetchJSON<Lead[]>(
      mediaAsset ? `/api/leads?mediaAsset=${encodeURIComponent(mediaAsset)}` : '/api/leads'
    ),
  })
}

export function useSponsors(mediaAsset?: string) {
  return useQuery({
    queryKey: ['sponsors', mediaAsset],
    queryFn: () => fetchJSON<Sponsor[]>(
      mediaAsset ? `/api/sponsors?mediaAsset=${encodeURIComponent(mediaAsset)}` : '/api/sponsors'
    ),
  })
}

export function useStats(mediaAsset?: string) {
  return useQuery({
    queryKey: ['stats', mediaAsset],
    queryFn: () => fetchJSON<Stats>(
      mediaAsset ? `/api/stats?mediaAsset=${encodeURIComponent(mediaAsset)}` : '/api/stats'
    ),
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchJSON<Lead>('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetchJSON<Lead>(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON(`/api/leads/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useCreateSponsor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchJSON<Sponsor>('/api/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useUpdateSponsor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetchJSON<Sponsor>(`/api/sponsors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useDeleteSponsor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON(`/api/sponsors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
