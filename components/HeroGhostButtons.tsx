'use client'

import { motion, AnimatePresence, useTransform, MotionValue } from 'framer-motion'
import { MessageCircle, MapPin, Info, Phone, ShoppingBag, Store } from 'lucide-react'

interface HeroGhostButtonsProps {
    progress: MotionValue<number>
    isMobile: boolean
}

const buttons = [
    { label: 'PEDIR NO WHATSAPP', icon: MessageCircle, link: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%AA%21+Vim+do+site+da+Illa%21' },
    { label: 'IFOOD', icon: ShoppingBag, link: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04' },
    { label: 'LOCALIZAÇÃO', icon: MapPin, link: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8' },
    { label: 'FRANQUIAS', icon: Store, link: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias' },
]

function DesktopGhostButton({ btn, i, total, progress }: { btn: (typeof buttons)[0], i: number, total: number, progress: MotionValue<number> }) {
    const step = 1 / total
    const start = step * i

    const opacity = useTransform(progress, [start, start + 0.1], [0, 1])
    const x = useTransform(progress, [start, start + 0.1], [50, 0])
    const scale = useTransform(progress, [start, start + 0.1], [0.8, 1])
    const display = useTransform(progress, p => p >= start ? 'flex' : 'none')

    const isAction = btn.label === 'QUEM SOMOS' || btn.label === 'CONTATO'

    return (
        <motion.a
            href={btn.link}
            target={isAction ? undefined : "_blank"}
            rel={isAction ? undefined : "noreferrer"}
            onClick={(e) => {
                if (btn.label === 'QUEM SOMOS') {
                    e.preventDefault()
                    window.dispatchEvent(new CustomEvent('open-about-modal'))
                }
            }}
            style={{ opacity, x, scale, display }}
            className="
                flex items-center gap-3 
                px-6 py-2.5 
                bg-white/10 backdrop-blur-xl 
                border border-white/30 rounded-full 
                text-white text-sm font-bold tracking-wide whitespace-nowrap
                hover:bg-white/20 hover:scale-105 hover:border-white/50 
                active:scale-95
                transition-colors
                shadow-2xl shadow-black/20
                cursor-pointer
            "
        >
            <btn.icon size={20} />
            <span className="drop-shadow-sm">{btn.label}</span>
        </motion.a>
    )
}

function DesktopButtons({ progress }: { progress: MotionValue<number> }) {
    return (
        <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center pointer-events-none transition-all duration-300">
            <div className="w-full max-w-6xl px-4 pointer-events-auto">
                <div className="flex justify-center gap-4 items-center">
                    {buttons.map((btn, i) => (
                        <DesktopGhostButton key={btn.label} btn={btn} i={i} total={buttons.length} progress={progress} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function MobileGhostButton({ btn, i, total, progress }: { btn: (typeof buttons)[0], i: number, total: number, progress: MotionValue<number> }) {
    const step = 1 / (total - 1)
    const myTarget = i * step
    const visibleRange = step * 2.5

    const rawOpacity = useTransform(progress, (p) => {
        const dist = Math.abs(p - myTarget)
        if (dist < visibleRange) {
            const normalizedDist = dist / visibleRange
            return Math.pow(Math.cos(normalizedDist * Math.PI / 2), 1.8)
        }
        return 0
    })

    // Core physics: Non-linear magnetic center
    // Items move incredibly fast on the edges, but "slow down" to let you read them in the center.
    const yOffset = useTransform(progress, (p) => {
        const dist = p - myTarget;
        const sign = Math.sign(dist);
        const absDist = Math.abs(dist);
        // Blend of linear (smooth tracking) and cubic (hyper-acceleration at edges)
        const travel = (absDist * 400) + (Math.pow(absDist, 3) * 8000);
        return sign * travel * -1; // -1 so scrolling down moves items UP
    });

    // Exponential scale decay: Huge at 0 dist, shrinks fast
    const scale = useTransform(progress, (p) => {
        const dist = Math.abs(p - myTarget);
        // Cap max dist impact so scale doesn't go negative
        const clampedDist = Math.min(dist, 1.0);
        return 1.25 - Math.pow(clampedDist * 1.8, 2) * 0.6;
    });

    // 3D Tilt: Tilts sharply up/down as it leaves center
    const rotateX = useTransform(progress, (p) => (p - myTarget) * -100);

    // Dynamic Depth of Field (Blur items out of focus)
    const blurAmount = useTransform(progress, (p) => {
        const dist = Math.abs(p - myTarget);
        // Only start blurring after it leaves the immediate center
        const blur = Math.max(0, (dist * 10) - 1.5) * 3;
        return Math.min(blur, 16); // Cap at 16px blur
    });
    const filter = useTransform(blurAmount, (b) => `blur(${b}px)`);

    // Premium Aesthetics: Centered item glows and gets a brighter border
    const borderColor = useTransform(rawOpacity, (o) => {
        const intensity = Math.pow(o, 3);
        return `rgba(255,255,255,${0.1 + intensity * 0.6})`;
    });

    const boxShadow = useTransform(rawOpacity, (o) => {
        const intensity = Math.pow(o, 4); // Only glows when practically centered
        return `0 ${intensity * 12}px ${intensity * 32}px rgba(255, 255, 255, ${intensity * 0.15}), inset 0 0 ${intensity * 20}px rgba(255,255,255,${intensity * 0.3})`;
    });

    const opacity = useTransform(rawOpacity, (o) => Math.max(0.01, o))
    const zIndex = useTransform(opacity, (o) => Math.round(o * 100))
    const display = useTransform(opacity, (o) => o > 0.02 ? 'flex' : 'none')

    const isAction = btn.label === 'QUEM SOMOS'

    return (
        <motion.a
            href={btn.link}
            target={isAction ? undefined : "_blank"}
            rel={isAction ? undefined : "noreferrer"}
            onClick={(e) => {
                if (isAction) {
                    e.preventDefault()
                    window.dispatchEvent(new CustomEvent('open-about-modal'))
                }
            }}
            style={{
                opacity,
                scale,
                y: yOffset,
                rotateX,
                filter,
                borderColor,
                boxShadow,
                x: '-50%',
                left: '50%',
                top: '50%', // Start perfectly centered vertically and horizontally
                marginTop: '-1.5rem',
                zIndex,
                display,
                transformPerspective: 1000 // Creates the 3D depth for rotateX
            }}
            className="
                absolute
                flex items-center justify-center gap-3 
                w-[85vw] max-w-[320px] py-4
                bg-white/10 backdrop-blur-2xl 
                border-2 rounded-2xl 
                text-white text-lg font-bold tracking-wide
                cursor-pointer pointer-events-auto
                will-change-transform
                hover:bg-white/20 hover:scale-[1.3] active:scale-95 transition-all duration-300
            "
        >
            <btn.icon size={24} />
            <span className="drop-shadow-md">{btn.label}</span>
        </motion.a>
    )
}

function MobileButtons({ progress }: { progress: MotionValue<number> }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            className="absolute bottom-[20vh] left-0 right-0 z-20 flex justify-center pointer-events-none h-32 items-center"
        >
            <div className="relative w-full h-full">
                {buttons.map((btn, i) => (
                    <MobileGhostButton key={btn.label} btn={btn} i={i} total={buttons.length} progress={progress} />
                ))}
            </div>
        </motion.div>
    )
}

export function HeroGhostButtons({ progress, isMobile }: HeroGhostButtonsProps) {
    if (isMobile) {
        return <MobileButtons progress={progress} />
    }
    return <DesktopButtons progress={progress} />
}
