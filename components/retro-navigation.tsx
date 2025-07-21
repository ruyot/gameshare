"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"

export function RetroNavigation() {
  const pathname = usePathname()
  const { user, loading, isAuthenticated, signOut } = useAuth()
  const [tokenCount, setTokenCount] = useState(0)
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (user && !loading) {
      // Fetch real token balance and username from API only when authenticated
      fetchUserProfile()
    } else {
      // Show demo token count for non-authenticated users
      setTokenCount(500)
      setUsername('')
    }
  }, [user, loading])

  const fetchUserProfile = async () => {
    if (!user) return // Don't fetch if no user
    
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setTokenCount(data.tokensBalance || 0)
        setUsername(data.username || 'PLAYER')
      } else if (response.status === 401) {
        // Handle unauthorized gracefully - user might not be fully authenticated yet
        setUsername(user?.user_metadata?.username || 'PLAYER')
        setTokenCount(0)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Fallback to user metadata
      setUsername(user?.user_metadata?.username || 'PLAYER')
      setTokenCount(0)
    }
  }

  const navItems = [
    { href: "/marketplace", label: "ARCADE" },
    { href: "/host", label: "HOST" },
    { href: "/profile", label: "PLAYER" },
    { href: "/store", label: "TOKENS" },
    { href: "/support", label: "HELP" },
  ]

  const handleLogin = () => {
    window.location.href = '/auth'
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-retro-dark border-b-2 border-neon-pink">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center select-none">
            <span className="relative inline-block">
              {/* Neon Glow Layer */}
              <span
                aria-hidden="true"
                className="text-xl md:text-3xl font-pixel absolute inset-0 z-0 pointer-events-none"
                style={{
                  color: '#ff5c8d',
                  filter: 'blur(2.5px)',
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                }}
              >
                GAME SHARE
              </span>
              {/* Solid White Text Layer */}
              <span
                className="text-xl md:text-3xl font-pixel text-white font-bold relative z-10"
                style={{
                  letterSpacing: '0.1em',
                }}
              >
                GAME SHARE
              </span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative font-pixel text-xs transition-all duration-200 ${
                  pathname === item.href
                    ? "text-electric-teal neon-glow-teal"
                    : "text-white hover:text-neon-pink hover:neon-glow-pink"
                }`}
              >
                {item.label}
                {pathname === item.href && (
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-electric-teal"
                    layoutId="nav-indicator"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Animated Token Counter */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="font-pixel text-electric-teal text-xs animate-pulse">LOADING...</div>
            ) : (
              <motion.div
                className={`led-counter font-pixel text-xs bg-retro-dark border-2 px-3 py-1 ${
                  isAuthenticated 
                    ? 'border-neon-pink' 
                    : 'border-electric-teal'
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.span
                  key={tokenCount}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={isAuthenticated ? 'text-neon-pink' : 'text-electric-teal'}
                >
                  {tokenCount.toLocaleString().padStart(6, "0")}T
                </motion.span>
              </motion.div>
            )}
            
            {/* User Display OR Login Button */}
            {isAuthenticated ? (
              <motion.span
                className="font-pixel text-xs text-neon-pink neon-glow-pink"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {username || 'PLAYER'}
              </motion.span>
            ) : (
              <motion.button
                onClick={handleLogin}
                className="retro-button bg-electric-teal text-retro-dark border-electric-teal font-pixel text-xs px-4 py-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95, y: 0 }}
              >
                LOGIN
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
