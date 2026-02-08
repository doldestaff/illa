'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { ReactLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function SmoothScroll({ children }: { children: ReactNode }) {
    const lenisRef = useRef<any>(null)

    useEffect(() => {
        function update(time: number) {
            lenisRef.current?.lenis?.raf(time * 1000)
        }

        // Bind GSAP Ticker to Lenis
        gsap.ticker.add(update)

        // Disable GSAP lag smoothing for better sync
        gsap.ticker.lagSmoothing(0)

        return () => {
            gsap.ticker.remove(update)
        }
    }, [])

    return (
        <ReactLenis
            ref={lenisRef}
            root
            options={{
                lerp: 0.1,
                duration: 1.5,
                smoothWheel: true,
                touchMultiplier: 2,
            }}
        >
            {children}
        </ReactLenis>
    )
}
