"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function AuthHandler() {
  const search = useSearchParams()
  const router = useRouter()
  const access_token = search.get('access_token')
  const refresh_token = search.get('refresh_token')

  useEffect(() => {
    if (access_token && refresh_token) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(() => {
          // Check for stored redirect destination
          const redirectTo = localStorage.getItem('authRedirect')
          if (redirectTo) {
            localStorage.removeItem('authRedirect')
            router.replace(redirectTo)
          } else {
            router.replace('/marketplace')
          }
        })
        .catch((error) => {
          console.error('Session error:', error)
          router.replace('/auth?error=session_error')
        })
    } else {
      console.error('Missing tokens')
      router.replace('/auth?error=missing_tokens')
    }
  }, [access_token, refresh_token, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Finalizing login...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  )
} 