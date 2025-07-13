"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, TrendingUp, Clock, Zap } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ParticleField } from "@/components/ui/particle-field"

const demoProfileData = {
  username: "DEMO_PLAYER",
  level: 42,
  tokenBalance: 2450,
  totalEarnings: 15680,
  gamesHosted: 23,
  hoursPlayed: 156,
  steamId: "76561198123456789",
}

const demoRentings = [
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
  {
    id: 3,
    title: "BALDURS GATE 3",
    timeRemaining: "00:45",
    tokensSpent: 45,
    status: "ACTIVE",
  },
]

const demoListings = [
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
  {
    id: 3,
    title: "SPIDER-MAN 2",
    rate: 25,
    status: "AVAILABLE",
    totalEarned: 320,
  },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("rentings")
  const [userData, setUserData] = useState<any>(null)
  const [userSessions, setUserSessions] = useState<any[]>([])
  const [userListings, setUserListings] = useState<any[]>([])
  const { user, loading } = useAuth()

  const tabs = [
    { id: "rentings", label: "RENTINGS" },
    { id: "listings", label: "LISTINGS" },
    { id: "earnings", label: "EARNINGS" },
  ]

  useEffect(() => {
    if (user) {
      // Fetch real user data if authenticated
      fetchUserData()
      fetchUserSessions()
      fetchUserListings()
    } else {
      // Use demo data for non-authenticated users
      setUserData(demoProfileData)
      setUserSessions(demoRentings)
      setUserListings(demoListings)
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/user/profile`)
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Fallback to demo data
      setUserData(demoProfileData)
    }
  }

  const fetchUserSessions = async () => {
    try {
      const response = await fetch(`/api/user/sessions`)
      if (response.ok) {
        const data = await response.json()
        setUserSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching user sessions:', error)
      // Fallback to demo data
      setUserSessions(demoRentings)
    }
  }

  const fetchUserListings = async () => {
    try {
      const response = await fetch(`/api/user/listings`)
      if (response.ok) {
        const data = await response.json()
        setUserListings(data.listings || [])
      }
    } catch (error) {
      console.error('Error fetching user listings:', error)
      // Fallback to demo data
      setUserListings(demoListings)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center relative overflow-hidden bg-retro-dark">
        <ParticleField />
        <div className="font-pixel text-electric-teal text-sm animate-pulse">LOADING PLAYER DATA...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 neon-grid relative overflow-hidden bg-retro-dark">
      {/* Particle Field Background */}
      <ParticleField />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1
            className="text-4xl md:text-6xl font-pixel text-neon-pink neon-glow-pink glitch-text mb-6"
            data-text="PLAYER PROFILE"
          >
            PLAYER PROFILE
          </h1>
          <p className="text-electric-teal font-pixel text-sm max-w-2xl mx-auto leading-relaxed">
            {user ? "YOUR GAMING JOURNEY" : "DEMO PLAYER PROFILE"}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="crt-monitor p-6 mb-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-neon-pink border-2 border-electric-teal pixel-border mx-auto mb-4 flex items-center justify-center relative">
                  <User className="w-10 h-10 text-retro-dark" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-electric-teal pixel-border flex items-center justify-center">
                    <span className="font-pixel text-retro-dark text-xs">{userData?.level || demoProfileData.level}</span>
                  </div>
                </div>

                <h2 className="font-pixel text-electric-teal text-sm mb-2 neon-glow-teal">
                  {userData?.steamId ? `STEAM_${userData.steamId.slice(-6)}` : demoProfileData.username}
                </h2>

                <div className="led-counter inline-block">
                  {(userData?.tokenBalance || demoProfileData.tokenBalance).toLocaleString()} TOKENS
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-retro-dark border border-neon-pink p-3 text-center">
                  <TrendingUp className="w-6 h-6 text-neon-pink mx-auto mb-2" />
                  <div className="font-pixel text-neon-pink text-xs">{userData?.totalEarnings || demoProfileData.totalEarnings}</div>
                  <div className="font-pixel text-white text-xs">EARNED</div>
                </div>

                <div className="bg-retro-dark border border-electric-teal p-3 text-center">
                  <Clock className="w-6 h-6 text-electric-teal mx-auto mb-2" />
                  <div className="font-pixel text-electric-teal text-xs">{userData?.hoursPlayed || demoProfileData.hoursPlayed}</div>
                  <div className="font-pixel text-white text-xs">HOURS</div>
                </div>
              </div>

              {/* Demo Notice */}
              {!user && (
                <div className="bg-electric-teal bg-opacity-20 border border-electric-teal p-3 text-center">
                  <div className="font-pixel text-electric-teal text-xs">DEMO MODE</div>
                  <div className="font-pixel text-white text-xs">LOGIN FOR REAL DATA</div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-2"
          >
            {/* Tab Buttons */}
            <div className="flex space-x-2 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`font-pixel text-xs px-4 py-2 border-2 transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-neon-pink text-retro-dark border-neon-pink"
                      : "bg-transparent text-neon-pink border-neon-pink hover:bg-neon-pink hover:text-retro-dark"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="crt-monitor p-6">
              {activeTab === "rentings" && (
                <div>
                  <h3 className="font-pixel text-electric-teal text-lg mb-4">ACTIVE RENTINGS</h3>
                  <div className="space-y-4">
                    {userSessions.map((renting) => (
                      <div
                        key={renting.id}
                        className="bg-retro-dark border border-neon-pink p-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-pixel text-neon-pink text-sm">{renting.title}</div>
                          <div className="font-pixel text-white text-xs">{renting.tokensSpent} TOKENS SPENT</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-pixel text-xs ${
                            renting.status === "ACTIVE" ? "text-electric-teal" : "text-gray-400"
                          }`}>
                            {renting.timeRemaining}
                          </div>
                          <div className="font-pixel text-white text-xs">{renting.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "listings" && (
                <div>
                  <h3 className="font-pixel text-electric-teal text-lg mb-4">YOUR LISTINGS</h3>
                  <div className="space-y-4">
                    {userListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="bg-retro-dark border border-electric-teal p-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-pixel text-electric-teal text-sm">{listing.title}</div>
                          <div className="font-pixel text-white text-xs">{listing.rate} TOKENS/HOUR</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-pixel text-xs ${
                            listing.status === "AVAILABLE" ? "text-neon-pink" : "text-electric-teal"
                          }`}>
                            {listing.status}
                          </div>
                          <div className="font-pixel text-white text-xs">{listing.totalEarned} EARNED</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "earnings" && (
                <div>
                  <h3 className="font-pixel text-electric-teal text-lg mb-4">EARNINGS OVERVIEW</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-retro-dark border border-neon-pink p-4 text-center">
                      <div className="font-pixel text-neon-pink text-lg">{userData?.totalEarnings || demoProfileData.totalEarnings}</div>
                      <div className="font-pixel text-white text-xs">TOTAL EARNED</div>
                    </div>
                    <div className="bg-retro-dark border border-electric-teal p-4 text-center">
                      <div className="font-pixel text-electric-teal text-lg">{userData?.gamesHosted || demoProfileData.gamesHosted}</div>
                      <div className="font-pixel text-white text-xs">GAMES HOSTED</div>
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
