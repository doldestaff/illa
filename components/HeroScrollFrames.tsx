'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { HeroGhostButtons } from './HeroGhostButtons'

interface Manifest {
    frameCount: number
    frames: string[]
}

export function HeroScrollFrames() {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [manifest, setManifest] = useState<Manifest | null>(null)
    const [images, setImages] = useState<Map<number, HTMLImageElement>>(new Map())
    const [isMobile, setIsMobile] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [debugInfo, setDebugInfo] = useState<string>('Init...')
    const [buttonProgress, setButtonProgress] = useState(0)

    // Config
    const SCROLL_HEIGHT = '500vh'

    // 1. Detect device & Load Manifest
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.matchMedia('(max-width: 768px)').matches
            // Always update on mount to be safe
            setIsMobile(mobile)
            loadManifest(mobile ? 'mobile' : 'desktop')
        }

        checkMobile()

        const handleResize = () => {
            const mobile = window.matchMedia('(max-width: 768px)').matches
            if (mobile !== isMobile) {
                window.location.reload() // Force reload on device switch for safety during debug
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const loadManifest = async (platform: 'mobile' | 'desktop') => {
        try {
            setDebugInfo(`Loading ${platform} manifest...`)
            const url = `/hero/manifest.${platform}.json`
            const res = await fetch(url)
            if (!res.ok) throw new Error(`Manifest 404 at ${url}`)
            const data = await res.json()
            setManifest(data)
            setImages(new Map())
            setDebugInfo(`Manifest loaded: ${data.frameCount} frames`)
        } catch (e: any) {
            console.error('Hero: Failed to load manifest:', e)
            setError(e.message)
            setDebugInfo(`Error: ${e.message}`)
        }
    }

    // 2. Queue & Preload Images
    useEffect(() => {
        if (!manifest) return

        const preloadImage = (index: number) => {
            if (images.has(index)) return
            const img = new Image()
            img.src = manifest.frames[index]

            img.onload = () => {
                if (index === 0) {
                    setIsLoading(false) // First frame ready
                    requestAnimationFrame(() => drawFrame(0))
                }
            }
            img.onerror = () => {
                console.error(`Failed to load frame ${index}: ${manifest.frames[index]}`)
                if (index === 0) setError(`Frame 0 failed: ${manifest.frames[index]}`)
            }

            setImages(prev => new Map(prev).set(index, img))
        }

        // Priority Load
        preloadImage(0)
        preloadImage(1)
        preloadImage(manifest.frameCount - 1)

        // Lazy Load
        const loadRest = () => {
            let loaded = 0
            const batch = 5
            const loadNextBatch = () => {
                if (loaded >= manifest.frames.length) return
                for (let i = 0; i < batch; i++) {
                    const idx = loaded + i
                    if (idx < manifest.frames.length) preloadImage(idx)
                }
                loaded += batch
                setTimeout(loadNextBatch, 50)
            }
            loadNextBatch()
        }

        const t = setTimeout(loadRest, 500)
        return () => clearTimeout(t)
    }, [manifest])

    const drawFrame = (index: number) => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx || !manifest) return

        const img = images.get(index)

        if (img && img.complete && img.naturalHeight !== 0) {
            const w = canvas.width
            const h = canvas.height

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

    // 3. Scroll Logic
    useEffect(() => {
        if (!manifest || !containerRef.current || !canvasRef.current) return

        const section = containerRef.current
        const canvas = canvasRef.current
        let rafId: number

        // Cache scroll dimensions to avoid jitter on mobile address bar resize
        let cachedScrollDist = 0
        let cachedWindowH = 0

        const updateDimensions = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight

            // On mobile, height changes when scrollbar/address bar moves.
            // We should use the container height + static logic if possible, 
            // but simply caching it on explicit resize (width change) helps.
            // For now, let's trust the resize event but maybe debounce or check width?
            // Actually, simply recalculating these here is better than in renderLoop.

            cachedWindowH = window.innerHeight
            cachedScrollDist = section.offsetHeight - cachedWindowH

            requestAnimationFrame(() => drawFrame(0))
        }

        // Only resize if width changes (to ignore vertical address bar shifts on mobile)
        let lastWidth = window.innerWidth
        const handleResize = () => {
            if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth
                updateDimensions()
            }
        }

        window.addEventListener('resize', handleResize)
        updateDimensions() // Init

        const renderLoop = () => {
            const rect = section.getBoundingClientRect()

            // Use cached values if available, else fallback
            const dist = cachedScrollDist || (section.offsetHeight - window.innerHeight)

            // Calculate progress based on Top position relative to cached start
            // rect.top is 0 when at start. -dist when at end.
            const scrolled = rect.top * -1

            let progress = scrolled / dist
            progress = Math.max(0, Math.min(1, progress))

            // clamp frame index
            const frameIndex = Math.min(
                manifest.frameCount - 1,
                Math.max(0, Math.round(progress * (manifest.frameCount - 1)))
            )


            drawFrame(frameIndex)

            // Ghost Buttons Progressive Reveal
            // Start at frame 10, end at frame 60.
            const startFrame = 10
            const endFrame = 60

            let btnProg = 0
            if (frameIndex >= startFrame) {
                btnProg = Math.min(1, Math.max(0, (frameIndex - startFrame) / (endFrame - startFrame)))
            }

            setButtonProgress(btnProg)

            rafId = requestAnimationFrame(renderLoop)
        }

        rafId = requestAnimationFrame(renderLoop)

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('resize', handleResize)
        }
    }, [manifest, images])

    if (error) {
        return (
            <div className="h-screen w-full bg-red-900 text-white flex flex-col items-center justify-center p-4">
                <AlertTriangle size={48} className="mb-4" />
                <h2 className="text-2xl font-bold mb-2">Error Loading Hero</h2>
                <p className="opacity-80 font-mono text-sm">{error}</p>
                <p className="mt-4 text-xs opacity-50">{debugInfo}</p>
            </div>
        )
    }

    return (
        <section
            ref={containerRef}
            className="relative w-full z-10"
            style={{ height: SCROLL_HEIGHT }}
        >
            <div className="sticky top-0 w-full h-screen overflow-hidden bg-illa-pink">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full block"
                />

                {/* Loader Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20 text-white">
                        <Loader2 className="animate-spin mb-4" size={48} />
                        <p className="font-semibold tracking-wider">LOADING EXPERIENCE...</p>
                        <p className="text-xs mt-2 opacity-50 font-mono">{debugInfo}</p>
                    </div>
                )}

                {/* Ghost Buttons Overlay */}
                <HeroGhostButtons progress={buttonProgress} isMobile={isMobile} />
            </div>
        </section>
    )
}
