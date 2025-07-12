"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter } from "lucide-react"
import { RetroGameCard } from "@/components/retro-game-card"

const games = [
  {
    id: 1,
    title: "Cyber Punk 2077",
    thumbnail: "/placeholder.svg?height=128&width=200",
    tokensPerHour: 25,
    rating: 4.8,
    genre: "RPG",
    isHosting: false,
    timeRemaining: null,
  },
  {
    id: 2,
    title: "Witcher III",
    thumbnail: "/placeholder.svg?height=128&width=200",
    tokensPerHour: 20,
    rating: 4.9,
    genre: "RPG",
    isHosting: true,
    timeRemaining: "02:15",
  },
  {
    id: 3,
    title: "Call of Duty MW3",
    thumbnail: "/placeholder.svg?height=128&width=200",
    tokensPerHour: 30,
    rating: 4.6,
    genre: "FPS",
    isHosting: false,
    timeRemaining: null,
  },
  {
    id: 4,
    title: "FIFA 24",
    thumbnail: "/placeholder.svg?height=128&width=200",
    tokensPerHour: 15,
    rating: 4.4,
    genre: "SPORT",
    isHosting: false,
    timeRemaining: null,
  },
  {
    id: 5,
    title: "Baldurs Gate 3",
    thumbnail: "/placeholder.svg?height=128&width=200",
    tokensPerHour: 22,
    rating: 4.9,
    genre: "RPG",
    isHosting: false,
    timeRemaining: null,
  },
  {
    id: 6,
    title: "Spider-Man 2",
    thumbnail: "/placeholder.svg?height=128&width=200",
    tokensPerHour: 28,
    rating: 4.7,
    genre: "ACTION",
    isHosting: true,
    timeRemaining: "00:45",
  },
]

const genres = ["ALL", "RPG", "FPS", "SPORT", "ACTION"]

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("ALL")
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = selectedGenre === "ALL" || game.genre === selectedGenre
    return matchesSearch && matchesGenre
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
              className="text-4xl md:text-6xl font-pixel text-white neon-glow-pink glitch-text mb-6"
              data-text="ARCADE"
            >
              ARCADE
            </h1>
            <p className="text-electric-teal font-pixel text-sm max-w-2xl mx-auto leading-relaxed">
              PLAY, SHARE, EARN
            </p>
          </motion.div>

          {/* Search Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto mb-8"
          >
            {/* Search Bar */}
            <div className="relative mb-6">
              <div
                className={`pixel-border bg-retro-dark transition-all duration-300 ${
                  isSearchFocused ? "border-electric-teal" : "border-neon-pink"
                }`}
              >
                <div className="flex items-center p-4">
                  <Search className="w-4 h-4 text-electric-teal mr-3" />
                  <input
                    type="text"
                    placeholder="SEARCH GAMES..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="flex-1 bg-transparent text-white font-pixel text-xs placeholder-gray-500 focus:outline-none"
                  />
                  <div className="w-2 h-4 bg-electric-teal animate-pulse" />
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-neon-pink" />
                <span className="font-pixel text-xs text-white">FILTERS:</span>
              </div>

              <div className="flex space-x-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`retro-button transition-all duration-200 ${
                      selectedGenre === genre
                        ? "bg-electric-teal text-retro-dark border-electric-teal neon-glow-teal"
                        : "bg-transparent text-neon-pink border-neon-pink hover:bg-neon-pink hover:text-retro-dark"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <RetroGameCard game={game} />
              </motion.div>
            ))}
          </motion.div>

          {filteredGames.length === 0 && (
            <div className="text-center py-16">
              <div className="font-pixel text-neon-pink text-sm mb-4">NO GAMES FOUND</div>
              <div className="font-pixel text-white text-xs">TRY DIFFERENT SEARCH TERMS</div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
