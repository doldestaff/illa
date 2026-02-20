'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { HeroGhostButtons } from './HeroGhostButtons'
import { useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'
import { HeroEngine } from './hero/HeroEngine'

export function HeroScrollFrames() {
    // Mount state
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Stable Refs
    const buttonProgress = useMotionValue(0)

    // --- Setup & Load ---
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.matchMedia('(max-width: 768px)').matches
            setIsMobile(mobile)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleProgress = (progress: number) => {
        // Ghost Button progress is now fully handled in the child component using the global 0..1 scroll value
        buttonProgress.set(progress)
    }

    // --- Render ---
    if (isMobile === null) return (
        <div className="h-[100dvh] w-full bg-[#111] relative overflow-hidden">
            {/* SSR skeleton fallback to prevent pink flash */}
            <img
                src="/hero/mobile/frames/hero-1-mobile_002.webp"
                className="absolute inset-0 w-full h-full object-cover md:hidden"
                alt="Illa Loading"
            />
            <img
                src="/hero/desktop/frames/hero-1-desktop_002.webp"
                className="absolute inset-0 w-full h-full object-cover hidden md:block"
                alt="Illa Loading"
            />
        </div>
    )

    // Config
    const MOBILE_HEIGHT_vh = 350
    const DESKTOP_HEIGHT_vh = 500
    const SCROLL_HEIGHT_vh = isMobile ? MOBILE_HEIGHT_vh : DESKTOP_HEIGHT_vh





    // ...

    return (
        <section
            className="relative w-full z-10"
            style={{ height: `${SCROLL_HEIGHT_vh}vh` }}
        >
            <div className="sticky top-0 w-full h-[100dvh] overflow-hidden bg-[#111]">

                {/* New Unified Engine */}
                <HeroEngine
                    manifestUrl={`/hero/manifest.${isMobile ? 'mobile' : 'desktop'}.json`}
                    posterUrl={`/hero/${isMobile ? 'mobile' : 'desktop'}/frames/hero-1-${isMobile ? 'mobile' : 'desktop'}_002.webp`}
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

