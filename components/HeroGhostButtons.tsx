'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, MapPin, Info, Phone, ShoppingBag, Store } from 'lucide-react'

interface HeroGhostButtonsProps {
    visible: boolean
}

export function HeroGhostButtons({ visible }: HeroGhostButtonsProps) {
    const buttons = [
        { label: 'PEDIR NO WHATSAPP', icon: MessageCircle, link: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%AA%21+Vim+do+site+da+Illa%21' },
        { label: 'IFOOD', icon: ShoppingBag, link: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04' },
        { label: 'LOCALIZAÇÃO', icon: MapPin, link: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8' },
        { label: 'FRANQUIAS', icon: Store, link: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias' },
        { label: 'QUEM SOMOS', icon: Info, link: 'https://www.illasorvetes.com.br/quem-somos' },
        { label: 'CONTATO', icon: Phone, link: 'https://wa.me/558287286990' },
    ]

    return (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center pointer-events-none md:bottom-6">
            <div className="w-full max-w-[90%] md:max-w-6xl overflow-x-auto md:overflow-visible no-scrollbar pointer-events-auto px-4 pb-2 md:pb-0">
                <div className="flex flex-nowrap md:justify-center gap-3 min-w-min">
                    <AnimatePresence>
                        {visible && buttons.map((btn, i) => (
                            <motion.a
                                key={btn.label}
                                href={btn.link}
                                target="_blank"
                                rel="noreferrer"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                transition={{
                                    duration: 0.4,
                                    delay: i * 0.05,
                                    ease: "easeOut"
                                }}
                                className="
                                    flex items-center gap-2 px-4 py-2.5 
                                    bg-white/10 backdrop-blur-md 
                                    border border-white/20 rounded-lg 
                                    text-white text-xs md:text-sm font-semibold tracking-wide whitespace-nowrap
                                    hover:bg-white/20 hover:scale-105 hover:border-white/40 
                                    active:scale-95
                                    transition-colors
                                    shadow-lg
                                "
                                aria-label={btn.label}
                            >
                                <btn.icon size={16} className="opacity-90" />
                                {btn.label}
                            </motion.a>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
