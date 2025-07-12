"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Coins, User } from "lucide-react"
import { motion } from "framer-motion"

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/profile", label: "Profile" },
    { href: "/store", label: "Store" },
    { href: "/support", label: "Support" },
  ]

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/marketplace" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold font-playfair text-gold drop-shadow-sm">Game Share</h1>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-white hover:text-gold transition-colors duration-200"
              >
                {item.label}
                {pathname === item.href && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold"
                    layoutId="navbar-indicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Token Balance & Profile */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-900 px-3 py-1 rounded-full">
              <Coins className="w-4 h-4 text-gold" />
              <span className="text-white font-medium">2,450</span>
            </div>
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-black" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
