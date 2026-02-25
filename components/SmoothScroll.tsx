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
        // PERF: On mobile, skip the GSAP ticker RAF pump entirely.
        // Lenis is passive on mobile (no smoothing), so pumping its RAF
        // every frame wastes CPU and can cause micro-jank.
        if (isMobile) {
            // Just bind ScrollTrigger to native scroll
            let initTimer: ReturnType<typeof setTimeout>
            const lenis = lenisRef.current?.lenis
            if (lenis) {
                initTimer = setTimeout(() => {
                    ScrollTrigger.refresh()
                    lenis.on('scroll', ScrollTrigger.update)
                }, 1000)
            }
            return () => {
                clearTimeout(initTimer!)
                if (lenis) lenis.off('scroll', ScrollTrigger.update)
            }
        }

        // Desktop: Full GSAP + Lenis integration
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
    }, [isMobile])

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

