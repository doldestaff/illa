'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useScroll, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

// Configuration
const TOTAL_FRAMES = 82
const FRAME_STEP = 3 // Load every 3rd frame (Huge memory saving: ~66% less RAM)
const PATH_PREFIX = '/members-bg/IllaMembers-mobile_'
const PATH_SUFFIX = '.webp'

// Singleton cache — survives re-renders and routes
const imageCache: Map<number, HTMLImageElement> = new Map()

export default function MembersScrollBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const lastFrameRef = useRef(-1)
    const { scrollYProgress } = useScroll()

    // Responsive spring — tighter for 1:1 "finger-glued" feel on mobile
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 500, // High enough for instant response
        damping: 30,    // Critically damped to prevent overshoot
        mass: 0.5,      // Lightweight
        restDelta: 0.001
    })

    // Helper: Find nearest loaded frame to avoid "blinking" gaps
    const getNearestFrame = useCallback((targetIndex: number) => {
        // Snap target to nearest stepGrid
        const snapedIndex = Math.round(targetIndex / FRAME_STEP) * FRAME_STEP

        // 1. Check exact snapped frame
        if (imageCache.get(snapedIndex)?.complete) return snapedIndex

        // 2. Search neighbors (expanding radius in steps)
        // We look a bit wider now because we are skipping frames
        for (let i = 1; i <= 3; i++) {
            const step = i * FRAME_STEP
            const prev = snapedIndex - step
            const next = snapedIndex + step

            // Prefer previous frames (continuity)
            if (prev >= 0 && imageCache.get(prev)?.complete) return prev
            if (next < TOTAL_FRAMES && imageCache.get(next)?.complete) return next
        }

        // Fallback: search *any* loaded frame within range if grid alignment failed
        // (This catches edge cases where maybe frame 1 is loaded but 0 isn't)
        if (imageCache.get(1)?.complete) return 1

        return -1
    }, [])

    // Draw a frame on canvas
    const drawFrame = useCallback((index: number) => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Find best distinct frame to show
        const bestIndex = getNearestFrame(index)
        if (bestIndex === -1) return // Nothing close enough matches

        // Skip if effective frame hasn't changed (Visual Persistence)
        if (lastFrameRef.current === bestIndex) return
        lastFrameRef.current = bestIndex

        // Optimize: alpha: false (opaque bg), desynchronized (low latency)
        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
        if (!ctx) return

        const img = imageCache.get(bestIndex)
        if (!img) return

        // Resize canvas to viewport if needed
        // CAP DPR to 1.5 to save massive memory on 3x screens
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        const vw = window.innerWidth
        const vh = window.innerHeight
        const targetWidth = Math.floor(vw * dpr)
        const targetHeight = Math.floor(vh * dpr)

        // Only resize if significantly changed
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth
            canvas.height = targetHeight
            // Reset scale context because canvas size changed
            ctx.scale(dpr, dpr)
        }

        // Draw cover-fit (centered, filling screen)
        // Note: Calculations use CSS pixels (vw, vh), ctx handles scaling
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
    }, [getNearestFrame])

    // Optimized Preloading (Staggered Batches + Async Decode + Skipping)
    useEffect(() => {
        // Note: We used to check isMobile here, but now we rely on CSS hiding
        // The browser might still prioritize visible content, but we load anyway to be safe.

        const loadFrame = (index: number) => {
            if (imageCache.has(index)) {
                if (index === 1 && !isLoaded) {
                    drawFrame(1)
                    setIsLoaded(true)
                }
                return Promise.resolve()
            }

            return new Promise<void>((resolve) => {
                const img = new Image()
                img.decoding = 'async' // Critical: Decode off main thread
                img.src = `${PATH_PREFIX}${index.toString().padStart(3, '0')}${PATH_SUFFIX}`
                img.onload = () => {
                    imageCache.set(index, img)
                    if (index === 1 && !isLoaded) {
                        drawFrame(1)
                        setIsLoaded(true)
                    }
                    resolve()
                }
                img.onerror = () => resolve()
            })
        }

        const loadBatch = async (start: number, end: number) => {
            const promises = []
            // Step loop: i += FRAME_STEP
            for (let i = start; i < end && i < TOTAL_FRAMES; i += FRAME_STEP) {
                promises.push(loadFrame(i))
            }
            await Promise.all(promises)
        }

        const runSequence = async () => {
            // 1. Critical: Hero Frame (Always load frame 1 explicitly)
            await loadFrame(1)

            // 2. High Priority: First chunk (roughly first 20 visual frames, but sparsely)
            // Range 0 to 20, stepping by 3 -> 0, 3, 6, 9, 12, 15, 18
            await loadBatch(0, 20)

            // 3. Buffer: Load remaining frames in small chunks
            for (let i = 20; i < TOTAL_FRAMES; i += 15) {
                await loadBatch(i, i + 15)
                await new Promise(r => setTimeout(r, 20)) // Yield to main thread
            }
        }

        runSequence()
    }, [drawFrame, isLoaded])

    // Scroll-driven frame rendering
    useEffect(() => {
        if (!canvasRef.current) return

        const render = () => {
            const progress = smoothProgress.get()
            const frameIndex = Math.min(
                TOTAL_FRAMES - 1,
                Math.max(0, Math.round(progress * (TOTAL_FRAMES - 1)))
            )
            drawFrame(frameIndex)
        }

        const unsubscribe = smoothProgress.on('change', render)
        render()
        return () => unsubscribe()
    }, [smoothProgress, drawFrame])

    return (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] md:hidden">
            {/* Static first frame — visible instantly before canvas is ready */}
            <img
                src="/members-bg/IllaMembers-mobile_001.webp"
                alt=""
                fetchPriority="high"
                className={cn(
                    "absolute inset-0 w-full h-full object-cover z-[-1] opacity-40",
                    "transition-opacity duration-700",
                    isLoaded && "opacity-0"
                )}
            />
            {/* Canvas — takes over once frames are loaded, scrubs with scroll */}
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }} // Explicit style
                className={cn(
                    "absolute inset-0 w-full h-full z-[-1]",
                    "transition-opacity duration-700 ease-out",
                    isLoaded ? "opacity-40" : "opacity-0"
                )}
            />
        </div>
    )
}
