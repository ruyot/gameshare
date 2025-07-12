"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, TrendingUp, Clock, Zap } from "lucide-react"

const profileData = {
  username: "PLAYER_ONE",
  level: 42,
  tokenBalance: 2450,
  totalEarnings: 15680,
  gamesHosted: 23,
  hoursPlayed: 156,
}

const myRentings = [
  {
    id: 1,
    title: "CYBER PUNK 2077",
    timeRemaining: "01:30",
    tokensSpent: 75,
    status: "ACTIVE",
  },
  {
    id: 2,
    title: "WITCHER III",
    timeRemaining: "COMPLETE",
    tokensSpent: 120,
    status: "DONE",
  },
]

const myListings = [
  {
    id: 1,
    title: "FIFA 24",
    rate: 15,
    status: "AVAILABLE",
    totalEarned: 450,
  },
  {
    id: 2,
    title: "CALL OF DUTY MW3",
    rate: 30,
    status: "RENTED",
    totalEarned: 890,
  },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("rentings")

  const tabs = [
    { id: "rentings", label: "RENTINGS" },
    { id: "listings", label: "LISTINGS" },
    { id: "earnings", label: "EARNINGS" },
  ]

  return (
    <div className="min-h-screen pt-16 neon-grid">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="crt-monitor p-6 mb-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-neon-pink border-2 border-electric-teal pixel-border mx-auto mb-4 flex items-center justify-center relative">
                  <User className="w-10 h-10 text-retro-dark" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-electric-teal pixel-border flex items-center justify-center">
                    <span className="font-pixel text-retro-dark text-xs">{profileData.level}</span>
                  </div>
                </div>

                <h2 className="font-pixel text-electric-teal text-sm mb-2 neon-glow-teal">{profileData.username}</h2>

                <div className="led-counter inline-block">{profileData.tokenBalance.toLocaleString()} TOKENS</div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-retro-dark border border-neon-pink p-3 text-center">
                  <TrendingUp className="w-6 h-6 text-neon-pink mx-auto mb-2" />
                  <div className="font-pixel text-neon-pink text-xs">{profileData.totalEarnings}</div>
                  <div className="font-pixel text-white text-xs">EARNED</div>
                </div>

                <div className="bg-retro-dark border border-electric-teal p-3 text-center">
                  <Clock className="w-6 h-6 text-electric-teal mx-auto mb-2" />
                  <div className="font-pixel text-electric-teal text-xs">{profileData.hoursPlayed}</div>
                  <div className="font-pixel text-white text-xs">HOURS</div>
                </div>
              </div>

              {/* Tab Buttons */}
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full retro-button text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-electric-teal text-retro-dark border-electric-teal transform translate-y-1"
                        : "bg-transparent text-neon-pink border-neon-pink hover:bg-neon-pink hover:text-retro-dark"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="crt-monitor p-6">
              <h1 className="font-pixel text-neon-pink text-lg mb-6 neon-glow-pink">
                {activeTab === "rentings"
                  ? "MY RENTINGS"
                  : activeTab === "listings"
                    ? "MY LISTINGS"
                    : "EARNINGS HISTORY"}
              </h1>

              {activeTab === "rentings" && (
                <div className="space-y-4">
                  {myRentings.map((rental, index) => (
                    <motion.div
                      key={rental.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-retro-dark border border-electric-teal p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-pixel text-white text-xs mb-1">{rental.title}</div>
                        <div className="font-pixel text-electric-teal text-xs">
                          {rental.status === "ACTIVE" ? `TIME: ${rental.timeRemaining}` : rental.timeRemaining}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-pixel text-neon-pink text-xs mb-1">{rental.tokensSpent}T</div>
                        <div
                          className={`font-pixel text-xs px-2 py-1 ${
                            rental.status === "ACTIVE"
                              ? "bg-electric-teal text-retro-dark"
                              : "bg-neon-pink text-retro-dark"
                          }`}
                        >
                          {rental.status}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === "listings" && (
                <div className="space-y-4">
                  {myListings.map((listing, index) => (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-retro-dark border border-neon-pink p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-pixel text-white text-xs mb-1">{listing.title}</div>
                        <div className="font-pixel text-neon-pink text-xs">{listing.rate}T/HOUR</div>
                      </div>

                      <div className="text-right">
                        <div className="font-pixel text-electric-teal text-xs mb-1">{listing.totalEarned}T EARNED</div>
                        <div
                          className={`font-pixel text-xs px-2 py-1 ${
                            listing.status === "AVAILABLE"
                              ? "bg-neon-pink text-retro-dark"
                              : "bg-electric-teal text-retro-dark animate-pulse"
                          }`}
                        >
                          {listing.status}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === "earnings" && (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 text-electric-teal mx-auto mb-4 animate-pulse" />
                  <h3 className="font-pixel text-neon-pink text-sm mb-4">EARNINGS TERMINAL</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                    <div className="crt-monitor p-4">
                      <div className="font-pixel text-electric-teal text-lg mb-2">
                        {profileData.totalEarnings.toLocaleString()}
                      </div>
                      <div className="font-pixel text-white text-xs">TOTAL EARNED</div>
                    </div>

                    <div className="crt-monitor p-4">
                      <div className="font-pixel text-neon-pink text-lg mb-2">{profileData.gamesHosted}</div>
                      <div className="font-pixel text-white text-xs">GAMES HOSTED</div>
                    </div>

                    <div className="crt-monitor p-4">
                      <div className="font-pixel text-electric-teal text-lg mb-2">4.8</div>
                      <div className="font-pixel text-white text-xs">AVG RATING</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
