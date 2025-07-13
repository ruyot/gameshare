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
    // Fetch user listings with game details
    const { data: listings, error } = await supabase
      .from('Listing')
      .select(`
        id,
        rateTokensPerHour,
        maxHours,
        status,
        createdAt,
        Game:gameId(
          id,
          name,
          thumbnailUrl
        )
      `)
      .eq('hostId', session.user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    // Transform listings for frontend
    const transformedListings = listings?.map((listing: any) => ({
      id: listing.id,
      gameTitle: listing.Game?.name || 'Unknown Game',
      gameThumbnail: listing.Game?.thumbnailUrl || '/placeholder.svg',
      rateTokensPerHour: listing.rateTokensPerHour,
      maxHours: listing.maxHours,
      status: listing.status,
      createdAt: listing.createdAt,
    })) || []

    return NextResponse.json({ listings: transformedListings })
  } catch (error) {
    console.error('Listings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 