'use client'

import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { HeroGhostButtons } from './HeroGhostButtons'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// --- 1. Global Singleton Cache ---
// Preserves state across re-mounts (navigation)
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

    const [isLoading, setIsLoading] = useState(!globalCache.manifest)
    const [error, setError] = useState<string | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [debugInfo, setDebugInfo] = useState<string>('Init...')
    const [buttonProgress, setButtonProgress] = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    // Config
    const SCROLL_HEIGHT = '500vh' // Total scroll distance

    // --- 2. Setup & Load ---
    useEffect(() => {
        const detectAndLoad = async () => {
            const mobile = window.matchMedia('(max-width: 768px)').matches
            setIsMobile(mobile)

            const platform = mobile ? 'mobile' : 'desktop'

            // If already cached for this platform, skip load
            if (globalCache.manifest && globalCache.platform === platform) {
                setDebugInfo(`Using cached ${platform} manifest`)
                setIsLoading(false)

                // Ensure frame 0 is drawn immediately
                requestAnimationFrame(() => drawFrame(0))
                return
            }

            // Reset cache if platform changed
            if (globalCache.platform !== platform) {
                globalCache.manifest = null
                globalCache.images.clear()
                globalCache.platform = platform
            }

            try {
                setDebugInfo(`Loading ${platform} manifest...`)
                const url = `/hero/manifest.${platform}.json`
                const res = await fetch(url)
                if (!res.ok) throw new Error(`Manifest 404 at ${url}`)

                const data = await res.json()
                globalCache.manifest = data
                setDebugInfo(`Loaded ${data.frameCount} frames`)

                // Start Preload
                preloadImages(data.frames)

            } catch (e: any) {
                console.error('Hero: Failed to load:', e)
                setError(e.message)
            }
        }

        detectAndLoad()
    }, [])

    const preloadImages = (frames: string[]) => {
        let loadedCount = 0
        const total = frames.length

        // Priority: First few frames + Last frame
        const priorityIndices = [0, 1, 2, total - 1]

        const loadSingle = (index: number) => {
            if (globalCache.images.has(index)) return Promise.resolve()

            return new Promise<void>((resolve, reject) => {
                const img = new Image()
                img.src = frames[index]
                img.onload = () => {
                    globalCache.images.set(index, img)
                    loadedCount++

                    // If first frame loaded, we can show something
                    if (index === 0) {
                        setIsLoading(false)
                        requestAnimationFrame(() => drawFrame(0))
                    }
                    resolve()
                }
                img.onerror = () => {
                    console.error(`Failed frame ${index}`)
                    resolve() // resolve anyway to continue
                }
            })
        }

        // Load priority first
        Promise.all(priorityIndices.map(i => loadSingle(i))).then(() => {
            // Lazy load the rest in batches
            let nextIndex = 0
            const loadNextBatch = () => {
                const batchSize = 5
                let batchCount = 0

                while (batchCount < batchSize && nextIndex < total) {
                    if (!globalCache.images.has(nextIndex)) {
                        loadSingle(nextIndex)
                        batchCount++
                    }
                    nextIndex++
                }

                if (nextIndex < total) {
                    requestAnimationFrame(loadNextBatch)
                }
            }
            loadNextBatch()
        })
    }

    // --- 3. Draw & Resize Logic ---
    const drawFrame = (index: number) => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx || !globalCache.manifest) return

        const img = globalCache.images.get(index)

        // Ensure canvas matches window size
        // We do this check inside draw to be resize-proof
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const w = canvas.width
        const h = canvas.height

        if (img && img.complete && img.naturalHeight !== 0) {
            // "Cover" logic
            const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
            const sw = w / scale
            const sh = h / scale
            const sx = (img.naturalWidth - sw) / 2
            const sy = 0

            ctx.clearRect(0, 0, w, h)
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
        }
    }

    // --- 4. GSAP ScrollTrigger Integration ---
    // We need to define isReady first or move the effect below
    const isReady = !isLoading && !!globalCache.manifest

    useLayoutEffect(() => {
        if (!isReady || !containerRef.current || !canvasRef.current || !contentRef.current) return

        // Register
        gsap.registerPlugin(ScrollTrigger)

        const totalFrames = globalCache.manifest!.frameCount - 1

        // Context for cleanup
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: "top top",
                end: "bottom bottom",
                pin: contentRef.current, // PIN THE CONTENT WRAPPER
                scrub: 0.5, // 0.5s lag for smoothness
                onUpdate: (self) => {
                    const progress = self.progress
                    const frameIndex = Math.min(
                        totalFrames,
                        Math.max(0, Math.round(progress * totalFrames))
                    )

                    // Draw
                    requestAnimationFrame(() => drawFrame(frameIndex))

                    // Ghost Button Progress (Frame 10 to 60)
                    const startFrame = 10
                    const endFrame = 60
                    let btnProg = 0
                    if (frameIndex >= startFrame) {
                        btnProg = Math.min(1, Math.max(0, (frameIndex - startFrame) / (endFrame - startFrame)))
                    }
                    setButtonProgress(btnProg)
                }
            })
        }, containerRef)

        return () => ctx.revert()
    }, [isReady])

    // --- Render ---
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
            {/* 
                Pinned Content Wrapper.
                GSAP pins this element.
                Because it contains both Canvas and Buttons, they scroll together.
            */}
            <div
                ref={contentRef}
                className="relative w-full h-screen overflow-hidden bg-illa-pink"
            >
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block"
                />

                {/* Ghost Buttons overlay - Absolute inside the pinned container */}
                <div className="absolute inset-0 pointer-events-none z-20">
                    <HeroGhostButtons progress={buttonProgress} isMobile={isMobile} />
                </div>
            </div>

            {/* Loader Overlay - Only if truly loading initial assets */}
            {isLoading && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-illa-pink z-50 text-white">
                    <Loader2 className="animate-spin mb-4" size={48} />
                    <p className="font-semibold tracking-wider">LOADING EXPERIENCE...</p>
                </div>
            )}
        </section>
    )
}
