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
            console.log('Detect Device:', mobile ? 'Mobile' : 'Desktop')
            loadManifest(mobile ? 'mobile' : 'desktop')
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const loadManifest = async (platform: 'mobile' | 'desktop') => {
        try {
            const url = `/hero/manifest.${platform}.json`
            console.log('Loading manifest:', url)
            const res = await fetch(url)
            if (!res.ok) throw new Error(`Manifest not found at ${url}`)
            const data = await res.json()
            console.log('Manifest loaded:', data.frameCount, 'frames')
            setManifest(data)
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
            }
        }

        preloadBatch(0, 10)

        let loadedCount = 10
        const interval = setInterval(() => {
            if (loadedCount >= manifest.frames.length) {
                clearInterval(interval)
                return
            }
            preloadBatch(loadedCount, 10)
            loadedCount += 10
        }, 500)

        return () => clearInterval(interval)
    }, [manifest])

    // 3. Scroll Listener (RAF)
    useEffect(() => {
        if (!manifest || !containerRef.current) return

        let rafId: number
        const section = containerRef.current

        const handleScroll = () => {
            const rect = section.getBoundingClientRect()

            // Console log to debug scroll
            // console.log('Scroll Top:', rect.top)

            const scrollDistance = section.offsetHeight - window.innerHeight
            const scrolled = rect.top * -1

            let progress = scrolled / scrollDistance
            progress = Math.max(0, Math.min(1, progress))

            const frameIndex = Math.round(progress * (manifest.frameCount - 1))

            if (imgRef.current && manifest.frames[frameIndex]) {
                if (!imgRef.current.src.endsWith(manifest.frames[frameIndex])) {
                    imgRef.current.src = manifest.frames[frameIndex]
                }
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
        return <div className="h-screen w-full bg-black" />
    }

    return (
        <section
            ref={containerRef}
            className="relative w-full z-10"
            style={{ height: '500vh' }}
        >
            <div
                className="sticky top-0 w-full h-[100vh] overflow-hidden bg-black"
            >
                <img
                    ref={imgRef}
                    src={manifest.frames[0]}
                    alt="Hero Sequence"
                    className="w-full h-full object-cover object-top"
                    loading="eager"
                />
            </div>
        </section>
    )
}
