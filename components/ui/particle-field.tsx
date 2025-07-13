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
      // Keep the longer streaks
      const speed = Math.random() * 1.2 + 0.8

      particles.push({
        x: centerX, // Start exactly at center
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 0.5, // Smaller particles
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 800 + 700, // Longer life for edge streaks
        speed: speed,
        startDistance: 0,
      })
    }

    for (let i = 0; i < 80; i++) {
      createParticle()
    }

    const animate = () => {
      ctx.fillStyle = "rgba(10, 15, 16, 0.12)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life++

        const distanceFromCenter = Math.sqrt(Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2))
        const buffer = 400
        if (
          particle.x < -buffer ||
          particle.x > canvas.width + buffer ||
          particle.y < -buffer ||
          particle.y > canvas.height + buffer ||
          particle.life >= particle.maxLife
        ) {
          particles.splice(i, 1)
          createParticle()
          continue
        }

        // Star Wars effect: Only visible after certain distance from center
        const minVisibleDistance = 80
        if (distanceFromCenter < minVisibleDistance) continue

        // Draw hyperspace streak effect with gradient
        ctx.save()
        const streakLength = Math.min(distanceFromCenter * 0.3, 60)
        const streakStartX = particle.x - particle.vx * streakLength
        const streakStartY = particle.y - particle.vy * streakLength
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
