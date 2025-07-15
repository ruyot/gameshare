"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Bell, Zap } from "lucide-react"

export function WaitlistSection() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/waitlist-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      alert('Something went wrong. Please try again.');
      return;
    }
    setIsSubmitted(true);
    setEmail('');
  };

  return (
    <section className="relative py-32 neon-grid">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="mb-8"
          >
            <Bell className="w-16 h-16 text-electric-teal mx-auto neon-glow-teal" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-pixel text-white neon-glow-pink mb-8">WANT ALL THE UPDATES?</h2>

          <p className="font-pixel text-electric-teal text-lg mb-12">JOIN THE WAITLIST FOR EXCLUSIVE ACCESS</p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="crt-monitor p-8 max-w-2xl mx-auto"
          >
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-electric-teal" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER YOUR EMAIL..."
                    className="w-full pl-12 pr-4 py-4 bg-retro-dark border-2 border-electric-teal pixel-border text-electric-teal font-pixel text-sm focus:outline-none focus:border-neon-pink transition-colors"
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-neon-pink to-electric-teal text-retro-dark font-pixel text-lg py-4 hover:from-electric-teal hover:to-neon-pink transition-all duration-300"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 30px rgba(255, 92, 141, 0.6)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span className="text-white">JOIN THE REVOLUTION</span>
                  </span>
                </motion.button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1 }}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Zap className="w-8 h-8 text-retro-dark" />
                </motion.div>
                <h3 className="font-pixel text-electric-teal text-xl mb-2">WELCOME TO THE FUTURE!</h3>
                <p className="font-pixel text-white text-sm">YOU'RE ON THE WAITLIST FOR GAMESHARE</p>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center"
          >
            {["EARLY ACCESS", "EXCLUSIVE UPDATES", "BETA TESTING"].map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                viewport={{ once: true }}
                className="font-pixel text-electric-teal text-xs"
              >
                ✓ {benefit}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
