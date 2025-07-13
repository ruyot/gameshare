"use client"

import { useEffect, useRef, useState } from "react"

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      if (typeof window !== 'undefined') {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    resizeCanvas()
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", resizeCanvas)
    }

    // Star Wars hyperspace-style particles with reduced count
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      life: number
      maxLife: number
      speed: number
      startDistance: number
    }> = []

    const colors = ["#FF5C8D", "#19FFE1", "#FFFFFF", "#9D4EDD"]

    const createParticle = () => {
      const centerX = canvas.width / 2 || 600
      const centerY = canvas.height / 2 || 400

      // Random angle for outward direction
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 0.8 + 0.4

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 400 + 300,
        speed: speed,
        startDistance: 0,
      })
    }

    // Create fewer initial particles for better performance
    for (let i = 0; i < 20; i++) {
      createParticle()
    }

    let animationId: number

    const animate = () => {
      // Clear canvas with fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, canvas.width || 1200, canvas.height || 800)

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]

        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life++

        // Calculate distance from center
        const centerX = canvas.width / 2 || 600
        const centerY = canvas.height / 2 || 400
        const distance = Math.sqrt(
          Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2)
        )

        // Remove particles that are too far or too old
        if (distance > Math.max(canvas.width || 1200, canvas.height || 800) || particle.life > particle.maxLife) {
          particles.splice(i, 1)
          continue
        }

        // Draw particle
        const opacity = 1 - particle.life / particle.maxLife
        const size = particle.size * (1 + distance / 100)

        ctx.save()
        ctx.globalAlpha = opacity
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fill()

        // Add glow effect
        ctx.shadowColor = particle.color
        ctx.shadowBlur = size * 2
        ctx.fill()
        ctx.restore()
      }

      // Occasionally add new particles
      if (Math.random() < 0.1 && particles.length < 30) {
        createParticle()
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("resize", resizeCanvas)
      }
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isClient])

  if (!isClient) {
    return null
  }

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ background: "transparent" }} />
  )
}
