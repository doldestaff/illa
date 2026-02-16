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
    { label: 'QUEM SOMOS', icon: Info, link: 'https://www.illasorvetes.com.br/quem-somos' },
    { label: 'CONTATO', icon: Phone, link: 'https://wa.me/558287286990' },
]

function DesktopButtons({ progress }: { progress: MotionValue<number> }) {
    return (
        <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center pointer-events-none transition-all duration-300">
            <div className="w-full max-w-6xl px-4 pointer-events-auto">
                <div className="flex justify-center gap-4 items-center">
                    {buttons.map((btn, i) => {
                        const step = 1 / buttons.length
                        const start = step * i

                        const opacity = useTransform(progress, [start, start + 0.1], [0, 1])
                        const x = useTransform(progress, [start, start + 0.1], [50, 0])
                        const scale = useTransform(progress, [start, start + 0.1], [0.8, 1])
                        const display = useTransform(progress, p => p >= start ? 'flex' : 'none')

                        const isAction = btn.label === 'QUEM SOMOS' || btn.label === 'CONTATO'

                        return (
                            <motion.a
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
                    })}
                </div>
            </div>
        </div>
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
                {buttons.map((btn, i) => {
                    const step = 1 / (buttons.length - 1)
                    const myTarget = i * step
                    const visibleRange = step * 1.2

                    const opacity = useTransform(progress, (p) => {
                        const dist = Math.abs(p - myTarget)
                        if (dist < visibleRange) {
                            const val = 1 - (dist / visibleRange)
                            return Math.pow(val, 2)
                        }
                        return 0
                    })

                    const scale = useTransform(opacity, [0, 1], [0.9, 1.05])
                    const yOffset = useTransform(progress, (p) => (p - myTarget) * -120)
                    const zIndex = useTransform(opacity, (o) => Math.round(o * 100))
                    const display = useTransform(opacity, (o) => o > 0.01 ? 'flex' : 'none')

                    const isAction = btn.label === 'QUEM SOMOS'

                    return (
                        <motion.a
                            key={btn.label}
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
                                marginTop: '-2rem',
                                zIndex,
                                display
                            }}
                            className="
                                absolute
                                flex items-center justify-center gap-3 
                                w-[85vw] max-w-[320px] py-4
                                bg-white/10 backdrop-blur-2xl 
                                border border-white/30 rounded-2xl 
                                text-white text-lg font-bold tracking-wide
                                shadow-xl shadow-black/20
                                cursor-pointer pointer-events-auto
                                will-change-transform
                                hover:bg-white/20 hover:scale-105 active:scale-95 transition-all
                            "
                        >
                            <btn.icon size={24} />
                            <span className="drop-shadow-md">{btn.label}</span>
                        </motion.a>
                    )
                })}
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
