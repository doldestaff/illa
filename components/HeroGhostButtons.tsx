'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, MapPin, Info, Phone, ShoppingBag, Store } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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

    // Config values
    const ITEM_WIDTH = 280 // Width of a button
    const SPACING = 24
    const TOTAL_WIDTH = (ITEM_WIDTH + SPACING) * buttons.length

    // Scroll Travel Logic
    // Start: 90vw (Just entering from right)
    // End: -TOTAL_WIDTH + 10vw (Fully exited to left)
    const startX = 90 // vw
    // We calculate the end X in pixels roughly:
    // We want the last item to clear the screen.
    // Let's use a cleaner interpolation.

    // We need a way to determine per-button visibility based on its position.
    // Since we don't have the exact DOM rects during render easily without refs,
    // we will approximate based on 'progress'.

    // Total travel distance in 'units' corresponding to TOTAL_WIDTH + ScreenWidth

    return (
        <div className="absolute bottom-[25vh] left-0 right-0 z-20 flex justify-center pointer-events-none overflow-hidden h-40 items-center">
            {/* Track */}
            <div
                className="flex items-center gap-6 relative pointer-events-auto transition-transform duration-75 ease-linear will-change-transform"
                style={{
                    // Move from right (100vw) to left (past all items)
                    transform: `translateX(calc(100vw - ${progress * (TOTAL_WIDTH + window.innerWidth)}px))`
                }}
            >
                {buttons.map((btn, i) => {
                    // Calculate "Active Index"
                    // We map the progress to which item index is currently near the center.
                    // Range 0 -> 1 covers indices 0 -> N.

                    const activeIndex = progress * (buttons.length + 1.5) - 0.75
                    const dist = Math.abs(i - activeIndex)
                    const isCenter = dist < 0.6

                    // Scale Logic:
                    // Base size 1.0 -> Active 1.5
                    const scale = Math.max(1.0, 1.5 - (dist * 0.7))

                    // Opacity Logic:
                    // Base opacity 0.6 (increased) -> Active 1.0
                    // Fade out at edges: approximate by distance from center
                    // If distance is large (> 2.5), opacity drops to 0 (fade out)
                    let opacity = Math.max(0.6, 1 - (dist * 0.4))

                    // Edge Fade: if dist > 2.2, sharp drop
                    if (dist > 2.2) {
                        opacity = Math.max(0, 0.6 - ((dist - 2.2) * 1.5))
                    }

                    // Boost center opacity
                    if (isCenter) opacity = 1

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
                                border: isCenter ? '3px solid rgba(255,255,255,0.95)' : '1px solid rgba(255,255,255,0.3)',
                                background: isCenter ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                                boxShadow: isCenter ? '0 20px 40px rgba(0,0,0,0.4)' : 'none',
                                filter: isCenter ? 'brightness(1.1)' : 'none'
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
