"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const consoles = [
  {
    name: "ATARI 2600",
    year: "1977",
    color: "#8B4513",
    shape: "rectangle",
    size: { width: 120, height: 60 },
  },
  {
    name: "NES",
    year: "1985",
    color: "#DC143C",
    shape: "rectangle",
    size: { width: 140, height: 70 },
  },
  {
    name: "SEGA GENESIS",
    year: "1988",
    color: "#000000",
    shape: "rectangle",
    size: { width: 160, height: 80 },
  },
  {
    name: "SUPER NINTENDO",
    year: "1990",
    color: "#9370DB",
    shape: "rounded",
    size: { width: 150, height: 75 },
  },
  {
    name: "PLAYSTATION",
    year: "1994",
    color: "#708090",
    shape: "rectangle",
    size: { width: 180, height: 90 },
  },
  {
    name: "NINTENDO 64",
    year: "1996",
    color: "#FF4500",
    shape: "rounded",
    size: { width: 170, height: 85 },
  },
  {
    name: "DREAMCAST",
    year: "1998",
    color: "#F0F8FF",
    shape: "rounded",
    size: { width: 160, height: 80 },
  },
  {
    name: "PS2",
    year: "2000",
    color: "#000080",
    shape: "rectangle",
    size: { width: 200, height: 100 },
  },
  {
    name: "XBOX",
    year: "2001",
    color: "#228B22",
    shape: "rounded",
    size: { width: 190, height: 95 },
  },
  {
    name: "NINTENDO WII",
    year: "2006",
    color: "#FFFFFF",
    shape: "rectangle",
    size: { width: 100, height: 200 },
  },
  {
    name: "PS4",
    year: "2013",
    color: "#1E1E1E",
    shape: "angular",
    size: { width: 220, height: 110 },
  },
  {
    name: "GAMING PC",
    year: "2025",
    color: "#FF5C8D",
    shape: "tower",
    size: { width: 120, height: 240 },
  },
]

export function ConsoleEvolution() {
  const [currentConsole, setCurrentConsole] = useState(0)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentConsole((prev) => (prev + 1) % consoles.length)
    }, 3000)

    // Generate fewer particles for better performance
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
    }))
    setParticles(newParticles)

    return () => clearInterval(interval)
  }, [])

  const console = consoles[currentConsole]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-electric-teal opacity-30"
          animate={{
            x: [particle.x, particle.x + particle.vx * 100],
            y: [particle.y, particle.y + particle.vy * 100],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      ))}

      {/* Console Evolution */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentConsole}
            initial={{
              opacity: 0,
              scale: 0.5,
              rotateY: -90,
              z: -200,
            }}
            animate={{
              opacity: 0.3,
              scale: 1,
              rotateY: 0,
              z: 0,
            }}
            exit={{
              opacity: 0,
              scale: 1.5,
              rotateY: 90,
              z: 200,
            }}
            transition={{
              duration: 1.5,
              type: "spring",
              stiffness: 100,
            }}
            className="relative"
            style={{
              perspective: "1000px",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Console Shape */}
            <motion.div
              className="relative border-4 border-current opacity-20"
              style={{
                width: console.size.width,
                height: console.size.height,
                backgroundColor: console.color,
                borderRadius: console.shape === "rounded" ? "20px" : console.shape === "angular" ? "0px" : "8px",
                boxShadow: `0 0 50px ${console.color}40, inset 0 0 30px ${console.color}20`,
              }}
              animate={{
                rotateX: [0, 5, 0],
                rotateY: [0, 10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              {/* Console Details */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-pixel text-xs mb-1" style={{ color: console.color }}>
                    {console.year}
                  </div>
                  <div className="font-pixel text-xs" style={{ color: console.color }}>
                    {console.name}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                backgroundColor: console.color,
                opacity: 0.1,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Evolution Timeline */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          {consoles.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === currentConsole ? "bg-neon-pink" : "bg-gray-600"
              }`}
              animate={{
                scale: index === currentConsole ? 1.5 : 1,
                opacity: index === currentConsole ? 1 : 0.5,
              }}
            />
          ))}
        </div>
        <p className="font-pixel text-electric-teal text-xs text-center mt-2">GAMING EVOLUTION</p>
      </div>
    </div>
  )
}
