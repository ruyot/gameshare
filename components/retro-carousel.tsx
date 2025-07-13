"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CarouselItem {
  id: number
  title: string
  description: string
  image: string
}

interface RetroCarouselProps {
  items: CarouselItem[]
}

export function RetroCarousel({ items }: RetroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* 3D Card Stack */}
      <div className="relative h-64 neon-grid p-8">
        <AnimatePresence mode="wait">
          {items.map((item, index) => {
            const offset = index - currentIndex
            const isActive = index === currentIndex

            return (
              <motion.div
                key={item.id}
                className="absolute inset-4 crt-monitor"
                initial={{
                  rotateY: offset * 15,
                  z: -Math.abs(offset) * 100,
                  opacity: 0.7 - Math.abs(offset) * 0.2,
                }}
                animate={{
                  rotateY: offset * 15,
                  z: -Math.abs(offset) * 100,
                  opacity: isActive ? 1 : 0.7 - Math.abs(offset) * 0.2,
                  scale: isActive ? 1 : 0.9 - Math.abs(offset) * 0.1,
                }}
                exit={{
                  rotateY: offset > 0 ? 90 : -90,
                  opacity: 0,
                  transition: { duration: 0.3 },
                }}
                transition={{
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100,
                }}
                style={{
                  transformStyle: "preserve-3d",
                  zIndex: items.length - Math.abs(offset),
                }}
              >
                <div className="w-full h-full bg-retro-dark border-2 border-electric-teal p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-neon-pink mb-4 pixel-border flex items-center justify-center">
                    <span className="font-pixel text-retro-dark text-xs">IMG</span>
                  </div>

                  <h3 className="font-pixel text-white text-sm mb-2 neon-glow-teal">{item.title}</h3>

                  <p className="font-pixel text-white text-xs leading-relaxed">{item.description}</p>

                  {isActive && (
                    <motion.div
                      className="absolute bottom-2 left-2 right-2 h-1 bg-neon-pink"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-neon-pink border-2 border-electric-teal pixel-border flex items-center justify-center hover:bg-electric-teal hover:border-neon-pink transition-colors duration-200"
        >
          <ChevronLeft className="w-6 h-6 text-retro-dark" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-neon-pink border-2 border-electric-teal pixel-border flex items-center justify-center hover:bg-electric-teal hover:border-neon-pink transition-colors duration-200"
        >
          <ChevronRight className="w-6 h-6 text-retro-dark" />
        </button>
      </div>

      {/* Indicators */}
      <div className="flex justify-center space-x-2 mt-4">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 pixel-border transition-colors duration-200 ${
              index === currentIndex ? "bg-electric-teal border-electric-teal" : "bg-transparent border-neon-pink"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
