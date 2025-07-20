import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PostSchema = z.object({
  listingId: z.string().uuid(),
  hours: z.number().int().min(1).max(24),
})

export async function POST(req: NextRequest) {
  const supabaseServer = createMiddlewareClient({ req, res: NextResponse.next() })
  const {
    data: { session },
  } = await supabaseServer.auth.getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parse = PostSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
  }
  const { listingId, hours } = parse.data

  // 1. Fetch listing
  const { data: listing, error: listingErr } = await supabase
    .from('Listing')
    .select('id, hostId, rateTokensPerHour, maxHours, status')
    .eq('id', listingId)
    .single()
  if (listingErr || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  if (listing.status !== 'active') {
    return NextResponse.json({ error: 'Listing not available' }, { status: 400 })
  }
  if (listing.hostId === session.user.id) {
    return NextResponse.json({ error: 'Cannot book your own listing' }, { status: 400 })
  }
  if (hours < 1 || hours > listing.maxHours) {
    return NextResponse.json({ error: 'Invalid hours' }, { status: 400 })
  }

  // 2. Fetch user
  const { data: user, error: userErr } = await supabase
    .from('User')
    .select('id, tokensBalance')
    .eq('auth_user_id', session.user.id)
    .single()
  if (userErr || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const totalCost = listing.rateTokensPerHour * hours
  if (user.tokensBalance < totalCost) {
    return NextResponse.json({ error: 'Insufficient tokens' }, { status: 400 })
  }

  // 3. Deduct tokens (atomic)
  const { error: deductErr } = await supabase.rpc('increment_tokens', { user_id: user.id, amount: -totalCost })
  if (deductErr) {
    return NextResponse.json({ error: 'Failed to deduct tokens' }, { status: 500 })
  }

  // 4. Create session
  const { data: sessionRow, error: sessionErr } = await supabase
    .from('Session')
    .insert({
      playerId: user.id,
      hostId: listing.hostId,
      listingId: listing.id,
      hours,
      status: 'active',
      startedAt: new Date().toISOString(),
    })
    .select()
    .single()
  if (sessionErr) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // 5. Mark listing as booked
  await supabase.from('Listing').update({ status: 'booked' }).eq('id', listing.id)

  // 6. Insert transaction
  await supabase.from('Transaction').insert({
    userId: user.id,
    type: 'spend',
    amount: totalCost,
    sessionId: sessionRow.id,
    metadata: { listingId: listing.id, hours },
  })

  return NextResponse.json(sessionRow, { status: 201 })
} 