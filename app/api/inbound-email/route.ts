import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'
import { addDays } from 'date-fns'

const anthropic = new Anthropic()

// Simple auth token - set this in your .env
const INBOUND_EMAIL_SECRET = process.env.INBOUND_EMAIL_SECRET

export async function POST(request: NextRequest) {
  try {
    // Check auth token if set
    if (INBOUND_EMAIL_SECRET) {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      if (token !== INBOUND_EMAIL_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()

    // Support multiple email webhook formats (Mailgun, SendGrid, Zapier, etc.)
    const emailData = parseEmailWebhook(body)

    if (!emailData.body) {
      return NextResponse.json({ error: 'No email content found' }, { status: 400 })
    }

    // Use Claude to extract lead information from the email
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are extracting lead information from a forwarded business email.

Email Details:
- From: ${emailData.from || 'Unknown'}
- Subject: ${emailData.subject || 'No subject'}
- Body:
${emailData.body}

Extract the following information about the SENDER (the potential lead/prospect). Return ONLY this JSON:
{
  "company": "their company name (look for email domain, signature, or mentions)",
  "name": "contact person's name if mentioned",
  "email": "their email address",
  "phone": "phone number if mentioned",
  "value": estimated deal value as number if any amounts mentioned (null if not),
  "notes": "brief summary of what they want or are asking about",
  "shouldCreateLead": true or false (false if it's spam, newsletter, or not a business inquiry)
}

Return only valid JSON, nothing else.`
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Failed to parse email' }, { status: 500 })
    }

    // Parse the extracted data
    let extractedData
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      }
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    if (!extractedData || !extractedData.shouldCreateLead) {
      return NextResponse.json({
        message: 'Email processed but no lead created (not a business inquiry)',
        extracted: extractedData
      })
    }

    // Create the lead
    const mediaAssets: string[] = Array.isArray(body.mediaAssets)
      ? body.mediaAssets
      : body.mediaAsset
        ? [body.mediaAsset as string]
        : ['Tokenized']
    const lead = await prisma.lead.create({
      data: {
        stage: 'new',
        value: extractedData.value ? parseFloat(extractedData.value) : null,
        probability: 50,
        nextFollowUp: addDays(new Date(), 3),
        followUpNotes: `Inbound email: ${emailData.subject || 'No subject'}`,
        source: 'Email',
        mediaAssets,
        contact: {
          create: {
            name: extractedData.name || extractedData.company || emailData.from || 'Unknown',
            company: extractedData.company,
            email: extractedData.email || emailData.from,
            phone: extractedData.phone,
            notes: extractedData.notes,
          },
        },
      },
      include: { contact: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Lead created from email',
      lead: {
        id: lead.id,
        company: lead.contact.company,
        email: lead.contact.email,
      }
    })

  } catch (error) {
    console.error('Inbound email error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process email' },
      { status: 500 }
    )
  }
}

// Parse different email webhook formats
function parseEmailWebhook(body: Record<string, unknown>): {
  from?: string
  subject?: string
  body?: string
} {
  // Zapier / generic format
  if (body.from || body.sender) {
    return {
      from: (body.from || body.sender || body.from_email) as string,
      subject: (body.subject) as string,
      body: (body.body || body.text || body.plain || body.body_plain || body.html || body.content) as string,
    }
  }

  // Mailgun format
  if (body.sender || body['body-plain']) {
    return {
      from: body.sender as string,
      subject: body.subject as string,
      body: (body['body-plain'] || body['stripped-text']) as string,
    }
  }

  // SendGrid format
  if (body.envelope) {
    const envelope = typeof body.envelope === 'string' ? JSON.parse(body.envelope) : body.envelope
    return {
      from: envelope?.from,
      subject: body.subject as string,
      body: (body.text || body.html) as string,
    }
  }

  // Postmark format
  if (body.FromFull || body.TextBody) {
    const fromFull = body.FromFull as { Email?: string } | undefined
    return {
      from: fromFull?.Email || body.From as string,
      subject: body.Subject as string,
      body: (body.TextBody || body.HtmlBody) as string,
    }
  }

  // Fallback - try to extract what we can
  return {
    from: (body.from || body.sender || body.email || body.from_email) as string | undefined,
    subject: (body.subject || body.Subject) as string | undefined,
    body: (body.body || body.text || body.content || body.message || body.html || JSON.stringify(body)) as string,
  }
}

// Also support GET for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Inbound email webhook is active. POST email data to create leads.',
    expectedFormat: {
      from: 'sender@example.com',
      subject: 'Email subject',
      body: 'Email content'
    }
  })
}
