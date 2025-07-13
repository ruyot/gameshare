import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Initialize Stripe only at runtime
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-06-30.basil',
    })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.text()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    const signature = req.headers.get('stripe-signature')!

    let event: any

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.userId

      if (userId) {
        // Add tokens to user account - simplified for MVP
        const { error } = await supabase
          .from('User')
          .update({ 
            tokensBalance: 100 // Fixed amount for MVP
          })
          .eq('id', userId)

        if (error) {
          console.error('Error updating user tokens:', error)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
} 