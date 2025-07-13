import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
  let event: Stripe.Event

  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const tokens = parseInt(session.metadata?.tokens || '0', 10)
    if (!userId || !tokens) {
      console.error('Missing userId or tokens in session metadata')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }
    // 3a) Atomically bump the balance
    const { data: newBalance, error: rpcErr } = await supabaseAdmin
      .rpc('increment_tokens', { user_id: userId, amount: tokens })
    if (rpcErr) {
      console.error('Error incrementing tokens:', rpcErr)
      return NextResponse.json({ error: 'Token credit error' }, { status: 500 })
    }
    // Insert Transaction row with idempotency
    const { error: txnError } = await supabaseAdmin
      .from('Transaction')
      .insert([{
        userId,
        type: 'deposit',
        amount: tokens,
        stripe_session_id: session.id,
        metadata: session,
      }])
    if (txnError && !txnError.message.includes('duplicate key')) {
      console.error('Error inserting transaction:', txnError)
      return NextResponse.json({ error: 'Transaction error' }, { status: 500 })
    }
    return NextResponse.json({ received: true })
  }

  // 204 for unhandled events
  return new NextResponse(null, { status: 204 })
} 