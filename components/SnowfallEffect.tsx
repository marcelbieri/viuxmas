"use client"

import { useEffect, useState } from "react"

interface Snowflake {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  drift: number
}

export function SnowfallEffect() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  useEffect(() => {
    // Create initial snowflakes
    const initialSnowflakes: Snowflake[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * -100, // start above screen
      size: Math.random() * 32 + 8, // 8-40px (max 64px as requested, but keeping it subtle)
      opacity: Math.random() * 0.4 + 0.1, // 0.1-0.5
      speed: Math.random() * 2 + 0.5, // 0.5-2.5
      drift: (Math.random() - 0.5) * 0.5, // slight horizontal drift
    }))

    setSnowflakes(initialSnowflakes)

    // Animation loop
    const animate = () => {
      setSnowflakes((prev) =>
        prev.map((flake) => ({
          ...flake,
          y: flake.y > 110 ? -10 : flake.y + flake.speed * 0.1, // reset when off screen
          x: flake.x + flake.drift * 0.1, // horizontal drift
        })),
      )
    }

    const interval = setInterval(animate, 50) // 20fps for smooth but not intensive animation

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute"
          style={{
            left: `${flake.x}%`,
            top: `${flake.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <svg
            width={flake.size}
            height={flake.size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: flake.opacity }}
          >
            <circle cx="32" cy="32" r="32" fill="white" fillOpacity="0.3" />
          </svg>
        </div>
      ))}
    </div>
  )
}
