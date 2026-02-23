'use client'

import { useRef, useState, useEffect } from 'react'
import { Info, Store, MapPin, MessageCircle, ShoppingBag, Instagram, ArrowRight } from 'lucide-react'
import { useLenis } from 'lenis/react'
import { cn } from '@/lib/utils'

const cards = [
    {
        id: 1,
        title: 'Sobre Nós',
        description: 'Conheça nossa história de sabor e tradição.',
        icon: Info,
        href: '#',
        action: 'open-about-modal' as const,
        label: 'Descobrir',
    },
    {
        id: 2,
        title: 'Seja Franqueado',
        description: 'Leve a magia da Illa para sua cidade.',
        icon: Store,
        href: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias',
        label: 'Quero franquia',
    },
    {
        id: 3,
        title: 'Pedir no WhatsApp',
        description: 'Fale com a gente e peça seu favorito.',
        icon: MessageCircle,
        href: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%AA%21+Vim+do+site+da+Illa%21&type=phone_number&app_absent=0',
        label: 'Chamar agora',
    },
    {
        id: 4,
        title: 'Peça no iFood',
        description: 'Receba Illa no conforto de casa.',
        icon: ShoppingBag,
        href: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04',
        label: 'Pedir agora',
    },
    {
        id: 5,
        title: 'Nossas Lojas',
        description: 'Encontre a unidade Illa mais próxima.',
        icon: MapPin,
        href: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8',
        label: 'Ver no mapa',
    },
    {
        id: 6,
        title: 'Instagram',
        description: 'Siga @illasorvetesoficial e inspire-se.',
        icon: Instagram,
        href: 'https://www.instagram.com/illasorvetesoficial/',
        label: 'Seguir',
    },
]

function LazyVideo() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { rootMargin: '200px', threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (isVisible) {
            videoRef.current?.play().catch(() => { })
        } else {
            videoRef.current?.pause()
        }
    }, [isVisible])

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 bg-gray-100">
            <video
                ref={videoRef}
                className={cn(
                    'w-full h-full object-cover transition-opacity duration-1000',
                    isVisible ? 'opacity-100' : 'opacity-0'
                )}
                loop muted playsInline preload="none"
                src="/instagram/reels/mobile/Insta-1.mp4"
            />
            {/* Soft white smoke veil over video */}
            <div className="absolute inset-0 bg-white/25 backdrop-blur-[1px]" />
        </div>
    )
}

