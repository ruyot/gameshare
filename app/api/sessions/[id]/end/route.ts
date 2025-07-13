import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabaseServer = createMiddlewareClient({ req, res: NextResponse.next() })
  const {
    data: { session },
  } = await supabaseServer.auth.getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const sessionId = params.id
  // Fetch session
  const { data: sessionRow, error: sessionErr } = await supabase
    .from('Session')
    .select('id, hostId, playerId, status')
    .eq('id', sessionId)
    .single()
  if (sessionErr || !sessionRow) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  if (sessionRow.status !== 'active') {
    return NextResponse.json({ error: 'Session not active' }, { status: 400 })
  }
  if (sessionRow.hostId !== session.user.id && sessionRow.playerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // End session
  const { data: updated, error: updateErr } = await supabase
    .from('Session')
    .update({ status: 'ended', endedAt: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single()
  if (updateErr) {
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 })
  }
  return NextResponse.json(updated, { status: 200 })
} 