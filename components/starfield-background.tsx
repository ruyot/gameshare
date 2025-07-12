"use client"

import { useEffect, useRef } from "react"

export function StarfieldBackground() {
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

    // Create stars
    const stars: Array<{
      x: number
      y: number
      z: number
      prevX: number
      prevY: number
    }> = []

    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width - canvas.width / 2,
        y: Math.random() * canvas.height - canvas.height / 2,
        z: Math.random() * 1000,
        prevX: 0,
        prevY: 0,
      })
    }

    const animate = () => {
      ctx.fillStyle = "rgba(10, 15, 16, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.translate(canvas.width / 2, canvas.height / 2)

      stars.forEach((star) => {
        star.prevX = star.x / (star.z * 0.001)
        star.prevY = star.y / (star.z * 0.001)

        star.z -= 2

        if (star.z <= 0) {
          star.x = Math.random() * canvas.width - canvas.width / 2
          star.y = Math.random() * canvas.height - canvas.height / 2
          star.z = 1000
          star.prevX = star.x / (star.z * 0.001)
          star.prevY = star.y / (star.z * 0.001)
        }

        const x = star.x / (star.z * 0.001)
        const y = star.y / (star.z * 0.001)

        const opacity = 1 - star.z / 1000
        const size = (1 - star.z / 1000) * 2

        // Draw star trail
        ctx.strokeStyle = `rgba(25, 255, 225, ${opacity * 0.5})`
        ctx.lineWidth = size
        ctx.beginPath()
        ctx.moveTo(star.prevX, star.prevY)
        ctx.lineTo(x, y)
        ctx.stroke()

        // Draw star
        ctx.fillStyle = `rgba(255, 92, 141, ${opacity})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.setTransform(1, 0, 0, 1, 0, 0)
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
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "var(--retro-dark)" }}
    />
  )
}
