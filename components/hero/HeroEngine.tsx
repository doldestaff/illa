'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useLenis } from 'lenis/react'

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
        inflight: new Set<number>(),
        lastFrameIndex: startIndex, // Start at requested index
        appHeight: 0,
        appWidth: 0,
        isMobile: false,
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

    // --- 2. Resize Handler (Stable) ---
    useEffect(() => {
        const handleResize = () => {
            const h = window.visualViewport ? window.visualViewport.height : window.innerHeight
            const w = window.visualViewport ? window.visualViewport.width : window.innerWidth
            state.current.appHeight = h
            state.current.appWidth = w

            // Mobile detection for perf
            state.current.isMobile = w < 768
            state.current.cache.setLimit(state.current.isMobile ? 20 : 60)

            if (containerRef.current) {
                containerRef.current.style.setProperty('--app-h', `${h}px`)
            }
            // Redraw current
            requestAnimationFrame(() => draw(state.current.lastFrameIndex, true))
        }

        window.addEventListener('resize', handleResize)
        if (window.visualViewport) window.visualViewport.addEventListener('resize', handleResize)

        handleResize()

        return () => {
            window.removeEventListener('resize', handleResize)
            if (window.visualViewport) window.visualViewport.removeEventListener('resize', handleResize)
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

    const loadFrame = useCallback(async (index: number, priority = false) => {
        if (!manifest && !state.current.isManual) return
        if (index < 0 || index >= state.current.frameCount) return
        if (state.current.cache.has(index)) return
        if (state.current.inflight.has(index)) return // Already loading

        // Concurrency Limiter (prevent browser choke)
        // Aggressive on mobile
        const maxInflight = state.current.isMobile ? 2 : 6
        if (!priority && state.current.inflight.size >= maxInflight) return

        const url = getUrl(index)
        if (!url) return

        state.current.inflight.add(index)

        try {
            const resp = await fetch(url)
            if (!resp.ok) throw new Error('404')
            const blob = await resp.blob()
            const bitmap = await createImageBitmap(blob, {
                premultiplyAlpha: 'none',
                colorSpaceConversion: 'none'
            })
            state.current.cache.add(index, bitmap)

            if (priority || Math.abs(state.current.lastFrameIndex - index) <= 1) {
                requestAnimationFrame(() => draw(state.current.lastFrameIndex, true))
            }
        } catch {
            // Fallback for Safari/Older browsers or error
            const img = new Image()
            img.src = url
            img.onload = () => {
                state.current.cache.add(index, img)
                if (priority) requestAnimationFrame(() => draw(state.current.lastFrameIndex, true))
            }
        } finally {
            state.current.inflight.delete(index)
        }
    }, [manifest, getUrl])

    // Initial Load
    useEffect(() => {
        if (!manifest) return

        const init = async () => {
            const toLoad = new Set([0, ...priorityFrames])
            await Promise.all(Array.from(toLoad).map(i => loadFrame(i, true)))
            setIsLoaded(true)
        }
        init()
    }, [manifest, priorityFrames, loadFrame])

    // --- 4. Draw Logic ---
    const draw = (frameIndex: number, force = false) => {
        const canvas = canvasRef.current
        if (!canvas || (!manifest && !state.current.isManual)) return

        const maxFrame = state.current.frameCount - 1
        const idx = Math.max(0, Math.min(maxFrame, Math.round(frameIndex)))

        if (!force && state.current.lastFrameIndex === idx) return

        const frame = state.current.cache.get(idx)

        // If frame is missing, triggers load but KEEP OLD FRAME (don't clear canvas)
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
            ctx.scale(dpr, dpr)
        } else {
            // If not resizing, we might need to reset transform if we were doing complex things, 
            // but here we just need to ensure we draw over everything.
            // We rely on 'cover' to fill the screen.
            ctx.resetTransform()
            ctx.scale(dpr, dpr)
        }

        const iW = (frame instanceof ImageBitmap) ? frame.width : (frame as HTMLImageElement).naturalWidth
        const iH = (frame instanceof ImageBitmap) ? frame.height : (frame as HTMLImageElement).naturalHeight

        // Cover Math
        const scale = Math.max(w / iW, h / iH)
        const finalW = iW * scale
        const finalH = iH * scale
        const x = (w - finalW) / 2
        const y = (h - finalH) / 2

        ctx.drawImage(frame, x, y, finalW, finalH)

        // Lookahead
        let lookahead = state.current.isMobile ? 3 : 6
        if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator && (navigator as any).deviceMemory <= 4) {
            lookahead = 3
        }
        for (let i = 1; i <= lookahead; i++) loadFrame(idx + i)
    }

    // --- 5. Scroll Logic (Unified) ---
    useLenis(({ scroll, limit }) => {
        if (!manifest && !state.current.isManual) {
            // console.warn('[HeroEngine] Scroll suppressed: No manifest')
            return
        }

        let progress = 0

        if (scrollMode === 'viewport') {
            const vh = state.current.appHeight
            const totalH = vh * (scrollSectionHeightVh / 100)
            const scrollable = totalH - vh
            progress = Math.max(0, Math.min(1, scroll / scrollable))
        } else {
            progress = Math.max(0, Math.min(1, scroll / limit))
        }

        // console.log('[HeroEngine] Scroll:', scroll, 'Progress:', progress) // Uncomment for heavy debugging

        if (onProgress) onProgress(progress)

        // START INDEX MAPPING (Clamp 0..1 to startIndex..last)
        const start = startIndex || 0
        const end = state.current.frameCount - 1
        const targetFrame = start + (progress * (end - start))

        draw(targetFrame)
    }, [manifest, scrollMode, scrollSectionHeightVh, loadFrame, startIndex])

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
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                    isLoaded ? "opacity-0" : "opacity-100"
                )}
            />

            <canvas ref={canvasRef} className="block w-full h-full object-cover" />
        </div>
    )
}
