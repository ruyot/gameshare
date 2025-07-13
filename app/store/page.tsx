"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DollarSign, Play, Trophy, Star, Zap, Gift, Target, Users, Clock, TrendingUp } from "lucide-react"
import { RetroCarousel } from "@/components/retro-carousel"

const tokenPackages = [
  { id: 1, tokens: 1000, price: 10, bonus: 0, popular: false, priceEnv: 'NEXT_PUBLIC_PRICE_1000_TOKENS' },
  { id: 2, tokens: 2500, price: 20, bonus: 500, popular: true, priceEnv: 'NEXT_PUBLIC_PRICE_2500_TOKENS' },
  { id: 3, tokens: 5000, price: 40, bonus: 1500, popular: false, priceEnv: 'NEXT_PUBLIC_PRICE_5000_TOKENS' },
  { id: 4, tokens: 10000, price: 75, bonus: 3500, popular: false, priceEnv: 'NEXT_PUBLIC_PRICE_10000_TOKENS' },
]

const giftGames = [
  {
    id: 1,
    title: "MYSTERY AAA GAME",
    description: "UNLOCK PREMIUM TITLE",
    image: "/placeholder.svg",
  },
  {
    id: 2,
    title: "INDIE BUNDLE PACK",
    description: "5 HANDPICKED GAMES",
    image: "/placeholder.svg",
  },
  {
    id: 3,
    title: "RACING COLLECTION",
    description: "SPEED DEMON BUNDLE",
    image: "/placeholder.svg",
  },
]

export default function StorePage() {
  const [isAdPlaying, setIsAdPlaying] = useState(false)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const { session } = useAuth()
  const router = useRouter()

  const playAd = () => {
    setIsAdPlaying(true)
    setTimeout(() => {
      setIsAdPlaying(false)
      // Trigger confetti effect here
    }, 3000)
  }

  async function buyTokens(priceEnv: string, pkgId: number) {
    if (!session?.user?.id) {
      // Redirect to login if not authenticated
      router.push('/auth')
      return
    }
    
    setLoadingId(pkgId)
    const priceId = process.env[priceEnv]!
    const res = await fetch('/api/payments/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': session.user.id,
      },
      body: JSON.stringify({ priceId }),
    }).then(r => r.json())

    if (res.url) router.push(res.url)
    else {
      setLoadingId(null)
      alert(res.error || 'Checkout error')
    }
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="py-16 neon-grid">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1
              className="text-4xl md:text-6xl font-pixel text-electric-teal neon-glow-teal glitch-text mb-6"
              data-text="TOKEN STORE"
            >
              TOKEN STORE
            </h1>
            <p className="text-neon-pink font-pixel text-sm max-w-2xl mx-auto leading-relaxed">
              POWER UP YOUR GAMING EXPERIENCE
            </p>
          </motion.div>
        </div>
      </section>

      {/* Token Packages */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="font-pixel text-neon-pink text-lg mb-4">TOKEN PACKAGES</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tokenPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className={`relative crt-monitor p-6 text-center ${
                  pkg.popular ? "scale-105 border-electric-teal" : ""
                }`}
                whileHover={{
                  scale: pkg.popular ? 1.1 : 1.05,
                  rotateY: 5,
                }}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-electric-teal text-retro-dark px-3 py-1 font-pixel text-xs">POPULAR</span>
                  </div>
                )}

                {/* Spinning Coin */}
                <motion.div
                  className="w-16 h-16 bg-neon-pink border-2 border-electric-teal pixel-border mx-auto mb-4 flex items-center justify-center"
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  whileHover={{ rotateY: 720 }}
                >
                  <DollarSign className="w-8 h-8 text-retro-dark" />
                </motion.div>

                <div className="font-pixel text-electric-teal text-lg mb-2">
                  {(pkg.tokens + pkg.bonus).toLocaleString()}
                </div>

                <div className="font-pixel text-white text-xs mb-4">
                  {pkg.tokens.toLocaleString()} TOKENS
                  {pkg.bonus > 0 && <div className="text-neon-pink">+{pkg.bonus.toLocaleString()} BONUS</div>}
                </div>

                <div className="font-pixel text-neon-pink text-xl mb-6">${pkg.price}</div>

                <button
                  className="retro-button bg-electric-teal text-retro-dark border-electric-teal w-full"
                  onClick={() => buyTokens(pkg.priceEnv, pkg.id)}
                  disabled={loadingId === pkg.id}
                >
                  {loadingId === pkg.id ? 'Redirecting...' : 'PURCHASE'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Tokens Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="crt-monitor p-8 text-center relative overflow-hidden"
          >
            {/* TV Monitor Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-pink to-transparent opacity-5 animate-pulse" />

            <Zap className="w-16 h-16 text-electric-teal mx-auto mb-4 animate-bounce" />

            <h3 className="font-pixel text-neon-pink text-lg mb-4 neon-glow-pink">EARN FREE TOKENS!</h3>

            <p className="font-pixel text-white text-xs mb-6 leading-relaxed max-w-2xl mx-auto">
              WATCH ADS AND COMPLETE MISSIONS TO EARN TOKENS
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={playAd}
                disabled={isAdPlaying}
                className={`retro-button flex items-center space-x-2 ${
                  isAdPlaying
                    ? "bg-neon-pink text-retro-dark border-neon-pink animate-pulse"
                    : "bg-electric-teal text-retro-dark border-electric-teal"
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{isAdPlaying ? "PLAYING AD..." : "WATCH AD (50T)"}</span>
              </button>

              <button 
                onClick={() => console.log('View missions clicked')}
                className="retro-button bg-transparent text-neon-pink border-neon-pink"
              >
                VIEW MISSIONS
              </button>
            </div>

            {isAdPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-retro-dark bg-opacity-90 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="font-pixel text-electric-teal text-sm mb-4">AD PLAYING...</div>
                  <div className="w-32 h-2 bg-retro-dark border border-neon-pink">
                    <motion.div
                      className="h-full bg-neon-pink"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Gift Codes Carousel */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-pixel text-electric-teal text-lg mb-4 flex items-center justify-center">
              <Gift className="w-6 h-6 mr-3" />
              GIFT CODE CAROUSEL
            </h2>
          </motion.div>

          <RetroCarousel items={giftGames} />
        </div>
      </section>
    </div>
  )
}
