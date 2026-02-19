'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { HeroGhostButtons } from './HeroGhostButtons'
import { useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'
import { HeroEngine } from './hero/HeroEngine'

export function HeroScrollFrames() {
    // Mount state
    const [isMounted, setIsMounted] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Stable Refs
    const buttonProgress = useMotionValue(0)

    // Config
    const MOBILE_HEIGHT_vh = 350
    const DESKTOP_HEIGHT_vh = 500
    const SCROLL_HEIGHT_vh = isMobile ? MOBILE_HEIGHT_vh : DESKTOP_HEIGHT_vh

    // --- Setup & Load ---
    useEffect(() => {
        setIsMounted(true)
        const checkMobile = () => {
            const mobile = window.matchMedia('(max-width: 768px)').matches
            setIsMobile(mobile)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleProgress = (progress: number) => {
        // Ghost Button Logic (Visible roughly from 15% to 80% of scroll)
        // Map 0.15 -> 0, 0.8 -> 1
        const start = 0.15
        const end = 0.8
        const p = Math.max(0, Math.min(1, (progress - start) / (end - start)))
        buttonProgress.set(p)
    }

    // --- Render ---
    if (!isMounted) return <div className="h-screen w-full bg-illa-pink" />





    // ...

    return (
        <section
            className="relative w-full z-10"
            style={{ height: `${SCROLL_HEIGHT_vh}vh` }}
        >
            <div className="sticky top-0 w-full h-[100dvh] overflow-hidden bg-illa-pink">

                {/* New Unified Engine */}
                <HeroEngine
                    manifestUrl={`/hero/manifest.${isMobile ? 'mobile' : 'desktop'}.json`}
                    posterUrl={`/hero/${isMobile ? 'mobile' : 'desktop'}/frames/hero-1-${isMobile ? 'mobile' : 'desktop'}_000.webp`} // Corrected path from manifest
                    scrollMode="viewport"
                    scrollSectionHeightVh={SCROLL_HEIGHT_vh}
                    onProgress={handleProgress}
                    debug={typeof window !== 'undefined' && window.location.search.includes('debugHero')}
                    className="z-10"
                />

                <div className="absolute inset-0 pointer-events-none z-20">
                    <HeroGhostButtons progress={buttonProgress} isMobile={isMobile} />
                </div>
            </div>
        </section>
    )
}

