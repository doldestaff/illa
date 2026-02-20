'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

// --- Types ---
export interface HeroEngineProps {
    manifestUrl?: string // e.g. /hero/manifest.mobile.json
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
}

interface Manifest {
    frameCount: number
    frames: string[]
}

// --- LRU Cache ---
class FrameCache {
    private cache = new Map<number, ImageBitmap | HTMLImageElement>()
    private accessHistory: number[] = []
    limit = 60

    setLimit(n: number) {
        this.limit = n
        this.prune()
    }

    private prune() {
        while (this.cache.size > this.limit) {
            const lru = this.accessHistory.shift()
            if (lru !== undefined) {
                const img = this.cache.get(lru)
                if (img && img instanceof ImageBitmap) img.close()
                this.cache.delete(lru)
            }
        }
    }

    get(index: number) {
        const pos = this.accessHistory.indexOf(index)
        if (pos > -1) {
            this.accessHistory.splice(pos, 1)
            this.accessHistory.push(index)
        }
        return this.cache.get(index)
    }

    add(index: number, frame: ImageBitmap | HTMLImageElement) {
        if (this.cache.has(index)) return
        this.cache.set(index, frame)
        this.accessHistory.push(index)
        this.prune()
    }

    has(index: number) { return this.cache.has(index) }
    get size() { return this.cache.size }
}

