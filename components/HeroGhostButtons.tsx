'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, MapPin, Info, Phone, ShoppingBag, Store } from 'lucide-react'

interface HeroGhostButtonsProps {
    progress: number // 0 to 1
    isMobile: boolean
}

export function HeroGhostButtons({ progress, isMobile }: HeroGhostButtonsProps) {
    const buttons = [
        { label: 'PEDIR NO WHATSAPP', icon: MessageCircle, link: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%AA%21+Vim+do+site+da+Illa%21' },
        { label: 'IFOOD', icon: ShoppingBag, link: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04' },
        { label: 'LOCALIZAÇÃO', icon: MapPin, link: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8' },
        { label: 'FRANQUIAS', icon: Store, link: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias' },
        { label: 'QUEM SOMOS', icon: Info, link: 'https://www.illasorvetes.com.br/quem-somos' },
        { label: 'CONTATO', icon: Phone, link: 'https://wa.me/558287286990' },
    ]

    // --- DESKTOP LOGIC (Preserved) ---
    if (!isMobile) {
        // Calculate how many buttons to show based on progress (0 -> 1 maps to 0 -> 6)
        const totalButtons = buttons.length
        const desktopCount = Math.min(totalButtons, Math.ceil(progress * totalButtons))

        return (
            <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center pointer-events-none transition-all duration-300">
                <div className="w-full max-w-6xl px-4 pointer-events-auto">
                    <div className="flex justify-center gap-4 items-center">
                        <AnimatePresence mode='popLayout'>
                            {buttons.slice(0, desktopCount).map((btn, i) => (
                                <motion.a
                                    key={btn.label}
                                    href={btn.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    layout
                                    initial={{ opacity: 0, x: 50, scale: 0.8 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{
                                        duration: 0.4,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25
                                    }}
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
                                    "
                                >
                                    <btn.icon size={20} />
                                    <span className="drop-shadow-sm">{btn.label}</span>
                                </motion.a>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        )
    }

    // --- MOBILE LOGIC (Stacked Fade Sequence) ---
    return (
        <div className="absolute bottom-[20vh] left-0 right-0 z-20 flex justify-center pointer-events-none h-32 items-center">
            <div className="relative w-full max-w-xs h-full flex items-center justify-center">
                {buttons.map((btn, i) => {
                    // Logic:
                    // We distribute the buttons across the 0..1 progress range.
                    // But we want to ensure the first one is visible at 0, and the last one at 1.

                    const step = 1 / (buttons.length - 1)
                    const myTarget = i * step

                    // Distance from current progress
                    const dist = Math.abs(progress - myTarget)

                    // Range of visibility: +/- step * 0.8 (slightly overlap)
                    const visibleRange = step * 1.2

                    // Opacity calculation
                    let opacity = 0
                    if (dist < visibleRange) {
                        opacity = 1 - (dist / visibleRange)
                        // Smooth ease in/out
                        opacity = Math.pow(opacity, 2)
                    }

                    // Scale effect: 0.8 -> 1.1 -> 0.8
                    const scale = 0.9 + (opacity * 0.15)

                    // Slide effect: slight vertical movement
                    // Enter from bottom, Exit to top
                    const yOffset = (progress - myTarget) * -100

                    // Only render if impactful
                    if (opacity < 0.01) return null

                    return (
                        <a
                            key={btn.label}
                            href={btn.link}
                            target="_blank"
                            rel="noreferrer"
                            className="
                                absolute
                                flex items-center justify-center gap-3 
                                w-[85vw] max-w-[320px] py-4
                                bg-white/10 backdrop-blur-2xl 
                                border border-white/30 rounded-2xl 
                                text-white text-lg font-bold tracking-wide
                                shadow-xl shadow-black/20
                                cursor-pointer pointer-events-auto
                                transition-transform duration-75 ease-linear will-change-transform
                            "
                            style={{
                                opacity: opacity,
                                transform: `translateY(${yOffset}px) scale(${scale})`,
                                zIndex: Math.round(opacity * 100),
                                border: `1px solid rgba(255,255,255, ${0.3 + opacity * 0.7})`,
                                filter: `brightness(${1 + opacity * 0.2})`
                            }}
                        >
                            <btn.icon size={24} />
                            <span className="drop-shadow-md">{btn.label}</span>
                        </a>
                    )
                })}
            </div>
        </div>
    )
}
