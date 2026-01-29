import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mediaAsset = searchParams.get('mediaAsset')

  const leads = await prisma.lead.findMany({
    where: mediaAsset ? { mediaAssets: { has: mediaAsset } } : undefined,
    include: { contact: true },
    orderBy: { nextFollowUp: 'asc' },
  })
  return NextResponse.json(leads)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, company, email, phone, notes, stage, value, probability, nextFollowUp, followUpNotes, source, holdReason, mediaAssets } = body

  const lead = await prisma.lead.create({
    data: {
      stage: stage || 'new',
      value: value ? parseFloat(value) : null,
      probability: probability ? parseInt(probability) : 50,
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
      followUpNotes,
      source,
      holdReason: holdReason || null,
      mediaAssets: mediaAssets && mediaAssets.length > 0 ? mediaAssets : ['Tokenized'],
      contact: {
        create: {
          name: name || company,
          company,
          email,
          phone,
          notes,
        },
      },
    },
    include: { contact: true },
  })

  return NextResponse.json(lead)
}
