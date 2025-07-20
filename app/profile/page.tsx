"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Clock, Zap } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ParticleField } from "@/components/ui/particle-field"

const demoProfileData = {
  username: "DEMO_PLAYER",
  level: 42,
  tokenBalance: 2450,
  totalEarnings: 15680,
  gamesHosted: 23,
  hoursPlayed: 156,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");

  console.log('Profile page render:', { 
    hasUser: !!user, 
    loading, 
    userId: user?.id,
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
  });

  const tabs = [
    { id: "rentings", label: "RENTINGS" },
    { id: "listings", label: "LISTINGS" },
    { id: "earnings", label: "EARNINGS" },
  ]

  useEffect(() => {
    if (user) {
      // Fetch real user data if authenticated
      console.log('Profile page: User authenticated, fetching data for:', user.id)
      fetchUserData()
      fetchUserSessions()
      fetchUserListings()
    } else {
      // Use demo data for non-authenticated users
      console.log('Profile page: No user found, loading demo data')
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
        setEditUsername(data.username || "");
        setEditFullName(data.full_name || "");
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
    console.log('Profile page: Auth loading state')
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
      {/* <ParticleField /> */}

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1
            className="text-4xl md:text-6xl font-pixel text-white neon-glow-pink glitch-text mb-6"
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
            {/* Profile Header */}
            <div className="crt-monitor p-6 mb-6">
              <div className="text-center mb-6">
                <h2 className="font-pixel text-electric-teal text-lg mb-4 neon-glow-teal">
                  {userData?.username || demoProfileData.username}
                </h2>

                {user && !isEditing && (
                  <motion.button 
                    className="retro-button bg-neon-pink text-retro-dark border-neon-pink font-pixel text-xs px-4 py-2 mt-2"
                    onClick={() => setIsEditing(true)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95, y: 0 }}
                  >
                    EDIT PROFILE
                  </motion.button>
                )}
                {isEditing && (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 mt-4 p-4 pixel-border border-electric-teal"
                    style={{ backgroundColor: 'var(--retro-dark)' }}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await fetch('/api/user/profile', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ username: editUsername, full_name: editFullName }),
                        });
                        if (res.ok) {
                          const updated = await res.json();
                          setUserData((prev: any) => ({ ...prev, ...updated }));
                          setIsEditing(false);
                          await fetchUserData(); // Refresh data
                          // Trigger a page refresh to update navigation
                          window.location.reload();
                        } else {
                          const error = await res.json();
                          alert(error.error || 'Failed to update profile');
                        }
                      } catch (error) {
                        alert('Failed to update profile');
                      }
                    }}
                  >
                    <div>
                      <label className="block font-pixel text-xs mb-1" style={{ color: 'var(--electric-teal)' }}>
                        USERNAME
                      </label>
                      <input 
                        className="w-full px-3 py-2 border-2 border-electric-teal font-pixel text-xs focus:border-neon-pink focus:outline-none"
                        style={{ 
                          backgroundColor: 'var(--retro-dark)',
                          color: 'var(--pixel-white)'
                        }}
                        value={editUsername} 
                        onChange={e => setEditUsername(e.target.value)} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block font-pixel text-xs mb-1" style={{ color: 'var(--electric-teal)' }}>
                        FULL NAME
                      </label>
                      <input 
                        className="w-full px-3 py-2 border-2 border-electric-teal font-pixel text-xs focus:border-neon-pink focus:outline-none"
                        style={{ 
                          backgroundColor: 'var(--retro-dark)',
                          color: 'var(--pixel-white)'
                        }}
                        value={editFullName} 
                        onChange={e => setEditFullName(e.target.value)}
                        placeholder="Your full name..."
                      />
                    </div>
                    <div className="flex space-x-2">
                      <motion.button 
                        type="submit" 
                        className="retro-button bg-electric-teal text-retro-dark border-electric-teal font-pixel text-xs px-4 py-2"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95, y: 0 }}
                      >
                        SAVE
                      </motion.button>
                      <motion.button 
                        type="button" 
                        className="retro-button bg-gray-600 text-white border-gray-600 font-pixel text-xs px-4 py-2"
                        onClick={() => setIsEditing(false)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95, y: 0 }}
                      >
                        CANCEL
                      </motion.button>
                    </div>
                  </motion.form>
                )}
                {!isEditing && userData?.full_name && (
                  <div className="font-pixel text-xs text-white mt-2 p-2 pixel-border border-electric-teal" style={{ backgroundColor: 'rgba(25, 255, 225, 0.1)' }}>
                    {userData.full_name}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-retro-dark border border-electric-teal p-3 text-center">
                  <Zap className="w-6 h-6 text-electric-teal mx-auto mb-2" />
                  <div className="font-pixel text-electric-teal text-xs">{userData?.tokensBalance || demoProfileData.tokenBalance}</div>
                  <div className="font-pixel text-white text-xs">TOKENS</div>
                </div>

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
                      ? "bg-neon-pink text-white border-neon-pink"
                      : "bg-transparent text-neon-pink border-neon-pink hover:bg-neon-pink hover:text-white"
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
