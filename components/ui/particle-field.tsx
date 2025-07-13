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
      // Increase speed for longer streaks
      const speed = Math.random() * 1.2 + 0.8 // was 0.8 + 0.4

      particles.push({
        x: centerX, // Start exactly at center
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 0.5, // Smaller particles
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 800 + 700, // was 400 + 300, now much longer
        speed: speed,
        startDistance: 0,
      })
    }

    // Create fewer initial particles
    for (let i = 0; i < 80; i++) {
      createParticle()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
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
        const buffer = 400 // Extra buffer to ensure they reach the very edges
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
        const minVisibleDistance = 80
        if (distanceFromCenter < minVisibleDistance) continue

        // Draw streak
        ctx.save()
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        // Draw streak backwards
        ctx.lineTo(
          particle.x - particle.vx * 30,
          particle.y - particle.vy * 30
        )
        ctx.strokeStyle = particle.color
        ctx.lineWidth = particle.size
        ctx.shadowColor = particle.color
        ctx.shadowBlur = 12
        ctx.stroke()
        ctx.restore()

        // Draw glowing point at end
        ctx.save()
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 1.2, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.shadowColor = particle.color
        ctx.shadowBlur = 16
        ctx.globalAlpha = 0.8
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

  // Absolutely position the canvas behind all content
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
      width={typeof window !== "undefined" ? window.innerWidth : 1920}
      height={typeof window !== "undefined" ? window.innerHeight : 1080}
      aria-hidden="true"
    />
  )
}
