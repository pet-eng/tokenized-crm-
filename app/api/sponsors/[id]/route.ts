import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    include: { contact: true },
  })

  if (!sponsor) {
    return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
  }

  return NextResponse.json(sponsor)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { contractStart, contractEnd, value, status, notes, mediaAssets, name, company, email, phone } = body

  const sponsor = await prisma.sponsor.update({
    where: { id },
    data: {
      contractStart: contractStart ? new Date(contractStart) : undefined,
      contractEnd: contractEnd ? new Date(contractEnd) : undefined,
      value: value !== undefined ? (value ? parseFloat(value) : null) : undefined,
      status,
      notes,
      mediaAssets,
      contact: (name || company || email || phone) ? {
        update: {
          name,
          company,
          email,
          phone,
        },
      } : undefined,
    },
    include: { contact: true },
  })

  return NextResponse.json(sponsor)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
  })

  if (!sponsor) {
    return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
  }

  await prisma.sponsor.delete({ where: { id } })
  await prisma.contact.delete({ where: { id: sponsor.contactId } })

  return NextResponse.json({ success: true })
}
