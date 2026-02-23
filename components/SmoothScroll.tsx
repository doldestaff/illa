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

        // 2. Bind ScrollTrigger update to Lenis scroll
        const lenis = lenisRef.current?.lenis
        if (lenis) {
            ScrollTrigger.refresh()
            lenis.on('scroll', ScrollTrigger.update)
        }

        return () => {
            gsap.ticker.remove(gsap.updateRoot)
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
                // Mobile: snappy response, syncTouch needed because Lenis root mode hides native overflow
                lerp: 0.2,
                duration: 0.8,
                smoothWheel: true,
                touchMultiplier: 1.8,
                syncTouch: true,
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
