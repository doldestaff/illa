'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Info, Store, MapPin, MessageCircle, ShoppingBag, Instagram, ArrowRight, ArrowUp, ChevronsDown } from 'lucide-react'
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

    useEffect(() => {
        const video = videoRef.current
        const el = containerRef.current
        if (!video || !el) return

        // Ensure play starts even if autoPlay was deferred by browser
        video.play().catch(() => { })

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(() => { })
                } else {
                    video.pause()
                }
            },
            { rootMargin: '100px', threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 bg-[#F5F5F7]">
            <video
                ref={videoRef}
                className="lazy-parallax-video w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                src="/instagram/reels/mobile/Insta-1.mp4"
                style={{
                    transform: `translate3d(0, 0px, 0) scale(1.15)`,
                    willChange: 'transform'
                }}
            />
            {/* iOS Crashing Bug Fix: Do NOT use backdrop-blur over a hardware video tag in a sticky container */}
            <div className="absolute inset-0 bg-white/40" />
        </div>
    )
}

export function PinnedButtonsParallax() {
    const containerRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<(HTMLAnchorElement | null)[]>([])
    const dotsRef = useRef<(HTMLDivElement | null)[]>([])

    type DOMCache = {
        video: HTMLElement | null
        indicator: HTMLElement | null
        upIndicator: HTMLElement | null
        tutorialChevron: HTMLElement | null
        cards: Array<{
            content: HTMLElement | null
            icon: HTMLElement | null
            highlight: HTMLElement | null
        }>
    }
    const domCacheRef = useRef<DOMCache | null>(null)

    const [isTablet, setIsTablet] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Detect tablet (768-1024px) and mobile (<768px) viewports
    useEffect(() => {
        const check = () => {
            const w = window.innerWidth
            setIsTablet(w >= 768 && w < 1024)
            setIsMobile(w < 768)
        }
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    const updateParallaxRef = useRef<(() => void) | undefined>(undefined)

    const updateParallax = useCallback(() => {
        if (!containerRef.current) return

        if (!domCacheRef.current) {
            domCacheRef.current = {
                video: containerRef.current.querySelector('.lazy-parallax-video') as HTMLElement | null,
                indicator: containerRef.current.querySelector('#parallax-scroll-indicator') as HTMLElement | null,
                upIndicator: containerRef.current.querySelector('#scroll-up-indicator') as HTMLElement | null,
                tutorialChevron: containerRef.current.querySelector('#tutorial-chevron-down') as HTMLElement | null,
                cards: cardsRef.current.map(card => {
                    if (!card) return { content: null, icon: null, highlight: null }
                    return {
                        content: card.querySelector('.card-content') as HTMLElement | null,
                        icon: card.querySelector('.card-icon') as HTMLElement | null,
                        highlight: card.querySelector('.glass-highlight') as HTMLElement | null,
                    }
                })
            }
        }

        const cache = domCacheRef.current

        // PERF: Use scrollY + cached offsets instead of getBoundingClientRect()
        // getBoundingClientRect forces a synchronous layout/reflow on every call
        const scrollY = window.scrollY || window.pageYOffset
        const containerTop = containerRef.current.offsetTop
        const height = containerRef.current.offsetHeight
        const windowH = window.innerHeight
        const scrollableDist = height - windowH
        const rawProgress = (scrollY - containerTop) / scrollableDist

        const progress = Math.max(0, Math.min(1, rawProgress));

        // Background Parallax Update (Sync with scroll)
        if (cache.video) {
            const videoY = (progress - 0.5) * 60 // Subtle movement
            cache.video.style.transform = `translate3d(0, ${videoY}px, 0) scale(1.15)`
        }

        const totalCards = cards.length
        const step = 1 / totalCards
        // Mobile: less overlap = clear card separation; tablet/desktop: more cinematic overlap
        const overlap = isTablet ? 0.35 : isMobile ? 0.15 : 0.6

        // ── Hold-curve for mobile ────────────────────────────────────────────────
        // Remaps localP so the center window is compressed to a slow crawl,
        // creating a natural visual pause before the next card enters.
        const applyHoldCurve = (p: number): number => {
            if (!isMobile) return p
            const ENTRY_END = 0.20  // 0..0.20 → fast entry
            const CENTER_START = 0.20
            const CENTER_END = 0.80  // 0.20..0.80 → extremely slow hold (long duration)
            const EXIT_START = 0.80  // 0.80..1 → fast exit
            if (p <= ENTRY_END) {
                // Map 0..0.20 → 0..0.35 (slightly compressed entry)
                return (p / ENTRY_END) * 0.35
            } else if (p <= CENTER_END) {
                // Map 0.20..0.80 → 0.35..0.65 (VERY slow — large plateau / hold zone)
                const t = (p - CENTER_START) / (CENTER_END - CENTER_START)
                return 0.35 + t * 0.30
            } else {
                // Map 0.80..1 → 0.65..1 (slightly compressed exit)
                const t = (p - EXIT_START) / (1 - EXIT_START)
                return 0.65 + t * 0.35
            }
        }

        cardsRef.current.forEach((card, i) => {
            if (!card) return

            const cardCache = cache.cards[i]
            const content = cardCache?.content
            const icon = cardCache?.icon
            const highlight = cardCache?.highlight
            const dot = dotsRef.current[i]

            const start = (i * step) - (i > 0 ? step * overlap : 0)
            const duration = step + step * overlap

            const rawLocalP = Math.max(0, Math.min(1, (progress - start) / duration))
            const localP = applyHoldCurve(rawLocalP)

            // Fade out the scroll indicator when reaching the end (Goal Gradient Effect)
            if (cache.indicator && i === 0) {
                const indicatorOpacity = progress > 0.85 ? Math.max(0, 1 - ((progress - 0.85) / 0.15)) : 1
                cache.indicator.style.opacity = indicatorOpacity.toString()
            }

            const dir = i % 2 === 0 ? -1 : 1

            // 1. BASE CONTINUOUS FLOW: Cards never stop moving, ensuring fluidity.
            // Spans the entire duration from 0 -> 1
            let y = 150 - (300 * localP)
            let z = -100 + (200 * localP)
            let rotateX = 15 - (30 * localP)
            const rotateZ = dir * 4 - (dir * 8 * localP)
            let translateX = dir * 20 - (dir * 40 * localP)
            let scale = 0.85 + (0.25 * localP)

            let opacity = 1
            const highlightX = -100 + (300 * localP)
            const iconScale = 0.9 + (0.2 * localP)
            let glowIntensity = 0.5
            let pointerEvents: 'auto' | 'none' = 'none'

            // 2. ADDITIVE EASING AT EDGES: Adds punch to entry and exit without stopping the base flow.
            if (localP < 0.3) {
                // ENTRY PHASE (0% to 30%)
                const e = localP / 0.3
                const easeOut = 1 - Math.pow(1 - e, 3) // easeOutCubic
                opacity = easeOut
                y += 100 * (1 - easeOut) // Drops in from below
                z -= 300 * (1 - easeOut) // Springs from background
                rotateX += 30 * (1 - easeOut)
                translateX += dir * 40 * (1 - easeOut)
                scale -= 0.15 * (1 - easeOut)
                glowIntensity = easeOut * 0.5
            } else if (localP > 0.7) {
                // EXIT PHASE (70% to 100%)
                const e = (localP - 0.7) / 0.3
                const easeIn = e * e * e // easeInCubic
                opacity = 1 - e
                y -= 100 * easeIn // Floats up faster
                z += 200 * easeIn // Zooms past camera
                rotateX -= 20 * easeIn
                translateX -= dir * 40 * easeIn
                scale += 0.1 * easeIn
                glowIntensity = 0.5 * (1 - e)
            } else {
                // MOMENTUM CENTER (30% to 70%)
                glowIntensity = 0.5 + 0.3 * Math.sin(((localP - 0.3) / 0.4) * Math.PI) // Peak neon in center
            }

            // Always clickable when reasonably visible, overlapping is handled natively by z-index
            pointerEvents = (localP > 0.05 && localP < 0.95) ? 'auto' : 'none'

            card.style.opacity = opacity.toString()
            card.style.transform = `translate3d(${translateX}px, ${y}px, ${z}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scale})`
            card.style.zIndex = Math.round(opacity * 50).toString()
            card.style.pointerEvents = pointerEvents

            // Neon Glow based on continuous intensity
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

        // -- Dynamic UX Interactions --

        // 1. "Deslize de volta" indicator (Pops up at the very end of the scroll)
        if (cache.upIndicator) {
            const showUp = progress > 0.95
            cache.upIndicator.style.opacity = showUp ? '1' : '0'
            cache.upIndicator.style.pointerEvents = showUp ? 'auto' : 'none'
        }

        // 2. Tutorial Chevron (Visible when inside section, hides when reaching the end OR scrolling actively)
        // Note: The active scroll hiding is handled in the lenis onScroll callback via CSS variables or direct style
        // Here we just handle the base visibility based on progress boundaries.
        if (cache.tutorialChevron) {
            const isInside = progress > 0.05 && progress < 0.9
            // Set base opacity, we'll modulate this in the lenis callback based on velocity
            cache.tutorialChevron.style.opacity = isInside ? '1' : '0'
        }
    }, [isTablet, isMobile])

    useEffect(() => {
        updateParallaxRef.current = updateParallax
    })

    const lenis = useLenis((e) => {
        updateParallaxRef.current?.()
        // Pacing & Dynamic Tutorial UX: Hide the tutorial chevron when scrolling actively
        // Using velocity to fade out the chevron. If |velocity| > subtle threshold, hide it.
        if (domCacheRef.current?.tutorialChevron) {
            const cv = domCacheRef.current.tutorialChevron;
            // Base visibility from the parallax loop takes precedence (if out of bounds, opacity is 0 string)
            if (cv.style.opacity !== '0') {
                const isActiveScrolling = Math.abs(e.velocity) > 0.5;
                cv.style.opacity = isActiveScrolling ? '0.1' : '1';
            }
        }
    })

    useEffect(() => {
        // PERF: Only use native scroll listener on mobile where Lenis is disabled.
        // On desktop/tablet Lenis already calls updateParallax via useLenis hook.
        if (!isMobile) {
            // Still need initial paint
            updateParallaxRef.current?.()
            return
        }

        let rafId: number
        const onScroll = () => {
            cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(() => updateParallaxRef.current?.())
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        // Initial setup to paint first frame
        updateParallaxRef.current?.()

        return () => {
            window.removeEventListener('scroll', onScroll)
            cancelAnimationFrame(rafId)
        }
    }, [isMobile])

    return (
        <section
            ref={containerRef}
            className={cn('relative w-full bg-white text-dark', isTablet ? 'h-[550vh]' : isMobile ? 'h-[700vh]' : 'h-[400vh]')}
        >
            <div className="sticky top-0 w-full h-[100vh] min-h-[100dvh] flex items-center justify-center overflow-hidden">

                <LazyVideo />

                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,_rgba(255,255,255,0.5)_0%,_transparent_70%)] pointer-events-none z-0" />

                <div className="relative w-full max-w-md md:max-w-xl h-[380px] md:h-[480px] flex items-center justify-center [perspective:1000px]">
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
                                    if (lenis) {
                                        lenis.scrollTo(card.href, { offset: -50 })
                                    } else {
                                        const target = document.querySelector(card.href)
                                        if (target) {
                                            const y = target.getBoundingClientRect().top + window.scrollY - 50
                                            window.scrollTo({ top: y, behavior: 'smooth' })
                                        }
                                    }
                                }
                            }}
                            className={cn(
                                'absolute inset-0 m-auto overflow-hidden',
                                'w-[85vw] max-w-[360px] md:max-w-[520px] h-[360px] md:h-[480px]',
                                'bg-white/80 border border-white/60',
                                'rounded-[3rem] shadow-[0_8px_48px_0_rgba(255,255,255,0.4),0_2px_8px_0_rgba(0,0,0,0.08)]',
                                'flex flex-col items-center justify-center text-center p-6 md:p-10',
                                'cursor-pointer group',
                                'hover:bg-white/45 hover:border-white/80 hover:shadow-[0_12px_60px_0_rgba(255,255,255,0.6)]',
                                'transition-shadow duration-500',
                            )}
                            style={{ opacity: 0, willChange: 'transform, opacity', transform: 'translateZ(0)' }}
                        >
                            <div
                                className="glass-highlight absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-20"
                                style={{ transform: 'translateX(-100%) skewX(-15deg)' }}
                            />

                            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/40 to-transparent rounded-t-[3rem] pointer-events-none" />

                            <div className="card-content relative z-10 flex flex-col items-center gap-4 md:gap-6">
                                <div
                                    className={cn(
                                        'card-icon w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center',
                                        'bg-white/90 shadow-lg ring-2 ring-white/50',
                                        'text-illa-pink',
                                        'group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out',
                                    )}
                                >
                                    <card.icon size={32} className="md:w-[48px] md:h-[48px]" strokeWidth={1.5} />
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-bold text-3xl md:text-5xl font-script bg-clip-text text-transparent bg-gradient-to-br from-white via-white/95 to-white/70 [filter:drop-shadow(3px_3px_0px_#E5017D)] uppercase tracking-tight">
                                        {card.title}
                                    </h3>
                                    <p className="text-[#2D2D30] font-medium leading-relaxed max-w-[270px] md:max-w-[320px] mx-auto text-sm md:text-base tracking-wide opacity-80 transition-opacity group-hover:opacity-100">
                                        {card.description}
                                    </p>
                                </div>

                                <div className="mt-2 md:mt-4 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-[0.15em] text-white bg-illa-pink/85 px-6 py-3 md:px-8 md:py-4 rounded-full shadow-[0_4px_12px_rgba(229,1,125,0.2)] group-hover:bg-illa-pink group-hover:shadow-[0_8px_24px_rgba(229,1,125,0.4)] transition-all duration-300 transform group-hover:-translate-y-0.5">
                                    {card.label} <ArrowRight size={14} className="md:w-5 md:h-5 md:ml-1 group-hover:translate-x-0.5 transition-transform" />
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

                {/* Cinematic Plasmatic Scroll Indicator (UX: Von Restorff & Continuation) */}
                <div id="parallax-scroll-indicator" className="absolute right-3 md:right-8 top-[60%] -translate-y-1/2 flex flex-col items-center gap-3 pointer-events-none z-40 transition-opacity duration-300">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 [writing-mode:vertical-rl] drop-shadow-md">
                        Explore
                    </span>
                    <div className="w-[3px] h-16 md:h-24 rounded-full bg-black/20 relative overflow-hidden border border-white/10 shadow-[inset_0_0_4px_rgba(0,0,0,0.5)]">
                        <div
                            className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-illa-pink to-white rounded-full"
                            style={{
                                animation: 'parallax-scroll-indicator 2s cubic-bezier(0.65, 0, 0.35, 1) infinite',
                                filter: 'drop-shadow(0 0 6px rgba(229,1,125,0.8))'
                            }}
                        />
                    </div>
                </div>

                {/* Mobile Scroll Up Indicator at the very end of the section */}
                <div id="scroll-up-indicator" className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-50 transition-opacity duration-300 opacity-0 md:hidden">
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            const section = containerRef.current
                            if (section && lenis) {
                                // Scroll just enough up to activate scrolling reverse flow easily
                                lenis.scrollTo(section.getBoundingClientRect().top + window.scrollY - 100)
                            } else {
                                window.scrollTo({ top: window.scrollY - window.innerHeight * 0.5, behavior: 'smooth' })
                            }
                        }}
                        className="flex flex-col items-center gap-2 group pointer-events-auto filter drop-shadow-[0_4px_12px_rgba(229,1,125,0.4)]"
                        aria-label="Voltar para cima"
                    >
                        <ArrowUp size={36} className="text-illa-pink animate-bounce transition-transform group-hover:-translate-y-1 drop-shadow-md" strokeWidth={2.5} />
                        <span className="text-illa-pink text-[12px] font-black uppercase tracking-[0.2em] text-center w-max drop-shadow-sm">
                            Deslize de volta
                        </span>
                    </button>
                </div>

                {/* Dynamic Scroll Tutorial Chevron */}
                <div id="tutorial-chevron-down" className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-50 transition-opacity duration-[400ms] opacity-0">
                    <ChevronsDown size={56} opacity={0.8} className="text-illa-pink animate-bounce drop-shadow-[0_4px_16px_rgba(229,1,125,0.5)]" strokeWidth={1.5} />
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes parallax-scroll-indicator {
                        0% { transform: translateY(-100%); opacity: 0; }
                        20% { opacity: 1; }
                        80% { opacity: 1; }
                        100% { transform: translateY(200%); opacity: 0; }
                    }
                `}} />
            </div>
        </section>
    )
}
