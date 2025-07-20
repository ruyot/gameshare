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
    // First get the User record to get the internal User ID
    const { data: userRecord, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (userError) {
      console.error('Error fetching User record:', userError)
      return NextResponse.json({ listings: [] }) // Return empty listings if User record not found
    }

    // Fetch user listings with game details using User.id
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
      .eq('hostId', userRecord.id)
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