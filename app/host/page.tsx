"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Server, TrendingUp } from "lucide-react"
import Link from "next/link"
import { HostGameCard } from "@/components/ui/host-game-card"
import type { HostListing } from "@/components/ui/host-game-card"


const hostListings: HostListing[] = [
  {
    id: 1,
    title: "FIFA 24",
    thumbnail: "/placeholder.svg?height=128&width=200",
    tokensPerHour: 15,
    rating: 4.4,
    genre: "SPORT",
    status: "AVAILABLE",
    totalEarned: 450,
    hoursRented: 30,
    currentRenter: null,
    timeRemaining: null,
  },
  {
    id: 2,
    title: "CALL OF DUTY MW3",
    thumbnail: "/placeholder.svg?height=128&width=200",
    tokensPerHour: 30,
    rating: 4.6,
    genre: "FPS",
    status: "RENTED",
    totalEarned: 890,
    hoursRented: 29,
    currentRenter: "PLAYER_X",
    timeRemaining: "01:23",
  },
  {
    id: 3,
    title: "BALDURS GATE 3",
    thumbnail: "/placeholder.svg?height=128&width=200",
    tokensPerHour: 22,
    rating: 4.9,
    genre: "RPG",
    status: "AVAILABLE",
    totalEarned: 660,
    hoursRented: 30,
    currentRenter: null,
    timeRemaining: null,
  },
]

export default function HostPage() {
  const [stats] = useState({
    totalEarnings: 2000,
    activeListings: 3,
    totalHours: 89,
    avgRating: 4.6,
  })

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative py-16 neon-grid">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1
              className="text-4xl md:text-6xl font-pixel text-electric-teal neon-glow-teal glitch-text mb-6"
              data-text="HOST TERMINAL"
            >
              HOST TERMINAL
            </h1>
            <p className="text-neon-pink font-pixel text-sm max-w-2xl mx-auto leading-relaxed">
              MANAGE YOUR GAME HOSTING EMPIRE
            </p>
          </motion.div>

          {/* Stats Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            <div className="crt-monitor p-4 text-center">
              <TrendingUp className="w-8 h-8 text-neon-pink mx-auto mb-2" />
              <div className="font-pixel text-neon-pink text-lg mb-1">{stats.totalEarnings}</div>
              <div className="font-pixel text-white text-xs">TOKENS EARNED</div>
            </div>

            <div className="crt-monitor p-4 text-center">
              <Server className="w-8 h-8 text-electric-teal mx-auto mb-2" />
              <div className="font-pixel text-electric-teal text-lg mb-1">{stats.activeListings}</div>
              <div className="font-pixel text-white text-xs">ACTIVE HOSTS</div>
            </div>

            <div className="crt-monitor p-4 text-center">
              <div className="w-8 h-8 bg-neon-pink mx-auto mb-2 flex items-center justify-center font-pixel text-retro-dark text-xs">
                {stats.totalHours}
              </div>
              <div className="font-pixel text-neon-pink text-lg mb-1">{stats.totalHours}</div>
              <div className="font-pixel text-white text-xs">HOURS HOSTED</div>
            </div>

            <div className="crt-monitor p-4 text-center">
              <div className="w-8 h-8 bg-electric-teal mx-auto mb-2 flex items-center justify-center font-pixel text-retro-dark text-xs">
                ★
              </div>
              <div className="font-pixel text-electric-teal text-lg mb-1">{stats.avgRating}</div>
              <div className="font-pixel text-white text-xs">AVG RATING</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Current Listings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="font-pixel text-neon-pink text-lg mb-4 flex items-center">
              <Server className="w-6 h-6 mr-3" />
              YOUR GAME HOSTS
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          >
            {hostListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <HostGameCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>

          {/* Create New Listing Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center"
          >
            <motion.div
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px rgba(255, 92, 141, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => window.location.href = '/host/create'}
                className="bg-neon-pink text-retro-dark font-pixel text-sm px-8 py-4 border-2 border-electric-teal hover:bg-electric-teal hover:text-retro-dark transition-all duration-300 flex items-center space-x-3 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>CREATE NEW LISTING</span>
              </button>
            </motion.div>

            <p className="font-pixel text-electric-teal text-xs mt-4">EXPAND YOUR HOSTING NETWORK</p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
