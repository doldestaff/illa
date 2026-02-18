'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

// --- Types ---

export interface ScrollFrameEngineProps {
    /** 
     * Function to generate frame URL by index 
     */
    getFrameUrl: (index: number) => string

    /** 
     * Total number of frames
     */
    frameCount: number

    /** 
     * Initial poster image to show before any frames load 
     */
    posterUrl: string

    /**
     * Optional class name for the wrapper
     */
    className?: string

    /** 
     * Priority frames to load immediately (e.g. [0, 1, 2]) 
     */
    priorityFrames?: number[]

    /** 
     * Scroll height identifier to sync with (e.g. body height or a specific container)
     * If not provided, assumes window scroll mapping to a virtual height.
     */
    scrollContainerHeight?: number // px

    /**
     * Callback when frame changes (for driving other animations)
     */
    onFrameChange?: (frameIndex: number, progress: number) => void

    /** 
     * Debug mode 
     */
    debug?: boolean
}

// --- LRU Cache ---
const MAX_CACHE_SIZE = 60

class FrameCache {
    private cache = new Map<number, ImageBitmap | HTMLImageElement>()
    private accessHistory: number[] = []

    get(index: number) {
        // Promote to newest
        const pos = this.accessHistory.indexOf(index)
        if (pos > -1) this.accessHistory.splice(pos, 1)
        this.accessHistory.push(index)
        return this.cache.get(index)
    }

    add(index: number, frame: ImageBitmap | HTMLImageElement) {
        if (this.cache.has(index)) return

        if (this.cache.size >= MAX_CACHE_SIZE) {
            const lru = this.accessHistory.shift()
            if (lru !== undefined) {
                const img = this.cache.get(lru)
                if (img && img instanceof ImageBitmap) img.close()
                this.cache.delete(lru)
            }
        }

        this.cache.set(index, frame)
        this.accessHistory.push(index)
    }

    has(index: number) {
        return this.cache.has(index)
    }

    get size() {
        return this.cache.size
    }
}

