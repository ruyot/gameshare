"use client"

import { motion } from "framer-motion"
import { Gamepad2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-retro-dark flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
            scale: { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          }}
          className="mb-4"
        >
          <Gamepad2 className="w-12 h-12 text-neon-pink mx-auto" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          className="font-pixel text-electric-teal text-sm"
        >
          LOADING GAME DATA...
        </motion.div>
      </div>
    </div>
  )
} 