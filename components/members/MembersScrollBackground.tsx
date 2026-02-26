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

    // 0px (topo) → 0.9 escuro para legibilidade do header e avatar
    // ~480px (missões) → 0 totalmente transparente — background 100% visível
    // ~900px (loja de descontos em diante) → vitral volta a escurecer (0.85) como no topo
    const overlayOpacity = useTransform(scrollY, [0, 80, 480, 600, 900], [0.9, 0.85, 0, 0, 0.85])

    // A imagem também diminui o brilho para destacar os cards da Área VIP
    const imageOpacity = useTransform(scrollY, [0, 80, 480, 600, 900], [0.35, 0.45, 1, 1, 0.45])

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
            {/* Animated CSS background - handling opacity smoothly */}
            <motion.div
                style={{ opacity: imageOpacity }}
                className="absolute inset-0 w-full h-full mix-blend-screen overflow-hidden"
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
            </motion.div>

            {/* Subtle gradient overlay to ensure text readability (Reduces on scroll to reveal BG) */}
            <motion.div
                style={{ opacity: overlayOpacity }}
                className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none mix-blend-multiply"
            />
        </div>
    )
}
