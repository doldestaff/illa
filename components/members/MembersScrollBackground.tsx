'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

// Configuration
const FRAME_Count = 82
const PATH_PREFIX = '/members-bg/IllaMembers-mobile_'
const PATH_SUFFIX = '.webp'

// Singleton Cache for Images
const imageCache: Map<number, HTMLImageElement> = new Map()

export default function MembersScrollBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const { scrollYProgress } = useScroll() // 0 to 1

    // Smooth scroll for less jittery frames
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    useEffect(() => {
        // Only run on mobile
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Preload Images
    useEffect(() => {
        if (!isMobile) return

        let loadedCount = 0
        const loadFrame = (index: number) => {
            if (imageCache.has(index)) return

            const img = new Image()
            const paddedIndex = index.toString().padStart(3, '0')
            img.src = `${PATH_PREFIX}${paddedIndex}${PATH_SUFFIX}`

            img.onload = () => {
                imageCache.set(index, img)
                loadedCount++
                if (index === 2) {
                    drawFrame(index) // Draw first visible frame immediately
                    setIsLoaded(true)
                }
            }
        }

        // Priority load: First frame + coarse steps
        loadFrame(2)
        for (let i = 0; i < FRAME_Count; i += 5) loadFrame(i)

        // Lazy load the rest
        requestAnimationFrame(() => {
            for (let i = 0; i < FRAME_Count; i++) loadFrame(i)
        })

    }, [isMobile])

    // Render Loop
    useEffect(() => {
        if (!isMobile || !canvasRef.current) return

        const render = () => {
            const progress = smoothProgress.get()
            const frameIndex = Math.min(
                FRAME_Count - 1,
                Math.max(0, Math.round(progress * (FRAME_Count - 1)))
            )
            drawFrame(frameIndex)
        }

        const unsubscribe = smoothProgress.on('change', render)
        return () => unsubscribe()
    }, [isMobile, smoothProgress])

    const drawFrame = (index: number) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = imageCache.get(index)
        if (!img || !img.complete) return

        // Resize Canvas if needed
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        // Draw Cover - centered filling screen
        const w = canvas.width
        const h = canvas.height
        const aspect = img.naturalWidth / img.naturalHeight
        const screenAspect = w / h

        let drawW, drawH, drawX, drawY

        if (screenAspect > aspect) {
            drawW = w
            drawH = w / aspect
            drawX = 0
            drawY = (h - drawH) / 2
        } else {
            drawW = h * aspect
            drawH = h
            drawX = (w - drawW) / 2
            drawY = 0
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH)
    }

    if (!isMobile) return null

    return (
        <canvas
            ref={canvasRef}
            className={cn(
                "fixed inset-0 w-full h-full pointer-events-none z-[-1]",
                "transition-opacity duration-1000 ease-out",
                isLoaded ? "opacity-40" : "opacity-0"
            )}
        />
    )
}
