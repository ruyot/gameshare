"use client"

import { motion } from "framer-motion"
import { Gamepad2, Cpu, HardDrive, Wifi, Zap, Star } from "lucide-react"
import { useState, useEffect } from "react"

interface FloatingElementsProps {
  mousePosition: { x: number; y: number }
}

export function FloatingElements({ mousePosition }: FloatingElementsProps) {
  const [isClient, setIsClient] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 })
  
  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  const icons = [Gamepad2, Cpu, HardDrive, Wifi, Zap, Star]

  if (!isClient) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {icons.map((Icon, index) => {
        const angle = (index / icons.length) * Math.PI * 2
        const radius = 300
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        return (
          <motion.div
            key={index}
            className="absolute text-neon-pink opacity-20"
            style={{
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: x + (mousePosition.x - windowSize.width / 2) * 0.1,
              y: y + (mousePosition.y - windowSize.height / 2) * 0.1,
              rotate: 360,
            }}
            transition={{
              x: { type: "spring", stiffness: 100, damping: 30 },
              y: { type: "spring", stiffness: 100, damping: 30 },
              rotate: { duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
            }}
          >
            <Icon className="w-8 h-8" />
          </motion.div>
        )
      })}
    </div>
  )
}
