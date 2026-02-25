'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

// --- Types ---
export interface HeroEngineProps {
    manifestUrl?: string // e.g. /hero/manifest.mobile.json
    // Inline manifest data to skip fetch waterfall (PERF: critical for first-load)
    inlineManifest?: { frameCount: number; frames: string[] }
    // Alternative to manifest: Manual pattern
    manualFrames?: {
        pathPrefix: string // e.g. "/members-bg/IllaMembers-mobile_"
        pathSuffix: string // e.g. ".webp"
        frameCount: number
        padStart?: number
    }
    posterUrl: string
    className?: string
    priorityFrames?: number[]
    // "viewport" = fixed height scroll section (Home)
    // "document" = map to full document height (Dashboard)
    scrollMode: 'viewport' | 'document'
    // If viewport mode, how tall is the scroll section?
    scrollSectionHeightVh?: number
    // Callback for progress (0..1) to drive other animations
    onProgress?: (progress: number) => void
    startIndex?: number
    debug?: boolean
    objectFit?: 'cover' | 'contain'
}

interface Manifest {
    frameCount: number
    frames: string[]
}

// --- O(1) LRU Cache using Map insertion order ---
class FrameCache {
    private cache = new Map<number, ImageBitmap | HTMLImageElement>()
    limit = 60

    setLimit(n: number) {
        this.limit = n
        this.prune()
    }

    private prune() {
        // Map iterates in insertion order → first key = LRU
        const iter = this.cache.keys()
        while (this.cache.size > this.limit) {
            const lru = iter.next().value
            if (lru === undefined) break
            const img = this.cache.get(lru)
            if (img && img instanceof ImageBitmap) img.close()
            this.cache.delete(lru)
        }
    }

    get(index: number) {
        const frame = this.cache.get(index)
        if (frame) {
            // Promote to newest: delete + re-set maintains Map insertion order — O(1)
            this.cache.delete(index)
            this.cache.set(index, frame)
        }
        return frame
    }

    add(index: number, frame: ImageBitmap | HTMLImageElement) {
        if (this.cache.has(index)) return
        this.cache.set(index, frame)
        this.prune()
    }

    has(index: number) { return this.cache.has(index) }
    get size() { return this.cache.size }
}

