"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

interface RetroGame {
  id: number
  title: string
  thumbnail: string
  tokensPerHour: number
  rating: number
  genre: string
  isHosting: boolean
  timeRemaining: string | null
}

interface RetroGameCardProps {
  game: RetroGame
}

export function RetroGameCard({ game }: RetroGameCardProps) {
  const [isHovered, setIsHovered] = useState(false)

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
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-full h-4 bg-neon-pink opacity-30 blur-lg rounded-full" />

      <div className="relative bg-retro-dark border-2 border-neon-pink pixel-border overflow-hidden">
        {/* Game Thumbnail */}
        <div className="relative h-32 overflow-hidden">
          <Image
            src={game.thumbnail || "/placeholder.svg"}
            alt={game.title}
            fill
            className="object-cover pixelated"
            style={{ imageRendering: "pixelated" }}
          />

          {/* Scan Lines Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-pink to-transparent opacity-10 animate-pulse" />

          {/* Status Badge */}
          {game.isHosting && game.timeRemaining && (
            <div className="absolute top-2 right-2 led-counter text-xs">{game.timeRemaining}</div>
          )}

          {/* Hover Overlay - Only Play Now Button */}
          <motion.div
            className="absolute inset-0 bg-retro-dark bg-opacity-90 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              className="retro-button bg-neon-pink text-retro-dark border-neon-pink"
              initial={{ y: 20, opacity: 0 }}
              animate={{
                y: isHovered ? 0 : 20,
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {game.isHosting ? "CONTINUE" : "PLAY NOW"}
            </motion.button>
          </motion.div>
        </div>

        {/* Game Info */}
        <div className="p-3 bg-retro-dark">
          <h3 className="font-pixel text-xs text-white mb-2 truncate">{game.title.toUpperCase()}</h3>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1">
              <span className="text-electric-teal font-pixel text-xs">{game.tokensPerHour}T/H</span>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-neon-pink font-pixel text-xs">★{game.rating}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="bg-neon-pink text-retro-dark px-2 py-1 font-pixel text-xs">{game.genre}</span>

            {game.isHosting && (
              <span className="bg-electric-teal text-retro-dark px-2 py-1 font-pixel text-xs animate-pulse">LIVE</span>
            )}
          </div>
        </div>

        {/* Neon Border Glow */}
        <motion.div
          className="absolute inset-0 border-2 border-neon-pink pointer-events-none"
          animate={{
            boxShadow: isHovered ? "0 0 20px #FF5C8D, inset 0 0 20px rgba(255, 92, 141, 0.1)" : "0 0 0px #FF5C8D",
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  )
}
