"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from '@/hooks/use-auth'
import { ParticleField } from "@/components/ui/particle-field"
import { Mail, Lock, User, Zap } from "lucide-react"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const { user, supabase } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  })

  useEffect(() => {
    const errorParam = searchParams?.get('error')
    const messageParam = searchParams?.get('message')
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
    if (messageParam) {
      setMessage(decodeURIComponent(messageParam))
    }

    if (user) {
      const redirectTo = localStorage.getItem('authRedirect') || '/marketplace'
      localStorage.removeItem('authRedirect')
      router.replace(redirectTo)
    }
  }, [user, router, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (error) throw error

      if (data.user) {
        const redirectTo = localStorage.getItem('authRedirect') || '/marketplace'
        localStorage.removeItem('authRedirect')
        router.push(redirectTo)
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    if (!registerData.username.trim()) {
      setError('Username is required')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: { username: registerData.username }
        }
      })

      if (error) throw error

      if (data.user) {
        await createUserProfile(data.user.id, registerData.username, registerData.email)
        setMessage('Registration successful! Please check your email to verify your account.')
        setRegisterData({ email: '', password: '', confirmPassword: '', username: '' })
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const createUserProfile = async (userId: string, username: string, email: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          username: username,
          full_name: username,
          avatar_url: null,
        }])

      if (error) console.error('Error creating profile:', error)
    } catch (err) {
      console.error('Profile creation error:', err)
    }
  }

  if (user) {
    return (
      <div className="min-h-screen bg-retro-dark flex items-center justify-center relative overflow-hidden">
        <ParticleField />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto mb-4"></div>
          <p className="font-pixel text-neon-pink">REDIRECTING...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-retro-dark relative overflow-hidden">
      <ParticleField />
      
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1 
              className="text-4xl font-pixel text-white neon-glow-pink mb-4"
              animate={{
                textShadow: [
                  '0 0 10px #ff5c8d, 0 0 20px #ff5c8d, 0 0 30px #ff5c8d',
                  '0 0 5px #ff5c8d, 0 0 10px #ff5c8d, 0 0 15px #ff5c8d',
                  '0 0 10px #ff5c8d, 0 0 20px #ff5c8d, 0 0 30px #ff5c8d'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              GAME SHARE
            </motion.h1>
            <p className="font-pixel text-electric-teal text-sm">ACCESS THE NETWORK</p>
          </div>

          {/* CRT Monitor Container */}
          <div className="crt-monitor p-8">
            {/* Error/Message Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 pixel-border"
                >
                  <p className="font-pixel text-red-400 text-xs">{error}</p>
                </motion.div>
              )}

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-electric-teal bg-opacity-10 border border-electric-teal pixel-border"
                >
                  <p className="font-pixel text-electric-teal text-xs">{message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab Switcher */}
            <div className="flex mb-8 bg-retro-dark border-2 border-electric-teal pixel-border overflow-hidden">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 font-pixel text-xs py-3 px-4 transition-all duration-200 ${
                  activeTab === 'login'
                    ? 'bg-neon-pink text-retro-dark'
                    : 'text-electric-teal hover:text-neon-pink hover:bg-neon-pink hover:bg-opacity-10'
                }`}
              >
                LOGIN
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 font-pixel text-xs py-3 px-4 transition-all duration-200 ${
                  activeTab === 'register'
                    ? 'bg-electric-teal text-retro-dark'
                    : 'text-electric-teal hover:text-neon-pink hover:bg-neon-pink hover:bg-opacity-10'
                }`}
              >
                REGISTER
              </button>
            </div>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {activeTab === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <div>
                    <label className="block font-pixel text-white text-xs mb-2">EMAIL:</label>
                    <div className="relative bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-electric-teal" />
                      <input
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500"
                        placeholder="YOUR.EMAIL@EXAMPLE.COM"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-pixel text-white text-xs mb-2">PASSWORD:</label>
                    <div className="relative bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-electric-teal" />
                      <input
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-neon-pink to-electric-teal text-retro-dark font-pixel text-lg py-4 hover:from-electric-teal hover:to-neon-pink transition-all duration-300 disabled:opacity-50"
                    whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(255, 92, 141, 0.6)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>{isLoading ? "ACCESSING..." : "LOGIN"}</span>
                    </span>
                  </motion.button>
                </motion.form>
              )}

              {activeTab === 'register' && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleRegister}
                  className="space-y-6"
                >
                  <div>
                    <label className="block font-pixel text-white text-xs mb-2">USERNAME:</label>
                    <div className="relative bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-electric-teal" />
                      <input
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500"
                        placeholder="PLAYER_NAME"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-pixel text-white text-xs mb-2">EMAIL:</label>
                    <div className="relative bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-electric-teal" />
                      <input
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500"
                        placeholder="YOUR.EMAIL@EXAMPLE.COM"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-pixel text-white text-xs mb-2">PASSWORD:</label>
                    <div className="relative bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-electric-teal" />
                      <input
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-pixel text-white text-xs mb-2">CONFIRM PASSWORD:</label>
                    <div className="relative bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-electric-teal" />
                      <input
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-electric-teal to-neon-pink text-retro-dark font-pixel text-lg py-4 hover:from-neon-pink hover:to-electric-teal transition-all duration-300 disabled:opacity-50"
                    whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(25, 255, 225, 0.6)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>{isLoading ? "CREATING..." : "JOIN THE REVOLUTION"}</span>
                    </span>
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 