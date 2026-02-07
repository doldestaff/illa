'use client'

import { useEffect, useRef, useState } from 'react'

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

    // Config
    const SCROLL_HEIGHT = '500vh' // Total scrolling distance

    // 1. Detect device & Load Manifest
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.matchMedia('(max-width: 768px)').matches
            // Only reload if platform changed
            if (mobile !== isMobile) {
                setIsMobile(mobile)
                loadManifest(mobile ? 'mobile' : 'desktop')
            }
        }

        // Initial check
        checkMobile()

        // Debounced resize handler could be better, but simple is robust here
        const handleResize = () => checkMobile()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isMobile])

    const loadManifest = async (platform: 'mobile' | 'desktop') => {
        try {
            const url = `/hero/manifest.${platform}.json`
            const res = await fetch(url)
            if (!res.ok) throw new Error(`Manifest not found at ${url}`)
            const data = await res.json()
            setManifest(data)
            setImages(new Map()) // Clear cache on platform switch
        } catch (e) {
            console.error('Failed to load manifest:', e)
        }
    }

    // 2. Queue & Preload Images
    // We prioritize Frame 0, 1, and the last frame for immediate stability.
    // Then we lazy load the rest.
    useEffect(() => {
        if (!manifest) return

        const preloadImage = (index: number) => {
            if (images.has(index)) return
            const img = new Image()
            img.src = manifest.frames[index]
            // We store it even if not fully loaded yet; browser handles network dedup
            setImages(prev => new Map(prev).set(index, img))

            // Render first frame immediately once loaded if it's the first one
            if (index === 0) {
                img.onload = () => drawFrame(0)
            }
        }

        // Priority 1: First and Last
        preloadImage(0)
        preloadImage(1)
        preloadImage(manifest.frameCount - 1)

        // Priority 2: Idle loading for the rest
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

                if (loaded < manifest.frames.length) {
                    // Use requestIdleCallback if available, else timeout
                    if ('requestIdleCallback' in window) {
                        (window as any).requestIdleCallback(loadNextBatch)
                    } else {
                        setTimeout(loadNextBatch, 50)
                    }
                }
            }
            loadNextBatch()
        }

        // Wait a bit for main thread to settle then load rest
        const t = setTimeout(loadRest, 1000)
        return () => clearTimeout(t)
    }, [manifest]) // Only re-run if manifest changes

    // Helper to draw
    const drawFrame = (index: number) => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx || !manifest) return

        const img = images.get(index)

        // If image exists and is loaded, draw it. 
        // If strictly checking .complete is failing (e.g. broken image), checks might be needed.
        if (img && img.complete && img.naturalHeight !== 0) {
            // High-DPI handling
            // canvas.width = window.innerWidth * dpr, etc. logic is handled by making canvas 100% css
            // but for drawing, we need internal resolution to match.
            // Simplified: Draw directly to canvas which matches sticky container size.

            /* 
               Better Approach for "Cover" fit on Canvas:
               We need to mimic object-fit: cover / object-position: top
            */
            const w = canvas.width
            const h = canvas.height
            const iw = img.naturalWidth
            const ih = img.naturalHeight

            // Scale to fit width or height?
            // "Cover" logic
            const scale = Math.max(w / iw, h / ih)
            const sw = w / scale
            const sh = h / scale
            const sx = (iw - sw) / 2
            const sy = 0 // Top alignment enforced (sy = 0)

            ctx.clearRect(0, 0, w, h)
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
        } else if (img) {
            // If exists but not loaded, try to draw it when it loads
            img.onload = () => drawFrame(index)
        }
    }

    // 3. Scroll Logic (RAF + IntersectionObserver)
    useEffect(() => {
        if (!manifest || !containerRef.current || !canvasRef.current) return

        const section = containerRef.current
        const canvas = canvasRef.current
        let rafId: number
        let isVisible = true

        // Resize canvas to match display size
        const resizeCanvas = () => {
            const rect = section.getBoundingClientRect()
            // The sticky container is always 100vh, so canvas should match viewport
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            // Redraw current frame after resize
            // We need to know current frame... tricky inside closure. 
            // We let the loop handle it or simply trigger a scroll handler manually.
        }
        window.addEventListener('resize', resizeCanvas)
        resizeCanvas() // Initial size

        // Observer to pause RAF
        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting
        }, { threshold: 0 })
        observer.observe(section)

        const renderLoop = () => {
            if (!isVisible) {
                // If not visible, check again next frame or wait for observer?
                // RAF keeps running but does nothing heavy
                // Better: cancel it? 
                // For simplicity + robustness with sticky: sticky element MIGHT be visible even if parent bottom is out?
                // No, parent wraps it.
                // We'll just skip logic if not visible to save CPU.
                rafId = requestAnimationFrame(renderLoop)
                return
            }

            const rect = section.getBoundingClientRect()
            const scrollDistance = section.offsetHeight - window.innerHeight
            const scrolled = rect.top * -1

            // Calculate progress
            let progress = scrolled / scrollDistance
            progress = Math.max(0, Math.min(1, progress))

            const frameIndex = Math.round(progress * (manifest.frameCount - 1))

            drawFrame(frameIndex)

            rafId = requestAnimationFrame(renderLoop)
        }

        rafId = requestAnimationFrame(renderLoop)

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('resize', resizeCanvas)
            observer.disconnect()
        }
    }, [manifest, images]) // Re-bind if manifest or images array (ref change) updates

    if (!manifest) {
        // Placeholder while manifest loads
        return <div className="h-screen w-full bg-black" />
    }

    return (
        <section
            ref={containerRef}
            className="relative w-full z-10"
            style={{ height: SCROLL_HEIGHT }}
        >
            <div className="sticky top-0 w-full h-screen overflow-hidden bg-black">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full block"
                />
            </div>
        </section>
    )
}
