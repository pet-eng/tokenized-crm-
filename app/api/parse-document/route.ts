import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('type') as string // 'lead' or 'sponsor'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')

    let response

    if (file.type === 'application/pdf') {
      // Send PDF directly to Claude
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: getExtractionPrompt(documentType),
              },
            ],
          },
        ],
      })
    } else if (file.type.startsWith('image/')) {
      // For images, use Claude's vision
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: 'text',
                text: getExtractionPrompt(documentType),
              },
            ],
          },
        ],
      })
    } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = buffer.toString('utf-8')

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${getExtractionPrompt(documentType)}\n\nDocument content:\n${text}`,
          },
        ],
      })
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Use PDF, images, or text files.' }, { status: 400 })
    }

    const content = response.content[0]
    if (content.type === 'text') {
      return NextResponse.json(parseExtractedData(content.text))
    }

    return NextResponse.json({ error: 'Failed to extract data' }, { status: 500 })
  } catch (error) {
    console.error('Document parsing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse document' },
      { status: 500 }
    )
  }
}

function getExtractionPrompt(documentType: string): string {
  if (documentType === 'sponsor') {
    return `You are extracting data from a business contract, invoice, or statement of work.

Look carefully for:
- COMPANY NAME: Look for the client/customer name, "Bill To", "Client:", company letterhead, or the party entering the agreement. This is NOT your company - it's the other party.
- CONTRACT VALUE: Look for total amount, contract value, payment terms, pricing, fees, "Total:", dollar amounts. Extract as a number only (no $ or commas).
- DATES: Start date, effective date, end date, expiration date, term length.
- EMAIL: Any email addresses mentioned.

Return ONLY this JSON (use null if not found):
{
  "company": "the client/customer company name",
  "email": "contact email if found",
  "contractStart": "YYYY-MM-DD format",
  "contractEnd": "YYYY-MM-DD format",
  "value": 50000,
  "notes": "one line summary of scope/services"
}

Return only valid JSON, nothing else.`
  }

  return `You are extracting data from a business document (proposal, email, SOW, etc).

Look carefully for:
- COMPANY NAME: The prospect/lead company name - look for letterhead, signatures, "From:", company mentions. This is the potential customer.
- DEAL VALUE: Any pricing, budget, contract amount, or quoted figures. Extract as a number only (no $ or commas).
- EMAIL: Contact email addresses.

Return ONLY this JSON (use null if not found):
{
  "company": "the prospect company name",
  "email": "contact email if found",
  "value": 25000,
  "notes": "brief summary of their interest/needs"
}

Return only valid JSON, nothing else.`
}

function parseExtractedData(text: string): Record<string, unknown> {
  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    // If parsing fails, return empty object
  }
  return {}
}
