"use client"

import { useState, useEffect } from "react"
import * as FramerMotion from "framer-motion"
const { motion, AnimatePresence } = FramerMotion

const quotes = [
  "DEMOCRATIZE GAMING FOR EVERYONE",
  "TURN IDLE HARDWARE INTO PROFIT",
  "PLAY ANY GAME, ANYWHERE, ANYTIME",
  "THE FUTURE OF GAMING IS HERE",
  "AIRBNB FOR GAMING PCs",
  "PASSIVE INCOME MEETS ENTERTAINMENT",
]

export function MorphingQuotes() {
  const [currentQuote, setCurrentQuote] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-16 flex items-center justify-center mb-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote}
          initial={{
            opacity: 0,
            y: 50,
            rotateX: -90,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: -50,
            rotateX: 90,
            scale: 0.8,
          }}
          transition={{
            duration: 0.8,
            type: "spring",
            stiffness: 100,
          }}
          className="font-pixel text-lg md:text-xl text-white text-center"
          style={{
            perspective: "1000px",
            transformStyle: "preserve-3d",
          }}
        >
          {quotes[currentQuote].split("").map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                type: "spring",
              }}
              className="inline-block"
              style={{
                textShadow: char === " " ? "none" : "0 0 10px currentColor",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
