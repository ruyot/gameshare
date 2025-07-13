"use client"

import { useEffect, useRef, useState } from "react"

export function StarfieldBackground() {
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

    // Create stars with reduced count for better performance
    const stars: Array<{
      x: number
      y: number
      z: number
      prevX: number
      prevY: number
    }> = []

    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * (canvas.width || 1200) - (canvas.width || 1200) / 2,
        y: Math.random() * (canvas.height || 800) - (canvas.height || 800) / 2,
        z: Math.random() * 1000,
        prevX: 0,
        prevY: 0,
      })
    }

    let animationId: number

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, canvas.width || 1200, canvas.height || 800)

      stars.forEach((star) => {
        star.prevX = star.x
        star.prevY = star.y
        star.z -= 2
        if (star.z < 1) {
          star.z = 1000
          star.x = Math.random() * (canvas.width || 1200) - (canvas.width || 1200) / 2
          star.y = Math.random() * (canvas.height || 800) - (canvas.height || 800) / 2
        }

        const scale = 1000 / star.z
        star.x = star.x * scale
        star.y = star.y * scale

        if (star.x > 0 && star.x < (canvas.width || 1200) && star.y > 0 && star.y < (canvas.height || 800)) {
          ctx.beginPath()
          ctx.moveTo(star.prevX, star.prevY)
          ctx.lineTo(star.x, star.y)
          ctx.strokeStyle = `rgba(255, 255, 255, ${scale})`
          ctx.lineWidth = scale * 2
          ctx.stroke()
        }
      })

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
