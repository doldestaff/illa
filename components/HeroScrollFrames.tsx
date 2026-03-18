'use client'

import { useEffect, useState, useRef } from 'react'
import { HeroGhostButtons } from './HeroGhostButtons'
import { ScrollStimulants } from './ScrollStimulants'
import { useMotionValue, animate } from 'framer-motion'
import { useLenis } from 'lenis/react'
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

    // Cinematic Trap State (Mobile/Tablet)
    const [trapState, setTrapState] = useState<'IDLE' | 'PLAYING' | 'COMPLETED' | 'RELEASED' | 'PLAYING_REVERSE'>('RELEASED')
    const mobileProgress = useMotionValue(0)
    const touchStart = useRef(0)
    const lenis = useLenis()

    // Stable Refs
    const buttonProgress = useMotionValue(0)

    // On mount: set initial values + listen for resize (breakpoints only)
    useEffect(() => {
        const w = window.innerWidth
        const h = window.innerHeight

        requestAnimationFrame(() => {
            const mobile = w < 768
            const tablet = w >= 768 && w < 1024
            setIsMobile(mobile)
            setIsTablet(tablet)
            if (mobile || tablet) setTrapState('IDLE')

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

    // Scroll Lock for Cinematic Trap
    useEffect(() => {
        if ((isMobile || isTablet) && trapState !== 'RELEASED' && trapState !== 'COMPLETED') {
            document.body.style.overflow = 'hidden'
            return () => { document.body.style.overflow = '' }
        }
    }, [isMobile, isTablet, trapState])

    // Handle Native Scroll Releases and Re-engagements
    useEffect(() => {
        if (!(isMobile || isTablet)) return

        const handleNativeScroll = () => {
            if (trapState === 'RELEASED' && window.scrollY <= 0) {
                setTrapState('COMPLETED')
            } else if (trapState === 'COMPLETED' && window.scrollY > 0) {
                setTrapState('RELEASED')
            }
        }

        if (trapState === 'RELEASED' || trapState === 'COMPLETED') {
            window.addEventListener('scroll', handleNativeScroll, { passive: true })
            handleNativeScroll() // Check instantly
            return () => window.removeEventListener('scroll', handleNativeScroll)
        }
    }, [isMobile, isTablet, trapState])

    const handleTrapInteraction = (deltaY: number) => {
        if (deltaY > 20) {
            if (trapState === 'IDLE') {
                setTrapState('PLAYING')
                animate(mobileProgress, 1, {
                    duration: 2.96, // Exactly 71 frames at 24fps
                    ease: 'linear',
                    onComplete: () => setTrapState('COMPLETED')
                })
            } else if (trapState === 'COMPLETED') {
                setTrapState('RELEASED')
            }
        } else if (deltaY < -20) {
            // Sweeping DOWN physically (intent to scroll UP)
            if (trapState === 'COMPLETED') {
                setTrapState('PLAYING_REVERSE')
                animate(mobileProgress, 0, {
                    duration: 2.96,
                    ease: 'linear',
                    onComplete: () => setTrapState('IDLE')
                })
            }
        }
    }

    // --- Render ---
    // Config
    // Mobile cinematic trap fixes the section to exactly 100vh.
    const MOBILE_HEIGHT_vh = 100
    const TABLET_HEIGHT_vh = 100
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
    const isLocked = trapState === 'IDLE' || trapState === 'PLAYING' || trapState === 'PLAYING_REVERSE'

    // We use pan-up when completed at the top to allow the user to easily swipe down to section 2,
    // but block the upward scroll (swipe down) so we can catch it with JS for reverse playtime without rubber-banding.
    const touchActionStyle = isLocked ? 'none' : (trapState === 'COMPLETED' && typeof window !== 'undefined' && window.scrollY <= 0 ? 'pan-up' : 'auto')

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
                className="sticky top-0 w-full overflow-hidden bg-[#111] z-10"
                style={{ height: '100vh', touchAction: touchActionStyle }}
                onWheel={(e) => {
                    if (isLocked) {
                        e.preventDefault()
                        handleTrapInteraction(e.deltaY)
                    } else if (trapState === 'COMPLETED' && typeof window !== 'undefined' && window.scrollY <= 0) {
                        if (e.deltaY < 0) {
                            e.preventDefault()
                            handleTrapInteraction(e.deltaY)
                        } else if (e.deltaY > 0) {
                            e.preventDefault()
                            if (lenis) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ;(lenis as any).scrollTo(window.innerHeight, { duration: 1.5, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
                            } else {
                                window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
                            }
                        }
                    }
                }}
                onTouchStart={(e) => {
                    touchStart.current = e.touches[0].clientY
                }}
                onTouchMove={(e) => {
                    // Handled inherently by touchActionStyle
                }}
                onTouchEnd={(e) => {
                    const deltaY = touchStart.current - e.changedTouches[0].clientY
                    if (isLocked) {
                        handleTrapInteraction(deltaY)
                    } else if (trapState === 'COMPLETED' && typeof window !== 'undefined' && window.scrollY <= 0) {
                        if (deltaY < -20) {
                            handleTrapInteraction(deltaY)
                        } else if (deltaY > 20) {
                            if (lenis) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ;(lenis as any).scrollTo(window.innerHeight, { duration: 1.5, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
                            } else {
                                window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
                            }
                        }
                    }
                }}
            >

                {/* Unified Engine — inline manifest eliminates fetch waterfall */}
                <HeroEngine
                    inlineManifest={manifest}
                    posterUrl={`/hero/${useMobileFrames ? 'mobile' : 'desktop'}/frames/hero-1-${useMobileFrames ? 'mobile' : 'desktop'}_${useMobileFrames ? '004' : '002'}.webp`}
                    scrollMode="viewport"
                    scrollSectionHeightVh={SCROLL_HEIGHT_vh}
                    onProgress={handleProgress}
                    // Pass mobileProgress to decouple from native scroll and drive by Framer Motion at 24fps
                    progressValue={useMobileFrames ? mobileProgress : undefined}
                    startIndex={0}
                    debug={typeof window !== 'undefined' && window.location.search.includes('debugHero')}
                    className="z-10"
                    endBuffer={1.0}
                />

                <div className="absolute inset-0 pointer-events-none z-20">
                    <HeroGhostButtons progress={buttonProgress} isMobile={isMobile} isTablet={isTablet} />
                    <ScrollStimulants 
                        progress={buttonProgress} 
                        isMobile={isMobile} 
                        isTablet={isTablet} 
                        isReleased={trapState === 'RELEASED'} 
                    />
                </div>
            </div>
        </section>
    )
}
