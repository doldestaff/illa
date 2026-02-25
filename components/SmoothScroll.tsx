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
        // 1. Force GSAP execution order
        gsap.ticker.remove(gsap.updateRoot)
        gsap.ticker.add((time) => {
            lenisRef.current?.lenis?.raf(time * 1000)
            gsap.updateRoot(time)
        })

        // PERF 2. Bind ScrollTrigger update to Lenis scroll
        // Defer GSAP heavy init by 1s (or idle) to unblock main thread hydration
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
                // Mobile: fully fluid momentum scroll (loose and cinematic)
                lerp: 0.08,
                duration: 1.2,
                smoothWheel: true,
                touchMultiplier: 1.2, // Slightly higher implies more slide per swipe
                syncTouch: true, // CRITICAL: MUST be true to prevent native scroll from fighting Lenis virtual scroll
            } : {
                // Desktop: full cinematic smooth
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
