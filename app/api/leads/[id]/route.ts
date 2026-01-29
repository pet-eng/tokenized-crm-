import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { contact: true },
  })

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  return NextResponse.json(lead)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { stage, value, probability, nextFollowUp, followUpNotes, source, holdReason, mediaAssets, name, company, email, phone, notes } = body

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      stage,
      value: value !== undefined ? (value ? parseFloat(value) : null) : undefined,
      probability: probability !== undefined ? (probability ? parseInt(probability) : null) : undefined,
      nextFollowUp: nextFollowUp !== undefined ? (nextFollowUp ? new Date(nextFollowUp) : null) : undefined,
      followUpNotes,
      source,
      holdReason,
      mediaAssets,
      contact: (name || company || email || phone || notes !== undefined) ? {
        update: {
          name,
          company,
          email,
          phone,
          notes,
        },
      } : undefined,
    },
    include: { contact: true },
  })

  return NextResponse.json(lead)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const lead = await prisma.lead.findUnique({
    where: { id },
  })

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  await prisma.lead.delete({ where: { id } })
  await prisma.contact.delete({ where: { id: lead.contactId } })

  return NextResponse.json({ success: true })
}
