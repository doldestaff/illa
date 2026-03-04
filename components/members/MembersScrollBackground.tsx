'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * MembersScrollBackground — Ultra-lightweight background for the Members Dashboard.
 *
 * RATIONALE: The previous implementations (HeroEngine canvas or JS-based parallax)
 * caused scroll stutter on mobile because any main-thread scroll listener competes
 * with React's complex UI updates in the dashboard.
 *
 * This version uses a pure `position: fixed` image with `object-cover`.
 * By removing the JS scroll listener entirely, the background remains static relative
 * to the viewport while the content scrolls over it, handled 100% by the browser's
 * compositor thread for guaranteed 60fps scrolling performance.
 */

const POSTER_MOBILE = '/members-bg/IllaMembers-mobile_001.webp'

export default function MembersScrollBackground() {
    const [isMobile, setIsMobile] = useState(false)
    const { scrollY } = useScroll()

    // 0px (topo) → Escuro para legibilidade
    // FIM da página → 0.2 (20% opacidade)
    const overlayOpacity = useTransform(scrollY, [0, 800], [0.95, 0.2])

    // A imagem também respira junto
    const imageOpacity = useTransform(scrollY, [0, 800], [0.4, 0.8])

    // Detect mobile once on mount
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    if (!isMobile) return null

    return (
        <div className="fixed inset-0 w-full h-[100vh] min-h-[100dvh] pointer-events-none z-[-1] overflow-hidden bg-black">
            {/* Background Image - Now static for consistent premium depth */}
            <div
                className="absolute inset-0 w-full h-full overflow-hidden opacity-40"
            >
                <Image
                    src={POSTER_MOBILE}
                    alt="Background"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                    quality={90}
                />
            </div>

            {/* Vitral Estático: Gradiente tri-fásico (66% -> 50% -> 66%) */}
            <div
                className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/66 via-black/50 to-black/66"
            />
        </div>
    )
}
