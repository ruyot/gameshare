"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { ParticleField } from "@/components/ui/particle-field"

const faqs = [
  {
    id: 1,
    question: "> HOW DO I RENT A GAME?",
    answer:
      "BROWSE ARCADE > SELECT GAME > CLICK PLAY NOW > TOKENS CHARGED PER HOUR > GAME AVAILABLE IN LIBRARY IMMEDIATELY",
  },
  {
    id: 2,
    question: "> HOW DOES GAME HOSTING WORK?",
    answer: "LIST GAMES IN ARCADE > SET HOURLY TOKEN RATE > EARN TOKENS WHEN RENTED > MANAGE FROM PLAYER PROFILE",
  },
  {
    id: 3,
    question: "> WHAT IF I RUN OUT OF TOKENS?",
    answer: "WARNING AT 15 MIN REMAINING > GAME PAUSES IF TOKENS DEPLETED > PURCHASE MORE TO CONTINUE",
  },
  {
    id: 4,
    question: "> HOW TO EARN FREE TOKENS?",
    answer: "VISIT TOKEN STORE > WATCH ADS > COMPLETE SURVEYS > PARTICIPATE IN EVENTS > EARN 50-200 DAILY",
  },
]

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    subject: "",
    email: "",
    message: "",
  })
  const [showChat, setShowChat] = useState(false)
  const [typingText, setTypingText] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const typewriterEffect = (text: string, callback?: () => void) => {
    setIsTyping(true)
    setTypingText("")
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setTypingText(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
        setIsTyping(false)
        callback?.()
      }
    }, 50)
  }

  const handleFaqToggle = (id: number) => {
    if (openFaq === id) {
      setOpenFaq(null)
      setTypingText("")
    } else {
      setOpenFaq(id)
      const faq = faqs.find((f) => f.id === id)
      if (faq) {
        typewriterEffect(faq.answer)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Support ticket submitted:", formData)
    setFormData({ subject: "", email: "", message: "" })
  }

  return (
    <div className="min-h-screen pt-16 relative overflow-hidden bg-retro-dark">
      {/* Particle Field Background */}
      {/* <ParticleField /> */}

      {/* Hero Section */}
      <section className="py-16 neon-grid">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1
              className="text-4xl md:text-6xl font-pixel text-white neon-glow-pink glitch-text mb-6"
              data-text="SUPPORT TERMINAL"
            >
              SUPPORT TERMINAL
            </h1>
            <p className="text-electric-teal font-pixel text-sm max-w-2xl mx-auto leading-relaxed">
              SYSTEM ASSISTANCE AVAILABLE 24/7
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ Terminal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="font-pixel text-electric-teal text-lg mb-8 flex items-center neon-glow-teal">
              <HelpCircle className="w-6 h-6 mr-3" />
              FAQ DATABASE
            </h2>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="crt-monitor overflow-hidden">
                  <button
                    onClick={() => handleFaqToggle(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-neon-pink hover:bg-opacity-10 transition-colors font-pixel text-xs"
                  >
                    <span className="text-white">{faq.question}</span>
                    {openFaq === faq.id ? (
                      <ChevronUp className="w-4 h-4 text-electric-teal" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-electric-teal" />
                    )}
                  </button>

                  <AnimatePresence>
                    {openFaq === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 bg-retro-dark border-t border-electric-teal">
                          <div className="font-pixel text-electric-teal text-xs leading-relaxed">
                            {openFaq === faq.id && (
                              <>
                                {typingText}
                                {isTyping && <span className="animate-pulse">_</span>}
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Support Ticket Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="font-pixel text-neon-pink text-lg mb-8">SUBMIT TICKET</h2>

            <div className="crt-monitor p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-pixel text-white text-xs mb-2">SUBJECT:</label>
                  <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500"
                      placeholder="BRIEF DESCRIPTION..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-pixel text-white text-xs mb-2">EMAIL:</label>
                  <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-transparent text-electric-teal font-pixel text-xs placeholder-gray-500 focus:outline-none"
                      placeholder="YOUR.EMAIL@EXAMPLE.COM"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-pixel text-white text-xs mb-2">MESSAGE:</label>
                  <div className="bg-retro-dark border-2 border-electric-teal pixel-border focus-within:border-neon-pink transition-colors">
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-transparent text-electric-teal font-pixel text-xs focus:outline-none placeholder-gray-500 h-24 resize-none"
                      placeholder="ENTER MESSAGE HERE..."
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-neon-pink text-retro-dark font-pixel text-xs py-3 rounded-md hover:bg-opacity-80 transition-colors"
                >
                  SUBMIT TICKET
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
