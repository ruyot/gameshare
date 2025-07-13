import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PostSchema = z.object({
  gameId: z.string().uuid(),
  rateTokensPerHour: z.number().int().positive(),
  maxHours: z.number().int().min(1).max(24),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'active'
  const gameId = searchParams.get('gameId')
  const page = parseInt(searchParams.get('page') || '0', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
  const offset = page * limit

  let query = supabase
    .from('Listing')
    .select(`id, hostId, rateTokensPerHour, maxHours, status, Game:gameId(id, name, thumbnailUrl), Host:hostId(id, steamId)`, { count: 'exact' })
    .eq('status', status)
    .range(offset, offset + limit - 1)
    .order('createdAt', { ascending: false })

  if (gameId) query = query.eq('gameId', gameId)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    page,
    totalPages: count ? Math.ceil(count / limit) : 1,
  })
}

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
  const { gameId, rateTokensPerHour, maxHours } = parse.data
  const { data, error } = await supabase
    .from('Listing')
    .insert({
      gameId,
      rateTokensPerHour,
      maxHours,
      status: 'active',
      hostId: session.user.id,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
} 