export function HeroEngine({
    manifestUrl,
    inlineManifest,
    manualFrames,
    posterUrl,
    className,
    priorityFrames = [],
    scrollMode = 'viewport',
    scrollSectionHeightVh = 500,
    onProgress,
    startIndex = 0,
    debug = false,
    objectFit = 'cover'
}: HeroEngineProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // State
    const [manifest, setManifest] = useState<Manifest | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [debugText, setDebugText] = useState('')
    // On mobile we skip the poster fade entirely — canvas is always shown
    const [isMobileHero, setIsMobileHero] = useState(false)
    // Refs for Loop
    const state = useRef({
        cache: new FrameCache(),
        inflight: new Map<number, AbortController>(),
        lastFrameIndex: startIndex, // Start at requested index
        targetFrameIndex: startIndex, // Actual visual target from scroll
        appHeight: 0,
        appWidth: 0,
        isMobile: false,
        pendingDraw: false,
        // Props for loop
        frameCount: 0,
        frames: [] as string[],
        isManual: false
    })



    // --- 1. Load Manifest or Set Manual ---
    useEffect(() => {
        let active = true

        if (manualFrames) {
            state.current.isManual = true
            state.current.frameCount = manualFrames.frameCount
            setManifest({ frameCount: manualFrames.frameCount, frames: [] })
            return
        }

        // PERF: Use inline manifest to skip fetch waterfall on first load
        if (inlineManifest) {
            state.current.frameCount = inlineManifest.frameCount
            state.current.frames = inlineManifest.frames
            state.current.isManual = false
            setManifest(inlineManifest)
            return
        }

        if (manifestUrl) {
            const load = async () => {
                try {
                    const res = await fetch(manifestUrl)
                    if (!res.ok) throw new Error(`Manifest 404: ${res.status}`)
                    const data = await res.json()

                    if (active) {
                        setManifest(data)
                        state.current.frameCount = data.frameCount
                        state.current.frames = data.frames
                        state.current.isManual = false
                    }
                } catch (e) {
                    if (active) console.error('[HeroEngine] Manifest Error:', e)
                }
            }
            load()
        }

        return () => { active = false }
    }, [manifestUrl, inlineManifest, manualFrames])

    // --- 2. Resize Handler (Stable & Debounced) ---
    useEffect(() => {
        let resizeTimer: NodeJS.Timeout

        const handleResize = () => {
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => {
                const h = window.visualViewport ? window.visualViewport.height : window.innerHeight
                const w = window.visualViewport ? window.visualViewport.width : window.innerWidth

                // Only update if dimensions actually changed significantly (prevent URL bar hide jitter)
                if (Math.abs(state.current.appHeight - h) < 60 &&
                    Math.abs(state.current.appWidth - w) < 1) return

                state.current.appHeight = h
                state.current.appWidth = w

                // Mobile detection for perf
                state.current.isMobile = w < 768

                // PERFORMANCE: Background areas like members dash have 82 frames.
                // We MUST set the cache equal or slightly larger to prevent reload-thrashing looping.
                const isBackgroundMode = scrollMode === 'document'
                state.current.cache.setLimit(state.current.isMobile ? (isBackgroundMode ? 90 : 100) : 100)

                if (containerRef.current) {
                    containerRef.current.style.setProperty('--app-h', `${h}px`)
                }

                // Force redraw on resize
                scheduleDraw()
            }, 150) // Debounce 150ms for stability
        }

        window.addEventListener('resize', handleResize)
        if (window.visualViewport) window.visualViewport.addEventListener('resize', handleResize)

        // Initial call without debounce
        const h = window.visualViewport ? window.visualViewport.height : window.innerHeight
        const w = window.visualViewport ? window.visualViewport.width : window.innerWidth
        state.current.appHeight = h
        state.current.appWidth = w
        state.current.isMobile = w < 768
        setIsMobileHero(w < 768)

        const isBackgroundMode = scrollMode === 'document'
        state.current.cache.setLimit(state.current.isMobile ? (isBackgroundMode ? 90 : 100) : 100)

        if (containerRef.current) containerRef.current.style.setProperty('--app-h', `${h}px`)

        return () => {
            window.removeEventListener('resize', handleResize)
            if (window.visualViewport) window.visualViewport.removeEventListener('resize', handleResize)
            clearTimeout(resizeTimer)
        }
    }, [scrollMode])

    // Helper to get URL
    const getUrl = useCallback((index: number) => {
        if (state.current.isManual && manualFrames) {
            const pad = manualFrames.padStart || 3
            return `${manualFrames.pathPrefix}${index.toString().padStart(pad, '0')}${manualFrames.pathSuffix}`
        }
        return state.current.frames[index]
    }, [manualFrames])

    const scheduleDraw = useCallback(() => {
        if (!state.current.pendingDraw) {
            state.current.pendingDraw = true
            requestAnimationFrame(() => {
                state.current.pendingDraw = false
                draw(state.current.targetFrameIndex, true)
            })
        }
    }, [])

    const loadFrame = useCallback(async (index: number, priority = false) => {
        if (!manifest && !state.current.isManual) return
        if (index < 0 || index >= state.current.frameCount) return
        if (state.current.cache.has(index)) return
        if (state.current.inflight.has(index)) return // Already loading

        // Concurrency Limiter (prevent browser choke)
        // Aggressive on mobile background mode
        const isBackgroundMode = scrollMode === 'document'
        const maxInflight = state.current.isMobile ? (isBackgroundMode ? 3 : 8) : 8

        if (!priority && state.current.inflight.size >= maxInflight) {
            // Priority Check: Abort furthest frame to make room for nearest frame
            let furthestIndex = -1
            let maxDist = Math.abs(state.current.targetFrameIndex - index)
            for (const inflightIdx of state.current.inflight.keys()) {
                const dist = Math.abs(state.current.targetFrameIndex - inflightIdx)
                if (dist > maxDist) {
                    maxDist = dist
                    furthestIndex = inflightIdx
                }
            }
            if (furthestIndex !== -1) {
                // Abort the furthest fetch to free up a slot
                const controller = state.current.inflight.get(furthestIndex)
                if (controller) controller.abort()
                state.current.inflight.delete(furthestIndex)
            } else {
                return // No items further away, keep current inflight
            }
        }

        const url = getUrl(index)
        if (!url) return

        const controller = new AbortController()
        state.current.inflight.set(index, controller)

        try {
            const resp = await fetch(url, { signal: controller.signal })
            if (!resp.ok) throw new Error('404')
            const blob = await resp.blob()

            let frameSource: ImageBitmap | HTMLImageElement
            try {
                // Try off-main-thread decode
                frameSource = await createImageBitmap(blob, {
                    premultiplyAlpha: 'none',
                    colorSpaceConversion: 'none'
                })
            } catch (bitmapError) {
                // Fallback to Image element if createImageBitmap fails or is unsupported
                frameSource = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image()
                    img.onload = () => resolve(img)
                    img.onerror = reject
                    img.src = URL.createObjectURL(blob)
                })
            }

            state.current.cache.add(index, frameSource)

            if (priority || Math.abs(state.current.targetFrameIndex - index) <= 1) {
                scheduleDraw()
            }
        } catch (e: unknown) {
            if ((e as Error).name === 'AbortError') return // Ignore aborted fetches
            // Fallback for Safari/Older browsers or error
            const img = new Image()
            img.src = url
            img.onload = () => {
                if (!state.current.cache.has(index)) {
                    state.current.cache.add(index, img)
                    if (priority || Math.abs(state.current.targetFrameIndex - index) <= 1) scheduleDraw()
                }
            }
        } finally {
            state.current.inflight.delete(index)
        }
    }, [manifest, getUrl, scrollMode])

    // Initial Load
    useEffect(() => {
        const init = async () => {
            if (!manifest || state.current.frameCount === 0) return

            // PERF: On mobile, only load the ONE visible frame to unblock first paint ASAP
            // Other frames will be loaded by the background preloader + lookahead
            const isBackgroundMode = scrollMode === 'document'
            const startFrame = startIndex || 0
            const initialFrames = state.current.isMobile
                ? (isBackgroundMode ? [0, 1] : [startFrame])
                : [0, 1, 2, 3, 4]

            const toLoad = new Set([startFrame, ...initialFrames])

            // Wait for at least the starting frame to load before we even attempt to draw
            await Promise.all(Array.from(toLoad).map(i => loadFrame(i, true)))

            scheduleDraw()
        }
        init()
    }, [manifest, loadFrame, startIndex, scheduleDraw, scrollMode])

    // --- 4. Draw Logic ---
    const draw = (frameIndex: number, force = false) => {
        const canvas = canvasRef.current
        if (!canvas || (!manifest && !state.current.isManual)) return

        const maxFrame = state.current.frameCount - 1
        const idx = Math.max(0, Math.min(maxFrame, Math.round(frameIndex)))

        if (!force && state.current.lastFrameIndex === idx) return

        const frame = state.current.cache.get(idx)

        // Lookahead Strategy (Bi-directional based on velocity)
        // PERF: Reduced mobile lookahead from 10→4 to avoid saturating the network
        // during init. Frames beyond 4 are handled by the background preloader.
        let lookahead = state.current.isMobile ? (scrollMode === 'document' ? 2 : 4) : 10
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator && (navigator as any).deviceMemory <= 2) {
            lookahead = 1
        }

        const isScrollingBackward = state.current.targetFrameIndex < state.current.lastFrameIndex

        if (isScrollingBackward) {
            for (let i = 1; i <= lookahead; i++) loadFrame(idx - i)
            for (let i = 1; i <= Math.floor(lookahead / 2); i++) loadFrame(idx + i)
        } else {
            for (let i = 1; i <= lookahead; i++) loadFrame(idx + i)
            for (let i = 1; i <= Math.floor(lookahead / 2); i++) loadFrame(idx - i)
        }

        // If frame is missing, find nearest cached frame and show that while we load the target
        if (!frame) {
            loadFrame(idx, true) // Priority load target
            // Scan outward for nearest cached frame to prevent canvas freeze
            let nearest: ImageBitmap | HTMLImageElement | undefined
            for (let dist = 1; dist <= 10; dist++) {
                nearest = state.current.cache.get(idx - dist) || state.current.cache.get(idx + dist)
                if (nearest) break
            }
            if (!nearest) return // Nothing to show yet
            // Draw the nearest frame as a bridge
            const ctx = canvasRef.current?.getContext('2d', { alpha: false, desynchronized: true })
            if (ctx && canvasRef.current) {
                const dpr = Math.min(window.devicePixelRatio || 1, state.current.isMobile ? 1.0 : 1.5)
                const w = state.current.appWidth
                const h = state.current.appHeight
                const targetW = Math.floor(w * dpr)
                const targetH = Math.floor(h * dpr)
                if (canvasRef.current.width !== targetW || canvasRef.current.height !== targetH) {
                    canvasRef.current.width = targetW
                    canvasRef.current.height = targetH
                    ctx.scale(dpr, dpr)
                }
                const iW = (nearest instanceof ImageBitmap) ? nearest.width : (nearest as HTMLImageElement).naturalWidth
                const iH = (nearest instanceof ImageBitmap) ? nearest.height : (nearest as HTMLImageElement).naturalHeight
                const scale = objectFit === 'contain' ? Math.min(w / iW, h / iH) : Math.max(w / iW, h / iH)
                const finalW = iW * scale
                const finalH = iH * scale
                const x = (w - finalW) / 2
                const y = objectFit === 'contain' ? 0 : (h - finalH) / 2
                ctx.drawImage(nearest, x, y, finalW, finalH)
                if (!isLoaded) setIsLoaded(true)
            }
            return
        }

        state.current.lastFrameIndex = idx

        // Debug
        if (debug) setDebugText(`Idx: ${idx} | Cache: ${state.current.cache.size}`)

        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
        if (!ctx) return

        // Cap DPR at 1.0 on ANY mobile to reduce canvas size and GPU fill-rate
        const dpr = Math.min(window.devicePixelRatio || 1, state.current.isMobile ? 1.0 : 1.5)
        const w = state.current.appWidth
        const h = state.current.appHeight
        const targetW = Math.floor(w * dpr)
        const targetH = Math.floor(h * dpr)

        // Only resize if changed (Resizing clears canvas)
        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW
            canvas.height = targetH
            // Scale context once after resize
            ctx.scale(dpr, dpr)
        }
        // NOTE: We do NOT resetTransform/scale every frame for performance.
        // We assume the context state persists until resize clears it.
        // If we needed to clear, we'd use ctx.clearRect, but we overwrite everything anyway.
        // If it's a Server Layout change, the canvas will be unmounted.

        const iW = (frame instanceof ImageBitmap) ? frame.width : (frame as HTMLImageElement).naturalWidth
        const iH = (frame instanceof ImageBitmap) ? frame.height : (frame as HTMLImageElement).naturalHeight

        // Cover Math
        const scale = objectFit === 'contain' ? Math.min(w / iW, h / iH) : Math.max(w / iW, h / iH)
        const finalW = iW * scale
        const finalH = iH * scale
        const x = (w - finalW) / 2
        const y = objectFit === 'contain' ? 0 : (h - finalH) / 2 // Align to top for contain, center for cover

        ctx.drawImage(frame, x, y, finalW, finalH)

        // We only set isLoaded once the *first* frame has actually been painted to the canvas
        if (!isLoaded) {
            setIsLoaded(true)
        }
    }

    // --- 5. Native Scroll Polling ---
    // Bypass React / useLenis hook overhead to prevent mobile render lag
    useEffect(() => {
        if (!manifest && !state.current.isManual) return

        let ticking = false
        // Lerp state for smooth frame interpolation
        let smoothedFrame = startIndex || 0
        let lerpRafId: number | null = null

        const lerpLoop = () => {
            const target = state.current.targetFrameIndex
            const diff = target - smoothedFrame
            // Converge faster for small diffs, slower for large jumps
            // On mobile use gentler lerp to prevent jumping ahead of cache
            const isMob = state.current.isMobile
            const lerpFactor = Math.abs(diff) < 2 ? (isMob ? 0.25 : 0.5) : (isMob ? 0.15 : 0.3)
            smoothedFrame += diff * lerpFactor

            // Only draw if we haven't converged
            if (Math.abs(diff) > 0.3) {
                draw(smoothedFrame)
                lerpRafId = requestAnimationFrame(lerpLoop)
            } else {
                // Snap to target when close enough
                smoothedFrame = target
                draw(target)
                lerpRafId = null
            }
        }

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY
                    let progress = 0

                    if (scrollMode === 'viewport') {
                        // No forced reflow — use cached appHeight and known section height
                        const vh = state.current.appHeight || window.innerHeight
                        const totalH = vh * ((scrollSectionHeightVh || 500) / 100)
                        const scrollable = totalH - vh
                        progress = scrollable > 0 ? Math.max(0, Math.min(1, scrollY / scrollable)) : 0
                    } else {
                        // Document mode — only 2 reads needed
                        const docH = Math.max(
                            document.body.scrollHeight, document.documentElement.scrollHeight
                        )
                        const limit = docH - (state.current.appHeight || window.innerHeight)
                        progress = limit > 0 ? Math.max(0, Math.min(1, scrollY / limit)) : 0
                    }

                    if (onProgress) onProgress(progress)

                    const start = startIndex || 0
                    const end = state.current.frameCount - 1
                    const targetFrame = start + (progress * (end - start))

                    // Set target for lerp loop instead of drawing directly
                    state.current.targetFrameIndex = Math.round(targetFrame)

                    // Start lerp loop if not already running
                    if (!lerpRafId) {
                        lerpRafId = requestAnimationFrame(lerpLoop)
                    }

                    ticking = false
                })
                ticking = true
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })

        // --- Critical Fix for Initial Render ---
        // Force an immediate draw using the start index before any scroll calculation happens
        window.requestAnimationFrame(() => {
            if (onProgress) onProgress(0); // Ensure ghost buttons get initial progress = 0
            draw(startIndex || 0, true);
            // Then let the scroll handler update it if we are already scrolled down
            handleScroll();
        });

        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (lerpRafId) cancelAnimationFrame(lerpRafId)
        }
    }, [manifest, scrollMode, scrollSectionHeightVh, startIndex, onProgress])

    // --- 6. Background Preloader ---
    useEffect(() => {
        if (!isLoaded || (!manifest && !state.current.isManual)) return
        if (typeof window === 'undefined') return

        let active = true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let idleCallbackId: any = null

        const preloadFrames = () => {
            const totalFrames = state.current.frameCount
            const frameIndices = Array.from({ length: totalFrames }, (_, i) => i)

            const loadNextBatch = () => {
                if (!active) return

                const missingFrames = frameIndices.filter(i =>
                    !state.current.cache.has(i) && !state.current.inflight.has(i)
                )

                if (missingFrames.length === 0) {
                    if (debug) console.log('[HeroEngine] All frames preloaded.')
                    return
                }

                // If active scrolling is using network, yield
                if (state.current.inflight.size > 2) {
                    idleCallbackId = setTimeout(loadNextBatch, 300)
                    return
                }

                // Load 3 frames at a time silently
                const batch = missingFrames.slice(0, 3)
                batch.forEach(i => loadFrame(i, false))

                idleCallbackId = setTimeout(loadNextBatch, 100)
            }

            // Start preloading quickly after initial sequence settles
            if ('requestIdleCallback' in window) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                idleCallbackId = window.requestIdleCallback(() => setTimeout(loadNextBatch, 300))
            } else {
                idleCallbackId = setTimeout(loadNextBatch, 300)
            }
        }

        preloadFrames()

        return () => {
            active = false
            if (idleCallbackId !== null) {
                try {
                    if ('cancelIdleCallback' in window && typeof idleCallbackId !== 'string' && typeof idleCallbackId !== 'number' && !idleCallbackId?._idleTimeout) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        window.cancelIdleCallback(idleCallbackId)
                    } else {
                        clearTimeout(idleCallbackId)
                    }
                } catch (e) {
                    clearTimeout(idleCallbackId)
                }
            }
        }
    }, [isLoaded, manifest, loadFrame, debug, state])

    return (
        <div ref={containerRef} className={cn("absolute inset-0 w-full h-full overflow-hidden", className)} style={{ height: '100%' }}>
            {debug && (
                <div className="fixed top-24 left-4 z-50 bg-black/80 text-green-400 p-4 text-xs font-mono pointer-events-none rounded border border-green-500/50">
                    <div>Status: {isLoaded ? 'LOADED' : 'LOADING...'}</div>
                    <div>Manifest: {state.current.isManual ? 'MANUAL' : (manifest ? 'OK' : 'NULL')} {manifestUrl}</div>
                    <div>Frames: {state.current.frameCount} | Cache: {state.current.cache.size}</div>
                    <div>Progress: {state.current.lastFrameIndex} / {state.current.frameCount - 1}</div>
                    <div>Size: {state.current.appWidth}x{state.current.appHeight}</div>
                    <div className="text-red-400">{debugText}</div>
                </div>
            )}

            {/* Poster: graceful fallback to prevent initial black screen — transition removed on mobile to prevent cross-fade bridge */}
            {
                posterUrl && (
                    <img
                        src={posterUrl}
                        className={cn(
                            "absolute inset-0 w-full h-full object-cover z-10",
                            isMobileHero ? "transition-none" : "transition-opacity duration-500 ease-out",
                            isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
                        )}
                        alt="Illa Loading"
                        style={{ pointerEvents: 'none' }}
                    />
                )
            }

            <canvas
                ref={canvasRef}
                className="absolute inset-0 block w-full h-full object-cover z-0"
                style={{
                    willChange: 'contents',
                    imageRendering: (state.current.isMobile && scrollMode === 'document') ? 'pixelated' : 'auto',
                    // Mobile: always visible from frame 0, no fade-in
                    // Desktop: fade in once poster has been shown
                    opacity: isMobileHero ? 1 : (isLoaded ? 1 : 0),
                    transition: isMobileHero ? 'none' : 'opacity 500ms ease-out',
                }}
            />
        </div >
    )
}
