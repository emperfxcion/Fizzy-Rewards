'use client'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'
export default function ConfettiBurst({ fire=false }: { fire?: boolean }) {
  useEffect(() => {
    if (!fire) return
    confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } })
    setTimeout(() => confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } }), 300)
  }, [fire])
  return null
}