export function ScrollFrameCanvasEngine({
    frameCount,
    getFrameUrl,
    posterUrl,
    className,
    priorityFrames = [],
    scrollContainerHeight,
    onFrameChange,
    debug = false
}: ScrollFrameEngineProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [isLoaded, setIsLoaded] = useState(false)
    const [debugText, setDebugText] = useState('')

    // Mutable state to avoid React render cycle in the loop
    const state = useRef({
        cache: new FrameCache(),
        lastScrollY: -1,
        lastFrameIndex: -1,
        ticking: false,
        appHeight: 0,
        appWidth: 0,
        mountTime: Date.now(),
        // Keep props accessible in loop
        props: { frameCount, getFrameUrl, onFrameChange, scrollContainerHeight }
    })

    // Sync props
    useEffect(() => {
        state.current.props = { frameCount, getFrameUrl, onFrameChange, scrollContainerHeight }
    }, [frameCount, getFrameUrl, onFrameChange, scrollContainerHeight])

    // --- 1. Viewport Management (Android Stable Bar) ---
    useEffect(() => {
        const handleResize = () => {
            // VisualViewport is more reliable on mobile for actual visible area
            const h = window.visualViewport ? window.visualViewport.height : window.innerHeight
            const w = window.visualViewport ? window.visualViewport.width : window.innerWidth

            state.current.appHeight = h
            state.current.appWidth = w

            if (containerRef.current) {
                containerRef.current.style.setProperty('--app-h', `${h}px`)
            }

            // Force redraw on resize to fix aspect ratio
            requestAnimationFrame(() => draw(state.current.lastFrameIndex, true))
        }

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize)
        }
        window.addEventListener('resize', handleResize)

        handleResize() // Initial

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize)
            }
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    // --- 2. Loader ---
    const loadFrame = useCallback(async (index: number, priority = false) => {
        if (index < 0 || index >= state.current.props.frameCount) return
        if (state.current.cache.has(index)) return

        const url = state.current.props.getFrameUrl(index)

        try {
            // High-perf loading
            // Fetch blob -> createImageBitmap (off-main-thread decode)
            const resp = await fetch(url)
            const blob = await resp.blob()
            const bitmap = await createImageBitmap(blob, {
                premultiplyAlpha: 'none',
                colorSpaceConversion: 'none'
            })

            state.current.cache.add(index, bitmap)

            // If priority or current frame, draw immediately
            if (priority || Math.abs(state.current.lastFrameIndex - index) <= 1) {
                requestAnimationFrame(() => draw(state.current.lastFrameIndex, true))
            }
        } catch (e) {
            // Fallback
            const img = new Image()
            img.src = url
            img.onload = () => {
                state.current.cache.add(index, img)
                if (priority) requestAnimationFrame(() => draw(state.current.lastFrameIndex, true))
            }
        }
    }, [])

    // Initial Load
    useEffect(() => {
        const init = async () => {
            // Always load frame 0 (poster match) + priority frames
            const toLoad = new Set([0, ...priorityFrames])

            // Execute parallel
            await Promise.all(Array.from(toLoad).map(i => loadFrame(i, true)))

            setIsLoaded(true)

            // Kickstart loop
            requestScrollUpdate()
        }
        init()
    }, [priorityFrames, loadFrame])


    // --- 3. Draw Engine ---
    const draw = (frameIndex: number, force = false) => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Clamp
        const maxFrame = state.current.props.frameCount - 1
        const idx = Math.max(0, Math.min(maxFrame, Math.round(frameIndex)))

        if (!force && state.current.lastFrameIndex === idx) {
            // Even if frame is same, check if we need to report progress driven updates
            // But usually we assume frame change drives it. 
            // Logic below handles reporting anyway.
            return
        }

        state.current.lastFrameIndex = idx
        const frame = state.current.cache.get(idx)

        // Debug
        if (debug) {
            setDebugText(`F: ${idx}/${maxFrame} | Cache: ${state.current.cache.size}`)
        }

        // Report UP
        if (state.current.props.onFrameChange) {
            state.current.props.onFrameChange(idx, idx / maxFrame)
        }

        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
        if (!ctx) return

        // Layout: Cover
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5) // Cap at 1.5 for performance
        const w = state.current.appWidth
        const h = state.current.appHeight

        // Resize canvas if needed
        const targetW = Math.floor(w * dpr)
        const targetH = Math.floor(h * dpr)

        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW
            canvas.height = targetH
            ctx.scale(dpr, dpr)
        }

        if (!frame) {
            // Frame missing? Try nearest neighbor
            // (Simulates "hold previous frame")
            // We don't clearRect to preserve previous frame naturally
            // But if we jumped far, we might want to find *something*
            return
        }

        const iW = (frame instanceof ImageBitmap) ? frame.width : (frame as HTMLImageElement).naturalWidth
        const iH = (frame instanceof ImageBitmap) ? frame.height : (frame as HTMLImageElement).naturalHeight

        const scale = Math.max(w / iW, h / iH)
        const finalW = iW * scale
        const finalH = iH * scale
        const x = (w - finalW) / 2
        const y = (h - finalH) / 2

        ctx.drawImage(frame, x, y, finalW, finalH)

        // --- Smart Lookahead ---
        // Dynamically load frames around current
        // Load roughly 6 frames ahead, 2 behind
        for (let i = 1; i <= 6; i++) loadFrame(idx + i)
        for (let i = 1; i <= 2; i++) loadFrame(idx - i)
    }

    // --- 4. Scroll Logic ---
    const update = () => {
        state.current.ticking = false

        const scrollY = window.scrollY
        // If container height not provided, use a default multiplier
        // Default: 350vh total scroll for mobile, 500vh for desktop usually
        // But here we need to map scroll -> frames.

        const totalHeight = state.current.props.scrollContainerHeight || (state.current.appHeight * 4)
        const viewH = state.current.appHeight
        const scrollable = Math.max(1, totalHeight - viewH)

        const progress = Math.max(0, Math.min(1, scrollY / scrollable))
        const targetFrame = progress * (state.current.props.frameCount - 1)

        draw(targetFrame)
    }

    const requestScrollUpdate = () => {
        if (!state.current.ticking) {
            requestAnimationFrame(update)
            state.current.ticking = true
        }
    }

    useEffect(() => {
        window.addEventListener('scroll', requestScrollUpdate, { passive: true })
        return () => window.removeEventListener('scroll', requestScrollUpdate)
    }, [])

    // Initial Tick
    useEffect(() => {
        requestScrollUpdate()
    }, [])

    return (
        <div
            ref={containerRef}
            className={cn("absolute inset-0 w-full h-full overflow-hidden", className)}
            style={{
                // We use CSS variable for height to avoid layout shift on bar toggle
                // Fallback to 100vh
                height: 'var(--app-h, 100vh)'
            }}
        >
            {debug && (
                <div className="fixed top-24 left-4 z-50 bg-black/50 text-green-400 p-2 text-xs font-mono pointer-events-none">
                    {debugText}
                </div>
            )}

            {/* Poster using standard img for fastest LCP */}
            <img
                src={posterUrl}
                alt="background"
                className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 will-change-opacity",
                    isLoaded ? "opacity-0" : "opacity-100"
                )}
                draggable={false}
            />

            <canvas
                ref={canvasRef}
                className={cn(
                    "block w-full h-full object-cover",
                    // GPU optimization hints
                    "will-change-contents"
                )}
            />
        </div>
    )
}
