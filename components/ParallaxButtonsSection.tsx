'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import { Info, Store, MapPin, MessageCircle, ShoppingBag, Instagram, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Data Configuration
const cards = [
    {
        id: 1,
        title: 'Sobre Nós',
        description: 'Conheça nossa história de sabor e tradição.',
        icon: Info,
        href: 'https://www.illasorvetes.com.br/quem-somos',
        color: 'from-pink-500/20 to-purple-500/20',
        borderColor: 'border-pink-500/30'
    },
    {
        id: 2,
        title: 'Seja um Franqueado',
        description: 'Leve a magia da Illa para sua cidade.',
        icon: Store,
        href: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias',
        color: 'from-blue-500/20 to-cyan-500/20',
        borderColor: 'border-blue-500/30'
    },
    {
        id: 3,
        title: 'Nossas Lojas',
        description: 'Encontre a unidade Illa mais próxima de você.',
        icon: MapPin,
        href: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8',
        color: 'from-emerald-500/20 to-green-500/20',
        borderColor: 'border-emerald-500/30'
    },
    {
        id: 4,
        title: 'Pedir no WhatsApp',
        description: 'Fale com a gente e peça seu favorito.',
        icon: MessageCircle,
        href: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%AA%21+Vim+do+site+da+Illa%21&type=phone_number&app_absent=0',
        color: 'from-green-500/20 to-teal-500/20',
        borderColor: 'border-green-500/30'
    },
    {
        id: 5,
        title: 'Peça no iFood',
        description: 'Receba Illa no conforto de casa.',
        icon: ShoppingBag,
        href: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04',
        color: 'from-red-500/20 to-orange-500/20',
        borderColor: 'border-red-500/30'
    },
    {
        id: 6,
        title: 'Instagram',
        description: 'Siga @illasorvetesoficial e fique por dentro.',
        icon: Instagram,
        href: 'https://www.instagram.com/illasorvetesoficial/',
        color: 'from-purple-500/20 to-pink-500/20',
        borderColor: 'border-purple-500/30'
    }
]

export function ParallaxButtonsSection() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    })

    return (
        <section
            ref={containerRef}
            className="relative h-[550vh] bg-white" // Increased track to ensure completion
        >
            <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center perspective-container">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-50 via-white to-white opacity-80" />

                {/* 3D Stage - Pulled up significantly (-35vh) per user request to be closer to Hero */}
                <div
                    className="relative w-full max-w-md h-[400px] md:h-[500px] flex items-center justify-center -mt-[35vh]"
                    style={{
                        perspective: '1000px',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {cards.map((card, index) => (
                        <ParallaxCard
                            key={card.id}
                            card={card}
                            index={index}
                            total={cards.length}
                            progress={scrollYProgress}
                        />
                    ))}
                </div>

                {/* Scroll Indicator (optional, only visible early on) */}
                <motion.div
                    style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-dark/30"
                >
                    <span className="text-xs uppercase tracking-widest font-bold">Explore</span>
                    <div className="w-px h-12 bg-gradient-to-b from-dark/30 to-transparent" />
                </motion.div>
            </div>
        </section>
    )
}

function ParallaxCard({
    card,
    index,
    total,
    progress
}: {
    card: typeof cards[0],
    index: number,
    total: number,
    progress: MotionValue<number>
}) {
    // Calculate range for this card
    const step = 1 / total

    // ADJUSTMENT: 50% Overlap for rapid sequence
    const overlap = step * 0.5

    // Compress total range to finish at 90% of scroll to avoid cutoff
    // This ensures all animations complete BEFORE the sticky container unpins
    const effectiveProgress = useTransform(progress, [0, 0.9], [0, 1])

    // Shift start for index 0 so it's fully visible at progress 0
    const start = index === 0 ? 0 : (index * step) - overlap
    const end = Math.min(1, (index * step) + step + overlap)

    // Transform Hooks
    // Phase 1: Enter
    // Phase 2: Active
    // Phase 3: Exit

    const entryEnd = index === 0 ? 0 : start + (step * 0.2)
    const exitStart = end - (step * 0.2)

    // Opacity: 0 -> 1 -> 1 -> 0
    const opacity = useTransform(
        effectiveProgress,
        [start, entryEnd, exitStart, end],
        [index === 0 ? 1 : 0, 1, 1, 0]
    )

    // Scale: 0.6 -> 1 -> 1 -> 1.2 (more dramatic entry)
    const scale = useTransform(
        effectiveProgress,
        [start, entryEnd, exitStart, end],
        [0.6, 1, 1, 1.2]
    )

    // Z Position: -300 -> 0 -> 0 -> 300 (deeper)
    const z = useTransform(
        effectiveProgress,
        [start, entryEnd, exitStart, end],
        [-300, 0, 0, 300]
    )

    // Blur: 12px -> 0 -> 0 -> 12px
    const blur = useTransform(
        effectiveProgress,
        [start, entryEnd, exitStart, end],
        [12, 0, 0, 12]
    )

    // Y: Slide Up effect. 
    // Enter from below (100px), Exit to above (-100px)
    const y = useTransform(
        effectiveProgress,
        [start, end],
        [100, -100]
    )

    // Visibility optimization
    const display = useTransform(effectiveProgress, (p) => (p >= start && p <= end) ? 'flex' : 'none')

    return (
        <motion.a
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                opacity,
                scale,
                z,
                y,
                filter: useTransform(blur, (b) => `blur(${b}px)`),
                display,
                transformStyle: 'preserve-3d' // Crucial
            }}
            className={cn(
                "absolute inset-0 m-auto", // Center in stage
                "w-[85vw] max-w-[360px] md:max-w-[420px] h-[300px] md:h-[400px]",
                "bg-white/40 backdrop-blur-2xl border", // Glass effect
                card.borderColor,
                "rounded-[2.5rem] shadow-2xl shadow-indigo-500/10",
                "flex flex-col items-center justify-center text-center p-8",
                "cursor-pointer group hover:bg-white/60 transition-colors duration-300"
            )}
        >
            {/* Inner Gradient Glow */}
            <div className={cn(
                "absolute inset-0 rounded-[2.5rem] bg-gradient-to-br opacity-50 group-hover:opacity-70 transition-opacity",
                card.color
            )} />

            <div className="relative z-10 flex flex-col items-center gap-6">
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center bg-white shadow-xl mb-2 group-hover:scale-110 transition-transform duration-500",
                    "text-dark/80"
                )}>
                    <card.icon size={36} strokeWidth={1.5} />
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-3xl font-script text-dark">{card.title}</h3>
                    <p className="text-dark/60 font-medium leading-relaxed max-w-[250px] mx-auto">
                        {card.description}
                    </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-illa-pink opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Acessar <ArrowRight size={14} />
                </div>
            </div>
        </motion.a>
    )
}
