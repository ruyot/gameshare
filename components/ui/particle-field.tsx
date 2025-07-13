"use client"

import { useEffect, useRef } from "react"

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Star Wars hyperspace-style particles
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
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Random angle for outward direction
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 0.8 + 0.4 // Much slower speed

      particles.push({
        x: centerX, // Start exactly at center
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 0.5, // Smaller particles
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 400 + 300, // Even longer life to reach edges
        speed: speed,
        startDistance: 0,
      })
    }

    // Create fewer initial particles
    for (let i = 0; i < 80; i++) {
      createParticle()
    }

    const animate = () => {
      // Darker fade for more dramatic effect
      ctx.fillStyle = "rgba(10, 15, 16, 0.12)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]

        // Move particle outward
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life++

        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2))

        // Remove particles only when they're well beyond screen edges or too old
        const buffer = 200 // Extra buffer to ensure they reach the very edges
        if (
          particle.x < -buffer ||
          particle.x > canvas.width + buffer ||
          particle.y < -buffer ||
          particle.y > canvas.height + buffer ||
          particle.life >= particle.maxLife
        ) {
          particles.splice(i, 1)
          createParticle() // Create new particle at center
          continue
        }

        // Star Wars effect: Only visible after certain distance from center
        const minVisibleDistance = 80 // Particles invisible within this radius
        const maxDistance = Math.sqrt(Math.pow(canvas.width / 2 + buffer, 2) + Math.pow(canvas.height / 2 + buffer, 2))

        if (distanceFromCenter < minVisibleDistance) {
          continue // Skip drawing if too close to center
        }

        // Calculate alpha based on distance (fade in as they move out, fade out only at very edges)
        const fadeInDistance = 120
        const fadeOutStart = maxDistance * 0.85 // Start fading much closer to actual edges
        let alpha = 0

        if (distanceFromCenter < fadeInDistance) {
          // Fade in zone
          alpha = (distanceFromCenter - minVisibleDistance) / (fadeInDistance - minVisibleDistance)
        } else if (distanceFromCenter < fadeOutStart) {
          // Full visibility zone - much larger now
          alpha = 1
        } else {
          // Fade out zone - only at the very edges
          alpha = 1 - (distanceFromCenter - fadeOutStart) / (maxDistance - fadeOutStart)
        }

        alpha = Math.max(0, Math.min(1, alpha)) * 0.6 // Cap alpha and make more subtle

        if (alpha <= 0) continue

        // Draw hyperspace streak effect
        ctx.save()
        ctx.globalAlpha = alpha

        // Draw the streak/trail (Star Wars hyperspace effect)
        const streakLength = Math.min(distanceFromCenter * 0.3, 40)
        const streakStartX = particle.x - particle.vx * streakLength
        const streakStartY = particle.y - particle.vy * streakLength

        // Gradient for the streak
        const gradient = ctx.createLinearGradient(streakStartX, streakStartY, particle.x, particle.y)
        gradient.addColorStop(0, particle.color + "00") // Transparent start
        gradient.addColorStop(0.7, particle.color + "80") // Semi-transparent middle
        gradient.addColorStop(1, particle.color + "FF") // Full opacity end

        ctx.strokeStyle = gradient
        ctx.lineWidth = particle.size
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(streakStartX, streakStartY)
        ctx.lineTo(particle.x, particle.y)
        ctx.stroke()

        // Draw bright point at the end
        ctx.shadowBlur = 8
        ctx.shadowColor = particle.color
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 0.8, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ background: "transparent" }} />
  )
}
