'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateLead, useCreateSponsor } from '@/lib/hooks'
import { MEDIA_ASSETS } from '@/lib/types'
import { format, addDays, addMonths } from 'date-fns'
import { Users, Building2, Upload, FileText, Loader2, X } from 'lucide-react'

interface ExtractedData {
  company?: string
  email?: string
  phone?: string
  value?: number
  notes?: string
  contractStart?: string
  contractEnd?: string
}

export default function QuickAddPage() {
  const router = useRouter()
  const createLead = useCreateLead()
  const createSponsor = useCreateSponsor()
  const [activeTab, setActiveTab] = useState('lead')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData>({})
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)

  const defaultFollowUp = format(addDays(new Date(), 3), 'yyyy-MM-dd')
  const today = format(new Date(), 'yyyy-MM-dd')
  const oneYearFromNow = format(addMonths(new Date(), 12), 'yyyy-MM-dd')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await processFile(file)
    }
  }, [activeTab])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }, [activeTab])

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setUploadedFile(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', activeTab)

      const response = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to parse document')
      }

      const data = await response.json()
      setExtractedData(data)
    } catch (error) {
      console.error('Error processing file:', error)
      alert(error instanceof Error ? error.message : 'Failed to process document. Make sure ANTHROPIC_API_KEY is set.')
    } finally {
      setIsProcessing(false)
    }
  }

  const clearUpload = () => {
    setUploadedFile(null)
    setExtractedData({})
  }

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    await createLead.mutateAsync(data)
    router.push('/leads')
  }

  const handleSponsorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    await createSponsor.mutateAsync(data)
    router.push('/sponsors')
  }

  const UploadZone = () => (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}
    >
      {isProcessing ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing document...</p>
        </div>
      ) : uploadedFile ? (
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{uploadedFile}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearUpload}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Drop a document here</p>
          <p className="text-xs text-muted-foreground mt-1">
            SOW, invoice, contract, or screenshot
          </p>
          <input
            type="file"
            accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </>
      )}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Quick Add</h1>
        <p className="text-muted-foreground mt-1">
          Drop a document or fill in manually
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); clearUpload(); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lead" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            New Lead
          </TabsTrigger>
          <TabsTrigger value="sponsor" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            New Sponsor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lead">
          <Card>
            <CardHeader>
              <CardTitle>Add New Lead</CardTitle>
              <CardDescription>
                Upload a document or fill in the form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <UploadZone />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {uploadedFile ? 'Review & Edit' : 'Or enter manually'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead-company">Company *</Label>
                    <Input
                      id="lead-company"
                      name="company"
                      required
                      placeholder="Acme Inc"
                      defaultValue={extractedData.company || ''}
                      key={`lead-company-${extractedData.company}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-mediaAsset">Media Asset</Label>
                    <select
                      id="lead-mediaAsset"
                      name="mediaAsset"
                      defaultValue="Tokenized"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {MEDIA_ASSETS.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-email">Email</Label>
                  <Input
                    id="lead-email"
                    name="email"
                    type="email"
                    placeholder="contact@acme.com"
                    defaultValue={extractedData.email || ''}
                    key={`lead-email-${extractedData.email}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead-value">Deal Value ($)</Label>
                    <Input
                      id="lead-value"
                      name="value"
                      type="number"
                      placeholder="10000"
                      defaultValue={extractedData.value || ''}
                      key={`lead-value-${extractedData.value}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-followup">Follow-up Date</Label>
                    <Input
                      id="lead-followup"
                      name="nextFollowUp"
                      type="date"
                      defaultValue={defaultFollowUp}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-notes">Notes</Label>
                  <textarea
                    id="lead-notes"
                    name="notes"
                    rows={3}
                    placeholder="Quick notes..."
                    defaultValue={extractedData.notes || ''}
                    key={`lead-notes-${extractedData.notes}`}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLead.isPending}>
                    {createLead.isPending ? 'Adding...' : 'Add Lead'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsor">
          <Card>
            <CardHeader>
              <CardTitle>Add New Sponsor</CardTitle>
              <CardDescription>
                Upload a contract/invoice or fill in the form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <UploadZone />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {uploadedFile ? 'Review & Edit' : 'Or enter manually'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSponsorSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sponsor-company">Company *</Label>
                    <Input
                      id="sponsor-company"
                      name="company"
                      required
                      placeholder="Acme Inc"
                      defaultValue={extractedData.company || ''}
                      key={`sponsor-company-${extractedData.company}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sponsor-mediaAsset">Media Asset</Label>
                    <select
                      id="sponsor-mediaAsset"
                      name="mediaAsset"
                      defaultValue="Tokenized"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {MEDIA_ASSETS.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sponsor-email">Email</Label>
                  <Input
                    id="sponsor-email"
                    name="email"
                    type="email"
                    placeholder="contact@acme.com"
                    defaultValue={extractedData.email || ''}
                    key={`sponsor-email-${extractedData.email}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sponsor-start">Contract Start *</Label>
                    <Input
                      id="sponsor-start"
                      name="contractStart"
                      type="date"
                      required
                      defaultValue={extractedData.contractStart || today}
                      key={`sponsor-start-${extractedData.contractStart}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sponsor-end">Contract End *</Label>
                    <Input
                      id="sponsor-end"
                      name="contractEnd"
                      type="date"
                      required
                      defaultValue={extractedData.contractEnd || oneYearFromNow}
                      key={`sponsor-end-${extractedData.contractEnd}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sponsor-value">Contract Value ($)</Label>
                  <Input
                    id="sponsor-value"
                    name="value"
                    type="number"
                    placeholder="50000"
                    defaultValue={extractedData.value || ''}
                    key={`sponsor-value-${extractedData.value}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sponsor-notes">Notes</Label>
                  <textarea
                    id="sponsor-notes"
                    name="notes"
                    rows={3}
                    placeholder="Contract details..."
                    defaultValue={extractedData.notes || ''}
                    key={`sponsor-notes-${extractedData.notes}`}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSponsor.isPending}>
                    {createSponsor.isPending ? 'Adding...' : 'Add Sponsor'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