export function HeroEngine({
    manifestUrl,
    manualFrames,
    posterUrl,
    className,
    priorityFrames = [],
    scrollMode = 'viewport',
    scrollSectionHeightVh = 500,
    onProgress,
    startIndex = 0,
    debug = false
}: HeroEngineProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // State
    const [manifest, setManifest] = useState<Manifest | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [debugText, setDebugText] = useState('')
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
        console.log('[HeroEngine] Init. ManifestUrl:', manifestUrl, 'Manual:', !!manualFrames)

        if (manualFrames) {
            state.current.isManual = true
            state.current.frameCount = manualFrames.frameCount
            setManifest({ frameCount: manualFrames.frameCount, frames: [] })
            console.log('[HeroEngine] Manual configuration set.')
            return
        }

        if (manifestUrl) {
            const load = async () => {
                try {
                    console.log('[HeroEngine] Fetching manifest:', manifestUrl)
                    const res = await fetch(manifestUrl)
                    if (!res.ok) throw new Error(`Manifest 404: ${res.status}`)
                    const data = await res.json()

                    if (active) {
                        console.log('[HeroEngine] Manifest loaded:', data)
                        setManifest(data)
                        state.current.frameCount = data.frameCount
                        state.current.frames = data.frames
                        state.current.isManual = false
                    } else {
                        console.log('[HeroEngine] Ignoring stale manifest:', manifestUrl)
                    }
                } catch (e) {
                    if (active) console.error('[HeroEngine] Manifest Error:', e)
                }
            }
            load()
        }

        return () => { active = false }
    }, [manifestUrl, manualFrames])

    // --- 2. Resize Handler (Stable & Debounced) ---
    useEffect(() => {
        let resizeTimer: NodeJS.Timeout

        const handleResize = () => {
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => {
                const h = window.visualViewport ? window.visualViewport.height : window.innerHeight
                const w = window.visualViewport ? window.visualViewport.width : window.innerWidth

                // Only update if dimensions actually changed significantly
                if (Math.abs(state.current.appHeight - h) < 1 &&
                    Math.abs(state.current.appWidth - w) < 1) return

                state.current.appHeight = h
                state.current.appWidth = w

                // Mobile detection for perf
                state.current.isMobile = w < 768
                state.current.cache.setLimit(state.current.isMobile ? 60 : 80)

                if (containerRef.current) {
                    containerRef.current.style.setProperty('--app-h', `${h}px`)
                }

                // Force redraw on resize
                scheduleDraw()
            }, 100) // Debounce 100ms
        }

        window.addEventListener('resize', handleResize)
        if (window.visualViewport) window.visualViewport.addEventListener('resize', handleResize)

        // Initial call without debounce
        const h = window.visualViewport ? window.visualViewport.height : window.innerHeight
        const w = window.visualViewport ? window.visualViewport.width : window.innerWidth
        state.current.appHeight = h
        state.current.appWidth = w
        state.current.isMobile = w < 768
        state.current.cache.setLimit(state.current.isMobile ? 60 : 80)
        if (containerRef.current) containerRef.current.style.setProperty('--app-h', `${h}px`)

        return () => {
            window.removeEventListener('resize', handleResize)
            if (window.visualViewport) window.visualViewport.removeEventListener('resize', handleResize)
            clearTimeout(resizeTimer)
        }
    }, [])

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
        // Aggressive on mobile
        const maxInflight = state.current.isMobile ? 5 : 8
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
        } catch (e: any) {
            if (e.name === 'AbortError') return // Ignore aborted fetches
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
    }, [manifest, getUrl])

    // Initial Load
    useEffect(() => {
        const init = async () => {
            if (!manifest || state.current.frameCount === 0) return

            // Load a small batch of initial frames to ensure smooth start
            const priorityFrames = [0, 1, 2, 3, 4]
            const toLoad = new Set([startIndex || 0, ...priorityFrames])

            // Wait for at least the starting frame to load before we even attempt to draw
            await Promise.all(Array.from(toLoad).map(i => loadFrame(i, true)))

            // We do NOT set isLoaded here anymore. We wait for the first successful canvas draw.
            scheduleDraw()
        }
        init()
    }, [manifest, loadFrame, startIndex, scheduleDraw])

    // --- 4. Draw Logic ---
    const draw = (frameIndex: number, force = false) => {
        const canvas = canvasRef.current
        if (!canvas || (!manifest && !state.current.isManual)) return

        const maxFrame = state.current.frameCount - 1
        const idx = Math.max(0, Math.min(maxFrame, Math.round(frameIndex)))

        state.current.targetFrameIndex = idx

        if (!force && state.current.lastFrameIndex === idx) return

        const frame = state.current.cache.get(idx)

        // Lookahead Strategy (Bi-directional based on velocity)
        // We do this BEFORE returning on missing frame, so we don't halt preloading!
        const isScrollingBackward = state.current.targetFrameIndex < state.current.lastFrameIndex;

        let lookahead = state.current.isMobile ? 4 : 8
        if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator && (navigator as any).deviceMemory <= 4) {
            lookahead = 3
        }

        if (isScrollingBackward) {
            for (let i = 1; i <= lookahead; i++) loadFrame(idx - i)
            for (let i = 1; i <= Math.floor(lookahead / 2); i++) loadFrame(idx + i)
        } else {
            for (let i = 1; i <= lookahead; i++) loadFrame(idx + i)
            for (let i = 1; i <= Math.floor(lookahead / 2); i++) loadFrame(idx - i)
        }

        // If frame is missing, triggers priority load but KEEP OLD FRAME (don't clear canvas)
        if (!frame) {
            loadFrame(idx, true) // Priority load
            return
        }

        state.current.lastFrameIndex = idx

        // Debug
        if (debug) setDebugText(`Idx: ${idx} | Cache: ${state.current.cache.size}`)

        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
        if (!ctx) return

        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
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

        const iW = (frame instanceof ImageBitmap) ? frame.width : (frame as HTMLImageElement).naturalWidth
        const iH = (frame instanceof ImageBitmap) ? frame.height : (frame as HTMLImageElement).naturalHeight

        // Cover Math
        const scale = Math.max(w / iW, h / iH)
        const finalW = iW * scale
        const finalH = iH * scale
        const x = (w - finalW) / 2
        const y = (h - finalH) / 2

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

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY
                    let progress = 0

                    if (scrollMode === 'viewport') {
                        // Using documentElement for consistent mobile behavior
                        const docH = Math.max(
                            document.body.scrollHeight, document.documentElement.scrollHeight,
                            document.body.offsetHeight, document.documentElement.offsetHeight,
                            document.body.clientHeight, document.documentElement.clientHeight
                        )

                        // We are sticky, so we assume scroll starts at top (0)
                        const vh = state.current.appHeight || window.innerHeight
                        const totalH = vh * ((scrollSectionHeightVh || 500) / 100)

                        // Limit tracking to the height of the hero section
                        const scrollable = totalH - vh
                        progress = scrollable > 0 ? Math.max(0, Math.min(1, scrollY / scrollable)) : 0
                    } else {
                        // Document mode
                        const docH = Math.max(
                            document.body.scrollHeight, document.documentElement.scrollHeight
                        )
                        const limit = docH - (state.current.appHeight || window.innerHeight)
                        progress = limit > 0 ? Math.max(0, Math.min(1, scrollY / limit)) : 0
                    }

                    if (onProgress) onProgress(progress)

                    // Critical fix: map progress correctly to the frame range
                    // Note: Instead of always starting at `startIndex`, we map 0->`startIndex` and 1->`end`
                    const start = startIndex || 0
                    const end = state.current.frameCount - 1

                    // We need to ensure that when progress is 0, we are exactly at `startIndex`
                    // And when progress is 1, we are exactly at `end`
                    const targetFrame = start + (progress * (end - start))

                    draw(targetFrame)
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

        return () => window.removeEventListener('scroll', handleScroll)
    }, [manifest, scrollMode, scrollSectionHeightVh, startIndex, onProgress])

    return (
        <div ref={containerRef} className={cn("absolute inset-0 w-full h-full overflow-hidden", className)}>
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

            <img
                src={posterUrl}
                className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out z-10",
                    isLoaded ? "opacity-0" : "opacity-100"
                )}
                alt="Illa Loading"
                style={{
                    // Fallback to ensuring pointer events don't block
                    pointerEvents: isLoaded ? 'none' : 'auto'
                }}
            />

            <canvas
                ref={canvasRef}
                className={cn(
                    "absolute inset-0 block w-full h-full object-cover z-0 transition-opacity duration-700",
                    isLoaded ? "opacity-100" : "opacity-0"
                )}
            />
        </div>
    )
}
