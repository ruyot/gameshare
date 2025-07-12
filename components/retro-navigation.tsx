"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

export function RetroNavigation() {
  const pathname = usePathname()
  const [tokenCount, setTokenCount] = useState(0)

  useEffect(() => {
    // Animate token counter on load
    const target = 2450
    const duration = 2000
    const increment = target / (duration / 16)
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setTokenCount(target)
        clearInterval(timer)
      } else {
        setTokenCount(Math.floor(current))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [])

  const navItems = [
    { href: "/marketplace", label: "ARCADE" },
    { href: "/profile", label: "PLAYER" },
    { href: "/store", label: "TOKENS" },
    { href: "/support", label: "HELP" },
  ]

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

          {/* Token Counter */}
          <div className="flex items-center space-x-4">
            <div className="led-counter font-pixel text-xs">{tokenCount.toLocaleString().padStart(6, "0")}</div>
            <div className="w-8 h-8 bg-neon-pink border-2 border-electric-teal pixel-border flex items-center justify-center">
              <span
                className="text-retro-dark font-pixel text-xs font-bold"
                style={{
                  textShadow: "1px 1px 0px #000000",
                  fontWeight: "900",
                }}
              >
                P1
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
