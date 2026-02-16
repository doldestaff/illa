'use client'

import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { HeroGhostButtons } from './HeroGhostButtons'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- 1. Global Singleton Cache ---
interface CacheData {
    manifest: { frameCount: number; frames: string[] } | null
    images: Map<number, HTMLImageElement>
    platform: 'mobile' | 'desktop' | null
}

const globalCache: CacheData = {
    manifest: null,
    images: new Map(),
    platform: null
}

export function HeroScrollFrames() {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Mount state
    const [isMounted, setIsMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Stable Refs
    const buttonProgress = useMotionValue(0)
    const [isMobile, setIsMobile] = useState(false)

    // Config
    const SCROLL_HEIGHT = isMobile ? '350vh' : '500vh'

    // --- 2. Setup & Load ---
    useEffect(() => {
        setIsMounted(true)

        const detectAndLoad = async () => {
            const mobile = window.matchMedia('(max-width: 768px)').matches
            setIsMobile(mobile)
            const platform = mobile ? 'mobile' : 'desktop'

            // Define Start Offsets
            const START_OFFSET = mobile ? 4 : 2 // 004.webp (mobile) or 002.webp (desktop)

            if (globalCache.manifest && globalCache.platform === platform) {
                setIsLoading(false)
                requestAnimationFrame(() => drawFrame(START_OFFSET))
                return
            }

            if (globalCache.platform !== platform) {
                globalCache.manifest = null
                globalCache.images.clear()
                globalCache.platform = platform
            }

            try {
                const url = `/hero/manifest.${platform}.json`
                const res = await fetch(url)
                if (!res.ok) throw new Error(`Manifest 404 at ${url}`)

                const data = await res.json()
                globalCache.manifest = data

                preloadImages(data.frames, START_OFFSET)

            } catch (e: any) {
                console.error('Hero: Failed to load:', e)
                setError(e.message)
            }
        }

        detectAndLoad()
    }, [])

    const preloadImages = (frames: string[], startOffset: number) => {
        let loadedCount = 0
        const total = frames.length
        // Prioritize the START_OFFSET frame so we can render immediately
        const priorityIndices = [startOffset, startOffset + 1, startOffset + 2, total - 1]

        const loadSingle = (index: number) => {
            if (globalCache.images.has(index)) return Promise.resolve()

            return new Promise<void>((resolve) => {
                const img = new Image()
                img.src = frames[index]
                img.onload = () => {
                    globalCache.images.set(index, img)
                    loadedCount++
                    // Show content as soon as the start frame is ready
                    if (index === startOffset) {
                        setIsLoading(false)
                        requestAnimationFrame(() => drawFrame(startOffset))
                        // Force refresh needed even for sticky? Maybe not, but good for ScrollTrigger bounds
                        ScrollTrigger.refresh()
                    }
                    resolve()
                }
                img.onerror = () => resolve()
            })
        }

        Promise.all(priorityIndices.map(i => {
            if (i < total) return loadSingle(i)
            return Promise.resolve()
        })).then(() => {
            const loadNextBatch = () => {
                const batchSize = 5
                let nextIndex = 0
                const processBatch = () => {
                    let batchCount = 0
                    while (batchCount < batchSize && nextIndex < total) {
                        if (!globalCache.images.has(nextIndex)) {
                            loadSingle(nextIndex)
                            batchCount++
                        }
                        nextIndex++
                    }
                    if (nextIndex < total) requestAnimationFrame(processBatch)
                }
                processBatch()
            }
            loadNextBatch()
        })
    }

    // --- 3. Draw Logic ---
    const drawFrame = (index: number) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx || !globalCache.manifest) return

        const img = globalCache.images.get(index)

        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const w = canvas.width
        const h = canvas.height

        if (img && img.complete && img.naturalHeight !== 0) {
            const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
            const sw = w / scale
            const sh = h / scale
            const sx = (img.naturalWidth - sw) / 2
            const sy = 0

            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
        }
    }

    // --- 4. GSAP ScrollTrigger Integration (NO PINNING - Scrub Only) ---
    const isReady = isMounted && !!globalCache.manifest

    useLayoutEffect(() => {
        if (!isReady || !containerRef.current) return

        const timer = setTimeout(() => {
            gsap.registerPlugin(ScrollTrigger)

            ScrollTrigger.getAll().forEach(t => {
                if (t.trigger === containerRef.current) t.kill()
            })

            const totalFrames = globalCache.manifest!.frameCount - 1
            const mobile = window.matchMedia('(max-width: 768px)').matches
            const START_OFFSET = mobile ? 4 : 2

            const ctx = gsap.context(() => {
                ScrollTrigger.create({
                    trigger: containerRef.current,
                    start: "top top",
                    end: "bottom bottom",
                    // NO PIN - Relies on CSS Sticky
                    scrub: 0,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        const progress = self.progress

                        // Map 0..1 progress to startOffset..totalFrames
                        const frameIndex = Math.min(
                            totalFrames,
                            Math.max(START_OFFSET, Math.round(START_OFFSET + (progress * (totalFrames - START_OFFSET))))
                        )

                        requestAnimationFrame(() => drawFrame(frameIndex))

                        // Ghost Button Progress (Frame 10 to 60)
                        const startFrame = 10
                        const endFrame = 60
                        let btnProg = 0
                        if (frameIndex >= startFrame) {
                            btnProg = Math.min(1, Math.max(0, (frameIndex - startFrame) / (endFrame - startFrame)))
                        }
                        buttonProgress.set(btnProg)
                    }
                })
            }, containerRef)

            const resizeObserver = new ResizeObserver(() => {
                ScrollTrigger.refresh()
            })
            resizeObserver.observe(containerRef.current!)

            return () => {
                resizeObserver.disconnect()
                ctx.revert()
                ScrollTrigger.getAll().forEach(t => {
                    if (t.trigger === containerRef.current) t.kill()
                })
            }
        }, 100)

        return () => clearTimeout(timer)
    }, [isReady])

    // --- Render ---
    if (!isMounted) return <div className="h-screen w-full bg-illa-pink" />

    if (error) {
        return (
            <div className="h-screen w-full bg-red-900 text-white flex flex-col items-center justify-center p-4">
                <AlertTriangle size={48} className="mb-4" />
                <h2 className="text-2xl font-bold mb-2">Error Loading</h2>
                <p className="opacity-80 font-mono text-xs">{error}</p>
            </div>
        )
    }

    return (
        <section
            ref={containerRef}
            className="relative w-full z-10"
            style={{ height: SCROLL_HEIGHT }}
        >
            <div
                ref={contentRef}
                className={cn(
                    "sticky top-0 w-full h-[100dvh] overflow-hidden bg-illa-pink will-change-transform transition-opacity duration-700",
                    isLoading ? "opacity-0" : "opacity-100"
                )}
            >
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block"
                />

                <div className="absolute inset-0 pointer-events-none z-20">
                    <HeroGhostButtons progress={buttonProgress} isMobile={isMobile} />
                </div>
            </div>

            {/* Loader Overlay - Instant hide, no fade */}
            {isLoading && (
                <div className="fixed inset-0 bg-illa-pink z-50 pointer-events-none" />
            )}
        </section>
    )
}

