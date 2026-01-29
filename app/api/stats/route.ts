import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mediaAsset = searchParams.get('mediaAsset')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const thirtyDaysFromNow = new Date(today)
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const leadFilter = mediaAsset ? { mediaAsset } : {}
  const sponsorFilter = mediaAsset ? { mediaAsset } : {}

  const [
    totalLeads,
    activeSponsors,
    leadsNeedingFollowUp,
    overdueLeads,
    expiringSoon,
    pipelineValue,
  ] = await Promise.all([
    prisma.lead.count({
      where: {
        ...leadFilter,
        stage: { notIn: ['won', 'lost', 'on_hold'] },
      },
    }),
    prisma.sponsor.count({
      where: { ...sponsorFilter, status: 'active' },
    }),
    prisma.lead.count({
      where: {
        ...leadFilter,
        nextFollowUp: {
          gte: today,
          lt: tomorrow,
        },
        stage: { notIn: ['won', 'lost', 'on_hold'] },
      },
    }),
    prisma.lead.count({
      where: {
        ...leadFilter,
        nextFollowUp: { lt: today },
        stage: { notIn: ['won', 'lost', 'on_hold'] },
      },
    }),
    prisma.sponsor.count({
      where: {
        ...sponsorFilter,
        status: 'active',
        contractEnd: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
    }),
    prisma.lead.aggregate({
      _sum: { value: true },
      where: {
        ...leadFilter,
        stage: { notIn: ['won', 'lost', 'on_hold'] },
        value: { not: null },
      },
    }),
  ])

  return NextResponse.json({
    totalLeads,
    activeSponsors,
    leadsNeedingFollowUp,
    overdueLeads,
    expiringSoon,
    pipelineValue: pipelineValue._sum.value || 0,
  })
}
