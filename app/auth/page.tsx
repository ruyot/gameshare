"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { User, Lock, Eye, EyeOff, Gamepad2 } from "lucide-react"
import { useRouter } from "next/navigation"

// Steam Icon Component
const SteamIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.979 0C5.678 0 0.511 4.86 0.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.624 0 11.979-5.354 11.979-11.979C23.958 5.354 18.603.001 11.979.001zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.456-.397.957-1.497 1.41-2.454 1.01z" />
  </svg>
)

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  })
  const [terminalText, setTerminalText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const router = useRouter()

  const typewriterEffect = (text: string) => {
    setIsTyping(true)
    setTerminalText("")
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setTerminalText(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
        setIsTyping(false)
      }
    }, 50)
  }

  useEffect(() => {
    typewriterEffect("WELCOME TO GAME SHARE AUTHENTICATION TERMINAL")
  }, [])

  const handleSteamLogin = async () => {
    setIsLoading(true)
    try {
      typewriterEffect("CONNECTING TO STEAM NETWORK...")
      // Redirect to Steam login
      router.push(`/api/auth/steam-login?returnUrl=${encodeURIComponent('/marketplace')}`)
    } catch (error) {
      console.error("Steam login error:", error)
      typewriterEffect("ERROR: STEAM CONNECTION FAILED")
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
        typewriterEffect("LOGIN SUCCESSFUL - REDIRECTING TO ARCADE...")
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
            },
          },
        })
        if (error) throw error
        typewriterEffect("ACCOUNT CREATED - CHECK EMAIL FOR VERIFICATION")
      }
    } catch (error: any) {
      typewriterEffect(`ERROR: ${error.message.toUpperCase()}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D Grid Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-retro-dark to-black">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              linear-gradient(90deg, transparent 0%, rgba(255, 92, 141, 0.3) 50%, transparent 100%),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 40px,
                rgba(255, 92, 141, 0.1) 40px,
                rgba(255, 92, 141, 0.1) 41px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 40px,
                rgba(255, 92, 141, 0.1) 40px,
                rgba(255, 92, 141, 0.1) 41px
              )
            `,
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "bottom",
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-electric-teal"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, type: "spring" }}
          className="w-full max-w-md"
          style={{ perspective: "1000px" }}
        >
          {/* Terminal Header */}
          <div className="crt-monitor mb-8 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-pixel text-electric-teal text-xs ml-4">AUTH_TERMINAL.EXE</span>
            </div>
            <div className="font-pixel text-electric-teal text-xs leading-relaxed">
              {terminalText}
              {isTyping && <span className="animate-pulse">_</span>}
            </div>
          </div>

          {/* Auth Form */}
          <div className="crt-monitor p-8 relative">
            {/* Scan Lines Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-pink to-transparent opacity-5 animate-pulse pointer-events-none" />

            {/* Logo */}
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center space-x-2"
                animate={{ rotateY: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
              >
                <Gamepad2 className="w-8 h-8 text-neon-pink" />
                <h1 className="font-pixel text-white text-lg neon-glow-pink-readable">GAME SHARE</h1>
              </motion.div>
            </div>

            {/* Steam Login - Primary Option */}
            <div className="mb-8">
              <motion.button
                onClick={handleSteamLogin}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-pixel text-sm border-2 border-blue-500 hover:from-blue-500 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden"
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Steam Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 transform -skew-x-12 animate-pulse" />

                <SteamIcon className="w-6 h-6" />
                <span className="relative z-10">{isLoading ? "CONNECTING TO STEAM..." : "LOGIN WITH STEAM"}</span>
              </motion.button>

              {/* Removed the 'Recommended for gamers' text */}
              {/* <div className="text-center mt-3">
                <p className="font-pixel text-xs text-electric-teal">RECOMMENDED FOR GAMERS</p>
              </div> */}
            </div>

            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-pink to-transparent"></div>
              <span className="px-4 font-pixel text-xs text-white">OR USE EMAIL</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-pink to-transparent"></div>
            </div>

            {/* Tab Switcher */}
            <div className="flex mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 font-pixel text-xs py-3 transition-all duration-300 ${
                  isLogin
                    ? "bg-electric-teal text-retro-dark border-b-2 border-electric-teal"
                    : "bg-transparent text-white border-b-2 border-gray-600 hover:border-neon-pink"
                }`}
              >
                LOGIN
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 font-pixel text-xs py-3 transition-all duration-300 ${
                  !isLogin
                    ? "bg-electric-teal text-retro-dark border-b-2 border-electric-teal"
                    : "bg-transparent text-white border-b-2 border-gray-600 hover:border-neon-pink"
                }`}
              >
                REGISTER
              </button>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-6">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block font-pixel text-white text-xs mb-2">USERNAME:</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-electric-teal" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-retro-dark border-2 border-electric-teal pixel-border text-electric-teal font-pixel text-xs focus:outline-none focus:border-neon-pink transition-colors"
                        placeholder="PLAYER_NAME"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block font-pixel text-white text-xs mb-2">EMAIL:</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-electric-teal" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-retro-dark border-2 border-electric-teal pixel-border text-electric-teal font-pixel text-xs focus:outline-none focus:border-neon-pink transition-colors"
                    placeholder="USER@EXAMPLE.COM"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-pixel text-white text-xs mb-2">ACCESS_CODE:</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-electric-teal" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 bg-retro-dark border-2 border-electric-teal pixel-border text-electric-teal font-pixel text-xs focus:outline-none focus:border-neon-pink transition-colors"
                    placeholder="••••••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-electric-teal hover:text-neon-pink transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 font-pixel text-sm transition-all duration-300 ${
                  isLoading
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-neon-pink text-retro-dark hover:bg-opacity-80 neon-glow-pink"
                }`}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? "PROCESSING..." : isLogin ? "ENTER GAME" : "CREATE PLAYER"}
              </motion.button>
            </form>

            {/* Forgot Password */}
            {isLogin && (
              <div className="text-center mt-6">
                <button className="font-pixel text-xs text-gray-400 hover:text-electric-teal transition-colors">
                  forgot_password?
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="font-pixel text-xs text-gray-500">SECURE CONNECTION ESTABLISHED</p>
            <div className="flex justify-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
