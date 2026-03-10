'use client'

import { useEffect, useState } from 'react'
import { HeroGhostButtons } from './HeroGhostButtons'
import { useMotionValue } from 'framer-motion'
import { HeroEngine } from './hero/HeroEngine'

// PERF: Inline manifest data — eliminates 1 RTT fetch waterfall on first load
import mobileManifest from '@/public/hero/manifest.mobile.json'
import desktopManifest from '@/public/hero/manifest.desktop.json'

export function HeroScrollFrames() {
    // Mount state
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const [isTablet, setIsTablet] = useState<boolean | null>(null)
    const [viewportHeight, setViewportHeight] = useState<number | null>(null)

    // Stable Refs
    const buttonProgress = useMotionValue(0)

    // --- Setup & Load ---
    useEffect(() => {
        const checkMobile = () => {
            const w = window.innerWidth
            // Use innerHeight instead of visualViewport to prevent keyboard from shrinking it
            const h = window.innerHeight
            setIsMobile(w < 768)
            setIsTablet(w >= 768 && w < 1024)
            setViewportHeight(h)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleProgress = (progress: number) => {
        buttonProgress.set(progress)
    }

    // --- Render ---
    // Config
    const MOBILE_HEIGHT_vh = 350
    const TABLET_HEIGHT_vh = 400
    const DESKTOP_HEIGHT_vh = 500

    if (isMobile === null || isTablet === null) return (
        <section
            className="relative w-full z-10"
            style={{ height: `${MOBILE_HEIGHT_vh}vh` }}
        >
            <div
                className="sticky top-0 w-full overflow-hidden bg-[#111]"
                style={{ height: viewportHeight ? `${viewportHeight}px` : '100svh' }}
            >
                {/* SSR skeleton — high priority poster to prevent flash, but SYNCHRONOUS decoding so iOS doesn't panic on hydration switch */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/hero/mobile/frames/hero-1-mobile_004.webp"
                    className="absolute inset-0 w-full h-full object-cover lg:hidden"
                    alt="Illa Loading"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/hero/desktop/frames/hero-1-desktop_002.webp"
                    className="absolute inset-0 w-full h-full object-cover hidden lg:block"
                    alt="Illa Loading"
                />
            </div>
        </section>
    )

    const SCROLL_HEIGHT_vh = isMobile ? MOBILE_HEIGHT_vh : isTablet ? TABLET_HEIGHT_vh : DESKTOP_HEIGHT_vh

    // Use mobile frames for tablets too, because portrait iPad aspect ratio works better with mobile frames
    const useMobileFrames = isMobile || isTablet
    const manifest = useMobileFrames ? mobileManifest : desktopManifest

    return (
        <section
            className="relative w-full z-10"
            style={{ height: `${SCROLL_HEIGHT_vh}vh` }}
        >
            {/* We anchor the sticky container using exact JS pixel height.
                If we use svh, dvh, or flex units, iOS/Android browser URL bar retraction
                will physically stretch the container and pull the canvas up/down during
                a scroll animation. Anchoring it to `innerHeight` prevents all jumping. */}
            <div
                className="sticky top-0 w-full overflow-hidden bg-[#111]"
                style={{ height: viewportHeight ? `${viewportHeight}px` : '100svh' }}
            >

                {/* Unified Engine — inline manifest eliminates fetch waterfall */}
                <HeroEngine
                    inlineManifest={manifest}
                    posterUrl={`/hero/${useMobileFrames ? 'mobile' : 'desktop'}/frames/hero-1-${useMobileFrames ? 'mobile' : 'desktop'}_${useMobileFrames ? '004' : '002'}.webp`}
                    scrollMode="viewport"
                    scrollSectionHeightVh={SCROLL_HEIGHT_vh}
                    onProgress={handleProgress}
                    startIndex={0}
                    debug={typeof window !== 'undefined' && window.location.search.includes('debugHero')}
                    className="z-10"
                />

                <div className="absolute inset-0 pointer-events-none z-20">
                    <HeroGhostButtons progress={buttonProgress} isMobile={isMobile} isTablet={isTablet} />
                </div>
            </div>
        </section>
    )
}
