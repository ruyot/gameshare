"use client"

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface AuthButtonProps {
  children: ReactNode
  onClick: () => void
  className?: string
  disabled?: boolean
  redirectTo?: string
}

export function AuthButton({ 
  children, 
  onClick, 
  className = "", 
  disabled = false,
  redirectTo 
}: AuthButtonProps) {
  const { requireAuth } = useAuth()

  const handleClick = () => {
    requireAuth(onClick, redirectTo)
  }

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
} 