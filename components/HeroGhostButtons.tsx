'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, MapPin, Info, Phone, ShoppingBag, Store } from 'lucide-react'
import { useEffect, useRef } from 'react'

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

    // --- MOBILE LOGIC (Scroll Carousel) ---
    // progress 0 -> 1 should slide the items.

    // Config values
    const ITEM_WIDTH = 280 // Wider buttons
    const SPACING = 24
    const TOTAL_WIDTH = (ITEM_WIDTH + SPACING) * buttons.length

    // We want to map progress (0-1) to an X offset.
    // Start: First button entering from right (60vw)
    // End: Last button exiting to left (-TOTAL_WIDTH + 40vw)
    // To ensure all are seen, we need to travel the full length plus some buffer.

    return (
        <div className="absolute bottom-[25vh] left-0 right-0 z-20 flex justify-center pointer-events-none overflow-hidden h-40 items-center">
            {/* Track */}
            <div
                className="flex items-center gap-6 relative pointer-events-auto transition-transform duration-75 ease-linear will-change-transform"
                style={{
                    // Tune the travel distance to Ensure all buttons pass the center
                    transform: `translateX(calc(70vw - ${progress * (TOTAL_WIDTH + 200)}px))`
                }}
            >
                {buttons.map((btn, i) => {
                    // Calculate "center-ness" for scaling
                    const activeIndex = progress * (buttons.length + 0.5) - 0.5
                    const dist = Math.abs(i - activeIndex)
                    const isCenter = dist < 0.5

                    // Scale Logic:
                    // Base size: 1.0 (already larger via CSS)
                    // Center boost: +50% -> 1.5
                    const scale = Math.max(1.0, 1.5 - (dist * 0.8))
                    const opacity = Math.max(0.3, 1 - (dist * 0.4))

                    return (
                        <a
                            key={btn.label}
                            href={btn.link}
                            target="_blank"
                            rel="noreferrer"
                            className="
                                flex items-center gap-3 
                                px-8 py-5
                                bg-white/10 backdrop-blur-3xl 
                                border border-white/30 rounded-3xl 
                                text-white text-lg font-bold tracking-wide whitespace-nowrap
                                transition-all duration-300
                                shadow-2xl shadow-black/20
                            "
                            style={{
                                transform: `scale(${scale})`,
                                opacity: opacity,
                                border: isCenter ? '3px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.2)',
                                background: isCenter ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.05)',
                                boxShadow: isCenter ? '0 20px 40px rgba(0,0,0,0.3)' : 'none'
                            }}
                        >
                            <btn.icon size={28} />
                            <span className="drop-shadow-md">{btn.label}</span>
                        </a>
                    )
                })}
            </div>
        </div>
    )
}
