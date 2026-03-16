'use client'

import { useEffect, useState, useRef } from 'react'
import { HeroGhostButtons } from './HeroGhostButtons'
import { useMotionValue } from 'framer-motion'
import { HeroEngine } from './hero/HeroEngine'

// PERF: Inline manifest data — eliminates 1 RTT fetch waterfall on first load
import mobileManifest from '@/public/hero/manifest.mobile.json'
import desktopManifest from '@/public/hero/manifest.desktop.json'

export function HeroScrollFrames() {
    // HYDRATION-SAFE: Initialize as null (matches SSR output), then set in useEffect.
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const [isTablet, setIsTablet] = useState<boolean | null>(null)

    // MOBILE FIX: Freeze viewport height in pixels at mount time.
    // This state NEVER changes when only height changes (URL bar collapse).
    // Only updates on real width changes (rotation/resize).
    const [frozenVhState, setFrozenVhState] = useState<number>(0)
    const prevWidthRef = useRef<number>(0)
    // Force a single re-render after mount to apply frozen height
    const [mountReady, setMountReady] = useState(false)

    // Stable Refs
    const buttonProgress = useMotionValue(0)

    // On mount: set initial values + listen for resize (breakpoints only)
    useEffect(() => {
        const w = window.innerWidth
        const h = window.innerHeight

        requestAnimationFrame(() => {
            setIsMobile(w < 768)
            setIsTablet(w >= 768 && w < 1024)

            // Freeze the viewport height in pixels
            setFrozenVhState(h)
            prevWidthRef.current = w
            setMountReady(true)
        })

        const handleResize = () => {
            const rw = window.innerWidth
            const rh = window.innerHeight
            setIsMobile(rw < 768)
            setIsTablet(rw >= 768 && rw < 1024)

            // CRITICAL: Only update frozen height if WIDTH actually changed
            // (real rotation/resize). Height-only changes = URL bar collapse → ignore.
            if (Math.abs(rw - prevWidthRef.current) > 1) {
                setFrozenVhState(rh)
                prevWidthRef.current = rw
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleProgress = (progress: number) => {
        buttonProgress.set(progress)
    }

    // --- Render ---
    // Config
    const MOBILE_HEIGHT_vh = 350
    const TABLET_HEIGHT_vh = 400
    const DESKTOP_HEIGHT_vh = 500

    if (isMobile === null || isTablet === null || !mountReady) return (
        <section
            className="relative w-full z-10 bg-[#111]"
            style={{ height: `${MOBILE_HEIGHT_vh}vh` }}
        >
            <div
                className="sticky top-0 w-full overflow-hidden bg-[#111]"
                style={{ height: '100vh' }}
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

    // Convert vh config to frozen pixels using the mount-time viewport height
    const sectionHeightPx = frozenVhState * (SCROLL_HEIGHT_vh / 100)

    return (
        <section
            className="relative w-full z-10 bg-[#111]"
            style={{ height: `${sectionHeightPx}px` }}
        >
            {/* Sticky container uses 100svh with 100dvh fallback.
                This ensures it fills the viewport when the URL bar collapses (preventing gaps).
                The inner canvas will use object-fit: cover to stretch without distorting. */}
            <div
                className="sticky top-0 w-full overflow-hidden bg-[#111]"
                style={{ height: '100svh', minHeight: '100dvh' }}
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
