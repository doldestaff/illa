'use client'

import { useEffect, useRef, useState } from 'react'

interface Manifest {
    frameCount: number
    frames: string[]
}

export function HeroScrollFrames() {
    const containerRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const [manifest, setManifest] = useState<Manifest | null>(null)
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const [images, setImages] = useState<HTMLImageElement[]>([])

    // 1. Detect device & Load Manifest
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.matchMedia('(max-width: 768px)').matches
            setIsMobile(mobile)
            loadManifest(mobile ? 'mobile' : 'desktop')
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const loadManifest = async (platform: 'mobile' | 'desktop') => {
        try {
            const res = await fetch(`/hero/manifest.${platform}.json`)
            if (!res.ok) throw new Error('Manifest not found')
            const data = await res.json()
            setManifest(data)
            // Reset for new platform
            setCurrentFrameIndex(0)
            setImages([])
        } catch (e) {
            console.error('Failed to load manifest:', e)
        }
    }

    // 2. Preload Images (Progressive)
    useEffect(() => {
        if (!manifest) return

        const preloadBatch = (startIndex: number, batchSize: number) => {
            const endIndex = Math.min(startIndex + batchSize, manifest.frames.length)
            for (let i = startIndex; i < endIndex; i++) {
                const img = new Image()
                img.src = manifest.frames[i]
                // Optional: img.decode() if supported for smoother painting
            }
        }

        // Load first few immediately
        preloadBatch(0, 10)

        // Then rest progressively
        let loadedCount = 10
        const interval = setInterval(() => {
            if (loadedCount >= manifest.frames.length) {
                clearInterval(interval)
                return
            }
            preloadBatch(loadedCount, 10)
            loadedCount += 10
        }, 500) // gentle batching

        return () => clearInterval(interval)
    }, [manifest])

    // 3. Scroll Listener (RAF)
    useEffect(() => {
        if (!manifest || !containerRef.current) return

        let rafId: number
        const section = containerRef.current

        const handleScroll = () => {
            const rect = section.getBoundingClientRect()

            // Calculate progress based on full section height relative to viewport
            // We want the scroll to "feel" like it's pinned until the end
            // Total Scrollable Distance = Section Height - Viewport Height
            const scrollDistance = section.offsetHeight - window.innerHeight
            const scrolled = rect.top * -1

            let progress = scrolled / scrollDistance
            progress = Math.max(0, Math.min(1, progress))

            const frameIndex = Math.round(progress * (manifest.frameCount - 1))

            if (imgRef.current && manifest.frames[frameIndex]) {
                imgRef.current.src = manifest.frames[frameIndex]
            }
        }

        const loop = () => {
            handleScroll()
            rafId = requestAnimationFrame(loop)
        }

        rafId = requestAnimationFrame(loop)

        return () => cancelAnimationFrame(rafId)
    }, [manifest])

    if (!manifest || manifest.frames.length === 0) {
        // Fallback or Loading State
        return null
    }

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            style={{ height: '350vh' }} // Increased height for longer scroll feel
        >
            <div
                className="sticky top-0 w-full h-[100vh] overflow-hidden"
            >
                <img
                    ref={imgRef}
                    src={manifest.frames[0]}
                    alt="Hero Sequence"
                    className="w-full h-full object-cover"
                />
            </div>
        </section>
    )
}
