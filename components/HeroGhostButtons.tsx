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
                bg-illa-pink/90 backdrop-blur-xl 
                border border-white/50 rounded-full 
                text-white text-sm font-bold tracking-wide whitespace-nowrap
                hover:bg-illa-yellow hover:text-dark hover:scale-105 hover:border-transparent 
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

function MobileButtons({ progress }: { progress: MotionValue<number> }) {
    // We map the 0..1 progress to a physical vertical translation of a container.
    // Let's assume the container needs to move up by say 250px to show all buttons.
    const scrollY = useTransform(progress, [0, 1], [0, -220])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            className="absolute bottom-[20vh] left-0 right-0 z-20 flex justify-center h-[120px] items-center overflow-visible"
        >
            {/* The mask container limits visibility so it feels like they are sliding in and out */}
            <div className="relative w-full h-[250px] flex justify-center items-center pointer-events-none [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">

                {/* The inner track that actually moves based on scroll progress */}
                <motion.div
                    style={{ y: scrollY }}
                    className="absolute top-[180px] flex flex-col gap-6 items-center pointer-events-auto w-full"
                >
                    {buttons.map((btn, i) => {
                        const isAction = btn.label === 'QUEM SOMOS' || btn.label === 'CONTATO'

                        return (
                            <a
                                key={btn.label}
                                href={btn.link}
                                target={isAction ? undefined : "_blank"}
                                rel={isAction ? undefined : "noreferrer"}
                                onClick={(e) => {
                                    if (btn.label === 'QUEM SOMOS') {
                                        e.preventDefault()
                                        window.dispatchEvent(new CustomEvent('open-about-modal'))
                                    }
                                }}
                                className="
                                    flex items-center justify-center gap-3 
                                    w-[65vw] max-w-[260px] py-4
                                    bg-illa-pink/90 backdrop-blur-xl hover:bg-illa-yellow hover:text-dark hover:border-transparent
                                    border border-white/50 rounded-2xl 
                                    text-white text-sm font-bold tracking-widest
                                    cursor-pointer
                                    active:scale-95 transition-all duration-300
                                    group shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
                                "
                            >
                                <btn.icon size={18} className="text-current" />
                                <span className="drop-shadow-md group-hover:drop-shadow-none">{btn.label}</span>
                            </a>
                        )
                    })}
                </motion.div>

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
