import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mediaAsset = searchParams.get('mediaAsset')

  const sponsors = await prisma.sponsor.findMany({
    where: mediaAsset ? { mediaAssets: { has: mediaAsset } } : undefined,
    include: { contact: true },
    orderBy: { contractEnd: 'asc' },
  })
  return NextResponse.json(sponsors)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, company, email, phone, notes, contractStart, contractEnd, value, status, mediaAssets } = body

  const sponsor = await prisma.sponsor.create({
    data: {
      contractStart: new Date(contractStart),
      contractEnd: new Date(contractEnd),
      value: value ? parseFloat(value) : null,
      status: status || 'active',
      notes,
      mediaAssets: mediaAssets && mediaAssets.length > 0 ? mediaAssets : ['Tokenized'],
      contact: {
        create: {
          name: name || company,
          company,
          email,
          phone,
        },
      },
    },
    include: { contact: true },
  })

  return NextResponse.json(sponsor)
}
