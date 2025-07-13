"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Clock, Star, TrendingUp, Settings, Pause, Play } from "lucide-react"


export interface HostListing {
  id: number
  title: string
  thumbnail: string
  tokensPerHour: number
  rating: number
  genre: string
  status: "AVAILABLE" | "RENTED" | "PAUSED"
  totalEarned: number
  hoursRented: number
  currentRenter: string | null
  timeRemaining: string | null
}

interface HostGameCardProps {
  listing: HostListing
}

export function HostGameCard({ listing }: HostGameCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handlePauseResume = () => {
    console.log(`${listing.status === "PAUSED" ? "Resuming" : "Pausing"} listing:`, listing.title)
  }

  const handleSettings = () => {
    console.log("Opening settings for:", listing.title)
  }

  return (
    <motion.div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{
        y: -8,
        rotateX: 5,
        rotateY: 5,
        scale: 1.05,
      }}
      transition={{ duration: 0.3 }}
      style={{ perspective: "1000px" }}
    >
      {/* Neon Pedestal Glow */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-full h-4 bg-electric-teal opacity-30 blur-lg rounded-full" />

      <div className="relative bg-retro-dark border-2 border-electric-teal pixel-border overflow-hidden">
        {/* Game Thumbnail */}
        <div className="relative h-32 overflow-hidden">
          <Image
            src={listing.thumbnail || "/placeholder.svg"}
            alt={listing.title}
            fill
            className="object-cover pixelated"
            style={{ imageRendering: "pixelated" }}
          />

          {/* Scan Lines Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-electric-teal to-transparent opacity-10 animate-pulse" />

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <div
              className={`led-counter text-xs ${
                listing.status === "RENTED"
                  ? "bg-neon-pink border-neon-pink text-retro-dark animate-pulse"
                  : listing.status === "PAUSED"
                    ? "bg-yellow-500 border-yellow-500 text-retro-dark"
                    : "bg-green-500 border-green-500 text-retro-dark"
              }`}
            >
              {listing.status}
            </div>
          </div>

          {/* Current Renter Info */}
          {listing.currentRenter && listing.timeRemaining && (
            <div className="absolute top-2 left-2 bg-retro-dark bg-opacity-80 p-2 border border-neon-pink">
              <div className="font-pixel text-neon-pink text-xs mb-1">{listing.currentRenter}</div>
              <div className="font-pixel text-electric-teal text-xs flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {listing.timeRemaining}
              </div>
            </div>
          )}

          {/* Hover Overlay */}
          <motion.div
            className="absolute inset-0 bg-retro-dark bg-opacity-90 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex space-x-2">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{
                  y: isHovered ? 0 : 20,
                  opacity: isHovered ? 1 : 0,
                }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <button
                  onClick={handlePauseResume}
                  className="retro-button bg-neon-pink text-retro-dark border-neon-pink p-2"
                >
                  {listing.status === "PAUSED" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{
                  y: isHovered ? 0 : 20,
                  opacity: isHovered ? 1 : 0,
                }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <button
                  onClick={handleSettings}
                  className="retro-button bg-electric-teal text-retro-dark border-electric-teal p-2"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Game Info */}
        <div className="p-3 bg-retro-dark">
          <h3 className="font-pixel text-xs text-white mb-2 truncate">{listing.title.toUpperCase()}</h3>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1">
              <span className="text-electric-teal font-pixel text-xs">{listing.tokensPerHour}T/H</span>
            </div>

            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-neon-pink fill-current" />
              <span className="text-neon-pink font-pixel text-xs">{listing.rating}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="bg-electric-teal text-retro-dark px-2 py-1 font-pixel text-xs">{listing.genre}</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-neon-pink" />
              <span className="text-neon-pink font-pixel text-xs">{listing.totalEarned}T</span>
            </div>
          </div>

          <div className="text-center">
            <div className="font-pixel text-white text-xs">{listing.hoursRented} HOURS RENTED</div>
          </div>
        </div>

        {/* Neon Border Glow */}
        <motion.div
          className="absolute inset-0 border-2 border-electric-teal pointer-events-none"
          animate={{
            boxShadow: isHovered ? "0 0 20px #19FFE1, inset 0 0 20px rgba(25, 255, 225, 0.1)" : "0 0 0px #19FFE1",
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  )
}
