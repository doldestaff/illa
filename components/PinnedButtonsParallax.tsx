'use client'

import { useRef, useLayoutEffect } from 'react'
import { Info, Store, MapPin, MessageCircle, ShoppingBag, Instagram, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
        title: 'Pedir no WhatsApp',
        description: 'Fale com a gente e peça seu favorito.',
        icon: MessageCircle,
        href: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%AA%21+Vim+do+site+da+Illa%21&type=phone_number&app_absent=0',
        color: 'from-green-500/20 to-teal-500/20',
        borderColor: 'border-green-500/30'
    },
    {
        id: 4,
        title: 'Peça no iFood',
        description: 'Receba Illa no conforto de casa.',
        icon: ShoppingBag,
        href: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04',
        color: 'from-red-500/20 to-orange-500/20',
        borderColor: 'border-red-500/30'
    },
    {
        id: 5,
        title: 'Nossas Lojas',
        description: 'Encontre a unidade Illa mais próxima de você.',
        icon: MapPin,
        href: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8',
        color: 'from-emerald-500/20 to-green-500/20',
        borderColor: 'border-emerald-500/30'
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

export function PinnedButtonsParallax() {
    const containerRef = useRef<HTMLDivElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<(HTMLAnchorElement | null)[]>([])

    useLayoutEffect(() => {
        gsap.registerPlugin(ScrollTrigger)

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "bottom bottom",
                    // NO PIN - Using CSS Sticky
                    scrub: 1, // Smooth scrub
                }
            })

            // Initial state for all cards: Hidden, far back
            cardsRef.current.forEach((card, i) => {
                if (!card) return
                gsap.set(card, {
                    opacity: 0,
                    z: -240,
                    y: 60,
                    scale: 0.85,
                    display: 'flex' // Ensure they are layout-ready
                })
            })

            // Sequence
            cardsRef.current.forEach((card, i) => {
                // Enter
                tl.to(card, {
                    opacity: 1,
                    z: 0,
                    y: 0,
                    scale: 1,
                    duration: 1,
                    ease: "power2.out"
                })
                    // Hold
                    .to(card, {
                        z: 20,
                        duration: 0.5,
                        ease: "none"
                    })
                    // Exit
                    .to(card, {
                        opacity: 0,
                        z: 100, // Move past the camera
                        y: -20,
                        scale: 1.1,
                        duration: 0.8,
                        ease: "power2.in"
                    })
            })

        }, containerRef)

        return () => ctx.revert()
    }, [])

    return (
        <section
            ref={containerRef}
            className="relative w-full h-[600vh] bg-white text-dark"
        >
            <div
                ref={wrapperRef}
                className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden perspective-container"
            >
                {/* Video Background */}
                <div className="absolute inset-0 z-0">
                    <video
                        src="/instagram/reels/mobile/reels-1.mp4"
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                    {/* Overlay for readability - Light glass */}
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
                </div>

                {/* Background Decor relative to sticky container */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-white/40 to-white/70 pointer-events-none z-0" />

                {/* Stage */}
                <div className="relative w-full max-w-md h-[400px] flex items-center justify-center" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
                    {cards.map((card, index) => (
                        <a
                            key={card.id}
                            ref={(el) => { cardsRef.current[index] = el }}
                            href={card.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "absolute inset-0 m-auto",
                                "w-[85vw] max-w-[360px] md:max-w-[420px] h-[300px] md:h-[400px]",
                                "bg-white/40 backdrop-blur-2xl border",
                                card.borderColor,
                                "rounded-[2.5rem] shadow-2xl shadow-indigo-500/10",
                                "flex flex-col items-center justify-center text-center p-8",
                                "cursor-pointer group hover:bg-white/60 transition-colors duration-300",
                                "will-change-transform"
                            )}
                            style={{
                                transformStyle: 'preserve-3d',
                                backfaceVisibility: 'hidden'
                            }}
                        >
                            {/* Inner Gradient Glow */}
                            <div className={cn(
                                "absolute inset-0 rounded-[2.5rem] bg-gradient-to-br opacity-50 group-hover:opacity-70 transition-opacity",
                                card.color
                            )} />

                            <div className="relative z-10 flex flex-col items-center gap-6 transform translate-z-10">
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
                        </a>
                    ))}
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-dark/30 pointer-events-none animate-pulse">
                    <span className="text-xs uppercase tracking-widest font-bold">Scroll</span>
                    <div className="w-px h-8 bg-gradient-to-b from-dark/30 to-transparent" />
                </div>
            </div>
        </section>
    )
}
