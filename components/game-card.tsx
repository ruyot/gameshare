"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Clock, Star, Coins } from "lucide-react"

interface Game {
  id: number
  title: string
  thumbnail: string
  tokensPerHour: number
  rating: number
  genre: string
  isHosting: boolean
  timeRemaining: string | null
}

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="relative bg-white rounded-2xl overflow-hidden shadow-lg game-card-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Game Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <Image src={game.thumbnail || "/placeholder.svg"} alt={game.title} fill className="object-cover" />

        {/* Countdown Timer (if hosting) */}
        {game.isHosting && game.timeRemaining && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-80 text-white px-2 py-1 rounded-lg flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-medium">{game.timeRemaining}</span>
          </div>
        )}

        {/* Hover Overlay */}
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gold hover:text-black transition-colors duration-200"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {game.isHosting ? "Continue Playing" : "Play Now"}
          </motion.button>
        </motion.div>
      </div>

      {/* Game Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-black mb-2">{game.title}</h3>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <Coins className="w-4 h-4 text-gold" />
            <span className="text-gold font-bold">{game.tokensPerHour}</span>
            <span className="text-gray-600 text-sm">/hour</span>
          </div>

          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-gold fill-current" />
            <span className="text-black font-medium">{game.rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-lg text-xs font-medium">{game.genre}</span>

          {game.isHosting && <span className="bg-gold text-black px-2 py-1 rounded-lg text-xs font-bold">HOSTING</span>}
        </div>
      </div>
    </motion.div>
  )
}
