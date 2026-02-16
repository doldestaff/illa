'use client'

import { useRef, useLayoutEffect } from 'react'
import { Info, Store, MapPin, MessageCircle, ShoppingBag, Instagram, ArrowRight, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const cards = [
    {
        id: 1,
        title: 'Sobre Nós',
        description: 'Conheça nossa história de sabor e tradição.',
        icon: Info,
        href: '#',
        action: 'open-about-modal' as const,
        color: 'from-pink-500/10 to-purple-500/10',
        borderColor: 'border-white/50'
    },
    {
        id: 2,
        title: 'Seja um Franqueado',
        description: 'Leve a magia da Illa para sua cidade.',
        icon: Store,
        href: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias',
        color: 'from-blue-500/10 to-cyan-500/10',
        borderColor: 'border-white/50'
    },
    {
        id: 3,
        title: 'Pedir no WhatsApp',
        description: 'Fale com a gente e peça seu favorito.',
        icon: MessageCircle,
        href: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%AA%21+Vim+do+site+da+Illa%21&type=phone_number&app_absent=0',
        color: 'from-green-500/10 to-teal-500/10',
        borderColor: 'border-white/50'
    },
    {
        id: 4,
        title: 'Peça no iFood',
        description: 'Receba Illa no conforto de casa.',
        icon: ShoppingBag,
        href: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04',
        color: 'from-red-500/10 to-orange-500/10',
        borderColor: 'border-white/50'
    },
    {
        id: 5,
        title: 'Nossas Lojas',
        description: 'Encontre a unidade Illa mais próxima de você.',
        icon: MapPin,
        href: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8',
        color: 'from-emerald-500/10 to-green-500/10',
        borderColor: 'border-white/50'
    },
    {
        id: 6,
        title: 'Instagram',
        description: 'Siga @illasorvetesoficial e fique por dentro.',
        icon: Instagram,
        href: 'https://www.instagram.com/illasorvetesoficial/',
        color: 'from-purple-500/10 to-pink-500/10',
        borderColor: 'border-white/50'
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
                    scrub: 0.8,
                }
            })

            // Initial state: All cards hidden below, scaled down
            cardsRef.current.forEach((card) => {
                if (!card) return
                gsap.set(card, {
                    opacity: 0,
                    y: 80,
                    scale: 0.85,
                    zIndex: 0,
                })
            })

            // Sequence: Each card enters → holds → exits
            cardsRef.current.forEach((card, i) => {
                if (!card) return
                const zBase = cards.length - i

                // Enter
                tl.to(card, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    zIndex: zBase + 10,
                    duration: 1,
                    ease: "power2.out"
                })
                    // Hold
                    .to(card, {
                        scale: 1.02,
                        duration: 0.6,
                        ease: "none"
                    })
                    // Exit
                    .to(card, {
                        opacity: 0,
                        y: -60,
                        scale: 1.08,
                        zIndex: 0,
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
                className="sticky top-0 w-full h-[100dvh] flex items-center justify-center overflow-hidden"
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
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                </div>

                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-white/20 to-white/60 pointer-events-none z-0" />

                {/* Stage */}
                <div className="relative w-full max-w-md h-[320px] md:h-[400px] flex items-center justify-center">
                    {cards.map((card, index) => (
                        <a
                            key={card.id}
                            ref={(el) => { cardsRef.current[index] = el }}
                            href={card.href}
                            target={'action' in card ? undefined : '_blank'}
                            rel={'action' in card ? undefined : 'noopener noreferrer'}
                            onClick={(e) => {
                                if ('action' in card && card.action) {
                                    e.preventDefault()
                                    window.dispatchEvent(new CustomEvent(card.action))
                                }
                            }}
                            className={cn(
                                "absolute inset-0 m-auto",
                                "w-[85vw] max-w-[360px] md:max-w-[420px] h-[300px] md:h-[400px]",
                                "bg-white/20 backdrop-blur-3xl border",
                                card.borderColor,
                                "rounded-[3rem] shadow-[0_8px_32px_0_rgba(255,255,255,0.2)]",
                                "hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:bg-white/30 hover:border-white/80",
                                "flex flex-col items-center justify-center text-center p-8",
                                "cursor-pointer group transition-shadow duration-500 ease-out",
                                "will-change-transform"
                            )}
                        >
                            {/* Inner Cloud Gradient */}
                            <div className={cn(
                                "absolute inset-0 rounded-[3rem] bg-gradient-to-b from-white/40 to-transparent opacity-50 pointer-events-none",
                                card.color
                            )} />

                            <div className="relative z-10 flex flex-col items-center gap-6">
                                <div className={cn(
                                    "w-24 h-24 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-xl mb-2",
                                    "group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out",
                                    "text-illa-pink ring-4 ring-white/30"
                                )}>
                                    <card.icon size={40} strokeWidth={1.5} />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-bold text-4xl font-script text-dark drop-shadow-sm">{card.title}</h3>
                                    <p className="text-dark/80 font-medium leading-relaxed max-w-[280px] mx-auto text-sm tracking-wide">
                                        {card.description}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-illa-pink/90 px-4 py-2 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 transform">
                                    Acessar <ArrowRight size={14} />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Premium Scroll Indicator */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70 pointer-events-none z-20 mix-blend-overlay animate-pulse md:hidden">
                    <ArrowUp className="animate-bounce mb-1" size={24} strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">Scroll</span>
                </div>
            </div>
        </section>
    )
}
