'use client'

import { useEffect, useState } from 'react'

interface Heart {
  id: number
  x: number
  size: number
  duration: number
  delay: number
  emoji: string
}

export default function FloatingHearts() {
  const [hearts, setHearts] = useState<Heart[]>([])

  useEffect(() => {
    const emojis = ['♥', '✝', '♦', '✧', '♥']
    const newHearts = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 16 + 8,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 10,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }))
    setHearts(newHearts)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute bottom-0 select-none"
          style={{
            left: `${heart.x}%`,
            fontSize: `${heart.size}px`,
            color: '#ff007f',
            opacity: 0.15,
            animation: `heartFloat ${heart.duration}s linear ${heart.delay}s infinite`,
            filter: 'drop-shadow(0 0 4px #ff007f)',
          }}
        >
          {heart.emoji}
        </div>
      ))}
    </div>
  )
}
