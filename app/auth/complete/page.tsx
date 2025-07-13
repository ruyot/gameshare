"use client"
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import AuthHandler from './AuthHandler'

export default function CompleteAuthPage() {
  return (
    // Suspense prevents the "missing suspense boundary" error
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Logging you in...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    }>
      <AuthHandler />
    </Suspense>
  )
} 