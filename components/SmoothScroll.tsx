'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { ReactLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function SmoothScroll({ children }: { children: ReactNode }) {
    const lenisRef = useRef<any>(null)

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
            options={{
                lerp: 0.1,
                duration: 1.5,
                smoothWheel: true,
                touchMultiplier: 2,
                syncTouch: true, // Critical for mobile
            }}
        >
            {children}
        </ReactLenis>
    )
}
