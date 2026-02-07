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
    // Increased width estimation to be safe for "PEDIR NO WHATSAPP"
    const ITEM_WIDTH = 340
    const SPACING = 24
    const TOTAL_WIDTH = (ITEM_WIDTH + SPACING) * buttons.length

    // Scroll Travel Logic
    // Start: 100vw (First item just entering from right)
    // End: -TOTAL_WIDTH (Last item fully exited to left)
    // We add a buffer to ensuring it clears completely.

    return (
        <div className="absolute bottom-[25vh] left-0 right-0 z-20 flex justify-center pointer-events-none overflow-hidden h-40 items-center">
            {/* Track */}
            <div
                className="flex items-center gap-6 relative pointer-events-auto transition-transform duration-75 ease-linear will-change-transform"
                style={{
                    // Move from 100vw to -TOTAL_WIDTH roughly
                    // The 'window.innerWidth' addition helps bridge the gap
                    // Formula: Start at 100vw, End at -(TOTAL_WIDTH - ScreenWidth)
                    // Let's use a simpler linear map provided we have window width available/css calc
                    transform: `translateX(calc(100vw - ${progress * (TOTAL_WIDTH + window.innerWidth)}px))`
                }}
            >
                {buttons.map((btn, i) => {
                    // Calculate "Active Index"
                    // We map the progress to which item index is currently near the center.
                    // spread the active index over the range 0 to N+1
                    const activeIndex = progress * (buttons.length + 2) - 1

                    const dist = Math.abs(i - activeIndex)
                    const isCenter = dist < 0.6

                    // Scale Logic:
                    // Base size 1.0 -> Active 1.5
                    const scale = Math.max(1.0, 1.5 - (dist * 0.7))

                    // Opacity Logic:
                    // Base opacity 0.6 -> Active 1.0
                    // Fade out at edges: approximate by distance from center
                    // We relax the fade out distance since items are wider
                    let opacity = Math.max(0.6, 1 - (dist * 0.35))

                    // Edge Fade: if dist gets very large, fade out
                    if (dist > 2.5) {
                        opacity = Math.max(0, 0.6 - ((dist - 2.5) * 1.0))
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
