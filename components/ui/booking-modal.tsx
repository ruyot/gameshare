"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Coins } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/toast-provider'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  game: {
    id: number
    title: string
    thumbnail: string
    tokensPerHour: number
    rating: number
    genre: string
  }
}

export function BookingModal({ isOpen, onClose, game }: BookingModalProps) {
  const [hours, setHours] = useState(1)
  const [isBooking, setIsBooking] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()

  const totalCost = game.tokensPerHour * hours

  const handleBooking = async () => {
    if (!user) return

    setIsBooking(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: game.id.toString(),
          hours: hours,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Success - close modal and show success message
        onClose()
        showToast('success', `Successfully booked ${game.title} for ${hours} hour(s)!`)
      } else {
        // Error handling
        console.error('Booking failed:', data.error)
        showToast('error', data.error || 'Booking failed. Please try again.')
      }
    } catch (error) {
      console.error('Booking error:', error)
      showToast('error', 'Network error. Please check your connection.')
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-retro-dark border-2 border-neon-pink pixel-border p-6 max-w-md w-full"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-pixel text-neon-pink text-lg">BOOK GAME SESSION</h2>
              <button
                onClick={onClose}
                className="text-electric-teal hover:text-neon-pink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Game Info */}
            <div className="mb-6 p-4 bg-retro-dark border border-electric-teal">
              <h3 className="font-pixel text-white text-sm mb-2">{game.title.toUpperCase()}</h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-electric-teal">{game.genre}</span>
                <span className="text-neon-pink">★{game.rating}</span>
              </div>
            </div>

            {/* Hours Selection */}
            <div className="mb-6">
              <label className="block font-pixel text-white text-xs mb-2">SELECT HOURS:</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setHours(Math.max(1, hours - 1))}
                  className="retro-button bg-electric-teal text-retro-dark border-electric-teal px-3"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <span className="font-pixel text-neon-pink text-lg">{hours}</span>
                  <span className="font-pixel text-white text-xs ml-1">HOURS</span>
                </div>
                <button
                  onClick={() => setHours(Math.min(24, hours + 1))}
                  className="retro-button bg-electric-teal text-retro-dark border-electric-teal px-3"
                >
                  +
                </button>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="mb-6 p-4 bg-retro-dark border border-neon-pink">
              <div className="flex items-center justify-between mb-2">
                <span className="font-pixel text-white text-xs">RATE PER HOUR:</span>
                <span className="font-pixel text-electric-teal text-xs">{game.tokensPerHour}T</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-pixel text-white text-xs">HOURS:</span>
                <span className="font-pixel text-electric-teal text-xs">{hours}</span>
              </div>
              <div className="flex items-center justify-between border-t border-neon-pink pt-2">
                <span className="font-pixel text-neon-pink text-sm">TOTAL COST:</span>
                <span className="font-pixel text-neon-pink text-lg">{totalCost}T</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 retro-button bg-transparent text-electric-teal border-electric-teal"
              >
                CANCEL
              </button>
              <button
                onClick={handleBooking}
                disabled={isBooking}
                className={`flex-1 retro-button ${
                  isBooking
                    ? 'bg-gray-600 text-gray-400 border-gray-600'
                    : 'bg-neon-pink text-retro-dark border-neon-pink'
                }`}
              >
                {isBooking ? 'BOOKING...' : 'CONFIRM BOOKING'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 