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
        href: '#locations',
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
            { rootMargin: '400px', threshold: 0.01 }
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
        <div ref={containerRef} className="absolute inset-0 z-0 bg-[#F5F5F7]">
            <video
                ref={videoRef}
                className={cn(
                    'lazy-parallax-video w-full h-full object-cover transition-opacity duration-1000',
                    isVisible ? 'opacity-100' : 'opacity-0'
                )}
                loop muted playsInline preload="auto"
                src="/instagram/reels/mobile/Insta-1.mp4"
                style={{
                    transform: `translate3d(0, 0px, 0) scale(1.15)`,
                    willChange: 'transform'
                }}
            />
            <div className="absolute inset-0 bg-white/35 backdrop-blur-[2px]" />
        </div>
    )
}

export function PinnedButtonsParallax() {
    const containerRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<(HTMLAnchorElement | null)[]>([])
    const dotsRef = useRef<(HTMLDivElement | null)[]>([])

    const lenis = useLenis(() => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const height = rect.height
        const windowH = window.innerHeight
        const scrollableDist = height - windowH
        const rawProgress = -rect.top / scrollableDist

        const progress = Math.max(0, Math.min(1, rawProgress));

        // Background Parallax Update (Sync with scroll)
        const video = containerRef.current.querySelector('.lazy-parallax-video') as HTMLElement
        if (video) {
            const videoY = (progress - 0.5) * 60 // Subtle movement
            video.style.transform = `translate3d(0, ${videoY}px, 0) scale(1.15)`
        }

        const totalCards = cards.length
        const step = 1 / totalCards
        const overlap = 0.6

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

            const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
            const easeInOutQuint = (t: number) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2

            let opacity = 0
            let y = 140
            let z = -400
            let rotateX = 45
            let rotateZ = (i % 2 === 0 ? -1 : 1) * 8
            let translateX = (i % 2 === 0 ? -1 : 1) * 60
            let scale = 0.75
            let pointerEvents: 'auto' | 'none' = 'none'
            let highlightX = -100
            let iconScale = 0.7
            let glowIntensity = 0

            if (localP < 0.35) {
                const t = localP / 0.35
                const e = easeOutExpo(t)
                opacity = t
                y = 140 * (1 - e)
                z = -400 * (1 - e)
                translateX = (i % 2 === 0 ? -1 : 1) * 60 * (1 - e)
                rotateX = 45 * (1 - e)
                rotateZ = (i % 2 === 0 ? -1 : 1) * 8 * (1 - e)
                scale = 0.75 + 0.25 * e
                iconScale = 0.7 + 0.3 * e
                highlightX = -100 + 150 * e
                glowIntensity = e * 0.5
            } else if (localP > 0.65) {
                const t = (localP - 0.65) / 0.35
                const e = easeInOutQuint(t)
                opacity = 1 - t
                y = -150 * e
                z = 200 * e
                translateX = (i % 2 === 0 ? 0.3 : -0.3) * 40 * e
                rotateX = -15 * e
                rotateZ = (i % 2 === 0 ? 1 : -1) * 4 * e
                scale = 1 + 0.1 * e
                iconScale = 1 + 0.05 * e
                highlightX = 50 + 150 * e
                glowIntensity = 0.5 * (1 - t)
            } else {
                const mt = (localP - 0.35) / 0.3
                opacity = 1
                y = -15 * mt
                z = 20 * mt
                translateX = 0
                rotateX = -5 * mt
                rotateZ = 0
                scale = 1 + 0.05 * mt
                iconScale = 1
                pointerEvents = 'auto'
                highlightX = 50 + 50 * mt
                glowIntensity = 0.5 + 0.2 * Math.sin(mt * Math.PI)
            }

            card.style.opacity = opacity.toString()
            card.style.transform = `translate3d(${translateX}px, ${y}px, ${z}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scale})`
            card.style.zIndex = pointerEvents === 'auto' ? '50' : Math.round(opacity * 20).toString()
            card.style.pointerEvents = pointerEvents

            card.style.borderColor = `rgba(229,1,125,${0.1 + (glowIntensity * 0.3)})`
            card.style.boxShadow = `0 ${8 + (glowIntensity * 10)}px ${30 + (glowIntensity * 20)}px rgba(229,1,125,${glowIntensity * 0.4})`

            if (content) {
                content.style.opacity = (opacity * Math.min(1, ((localP - 0.05) / 0.9) * 2)).toString()
                content.style.transform = `translateY(${y * 0.1}px)`
            }
            if (icon) {
                icon.style.transform = `scale(${iconScale})`
            }
            if (highlight) {
                highlight.style.transform = `translateX(${highlightX}%) skewX(-15deg)`
                highlight.style.opacity = (opacity * 0.4).toString()
            }

            if (dot) {
                const isActive = pointerEvents === 'auto'
                dot.style.background = isActive ? '#E5017D' : 'rgba(0,0,0,0.15)'
                dot.style.transform = isActive ? `scale(${1.2 + (glowIntensity * 0.4)})` : 'scale(1)'
                dot.style.opacity = (0.3 + (opacity * 0.7)).toString()
            }
        })
    }, [])

    return (
        <section
            ref={containerRef}
            className="relative w-full h-[400vh] bg-white text-dark"
        >
            <div className="sticky top-0 w-full h-[100dvh] flex items-center justify-center overflow-hidden touch-pan-y">

                <LazyVideo />

                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,_rgba(255,255,255,0.5)_0%,_transparent_70%)] pointer-events-none z-0" />

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
                                } else if (card.href.startsWith('#')) {
                                    e.preventDefault()
                                    lenis?.scrollTo(card.href, { offset: -50 })
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
                            <div
                                className="glass-highlight absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-20"
                                style={{ transform: 'translateX(-100%) skewX(-15deg)' }}
                            />

                            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/40 to-transparent rounded-t-[3rem] pointer-events-none" />

                            <div className="card-content relative z-10 flex flex-col items-center gap-4 md:gap-5">
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
                                    <h3 className="font-bold text-3xl md:text-4xl font-script bg-clip-text text-transparent bg-gradient-to-br from-white via-white/95 to-white/70 drop-shadow-sm">
                                        {card.title}
                                    </h3>
                                    <p className="text-[#2D2D30] font-medium leading-relaxed max-w-[270px] mx-auto text-sm tracking-wide opacity-80 transition-opacity group-hover:opacity-100">
                                        {card.description}
                                    </p>
                                </div>

                                <div className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white bg-illa-pink/85 px-6 py-3 rounded-full shadow-[0_4px_12px_rgba(229,1,125,0.2)] group-hover:bg-illa-pink group-hover:shadow-[0_8px_24px_rgba(229,1,125,0.4)] transition-all duration-300 transform group-hover:-translate-y-0.5">
                                    {card.label} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

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
