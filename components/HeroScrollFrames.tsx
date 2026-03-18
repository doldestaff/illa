'use client'

import { useEffect, useState, useRef } from 'react'
import { HeroGhostButtons } from './HeroGhostButtons'
import { ScrollStimulants } from './ScrollStimulants'
import { useMotionValue } from 'framer-motion'
import { HeroEngine } from './hero/HeroEngine'

// PERF: Inline manifest data — eliminates 1 RTT fetch waterfall on first load
import mobileManifest from '@/public/hero/manifest.mobile.json'
import desktopManifest from '@/public/hero/manifest.desktop.json'

export function HeroScrollFrames() {
    // HYDRATION-SAFE: Initialize as null (matches SSR output), then set in useEffect.
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const [isTablet, setIsTablet] = useState<boolean | null>(null)

    // MOBILE FIX: Freeze viewport height in pixels by measuring a pure 100vh element.
    // This value NEVER changes when the URL bar collapses (unlike 100dvh or window.innerHeight).
    const [realVhPx, setRealVhPx] = useState<number>(0)
    const stickyRef = useRef<HTMLDivElement>(null)
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

            // Measure the actual layout size of the 100vh sticky container
            if (stickyRef.current) {
                setRealVhPx(stickyRef.current.clientHeight)
            }
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
                if (stickyRef.current) {
                    setRealVhPx(stickyRef.current.clientHeight)
                }
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
    const MOBILE_HEIGHT_vh = 140
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

    // Convert vh config to real layout pixels to ensure exactly proportional scroll depth
    const sectionStyle = realVhPx > 0 
        ? { height: `${realVhPx * (SCROLL_HEIGHT_vh / 100)}px` }
        : { height: `${SCROLL_HEIGHT_vh}vh` }

    return (
        <section
            className="relative w-full z-10 bg-[#111]"
            style={sectionStyle}
        >
            {/* Sticky container uses 100vh constant.
                On mobile, 100vh is statically resolved to the maximum viewport size (URL bar hidden).
                This ensures it NEVER resizes during scroll, completely eliminating image jumping, shifting, 
                and the recalculation of object-fit centers, while also leaving no black gaps! */}
            <div
                ref={stickyRef}
                className="sticky top-0 w-full overflow-hidden bg-[#111]"
                style={{ height: '100vh' }}
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
                    <ScrollStimulants progress={buttonProgress} isMobile={isMobile} isTablet={isTablet} />
                </div>
            </div>
        </section>
    )
}
