import type React from "react"
import type { Metadata } from "next"
import { Press_Start_2P } from "next/font/google"
import "./globals.css"
import { RetroNavigation } from "@/components/retro-navigation"
import { StarfieldBackground } from "@/components/starfield-background"

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
})

export const metadata: Metadata = {
  title: "GAME SHARE - RETRO ARCADE",
  description: "Enter the neon grid of premium gaming",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${pressStart2P.variable} font-pixel antialiased bg-retro-dark overflow-x-hidden`}>
        <StarfieldBackground />
        <div className="scanlines"></div>
        <RetroNavigation />
        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  )
}
