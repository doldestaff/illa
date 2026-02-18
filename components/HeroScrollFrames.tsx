'use client'

import { useEffect, useState, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { HeroGhostButtons } from './HeroGhostButtons'
import { useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ScrollFrameCanvasEngine } from './hero/ScrollFrameCanvasEngine'

// --- Types ---
interface Manifest {
    frameCount: number
    frames: string[]
}

export function HeroScrollFrames() {
    // Mount state
    const [isMounted, setIsMounted] = useState(false)
    const [manifest, setManifest] = useState<Manifest | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    // Stable Refs
    const buttonProgress = useMotionValue(0)

    // Config
    const MOBILE_HEIGHT_vh = 350
    const DESKTOP_HEIGHT_vh = 500
    const SCROLL_HEIGHT_vh = isMobile ? MOBILE_HEIGHT_vh : DESKTOP_HEIGHT_vh

    // Derived pixels for engine (approximate until mount, but engine handles dynamic resize)
    // We pass the "total scrollable height" expected by the engine to map 0..1
    // The engine expects pixel value. We can estimate or use window.innerHeight
    // Better to let engine handle it or pass a simplified "scrollLength" scalar?
    // Engine v2 has `scrollContainerHeight`.
    const [containerHeightPx, setContainerHeightPx] = useState(0)


    // --- Setup & Load ---
    useEffect(() => {
        setIsMounted(true)
        const mobile = window.matchMedia('(max-width: 768px)').matches
        setIsMobile(mobile)

        const updateHeight = () => {
            const h = window.innerHeight
            const vh = mobile ? MOBILE_HEIGHT_vh : DESKTOP_HEIGHT_vh
            setContainerHeightPx(h * (vh / 100))
        }
        updateHeight()
        window.addEventListener('resize', updateHeight)

        const loadManifest = async () => {
            const platform = mobile ? 'mobile' : 'desktop'
            try {
                const url = `/hero/manifest.${platform}.json`
                const res = await fetch(url)
                if (!res.ok) throw new Error(`Manifest 404`)
                const data = await res.json()
                setManifest(data)
            } catch (e: any) {
                console.error('Hero Load Error:', e)
                setError(e.message)
            }
        }
        loadManifest()

        return () => window.removeEventListener('resize', updateHeight)
    }, [])

    const handleFrameChange = (index: number, progress: number) => {
        // Ghost Button Logic (Frame 10 to 60)
        // We might need to map this based on exact frame counts from manifest
        // But 10-60 is the "safe zone" logic from before.
        const startFrame = 10
        const endFrame = 60
        let btnProg = 0
        if (index >= startFrame) {
            btnProg = Math.min(1, Math.max(0, (index - startFrame) / (endFrame - startFrame)))
        }
        buttonProgress.set(btnProg)
    }

    // --- Render ---
    if (!isMounted) return <div className="h-screen w-full bg-illa-pink" />

    if (error) {
        return (
            <div className="h-screen w-full bg-red-900 text-white flex flex-col items-center justify-center p-4">
                <AlertTriangle size={48} className="mb-4" />
                <p className="opacity-80 font-mono text-xs">{error}</p>
            </div>
        )
    }

    return (
        <section
            className="relative w-full z-10"
            style={{ height: `${SCROLL_HEIGHT_vh}vh` }}
        >
            <div className="sticky top-0 w-full h-[100dvh] overflow-hidden bg-illa-pink">

                {manifest ? (
                    <ScrollFrameCanvasEngine
                        frameCount={manifest.frameCount}
                        getFrameUrl={(i) => manifest.frames[i]}
                        posterUrl={manifest.frames[isMobile ? 4 : 2] || ''} // Fallback to start frame
                        scrollContainerHeight={containerHeightPx}
                        priorityFrames={[0, 1, 2, 3, 4]}
                        onFrameChange={handleFrameChange}
                        debug={typeof window !== 'undefined' && window.location.search.includes('debugHero')}
                    />
                ) : (
                    // Initial loader state
                    <div className="absolute inset-0 bg-illa-pink" />
                )}

                <div className="absolute inset-0 pointer-events-none z-20">
                    <HeroGhostButtons progress={buttonProgress} isMobile={isMobile} />
                </div>
            </div>
        </section>
    )
}

