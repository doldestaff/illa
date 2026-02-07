'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, MapPin, Info, Phone, ShoppingBag, Store } from 'lucide-react'

interface HeroGhostButtonsProps {
    visibleCount: number
}

export function HeroGhostButtons({ visibleCount }: HeroGhostButtonsProps) {
    const buttons = [
        { label: 'PEDIR NO WHATSAPP', icon: MessageCircle, link: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%AA%21+Vim+do+site+da+Illa%21' },
        { label: 'IFOOD', icon: ShoppingBag, link: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04' },
        { label: 'LOCALIZAÇÃO', icon: MapPin, link: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8' },
        { label: 'FRANQUIAS', icon: Store, link: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias' },
        { label: 'QUEM SOMOS', icon: Info, link: 'https://www.illasorvetes.com.br/quem-somos' },
        { label: 'CONTATO', icon: Phone, link: 'https://wa.me/558287286990' },
    ]

    return (
        <div className="absolute bottom-[25vh] md:bottom-8 left-0 right-0 z-20 flex justify-center pointer-events-none transition-all duration-300">
            <div className="w-full max-w-[95%] md:max-w-6xl overflow-x-auto md:overflow-visible no-scrollbar pointer-events-auto px-4 pb-4 md:pb-0">
                <div className="flex flex-nowrap md:justify-center gap-3 md:gap-4 min-w-min items-center">
                    <AnimatePresence mode='popLayout'>
                        {buttons.slice(0, visibleCount).map((btn, i) => (
                            <motion.a
                                key={btn.label}
                                href={btn.link}
                                target="_blank"
                                rel="noreferrer"
                                layout
                                initial={{ opacity: 0, x: 50, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeOut",
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25
                                }}
                                className="
                                    flex items-center gap-2 md:gap-3 
                                    px-5 py-3 md:px-6 md:py-2.5 
                                    bg-white/10 backdrop-blur-xl 
                                    border border-white/30 rounded-full 
                                    text-white text-sm md:text-sm font-bold tracking-wide whitespace-nowrap
                                    hover:bg-white/20 hover:scale-105 hover:border-white/50 
                                    active:scale-95
                                    transition-colors
                                    shadow-2xl shadow-black/20
                                "
                                aria-label={btn.label}
                            >
                                <btn.icon size={20} className="opacity-100" />
                                <span className="drop-shadow-sm">{btn.label}</span>
                            </motion.a>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
