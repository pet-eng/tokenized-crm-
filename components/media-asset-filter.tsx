'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MEDIA_ASSETS } from '@/lib/types'

interface MediaAssetFilterProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export function MediaAssetFilter({ value, onChange }: MediaAssetFilterProps) {
  return (
    <Tabs
      value={value || 'all'}
      onValueChange={(v) => onChange(v === 'all' ? undefined : v)}
    >
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        {MEDIA_ASSETS.map((asset) => (
          <TabsTrigger key={asset.id} value={asset.id}>
            {asset.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
