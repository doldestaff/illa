'use client'

import { useRef, useState, useEffect } from 'react'
import { Info, Store, MapPin, MessageCircle, ShoppingBag, Instagram, ArrowRight, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLenis } from 'lenis/react'

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

// ... LazyVideo component (unchanged) ...

function LazyVideo() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                } else {
                    setIsVisible(false)
                }
            },
            { rootMargin: '200px', threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (isVisible) {
            const playPromise = videoRef.current?.play()
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.log('Auto-play was prevented:', error)
                })
            }
        } else {
            videoRef.current?.pause()
        }
    }, [isVisible])

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 bg-gray-100">
            <div className={cn(
                "absolute inset-0 bg-cover bg-center transition-opacity duration-700 bg-gray-200",
                isVisible ? "opacity-0" : "opacity-100"
            )}
            />
            <video
                ref={videoRef}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-1000",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
                loop muted playsInline preload="none"
                src="/instagram/reels/mobile/Insta-1.mp4"
            />
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
        </div>
    )
}

export function PinnedButtonsParallax() {
    const containerRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<(HTMLAnchorElement | null)[]>([])

    // --- Direct Scroll Logic (No GSAP Scrub) ---
    useLenis(({ scroll }) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const top = rect.top
        const height = rect.height
        const windowH = window.innerHeight

        const scrollableDist = height - windowH
        const rawProgress = -top / scrollableDist
        const progress = Math.max(0, Math.min(1, rawProgress))

        const totalCards = cards.length
        const step = 1 / totalCards
        const overlap = 0.5

        cardsRef.current.forEach((card, i) => {
            if (!card) return

            // Selective child elements for staggered animation
            const content = card.querySelector('.card-content') as HTMLElement
            const icon = card.querySelector('.card-icon') as HTMLElement
            const highlight = card.querySelector('.glass-highlight') as HTMLElement

            // Global Timeline position for this card
            const start = (i * step) - (i > 0 ? (step * overlap) : 0)
            const duration = step + (step * overlap)

            // Local card progress 0..1
            let localP = (progress - start) / duration
            if (localP < 0) localP = 0
            if (localP > 1) localP = 1

            // Cinematic easing functions
            const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
            const easeInCubic = (t: number) => t * t * t

            let opacity = 0
            let y = 100
            let z = -600
            let rotateX = 35
            let scale = 0.7
            let pointerEvents: 'auto' | 'none' = 'none'
            let highlightX = -100

            // ANIMATION CORE - Optimized for first two buttons and better readability
            // Width of the focus plateau (Phase 2): 0.35 to 0.65 (30% of card duration)
            if (i === 0 && localP < 0.65) {
                // FIRST CARD EXCEPTION: Stay focused from the start until it's time to exit
                opacity = 1
                y = 0
                z = 0
                rotateX = 0
                scale = 1
                pointerEvents = 'auto'
                highlightX = 100
            } else if (localP < 0.35) {
                // PHASE 1: ENTERING (0.0 to 0.35)
                const t = localP / 0.35
                const e = easeOutQuart(t)

                opacity = t
                y = 100 * (1 - e)
                z = -600 * (1 - e)
                rotateX = 35 * (1 - e)
                scale = 0.7 + (0.3 * e)
                highlightX = -100 + (200 * e)
            } else if (localP > 0.65) {
                // PHASE 3: EXITING (0.65 to 1.0)
                const t = (localP - 0.65) / 0.35
                const e = easeInCubic(t)

                opacity = 1 - t
                y = -120 * e
                z = 400 * e
                rotateX = -20 * e
                scale = 1 + (0.15 * e)
                highlightX = 100 + (200 * e)
            } else {
                // PHASE 2: CENTER FOCUS (0.35 to 0.65)
                opacity = 1
                y = 0
                z = 0
                rotateX = 0
                scale = 1
                pointerEvents = 'auto'
                highlightX = 100
            }

            // Special handling for section entry: Button 1 must be active immediately
            if (i === 0 && progress < 0.1) {
                opacity = 1; y = 0; z = 0; rotateX = 0; scale = 1; pointerEvents = 'auto';
            }

            // APPLY MAIN CARD TRANSFORMS
            card.style.opacity = opacity.toString()
            card.style.transform = `translate3d(0, ${y}px, ${z}px) rotateX(${rotateX}deg) scale(${scale})`
            card.style.zIndex = pointerEvents === 'auto' ? '50' : Math.round(opacity * 10).toString()
            card.style.pointerEvents = pointerEvents

            // APPLY STAGGERED CHILD ANIMATIONS (Inner Depth)
            if (content) {
                const contentT = Math.max(0, Math.min(1, (localP - 0.1) / 0.8))
                content.style.opacity = (opacity * Math.min(1, contentT * 2)).toString()
                content.style.transform = `translateY(${y * 0.2}px)`
            }
            if (icon) {
                icon.style.transform = `scale(${scale}) translateY(${y * -0.1}px)`
                icon.style.filter = `drop-shadow(0 ${Math.abs(y) * 0.1}px ${20 + Math.abs(z) * 0.05}px rgba(0,0,0,0.2))`
            }
            if (highlight) {
                highlight.style.transform = `translateX(${highlightX}%) skewX(-20deg)`
                // Make highlights brighter for the first two cards to emphasize premium
                const intensity = (i < 2) ? 0.6 : 0.4
                highlight.style.opacity = (opacity * intensity).toString()
            }
        })

    }, [])


    return (
        <section
            ref={containerRef}
            className="relative w-full h-[500vh] bg-white text-dark"
        >
            <div
                className="sticky top-0 w-full h-[100dvh] flex items-center justify-center overflow-hidden touch-pan-y"
            >
                {/* Lazy Video Background */}
                <LazyVideo />

                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-white/20 to-white/60 pointer-events-none z-0" />

                {/* Stage */}
                <div className="relative w-full max-w-md h-[320px] md:h-[400px] flex items-center justify-center [perspective:1000px]">
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
                                "absolute inset-0 m-auto overflow-hidden",
                                "w-[85vw] max-w-[360px] md:max-w-[420px] h-[300px] md:h-[400px]",
                                "bg-white/20 backdrop-blur-md border",
                                card.borderColor,
                                "rounded-[3rem] shadow-[0_8px_32px_0_rgba(255,255,255,0.2)]",
                                "hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:bg-white/30 hover:border-white/80",
                                "flex flex-col items-center justify-center text-center p-8",
                                "cursor-pointer group transition-shadow duration-500 ease-out",
                                "will-change-transform"
                            )}
                            style={{ opacity: 0 }}
                        >
                            {/* Cinematic Glass Highlight Traveler */}
                            <div className="glass-highlight absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-20 pointer-events-none z-20" style={{ transform: 'translateX(-100%)' }} />

                            {/* Inner Cloud Gradient */}
                            <div className={cn(
                                "absolute inset-0 rounded-[3rem] bg-gradient-to-b from-white/40 to-transparent opacity-50 pointer-events-none",
                                card.color
                            )} />

                            <div className="card-content relative z-10 flex flex-col items-center gap-6">
                                <div className={cn(
                                    "card-icon w-24 h-24 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-xl mb-2",
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
