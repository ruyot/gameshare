import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { priceId } = await req.json()
  if (!priceId) {
    return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })
  }
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  try {
    // Initialize Stripe only at runtime
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-06-30.basil',
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/store?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/store?canceled=true`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Stripe error' }, { status: 500 })
  }
} 