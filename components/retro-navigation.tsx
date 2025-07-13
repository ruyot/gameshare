"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { initiateSteamLogin } from "@/lib/steam-auth"

export function RetroNavigation() {
  const pathname = usePathname()
  const { user, loading, isAuthenticated, signOut } = useAuth()
  const [tokenCount, setTokenCount] = useState(0)

  useEffect(() => {
    if (user) {
      // Fetch real token balance from API
      fetchUserTokens()
    } else {
      setTokenCount(0)
    }
  }, [user])

  const fetchUserTokens = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setTokenCount(data.tokensBalance || 0)
      }
    } catch (error) {
      console.error('Error fetching user tokens:', error)
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
    initiateSteamLogin()
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-retro-dark border-b-2 border-neon-pink">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/marketplace" className="flex items-center">
            <motion.h1
              className="text-xl font-pixel text-neon-pink neon-glow-pink-readable glitch-text"
              data-text="GAME SHARE"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              style={{
                textShadow: "0 0 2px #ff5c8d, 0 0 4px #ff5c8d, 0 0 6px #ff5c8d, 2px 2px 0px #000000",
                fontWeight: "bold",
              }}
            >
              GAME SHARE
            </motion.h1>
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

          {/* Token Counter & Auth */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="font-pixel text-electric-teal text-xs animate-pulse">LOADING...</div>
            ) : isAuthenticated ? (
              <>
                <div className="led-counter font-pixel text-xs">{tokenCount.toLocaleString().padStart(6, "0")}</div>
                <div className="w-8 h-8 bg-neon-pink border-2 border-electric-teal pixel-border flex items-center justify-center">
                  <span
                    className="text-retro-dark font-pixel text-xs font-bold"
                    style={{
                      textShadow: "1px 1px 0px #000000",
                      fontWeight: "900",
                    }}
                  >
                    {user?.user_metadata?.steamId ? `S${user.user_metadata.steamId.slice(-4)}` : 'P1'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="font-pixel text-xs text-white hover:text-neon-pink transition-colors duration-200"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="font-pixel text-xs bg-neon-pink text-retro-dark px-4 py-2 border-2 border-electric-teal hover:bg-electric-teal hover:text-retro-dark transition-all duration-200"
              >
                LOGIN
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
