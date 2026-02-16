'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useScroll, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

// Configuration
const FRAME_COUNT = 82
const PATH_PREFIX = '/members-bg/IllaMembers-mobile_'
const PATH_SUFFIX = '.webp'

// Singleton cache — survives re-renders and route changes
const imageCache: Map<number, HTMLImageElement> = new Map()

export default function MembersScrollBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const lastFrameRef = useRef(-1)
    const { scrollYProgress } = useScroll()

    // Responsive spring — fast enough to feel 1:1 with scroll
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 200,
        damping: 40,
        restDelta: 0.0005
    })

    // Mobile detection
    useEffect(() => {
        const mql = window.matchMedia('(max-width: 768px)')
        setIsMobile(mql.matches)
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    // Draw a frame on canvas
    const drawFrame = useCallback((index: number) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = imageCache.get(index)
        if (!img || !img.complete) return

        // Skip if same frame already drawn
        if (lastFrameRef.current === index) return
        lastFrameRef.current = index

        // Resize canvas to viewport if needed
        const vw = window.innerWidth
        const vh = window.innerHeight
        if (canvas.width !== vw || canvas.height !== vh) {
            canvas.width = vw
            canvas.height = vh
        }

        // Draw cover-fit (centered, filling screen)
        const aspect = img.naturalWidth / img.naturalHeight
        const screenAspect = vw / vh
        let dw, dh, dx, dy

        if (screenAspect > aspect) {
            dw = vw; dh = vw / aspect
            dx = 0; dy = (vh - dh) / 2
        } else {
            dw = vh * aspect; dh = vh
            dx = (vw - dw) / 2; dy = 0
        }

        ctx.drawImage(img, dx, dy, dw, dh)
    }, [])

    // Preload all frames
    useEffect(() => {
        if (!isMobile) return

        const loadFrame = (index: number) => {
            if (imageCache.has(index)) {
                // Already cached — draw first frame immediately
                if (index === 1 && !isLoaded) {
                    drawFrame(1)
                    setIsLoaded(true)
                }
                return
            }

            const img = new Image()
            img.src = `${PATH_PREFIX}${index.toString().padStart(3, '0')}${PATH_SUFFIX}`

            img.onload = () => {
                imageCache.set(index, img)
                // Draw first visible frame as soon as it loads
                if (index === 1 && !isLoaded) {
                    drawFrame(1)
                    setIsLoaded(true)
                }
            }
        }

        // Priority: frame 1 (the hero frame), then every 5th, then all
        loadFrame(1)
        for (let i = 0; i < FRAME_COUNT; i += 5) loadFrame(i)
        requestAnimationFrame(() => {
            for (let i = 0; i < FRAME_COUNT; i++) loadFrame(i)
        })
    }, [isMobile, drawFrame, isLoaded])

    // Scroll-driven frame rendering
    useEffect(() => {
        if (!isMobile || !canvasRef.current) return

        const render = () => {
            const progress = smoothProgress.get()
            const frameIndex = Math.min(
                FRAME_COUNT - 1,
                Math.max(0, Math.round(progress * (FRAME_COUNT - 1)))
            )
            drawFrame(frameIndex)
        }

        // Subscribe to scroll progress changes
        const unsubscribe = smoothProgress.on('change', render)

        // Also render once immediately in case scroll is already > 0
        render()

        return () => unsubscribe()
    }, [isMobile, smoothProgress, drawFrame])

    if (!isMobile) return null

    return (
        <>
            {/* Static first frame — visible instantly before canvas is ready */}
            <img
                src="/members-bg/IllaMembers-mobile_001.webp"
                alt=""
                fetchPriority="high"
                className={cn(
                    "fixed inset-0 w-full h-full object-cover pointer-events-none z-[-1] opacity-40",
                    "transition-opacity duration-700",
                    isLoaded && "opacity-0"
                )}
            />
            {/* Canvas — takes over once frames are loaded, scrubs with scroll */}
            <canvas
                ref={canvasRef}
                className={cn(
                    "fixed inset-0 w-full h-full pointer-events-none z-[-1]",
                    "transition-opacity duration-700 ease-out",
                    isLoaded ? "opacity-40" : "opacity-0"
                )}
            />
        </>
    )
}
