'use client'

import { useEffect, useState } from 'react'
import { HeroGhostButtons } from './HeroGhostButtons'
import { useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'
import { HeroEngine } from './hero/HeroEngine'

// PERF: Inline manifest data — eliminates 1 RTT fetch waterfall on first load
import mobileManifest from '@/public/hero/manifest.mobile.json'
import desktopManifest from '@/public/hero/manifest.desktop.json'

export function HeroScrollFrames() {
    // Mount state
    const [isMobile, setIsMobile] = useState<boolean | null>(null)

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
        buttonProgress.set(progress)
    }

    // --- Render ---
    if (isMobile === null) return (
        <div className="h-[100svh] w-full bg-[#111] relative overflow-hidden">
            {/* SSR skeleton — high priority poster to prevent flash */}
            <img
                src="/hero/mobile/frames/hero-1-mobile_002.webp"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover md:hidden"
                alt="Illa Loading"
            />
            <img
                src="/hero/desktop/frames/hero-1-desktop_002.webp"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover hidden md:block"
                alt="Illa Loading"
            />
        </div>
    )

    // Config
    const MOBILE_HEIGHT_vh = 350
    const DESKTOP_HEIGHT_vh = 500
    const SCROLL_HEIGHT_vh = isMobile ? MOBILE_HEIGHT_vh : DESKTOP_HEIGHT_vh

    const manifest = isMobile ? mobileManifest : desktopManifest

    return (
        <section
            className="relative w-full z-10"
            style={{ height: `${SCROLL_HEIGHT_vh}svh` }}
        >
            <div className="sticky top-0 w-full h-[100svh] overflow-hidden bg-[#111]">

                {/* Unified Engine — inline manifest eliminates fetch waterfall */}
                <HeroEngine
                    inlineManifest={manifest}
                    posterUrl={`/hero/${isMobile ? 'mobile' : 'desktop'}/frames/hero-1-${isMobile ? 'mobile' : 'desktop'}_002.webp`}
                    scrollMode="viewport"
                    scrollSectionHeightVh={SCROLL_HEIGHT_vh}
                    onProgress={handleProgress}
                    startIndex={2}
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
