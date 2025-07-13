"use client"

import { motion } from "framer-motion"
import { Gamepad2, Cpu, HardDrive, Wifi, Zap, Star } from "lucide-react"

interface FloatingElementsProps {
  mousePosition: { x: number; y: number }
}

export function FloatingElements({ mousePosition }: FloatingElementsProps) {
  const icons = [Gamepad2, Cpu, HardDrive, Wifi, Zap, Star]

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
              x: x + (mousePosition.x - window.innerWidth / 2) * 0.1,
              y: y + (mousePosition.y - window.innerHeight / 2) * 0.1,
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
