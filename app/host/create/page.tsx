"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Upload, Gamepad2, DollarSign, Star, Tag, Clock, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ParticleField } from "@/components/ui/particle-field"

export default function CreateListingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    gameTitle: "",
    description: "",
    genre: "",
    tokensPerHour: "",
    minimumRentalTime: "1",
    maximumRentalTime: "24",
    gameImage: null as File | null,
    systemRequirements: "",
    tags: "",
    specialInstructions: "",
  })

  const genres = [
    "ACTION",
    "ADVENTURE",
    "RPG",
    "FPS",
    "STRATEGY",
    "SIMULATION",
    "SPORT",
    "RACING",
    "PUZZLE",
    "HORROR",
    "INDIE",
    "MMO",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log("Creating listing:", formData)

    // Redirect back to host page
    router.push("/host")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, gameImage: file })
    }
  }

  return (
    <div className="min-h-screen pt-16 relative overflow-hidden bg-retro-dark">
      {/* Particle Field Background */}
      <ParticleField />

      {/* Hero Section */}
      <section className="relative py-16 neon-grid">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <Link
              href="/host"
              className="inline-flex items-center space-x-2 font-pixel text-electric-teal text-xs mb-6 hover:text-neon-pink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK TO HOST TERMINAL</span>
            </Link>

            <h1
              className="text-4xl md:text-6xl font-pixel text-neon-pink neon-glow-pink glitch-text mb-6"
              data-text="CREATE LISTING"
            >
              CREATE LISTING
            </h1>
            <p className="text-electric-teal font-pixel text-sm max-w-2xl mx-auto leading-relaxed">
              REGISTER YOUR GAME FOR HOSTING
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="crt-monitor p-8"
          >
            {/* Terminal Header */}
            <div className="flex items-center space-x-2 mb-8 pb-4 border-b border-electric-teal">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-pixel text-electric-teal text-xs ml-4">LISTING_FORM.EXE</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Game Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <label className="flex items-center space-x-2 font-pixel text-white text-xs mb-3">
                  <Gamepad2 className="w-4 h-4 text-neon-pink" />
                  <span>GAME TITLE:</span>
                </label>
                <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                  <input
                    type="text"
                    value={formData.gameTitle}
                    onChange={(e) => setFormData({ ...formData, gameTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500"
                    placeholder="ENTER GAME NAME..."
                    required
                  />
                </div>
              </motion.div>

              {/* Genre Selection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <label className="flex items-center space-x-2 font-pixel text-white text-xs mb-3">
                  <Tag className="w-4 h-4 text-neon-pink" />
                  <span>GENRE:</span>
                </label>
                <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full px-4 py-3 bg-retro-dark text-electric-teal font-pixel text-xs focus:outline-none"
                    required
                  >
                    <option value="">SELECT GENRE...</option>
                    {genres.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>

              {/* Pricing */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <label className="flex items-center space-x-2 font-pixel text-white text-xs mb-3">
                  <DollarSign className="w-4 h-4 text-neon-pink" />
                  <span>TOKENS PER HOUR:</span>
                </label>
                <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.tokensPerHour}
                    onChange={(e) => setFormData({ ...formData, tokensPerHour: e.target.value })}
                    className="w-full px-4 py-3 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500"
                    placeholder="SET HOURLY RATE..."
                    required
                  />
                </div>
                <p className="font-pixel text-gray-400 text-xs mt-2">RECOMMENDED: 15-30 TOKENS/HOUR</p>
              </motion.div>

              {/* Rental Time Limits */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label className="flex items-center space-x-2 font-pixel text-white text-xs mb-3">
                    <Clock className="w-4 h-4 text-neon-pink" />
                    <span>MIN RENTAL (HOURS):</span>
                  </label>
                  <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={formData.minimumRentalTime}
                      onChange={(e) => setFormData({ ...formData, minimumRentalTime: e.target.value })}
                      className="w-full px-4 py-3 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 font-pixel text-white text-xs mb-3">
                    <Clock className="w-4 h-4 text-neon-pink" />
                    <span>MAX RENTAL (HOURS):</span>
                  </label>
                  <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={formData.maximumRentalTime}
                      onChange={(e) => setFormData({ ...formData, maximumRentalTime: e.target.value })}
                      className="w-full px-4 py-3 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              {/* Game Image Upload */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <label className="flex items-center space-x-2 font-pixel text-white text-xs mb-3">
                  <Upload className="w-4 h-4 text-neon-pink" />
                  <span>GAME IMAGE:</span>
                </label>
                <div className="bg-retro-dark border-2 border-electric-teal pixel-border border-dashed hover:border-neon-pink transition-colors p-6 text-center">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="game-image" />
                  <label htmlFor="game-image" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-electric-teal mx-auto mb-2" />
                    <p className="font-pixel text-electric-teal text-xs">
                      {formData.gameImage ? formData.gameImage.name : "CLICK TO UPLOAD IMAGE"}
                    </p>
                    <p className="font-pixel text-gray-400 text-xs mt-1">PNG, JPG UP TO 5MB</p>
                  </label>
                </div>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <label className="flex items-center space-x-2 font-pixel text-white text-xs mb-3">
                  <FileText className="w-4 h-4 text-neon-pink" />
                  <span>DESCRIPTION:</span>
                </label>
                <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500 h-24 resize-none"
                    placeholder="DESCRIBE YOUR GAME..."
                    required
                  />
                </div>
              </motion.div>

              {/* System Requirements */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <label className="flex items-center space-x-2 font-pixel text-white text-xs mb-3">
                  <Star className="w-4 h-4 text-neon-pink" />
                  <span>SYSTEM REQUIREMENTS:</span>
                </label>
                <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                  <textarea
                    value={formData.systemRequirements}
                    onChange={(e) => setFormData({ ...formData, systemRequirements: e.target.value })}
                    className="w-full px-4 py-3 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500 h-20 resize-none"
                    placeholder="MIN SPECS, RECOMMENDED SPECS..."
                  />
                </div>
              </motion.div>

              {/* Special Instructions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <label className="flex items-center space-x-2 font-pixel text-white text-xs mb-3">
                  <FileText className="w-4 h-4 text-neon-pink" />
                  <span>SPECIAL INSTRUCTIONS:</span>
                </label>
                <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    className="w-full px-4 py-3 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500 h-20 resize-none"
                    placeholder="SETUP INSTRUCTIONS, NOTES FOR RENTERS..."
                  />
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="text-center pt-8"
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`font-pixel text-sm px-12 py-4 transition-all duration-300 ${
                    isSubmitting
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-neon-pink text-retro-dark hover:bg-electric-teal hover:text-retro-dark neon-glow-pink"
                  }`}
                >
                  {isSubmitting ? "CREATING LISTING..." : "DEPLOY GAME HOST"}
                </button>

                <p className="font-pixel text-electric-teal text-xs mt-4">LISTING WILL BE REVIEWED BEFORE GOING LIVE</p>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