export function PinnedButtonsParallax() {
    const containerRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<(HTMLAnchorElement | null)[]>([])
    const dotsRef = useRef<(HTMLDivElement | null)[]>([])

    useLenis(() => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const height = rect.height
        const windowH = window.innerHeight
        const scrollableDist = height - windowH
        const rawProgress = -rect.top / scrollableDist

        // Add a 15% scroll delay at the beginning before animation starts
        // This keeps the 'Sobre Nós' card completely still when Section 2 first pins.
        const START_DELAY = 0.15;
        let progress = 0;

        if (rawProgress > START_DELAY) {
            progress = Math.max(0, Math.min(1, (rawProgress - START_DELAY) / (1 - START_DELAY)));
        }

        const totalCards = cards.length
        const step = 1 / totalCards
        const overlap = 0.5

        cardsRef.current.forEach((card, i) => {
            if (!card) return

            const content = card.querySelector('.card-content') as HTMLElement | null
            const icon = card.querySelector('.card-icon') as HTMLElement | null
            const highlight = card.querySelector('.glass-highlight') as HTMLElement | null
            const dot = dotsRef.current[i]

            const start = (i * step) - (i > 0 ? step * overlap : 0)
            const duration = step + step * overlap

            let localP = (progress - start) / duration
            localP = Math.max(0, Math.min(1, localP))

            const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
            const easeInCubic = (t: number) => t * t * t

            let opacity = 0
            let y = 110
            let z = -500
            let rotateX = 60
            let rotateZ = (i % 2 === 0 ? -1 : 1) * 10
            let translateX = (i % 2 === 0 ? -1 : 1) * 80
            let scale = 0.6
            let pointerEvents: 'auto' | 'none' = 'none'
            let highlightX = -100
            let iconScale = 0.5
            let glowIntensity = 0 // <-- NEON INTENSITY

            const isFirstActive = i === 0 && localP < 0.65

            if (isFirstActive) {
                opacity = 1; y = 0; z = 0; rotateX = 0; rotateZ = 0
                translateX = 0; scale = 1; iconScale = 1; pointerEvents = 'auto'
                highlightX = 100; glowIntensity = 1
            } else if (localP < 0.35) {
                const t = localP / 0.35
                const e = easeOutQuart(t)
                opacity = t
                y = 110 * (1 - e)
                z = -500 * (1 - e)
                translateX = (i % 2 === 0 ? -1 : 1) * 80 * (1 - e)
                rotateX = 60 * (1 - e)
                rotateZ = (i % 2 === 0 ? -1 : 1) * 10 * (1 - e)
                scale = 0.6 + 0.4 * e
                iconScale = 0.5 + 0.5 * e
                highlightX = -100 + 200 * e
                glowIntensity = e
            } else if (localP > 0.65) {
                const t = (localP - 0.65) / 0.35
                const e = easeInCubic(t)
                opacity = 1 - t
                y = -120 * e
                z = 300 * e
                translateX = 0
                rotateX = -20 * e
                rotateZ = 0
                scale = 1 + 0.15 * e
                iconScale = 1 + 0.1 * e
                highlightX = 100 + 200 * e
                glowIntensity = 1 - e
            } else {
                // CENTER FOCUS — fully active
                opacity = 1; y = 0; z = 0; rotateX = 0; rotateZ = 0
                translateX = 0; scale = 1; iconScale = 1
                pointerEvents = 'auto'
                highlightX = 100
                glowIntensity = 1
            }

            // Override for section entry
            if (i === 0 && progress < 0.1) {
                opacity = 1; y = 0; z = 0; rotateX = 0; rotateZ = 0
                translateX = 0; scale = 1; iconScale = 1; pointerEvents = 'auto'
                glowIntensity = 1
            }

            card.style.opacity = opacity.toString()
            card.style.transform = `translate3d(${translateX}px, ${y}px, ${z}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scale})`
            card.style.zIndex = pointerEvents === 'auto' ? '50' : Math.round(opacity * 10).toString()
            card.style.pointerEvents = pointerEvents

            // Neon Glow FX (Pink & White)
            card.style.borderColor = `rgba(229,1,125,${0.2 + (glowIntensity * 0.4)})`
            card.style.boxShadow = `
                0 8px 48px 0 rgba(255,255,255,0.4), 
                0 0 ${glowIntensity * 40}px rgba(229,1,125,${glowIntensity * 0.7}), 
                0 0 ${glowIntensity * 15}px rgba(255,255,255,${glowIntensity})
            `

            if (content) {
                content.style.opacity = (opacity * Math.min(1, ((localP - 0.1) / 0.8) * 2)).toString()
                content.style.transform = `translateY(${y * 0.15}px)`
            }
            if (icon) {
                icon.style.transform = `scale(${scale * iconScale}) translateY(${y * -0.08}px)`
            }
            if (highlight) {
                highlight.style.transform = `translateX(${highlightX}%) skewX(-20deg)`
                highlight.style.opacity = (opacity * 0.5).toString()
            }

            // Progress dot
            if (dot) {
                const isActive = pointerEvents === 'auto'
                dot.style.background = isActive ? 'rgba(229,1,125,0.8)' : 'rgba(0,0,0,0.2)'
                dot.style.transform = isActive ? 'scale(1.5)' : 'scale(1)'
                dot.style.boxShadow = isActive ? '0 0 8px rgba(229,1,125,0.5)' : 'none'
            }
        })
    }, [])

    return (
        <section
            ref={containerRef}
            className="relative w-full h-[400vh] bg-white text-dark"
        >
            <div className="sticky top-0 w-full h-[100dvh] flex items-center justify-center overflow-hidden touch-pan-y">

                {/* Video Background */}
                <LazyVideo />

                {/* Radial softness — centre of stage */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,_rgba(255,255,255,0.5)_0%,_transparent_70%)] pointer-events-none z-0" />

                {/* Card stage */}
                <div className="relative w-full max-w-md h-[380px] flex items-center justify-center [perspective:1000px]">
                    {cards.map((card, index) => (
                        <a
                            key={card.id}
                            ref={el => { cardsRef.current[index] = el }}
                            href={card.href}
                            target={'action' in card ? undefined : '_blank'}
                            rel={'action' in card ? undefined : 'noopener noreferrer'}
                            onClick={e => {
                                if ('action' in card && card.action) {
                                    e.preventDefault()
                                    window.dispatchEvent(new CustomEvent(card.action))
                                }
                            }}
                            className={cn(
                                'absolute inset-0 m-auto overflow-hidden',
                                'w-[85vw] max-w-[360px] md:max-w-[420px] h-[360px] md:h-[400px]',
                                'bg-white/30 backdrop-blur-2xl border border-white/60',
                                'rounded-[3rem] shadow-[0_8px_48px_0_rgba(255,255,255,0.4),0_2px_8px_0_rgba(0,0,0,0.08)]',
                                'flex flex-col items-center justify-center text-center p-6 md:p-8',
                                'cursor-pointer group',
                                'hover:bg-white/45 hover:border-white/80 hover:shadow-[0_12px_60px_0_rgba(255,255,255,0.6)]',
                                'transition-shadow duration-500',
                            )}
                            style={{ opacity: 0, willChange: 'transform, opacity' }}
                        >
                            {/* Sweeping glass highlight */}
                            <div
                                className="glass-highlight absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-20"
                                style={{ transform: 'translateX(-100%) skewX(-20deg)' }}
                            />

                            {/* Soft inner glow top */}
                            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/40 to-transparent rounded-t-[3rem] pointer-events-none" />

                            <div className="card-content relative z-10 flex flex-col items-center gap-4 md:gap-5">
                                {/* Icon */}
                                <div
                                    className={cn(
                                        'card-icon w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center',
                                        'bg-white/70 backdrop-blur-sm shadow-lg ring-2 ring-white/50',
                                        'text-illa-pink',
                                        'group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out',
                                    )}
                                >
                                    <card.icon size={32} className="md:w-[40px] md:h-[40px]" strokeWidth={1.5} />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-bold text-3xl md:text-4xl font-script text-dark drop-shadow-sm">
                                        {card.title}
                                    </h3>
                                    <p className="text-dark/70 font-medium leading-relaxed max-w-[270px] mx-auto text-sm tracking-wide">
                                        {card.description}
                                    </p>
                                </div>

                                {/* CTA */}
                                <div className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-illa-pink/85 px-5 py-2.5 rounded-full shadow-md shadow-pink-200/40 group-hover:bg-illa-pink group-hover:shadow-xl transition-all duration-300">
                                    {card.label} <ArrowRight size={13} />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Progress dots */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none z-30">
                    {cards.map((card, i) => (
                        <div
                            key={card.id}
                            ref={el => { dotsRef.current[i] = el }}
                            className="w-2 h-2 rounded-full transition-all duration-300"
                            style={{ background: 'rgba(0,0,0,0.2)' }}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
