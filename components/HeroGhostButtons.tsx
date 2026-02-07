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
    // "apresente-os 1 de cada vez" -> Enter from right?
    // "botão que alcança o meio fica maior" -> Center scaling.

    // Let's assume a "virtual scroll" where progress 0 = first item far right, progress 1 = last item centered?
    // Or progress 0 = first item centered?
    // User said "apresente-os 1 de cada vez". This implies they start hidden or just entering.

    // Config values
    const ITEM_WIDTH = 260 // approx width of a button on mobile
    const SPACING = 20
    const TOTAL_WIDTH = (ITEM_WIDTH + SPACING) * buttons.length

    // We want to map progress (0-1) to an X offset.
    // Let's say at 0, we show nothing (offset extremely positive).
    // At 1, we show the last one?

    // Refined Interpretation: "Movem na horizontal"
    // Let's make the track slide from right to left as we scroll down.
    // Start: First button entering from right.
    // End: Last button visible/centered.

    return (
        <div className="absolute bottom-[20vh] left-0 right-0 z-20 flex justify-center pointer-events-none overflow-hidden h-32 items-center">
            {/* Track */}
            <div
                className="flex items-center gap-4 relative pointer-events-auto transition-transform duration-75 ease-linear will-change-transform"
                style={{
                    // Calculate transform based on progress.
                    // Start offset: Window width (offscreen right)
                    // End offset: -TOTAL_WIDTH + Window Width (scrolled past?)
                    // Let's tune: 
                    // 0.0 -> Start entering (translateX = 50vw)
                    // 1.0 -> Last item near center (translateX = -TOTAL_WIDTH + 50vw + buffer)
                    transform: `translateX(calc(60vw - ${progress * (TOTAL_WIDTH + 100)}px))`
                }}
            >
                {buttons.map((btn, i) => {
                    // Calculate "center-ness" for scaling
                    // We need to know the button's absolute position relative to viewport center.
                    // This is hard to do purely with CSS in this structure without individual transforms.
                    // However, we can approximate "active index" based on progress.

                    const activeIndex = progress * (buttons.length + 1) - 1 // -1 to start before 0
                    const dist = Math.abs(i - activeIndex)
                    const isCenter = dist < 0.6 // Threshold for "center"

                    // Simple scale based on distance
                    const scale = Math.max(0.8, 1.2 - (dist * 0.4))
                    const opacity = Math.max(0.4, 1 - (dist * 0.3))

                    return (
                        <a
                            key={btn.label}
                            href={btn.link}
                            target="_blank"
                            rel="noreferrer"
                            className="
                                flex items-center gap-3 
                                px-6 py-4
                                bg-white/10 backdrop-blur-xl 
                                border border-white/30 rounded-2xl 
                                text-white text-base font-bold tracking-wide whitespace-nowrap
                                transition-all duration-300
                                shadow-2xl shadow-black/20
                            "
                            style={{
                                transform: `scale(${scale})`,
                                opacity: opacity,
                                border: isCenter ? '2px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.2)',
                                background: isCenter ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'
                            }}
                        >
                            <btn.icon size={24} />
                            <span className="drop-shadow-sm">{btn.label}</span>
                        </a>
                    )
                })}
            </div>
        </div>
    )
}
