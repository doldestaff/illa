'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { ReactLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function SmoothScroll({ children }: { children: ReactNode }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lenisRef = useRef<any>(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)')
        setTimeout(() => setIsMobile(mq.matches), 0)
        const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])

    useEffect(() => {
        // ALWAYS run GSAP ticker + Lenis RAF pump, even on mobile.
        // With lerp:1 on mobile, the pump is virtually free (no interpolation math),
        // but it's REQUIRED for useLenis() callbacks to fire across all components.
        gsap.ticker.remove(gsap.updateRoot)
        gsap.ticker.add((time) => {
            lenisRef.current?.lenis?.raf(time * 1000)
            gsap.updateRoot(time)
        })

        let initTimer: ReturnType<typeof setTimeout>
        const lenis = lenisRef.current?.lenis

        if (lenis) {
            initTimer = setTimeout(() => {
                ScrollTrigger.refresh()
                lenis.on('scroll', ScrollTrigger.update)
            }, 1000)
        }

        return () => {
            gsap.ticker.remove(gsap.updateRoot)
            clearTimeout(initTimer)
            if (lenis) {
                lenis.off('scroll', ScrollTrigger.update)
            }
        }
    }, [])

    return (
        <ReactLenis
            ref={lenisRef}
            root
            options={isMobile ? {
                // MOBILE: Lenis is 100% PASSIVE — zero smoothing, zero interception.
                // It stays mounted only as a scroll event bus so useLenis() hooks
                // in Section 2 (PinnedButtonsParallax) still fire their callbacks.
                lerp: 1,             // Instant — no position interpolation
                smoothWheel: false,  // Don't intercept wheel events
                syncTouch: false,    // Don't intercept touch events
                // No duration — native scroll physics handle everything
            } : {
                // Desktop: full cinematic smooth scroll
                lerp: 0.1,
                duration: 1.5,
                smoothWheel: true,
                touchMultiplier: 2,
                syncTouch: false,
            }}
        >
            {children}
        </ReactLenis>
    )
}

