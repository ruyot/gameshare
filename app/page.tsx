"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { Gamepad2, Zap, ArrowRight, Play, Cpu, HardDrive, DollarSign } from "lucide-react"
import { ConsoleEvolution } from "@/components/ui/console-evolution"
import { ParticleField } from "@/components/ui/particle-field"
import { MorphingQuotes } from "@/components/ui/morphing-quotes"
import { FloatingElements } from "@/components/ui/floating-elements"
import { WaitlistSection } from "@/components/ui/waitlist-section"

export default function HomePage() {
  const { scrollYProgress } = useScroll()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Parallax transforms
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -500])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const benefits = [
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: "DEMOCRATIZE GAMING",
      description:
        "Rising developers get spotlight without competing in overcrowded stores. Low commitment, high impact.",
      color: "neon-pink",
    },
    {
      icon: <HardDrive className="w-8 h-8" />,
      title: "STORAGE FREEDOM",
      description: "Don't like 4TB storage requirements? Neither do we. Store what you host, play what you want.",
      color: "electric-teal",
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "PASSIVE INCOME",
      description: "Passive income and entertainment in the same place. What more could you ask for?",
      color: "neon-pink",
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "AIRBNB FOR PCs",
      description: "Monetize your idle hardware. 80% of gaming PCs sit unused - turn that into profit.",
      color: "electric-teal",
    },
  ]

  const stats = [
    { number: "3.2B", label: "GLOBAL GAMERS", suffix: "" },
    { number: "200", label: "BILLION MARKET", suffix: "B+" },
    { number: "80", label: "HARDWARE IDLE", suffix: "%" },
    { number: "1500", label: "AVG PC COST", suffix: "$+" },
  ]

  return (
    <div ref={containerRef} className="relative overflow-hidden bg-retro-dark">
      {/* Particle Field Background */}
      <ParticleField />

      {/* Floating Elements */}
      <FloatingElements mousePosition={mousePosition} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <ConsoleEvolution />

        <motion.div style={{ y: y1, opacity, scale }} className="relative z-20 text-center px-4 max-w-6xl mx-auto">
          {/* Glitch Logo */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mb-8"
          >
            <h1
              className="text-6xl md:text-9xl font-pixel text-neon-pink neon-glow-pink glitch-text mb-4"
              data-text="GAMESHARE"
              style={{
                textShadow: "0 0 10px #ff5c8d, 0 0 20px #ff5c8d, 0 0 30px #ff5c8d, 4px 4px 0px #000000",
                fontWeight: "bold",
              }}
            >
              GAMESHARE
            </h1>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, delay: 1 }}
              className="h-1 bg-gradient-to-r from-neon-pink via-electric-teal to-neon-pink mx-auto mb-6"
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.5 }}
              className="text-xl md:text-3xl font-pixel text-electric-teal neon-glow-teal"
            >
              THE AIRBNB FOR GAMING PCs
            </motion.p>
          </motion.div>

          {/* Morphing Taglines */}
          <MorphingQuotes />

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 2.5 }}
            className="mt-12"
          >
            <Link href="/marketplace">
              <motion.button
                className="group relative bg-gradient-to-r from-neon-pink to-electric-teal text-retro-dark font-pixel text-lg px-12 py-6 border-4 border-white overflow-hidden"
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 0 50px rgba(255, 92, 141, 0.8), 0 0 100px rgba(25, 255, 225, 0.6)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Button Background Animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-electric-teal to-neon-pink"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "0%" }}
                  transition={{ duration: 0.3 }}
                />

                <span className="relative z-10 flex items-center space-x-3">
                  <Play className="w-6 h-6" />
                  <span>ENTER THE ARCADE</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative py-32 neon-grid">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center crt-monitor p-6"
              >
                <motion.div
                  className="text-4xl md:text-6xl font-pixel text-neon-pink neon-glow-pink mb-2"
                  whileHover={{ scale: 1.1 }}
                >
                  {stat.number}
                  {stat.suffix}
                </motion.div>
                <div className="font-pixel text-electric-teal text-xs">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-32">
        <motion.div style={{ y: y2 }} className="max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-pixel text-electric-teal neon-glow-teal mb-8">THE PROBLEM</h2>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="crt-monitor p-8"
              >
                <h3 className="font-pixel text-neon-pink text-xl mb-6">GAMING IS EXPENSIVE</h3>
                <p className="font-pixel text-white text-sm leading-relaxed mb-4">
                  High-end gaming PCs cost $1,500-3,000, making premium gaming inaccessible to millions.
                </p>
                <p className="font-pixel text-electric-teal text-sm leading-relaxed">
                  Meanwhile, powerful PCs sit idle 80% of the time, representing billions in wasted hardware value.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* 3D Floating PC */}
                <motion.div
                  animate={{
                    rotateY: 360,
                    y: [0, -20, 0],
                  }}
                  transition={{
                    rotateY: { duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                    y: { duration: 4, repeat: Number.POSITIVE_INFINITY },
                  }}
                  className="w-32 h-32 bg-gradient-to-br from-neon-pink to-electric-teal mx-auto pixel-border flex items-center justify-center"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Cpu className="w-16 h-16 text-retro-dark" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Solution Section */}
      <section className="relative py-32 neon-grid">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-pixel text-neon-pink neon-glow-pink mb-12">OUR SOLUTION</h2>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="crt-monitor p-12 mb-16"
            >
              <h3 className="font-pixel text-electric-teal text-2xl mb-8">
                A MARKETPLACE WHERE PC OWNERS MONETIZE IDLE HARDWARE
              </h3>
              <p className="font-pixel text-white text-lg leading-relaxed max-w-4xl mx-auto">
                Connecting gamers who need high-performance gaming with PC owners who have powerful hardware sitting
                idle.
              </p>
            </motion.div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="crt-monitor p-8 group hover:scale-105 transition-transform duration-300"
                  whileHover={{
                    boxShadow:
                      benefit.color === "neon-pink"
                        ? "0 0 30px rgba(255, 92, 141, 0.6)"
                        : "0 0 30px rgba(25, 255, 225, 0.6)",
                  }}
                >
                  <div className={`text-${benefit.color} mb-4 group-hover:scale-110 transition-transform`}>
                    {benefit.icon}
                  </div>
                  <h4 className={`font-pixel text-${benefit.color} text-lg mb-4`}>{benefit.title}</h4>
                  <p className="font-pixel text-white text-sm leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-32">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-pixel text-electric-teal neon-glow-teal mb-8">HOW IT WORKS</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "BROWSE GAMES",
                description: "Explore thousands of games available for rent from PC owners worldwide",
                icon: <Gamepad2 className="w-12 h-12" />,
              },
              {
                step: "02",
                title: "STEAM LOGIN",
                description: "One-click authentication with your Steam account for instant access",
                icon: <Zap className="w-12 h-12" />,
              },
              {
                step: "03",
                title: "START PLAYING",
                description: "Connect to high-end hardware and play premium games instantly",
                icon: <Play className="w-12 h-12" />,
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center relative"
              >
                {/* Connection Line */}
                {index < 2 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                    viewport={{ once: true }}
                    className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-neon-pink to-electric-teal origin-left"
                  />
                )}

                <div className="crt-monitor p-8 relative z-10">
                  <div className="text-6xl font-pixel text-neon-pink neon-glow-pink mb-4">{step.step}</div>
                  <div className="text-electric-teal mb-4">{step.icon}</div>
                  <h3 className="font-pixel text-white text-lg mb-4">{step.title}</h3>
                  <p className="font-pixel text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <WaitlistSection />

      {/* Footer */}
      <footer className="relative py-16 border-t-2 border-neon-pink">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="font-pixel text-neon-pink text-2xl mb-4 neon-glow-pink">READY TO REVOLUTIONIZE GAMING?</h3>
            <p className="font-pixel text-electric-teal text-sm mb-8">JOIN THE FUTURE OF GAMING TODAY</p>

            <Link href="/marketplace">
              <motion.button
                className="bg-electric-teal text-retro-dark font-pixel text-lg px-8 py-4 hover:bg-neon-pink transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ENTER THE ARCADE
              </motion.button>
            </Link>

            <div className="mt-12 pt-8 border-t border-gray-700">
              <p className="font-pixel text-gray-500 text-xs">© 2024 GAMESHARE - THE AIRBNB FOR GAMING PCs</p>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
