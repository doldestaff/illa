'use client'

import { useRef, useEffect, useState } from 'react'

/**
 * MembersScrollBackground — Lightweight parallax background for the Members Dashboard.
 *
 * RATIONALE: The previous implementation used the full HeroEngine (canvas-based 82-frame
 * sequence player with LRU cache, fetch+decode pipeline, and lerp loop). This was massive
 * overkill for a subtle 30% opacity decorative background and caused severe scroll stutter
 * on mobile by competing for CPU/GPU/network with the interactive dashboard content.
 *
 * This replacement uses a single preloaded poster image with a GPU-accelerated CSS
 * transform-based parallax effect. Zero canvas, zero per-frame fetch, zero lerp loop.
 * The scroll listener uses requestAnimationFrame throttling and only writes a single
 * CSS custom property, keeping the main thread completely free.
 */

const POSTER_MOBILE = '/members-bg/IllaMembers-mobile_001.webp'
const POSTER_DESKTOP = '/members-bg/IllaMembers-mobile_041.webp' // Mid-frame for desktop

export default function MembersScrollBackground() {
    const [isMobile, setIsMobile] = useState(false)
    const bgRef = useRef<HTMLDivElement>(null)

    // Detect mobile once on mount
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Lightweight scroll-driven parallax using CSS custom property
    useEffect(() => {
        if (!isMobile) return

        let ticking = false
        const el = bgRef.current

        const onScroll = () => {
            if (ticking || !el) return
            ticking = true
            requestAnimationFrame(() => {
                const scrollY = window.scrollY
                const docH = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight
                )
                const viewH = window.innerHeight
                const maxScroll = docH - viewH
                // Parallax: move the background 20% of viewport height over the full scroll
                const progress = maxScroll > 0 ? Math.min(1, scrollY / maxScroll) : 0
                const shift = progress * viewH * 0.2
                el.style.transform = `translate3d(0, ${-shift}px, 0)`
                ticking = false
            })
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        // Initial position
        onScroll()

        return () => window.removeEventListener('scroll', onScroll)
    }, [isMobile])

    if (!isMobile) return null

    return (
        <div
            ref={bgRef}
            className="fixed inset-0 w-full h-[120vh] pointer-events-none z-[-1] md:hidden will-change-transform"
        >
            {/* Single preloaded image — no canvas, no frame decoding */}
            <img
                src={POSTER_MOBILE}
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
                style={{
                    imageRendering: 'auto',
                }}
            />
            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
        </div>
    )
}
