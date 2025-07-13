import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const supabaseServer = createMiddlewareClient({ req, res: NextResponse.next() })
  const {
    data: { session },
  } = await supabaseServer.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch user sessions with game and listing details
    const { data: sessions, error } = await supabase
      .from('Session')
      .select(`
        id,
        hours,
        status,
        startedAt,
        endedAt,
        Listing:listingId(
          id,
          rateTokensPerHour,
          Game:gameId(
            id,
            name,
            thumbnailUrl
          )
        ),
        Host:hostId(steamId),
        Player:playerId(steamId)
      `)
      .or(`playerId.eq.${session.user.id},hostId.eq.${session.user.id}`)
      .order('startedAt', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Transform sessions for frontend
    const transformedSessions = sessions?.map((session: any) => ({
      id: session.id,
      gameTitle: session.Listing?.Game?.name || 'Unknown Game',
      gameThumbnail: session.Listing?.Game?.thumbnailUrl || '/placeholder.svg',
      hours: session.hours,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      rateTokensPerHour: session.Listing?.rateTokensPerHour || 0,
      totalCost: (session.Listing?.rateTokensPerHour || 0) * session.hours,
      isHost: session.hostId === session.user.id,
      otherParty: session.hostId === session.user.id 
        ? session.Player?.steamId 
        : session.Host?.steamId,
    })) || []

    return NextResponse.json({ sessions: transformedSessions })
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 