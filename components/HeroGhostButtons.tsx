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

    // Wider visibility window: stays opaque longer so it's clearly seen
    const rawOpacity = useTransform(progress, (p) => {
        const dist = Math.abs(p - myTarget)
        // Flatter, wider curve: stays near 1.0 longer, then drops
        return Math.exp(-(dist * dist) * 10)
    })

    // Elegant magnetic center: Slows down dramatically near the center, accelerates rapidly away
    const yOffset = useTransform(progress, (p) => {
        const dist = p - myTarget;
        const sign = Math.sign(dist);
        const absDist = Math.abs(dist);
        // Blends a very subtle linear track with a powerful cubic push
        const travel = (absDist * 80) + (Math.pow(absDist, 2.5) * 2500);
        return sign * travel * -1;
    });

    // Scale pops distinctly to 1.15 in center, sits at 0.9 off-center
    const scale = useTransform(progress, (p) => {
        const dist = Math.abs(p - myTarget);
        return 0.9 + (0.25 * Math.exp(-(dist * dist) * 15));
    });

    const opacity = useTransform(rawOpacity, (o) => Math.max(0.01, o))
    const zIndex = useTransform(opacity, (o) => Math.round(o * 100))
    // Keep it in the DOM slightly longer for smooth fade out
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
                x: '-50%',
                left: '50%',
                top: '50%',
                marginTop: '-1.5rem',
                zIndex,
                display
                // REMOVED transformPerspective and rotateX to prevent 3D composite thrashing over Canvas
            }}
            className="
                absolute
                flex items-center justify-center gap-3 
                w-[65vw] max-w-[260px] py-3
                bg-white hover:bg-white/90
                border border-white/50 rounded-2xl 
                text-rose-600 text-base font-bold tracking-wide
                cursor-pointer pointer-events-auto
                shadow-xl shadow-black/10
                will-change-transform
                active:scale-95 transition-all duration-300
            "
        >
            <btn.icon size={20} />
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
