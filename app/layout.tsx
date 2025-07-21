import type React from "react"
import type { Metadata } from "next"
import { Press_Start_2P } from "next/font/google"
import "./globals.css"
import { RetroNavigation } from "@/components/retro-navigation"
import { StarfieldBackground } from "@/components/starfield-background"
import { ToastProvider } from "@/components/ui/toast-provider"
import { ErrorBoundary } from "@/components/ui/error-boundary"

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
})

export const metadata: Metadata = {
  title: "GAME SHARE - RETRO ARCADE",
  description: "Enter the neon grid of premium gaming. Rent high-end gaming PCs, play AAA titles instantly, and monetize your idle hardware. The future of gaming is here.",
  generator: 'v0.dev',
  metadataBase: new URL('https://gameshareit.com'),
  
  // Open Graph metadata for social sharing
  openGraph: {
    title: "GAME SHARE - RETRO ARCADE",
    description: "Enter the neon grid of premium gaming. Rent high-end gaming PCs, play AAA titles instantly, and monetize your idle hardware.",
    url: "https://gameshareit.com",
    siteName: "GameShare",
    type: "website",
    images: [
      {
        url: "/Gameshare main.png",
        width: 1200,
        height: 630,
        alt: "GameShare - Premium Gaming Network",
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "GAME SHARE - RETRO ARCADE",
    description: "Enter the neon grid of premium gaming. Rent high-end gaming PCs, play AAA titles instantly.",
    images: ["/Gameshare main.png"],
    creator: "@gameshare",
    site: "@gameshare",
  },

  // Additional metadata
  keywords: ["gaming", "PC rental", "cloud gaming", "game streaming", "retro arcade", "gaming network"],
  authors: [{ name: "GameShare Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${pressStart2P.variable} font-pixel antialiased bg-retro-dark overflow-x-hidden`}>
        <ErrorBoundary>
          <ToastProvider>
            <StarfieldBackground />
            <div className="scanlines"></div>
            <RetroNavigation />
            <main className="relative z-10 min-h-screen">{children}</main>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
