import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { subject, email, message } = await req.json()
    
    if (!subject || !email || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Get SendGrid API key from environment variables (server-side only)
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
    
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Create support ticket email payload  
    const supportPayload = {
      personalizations: [
        { 
          to: [{ email: "tahmeed@gameshareit.com" }],
          subject: `🎧 Support Ticket: ${subject}`
        }
      ],
      from: { email: "tahmeed@gameshareit.com", name: "GameShare Support" },
      content: [
        {
          type: "text/html",
          value: `
            <h3>New Support Ticket</h3>
            <p><strong>From:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #19FFE1;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <hr>
            <p style="font-size: 12px; color: #666;">
              GameShare Support System<br>
              <a href="https://gameshareit.com">gameshareit.com</a>
            </p>
          `
        }
      ]
    }

    // Send email via SendGrid
    const emailRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(supportPayload)
    })

    if (!emailRes.ok) {
      const errorData = await emailRes.json().catch(() => ({}))
      console.error('SendGrid error:', errorData)
      return NextResponse.json({ error: 'Failed to send support ticket' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Support ticket sent successfully!' })
    
  } catch (error) {
    console.error('Support API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 