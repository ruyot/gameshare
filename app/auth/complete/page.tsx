"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function AuthCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const completeAuth = async () => {
      try {
        // Call the Steam callback endpoint to get session tokens
        const response = await fetch('/api/auth/steam-callback?' + searchParams.toString())
        
        if (!response.ok) {
          throw new Error('Failed to complete Steam authentication')
        }

        const { access_token, refresh_token, user } = await response.json()

        if (!access_token) {
          throw new Error('No access token received')
        }

        // Set the session in Supabase client
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        })

        if (sessionError) {
          throw sessionError
        }

        // Redirect to marketplace
        router.push('/marketplace')
      } catch (err: any) {
        console.error('Auth completion error:', err)
        setError(err.message || 'Authentication failed')
      } finally {
        setIsLoading(false)
      }
    }

    completeAuth()
  }, [searchParams, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto mb-4"></div>
          <p className="font-pixel text-neon-pink">COMPLETING STEAM AUTHENTICATION...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-dark">
        <div className="text-center">
          <p className="font-pixel text-red-500 mb-4">AUTHENTICATION ERROR</p>
          <p className="font-pixel text-white mb-4">{error}</p>
          <button 
            onClick={() => router.push('/auth')}
            className="font-pixel bg-neon-pink text-retro-dark px-4 py-2 hover:bg-opacity-80"
          >
            RETURN TO LOGIN
          </button>
        </div>
      </div>
    )
  }

  return null
} 