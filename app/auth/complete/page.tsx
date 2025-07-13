"use client"

import { useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const completeAuth = async () => {
      try {
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')

        if (!accessToken || !refreshToken) {
          console.error('Missing tokens')
          router.push('/auth?error=missing_tokens')
          return
        }

        // Set the session with the tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (error) {
          console.error('Session error:', error)
          router.push('/auth?error=session_error')
          return
        }

        // Redirect to marketplace on success
        router.push('/marketplace')
      } catch (error) {
        console.error('Auth completion error:', error)
        router.push('/auth?error=completion_failed')
      }
    }

    completeAuth()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing Authentication...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  )
} 