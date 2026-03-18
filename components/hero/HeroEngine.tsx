'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { MotionValue } from 'framer-motion'

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
    // Drive the engine externally (e.g. time-based animation on mobile)
    progressValue?: MotionValue<number>
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
    scrollMode = 'viewport',
    scrollSectionHeightVh = 500,
    progressValue,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- setter is used in scroll handler, value reserved for future mobile-specific rendering
    const [_isMobileHero, setIsMobileHero] = useState(false)
    // Refs for Loop
    const state = useRef({
        cache: new FrameCache(),
        inflight: new Map<number, AbortController>(),
        lastFrameIndex: startIndex, // Start at requested index
        targetFrameIndex: startIndex, // Actual visual target from scroll
        appHeight: 0,
        appWidth: 0,
        isMobile: false,
        isTablet: false,
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

    // --- 2. Resize Handler (Split: immediate dimension update + debounced redraw) ---
    useEffect(() => {
        let redrawTimer: NodeJS.Timeout
        // Track previous width to detect real resizes vs URL bar collapse
        let prevWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth

        const handleResize = () => {
            // CRITICAL: Update dimensions IMMEDIATELY — measuring the DOM element directly.
            // This safely bypasses visualViewport/URL-bar collapse differences on mobile.
            const h = containerRef.current ? containerRef.current.clientHeight : (window.visualViewport ? window.visualViewport.height : window.innerHeight)
            const w = containerRef.current ? containerRef.current.clientWidth : (window.visualViewport ? window.visualViewport.width : window.innerWidth)

            const widthChanged = Math.abs(w - prevWidth) > 1
            const isMob = w < 768
            const isTab = w >= 768 && w < 1024

            state.current.appWidth = w
            state.current.isMobile = isMob
            state.current.isTablet = isTab

            // On mobile/tablet, ONLY update appHeight if the WIDTH actually changed
            // (real rotation/resize). If only height changed, it's the URL bar collapsing
            // and we MUST ignore it to prevent the canvas from jumping.
            if (widthChanged || (!isMob && !isTab)) {
                state.current.appHeight = h
                prevWidth = w
            }

            const isBackgroundMode = scrollMode === 'document'
            state.current.cache.setLimit((isMob || isTab) ? (isBackgroundMode ? 90 : 100) : 100)

            if (containerRef.current) {
                // Use the stable appHeight, not the raw h
                containerRef.current.style.setProperty('--app-h', `${state.current.appHeight}px`)
            }

            // Debounce only the expensive canvas resize + redraw
            clearTimeout(redrawTimer)
            redrawTimer = setTimeout(() => scheduleDraw(), 150)
        }

        window.addEventListener('resize', handleResize)
        if (window.visualViewport) window.visualViewport.addEventListener('resize', handleResize)

        // Initial call — always set everything on first mount
        const h = containerRef.current ? containerRef.current.clientHeight : (window.visualViewport ? window.visualViewport.height : window.innerHeight)
        const w = containerRef.current ? containerRef.current.clientWidth : (window.visualViewport ? window.visualViewport.width : window.innerWidth)
        prevWidth = w
        state.current.appHeight = h
        state.current.appWidth = w
        state.current.isMobile = w < 768
        state.current.isTablet = w >= 768 && w < 1024
        setIsMobileHero(w < 768 || (w >= 768 && w < 1024))

        const isBackgroundMode = scrollMode === 'document'
        state.current.cache.setLimit((state.current.isMobile || state.current.isTablet) ? (isBackgroundMode ? 90 : 100) : 100)

        if (containerRef.current) containerRef.current.style.setProperty('--app-h', `${h}px`)

        return () => {
            window.removeEventListener('resize', handleResize)
            if (window.visualViewport) window.visualViewport.removeEventListener('resize', handleResize)
            clearTimeout(redrawTimer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                // iOS Fix: skip draw if dimensions not yet measured (prevents 0x0 canvas on first paint)
                if (state.current.appWidth === 0 || state.current.appHeight === 0) return
                draw(state.current.targetFrameIndex, true)
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadFrame = useCallback(async (index: number, priority = false) => {
        if (!manifest && !state.current.isManual) return
        if (index < 0 || index >= state.current.frameCount) return
        if (state.current.cache.has(index)) return
        if (state.current.inflight.has(index)) return // Already loading

        // Concurrency Limiter (prevent browser choke)
        // Aggressive on mobile to save GPU/Network parsing
        const isBackgroundMode = scrollMode === 'document'
        const maxInflight = state.current.isMobile ? (isBackgroundMode ? 2 : 3) : 6

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
                // Try off-main-thread decode, but SKIP on mobile because iOS Safari iOS 15- 
                // crashes the GPU process immediately when creating too many ImageBitmaps
                if (!state.current.isMobile) {
                    frameSource = await createImageBitmap(blob, {
                        premultiplyAlpha: 'none',
                        colorSpaceConversion: 'none'
                    })
                } else {
                    throw new Error('Skip Bitmap on Mobile')
                }
            } catch {
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
            try {
                const img = new Image()
                img.decoding = 'async' // PERF: Force async decode
                img.src = url

                // Wait for the browser to decode the image on a worker thread
                await img.decode()

                if (!state.current.cache.has(index)) {
                    state.current.cache.add(index, img)
                    if (priority || Math.abs(state.current.targetFrameIndex - index) <= 1) scheduleDraw()
                }
            } catch {
                // If decode() throws (e.g., unsupported format or broken image), fallback to standard onload
                const img = new Image()
                img.src = url
                img.onload = () => {
                    if (!state.current.cache.has(index)) {
                        state.current.cache.add(index, img)
                        if (priority || Math.abs(state.current.targetFrameIndex - index) <= 1) scheduleDraw()
                    }
                }
            }
        } finally {
            state.current.inflight.delete(index)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // PERF: Reduced mobile/tablet lookahead from 4→2 to avoid saturating the network
        // during init. Frames beyond 2 are handled by the background preloader.
        let lookahead = (state.current.isMobile || state.current.isTablet) ? 2 : 8
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
                const dpr = Math.min(window.devicePixelRatio || 1, (state.current.isMobile || state.current.isTablet) ? 1.0 : 1.5)
                const w = state.current.appWidth
                const h = state.current.appHeight
                const targetW = Math.floor(w * dpr)
                const targetH = Math.floor(h * dpr)
                if (canvasRef.current.width !== targetW || canvasRef.current.height !== targetH) {
                    canvasRef.current.width = targetW
                    canvasRef.current.height = targetH
                    ctx.scale(dpr, dpr)
                } else {
                    ctx.clearRect(0, 0, w, h)
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

        // Cap DPR at 1.0 on ANY mobile/tablet to reduce canvas size and GPU fill-rate
        const dpr = Math.min(window.devicePixelRatio || 1, (state.current.isMobile || state.current.isTablet) ? 1.0 : 1.5)
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
        } else {
            // CRITICAL FIX: Clear the canvas before drawing the new frame to prevent WebP alpha/compression artifact buildup (tearing)
            ctx.clearRect(0, 0, w, h)
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

        // Horizontal center
        const x = (w - finalW) / 2

        // Vertical center with tablet offset
        // On iPad/Tablet (portrait tall aspect), the mobile frames are heavily cropped at top/bottom.
        // For tablets in portrait mode, the image was too high. Let's pull it down slightly (+2%) or center it.
        let yOffset = 0
        if (state.current.isTablet && h > w) {
            yOffset = Number.isFinite(h) ? h * 0.02 : 0 // Shift down by 2% of screen height
        }
        const y = objectFit === 'contain' ? 0 : ((h - finalH) / 2) + yOffset

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
                // Trailing watchdog: catch new targets that arrived while converging
                // This closes the gap between scroll handler ticking and lerp loop lifecycle
                lerpRafId = requestAnimationFrame(() => {
                    if (Math.abs(state.current.targetFrameIndex - smoothedFrame) > 0.3) {
                        lerpRafId = requestAnimationFrame(lerpLoop)
                    } else {
                        lerpRafId = null
                    }
                })
            }
        }

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    let progress = 0
                    
                    if (progressValue) {
                        progress = progressValue.get()
                    } else {
                        const scrollY = window.scrollY

                        if (scrollMode === 'viewport') {
                            // DEFINITIVE FIX: Use FROZEN appHeight for scroll progress math.
                            // On mobile, appHeight is locked at mount and only updates on width changes.
                            // This ensures the same scrollY always maps to the same progress/frame,
                            // regardless of URL bar collapse changing the actual viewport height.
                            const vh = state.current.appHeight || window.innerHeight
                            const totalH = vh * ((scrollSectionHeightVh || 500) / 100)
                            const scrollable = totalH - vh
                            progress = scrollable > 0 ? Math.max(0, Math.min(1, scrollY / scrollable)) : 0
                        } else {
                            // Document mode — use frozen height for consistency
                            const docH = Math.max(
                                document.body.scrollHeight, document.documentElement.scrollHeight
                            )
                            const vh = state.current.appHeight || window.innerHeight
                            const limit = docH - vh
                            progress = limit > 0 ? Math.max(0, Math.min(1, scrollY / limit)) : 0
                        }
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

        // --- Critical Fix for Initial Render ---
        // iOS Fix: defer initial draw via double-rAF to ensure resize handler has set appWidth/Height first
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                if (onProgress) onProgress(0)
                if (state.current.appWidth > 0 && state.current.appHeight > 0) {
                    draw(startIndex || 0, true)
                }
                handleScroll()
            })
        })

        let unsubscribe: (() => void) | undefined
        if (progressValue) {
            unsubscribe = progressValue.on('change', handleScroll)
        } else {
            window.addEventListener('scroll', handleScroll, { passive: true })
        }

        return () => {
            if (unsubscribe) unsubscribe()
            window.removeEventListener('scroll', handleScroll)
            if (lerpRafId) cancelAnimationFrame(lerpRafId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manifest, scrollMode, scrollSectionHeightVh, startIndex, onProgress, progressValue])

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
                idleCallbackId = window.requestIdleCallback(() => setTimeout(loadNextBatch, state.current.isMobile ? 800 : 300))
            } else {
                idleCallbackId = setTimeout(loadNextBatch, state.current.isMobile ? 800 : 300)
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
                } catch {
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

            {/* Poster: Always visible beneath the canvas. Prevents black screen on load. 
                Canvas draws over it exactly matching frame 0, eliminating cross-fades entirely. */}
            {posterUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={posterUrl}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    alt="Illa Loading"
                    style={{ pointerEvents: 'none' }}
                />
            )}

            <canvas
                ref={canvasRef}
                className="absolute inset-0 block w-full h-full object-cover z-10"
                style={{
                    willChange: 'contents',
                    imageRendering: (state.current.isMobile && scrollMode === 'document') ? 'pixelated' : 'auto',
                    // Always visible, no fade-in to prevent black screen flashes
                    opacity: 1,
                }}
            />
        </div >
    )
}
