'use client'

import { useState, MouseEvent, useEffect, useSyncExternalStore } from 'react'
import { motion, useTransform, MotionValue, AnimatePresence } from 'framer-motion'
import { MessageCircle, MapPin, ShoppingBag, Store, X, ArrowRight, ChevronUp } from 'lucide-react'
import { useLenis } from 'lenis/react'
import { createPortal } from 'react-dom'

function subscribe() { return () => { } }
function useIsClientMounted() {
    return useSyncExternalStore(subscribe, () => true, () => false)
}

// ─── External Link Warning Modal ────────────────────────────────────────────
function ExternalLinkWarningModal({ isOpen, link, onClose }: { isOpen: boolean, link: string | null, onClose: () => void }) {
    const mounted = useIsClientMounted()
    const [lastLink, setLastLink] = useState<string | null>(null)

    useEffect(() => {
        if (link) setLastLink(link)
    }, [link])

    if (!mounted) return null

    const displayLink = link || lastLink

    return createPortal(
        <AnimatePresence>
            {isOpen && displayLink && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto"
                    onClick={onClose}
                >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 sm:p-8 flex flex-col items-center gap-6 shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-illa-pink via-pink-400 to-illa-yellow opacity-20 blur-md" />
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-illa-yellow/30 blur-2xl" />
                    <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-illa-pink/20 blur-2xl" />

                    <motion.div
                        initial={{ scale: 0.5, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
                        className="relative w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-illa-pink to-pink-500 shadow-[0_12px_24px_rgba(229,1,125,0.4)] flex items-center justify-center text-white mb-2"
                    >
                        <MessageCircle size={40} strokeWidth={2.5} className="drop-shadow-md" />
                    </motion.div>

                    <div className="text-center relative z-10 flex flex-col gap-2">
                        <h3 className="text-[26px] font-black tracking-tight bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent leading-tight">Saindo do Universo Illa?</h3>
                        <p className="text-[15px] font-medium text-slate-500 leading-relaxed px-1">
                            Você será redirecionado para um site externo. Deseja continuar ou ficar no nosso universo?
                        </p>
                    </div>

                    <div className="flex flex-col w-full gap-3 mt-2 relative z-10">
                        <button
                            onClick={() => {
                                window.open(link || '#', '_blank', 'noopener,noreferrer')
                                setTimeout(onClose, 300)
                            }}
                            className="w-full py-4 bg-illa-pink text-white font-black tracking-wide rounded-2xl text-[15px] flex items-center justify-center transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-illa-pink/40 hover:shadow-illa-pink/60 hover:bg-pink-500"
                        >
                            Continuar para fora
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 text-slate-600 font-bold tracking-wide rounded-2xl text-[15px] flex items-center justify-center transition-colors hover:bg-slate-100 active:bg-slate-200"
                        >
                            Ficar no Universo Illa
                        </button>
                    </div>
                </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

// ─── Hero Button Popup (Mobile / Tablet) ─────────────────────────────────────
interface ButtonPopupData {
    icon: React.ElementType
    title: string
    subtitle: string
    description: string
    cta: string
    ctaLink: string
    gradient: string
    isExternal?: boolean
    isScroll?: boolean
    isModal?: string
}

const buttonPopups: Record<string, ButtonPopupData> = {
    'PEDIR NO WHATSAPP': {
        icon: MessageCircle,
        title: 'Pedir no WhatsApp',
        subtitle: 'Atendimento exclusivo e rápido',
        description: 'Fale diretamente com nossa equipe, receba sugestões personalizadas e faça seu pedido especial. A Illa te atende com toda a atenção que você merece! 🩷',
        cta: 'Chamar agora',
        ctaLink: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%21+Vim+do+site+da+Illa%21',
        gradient: 'from-emerald-400 to-green-500',
        isExternal: true,
    },
    'IFOOD': {
        icon: ShoppingBag,
        title: 'Peça pelo iFood',
        subtitle: 'Entrega rápida na sua porta',
        description: 'Receba seus sorvetes favoritos no conforto de casa, com a agilidade e confiança do maior app de delivery do Brasil. 🍦',
        cta: 'Pedir agora',
        ctaLink: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04',
        gradient: 'from-red-500 to-rose-400',
        isExternal: true,
    },
    'LOCALIZAÇÃO': {
        icon: MapPin,
        title: 'Nossas Lojas',
        subtitle: 'Encontre a unidade mais perto',
        description: 'Visite nossas lojas e experimente o universo Illa presencialmente. Sorrisos garantidos desde a entrada. 📍',
        cta: 'Ver no mapa',
        ctaLink: '#locations',
        gradient: 'from-sky-400 to-blue-500',
        isScroll: true,
    },
    'FRANQUIAS': {
        icon: Store,
        title: 'Seja Franqueado',
        subtitle: 'Leve a magia Illa para sua cidade',
        description: 'Abra sua própria unidade Illa e faça parte de uma das marcas mais amadas do Brasil. Lucratividade, suporte e identidade única te esperam! 🌟',
        cta: 'Quero saber mais',
        ctaLink: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias',
        gradient: 'from-illa-pink to-pink-400',
        isExternal: true,
    },
}

function HeroButtonPopup({ btn, isOpen, onClose, lenis }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    btn: { label: string; icon: React.ElementType; link: string } | null, isOpen: boolean, onClose: () => void, lenis: any
}) {
    // Lock scroll when popup opens
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            if (lenis) lenis.stop()
        } else {
            document.body.style.overflow = ''
            if (lenis) lenis.start()
        }
        return () => {
            document.body.style.overflow = ''
            if (lenis) lenis.start()
        }
    }, [isOpen, lenis])

    const mounted = useIsClientMounted()
    
    // Store the last active data so the exit animation has content to render
    const [lastData, setLastData] = useState<ButtonPopupData | null>(null)
    useEffect(() => {
        if (btn && buttonPopups[btn.label]) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setLastData(buttonPopups[btn.label])
        }
    }, [btn])

    if (!mounted) return null

    const data = btn ? buttonPopups[btn.label] : lastData
    if (!data) return null

    const Icon = data.icon

    const handleCta = () => {
        if (data.isScroll) {
            onClose()
            setTimeout(() => {
                const el = document.getElementById('locations')
                if (el) {
                    if (lenis) lenis.scrollTo(el, { offset: -50 })
                    else el.scrollIntoView({ behavior: 'smooth' })
                }
            }, 300)
        } else if (data.isModal) {
            window.dispatchEvent(new CustomEvent(data.isModal))
            onClose()
        } else {
            window.open(data.ctaLink, '_blank', 'noopener,noreferrer')
            onClose()
        }
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9990] flex items-end justify-center p-4 pb-8 pointer-events-auto"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: 80, opacity: 0, scale: 0.96 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 60, opacity: 0, scale: 0.96 }}
                        transition={{ type: "spring", damping: 28, stiffness: 340 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
                        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top gradient accent */}
                        <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${data.gradient} opacity-15`} />
                        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-illa-yellow/20 blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-illa-pink/15 blur-3xl" />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-black/10 flex items-center justify-center text-slate-600 hover:bg-black/20 transition-all active:scale-90"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>

                        <div className="relative z-10 flex flex-col items-center gap-5 p-8 pt-9">
                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0.5, rotate: -12 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 14, stiffness: 280, delay: 0.08 }}
                                className={`w-20 h-20 rounded-[1.5rem] bg-gradient-to-br ${data.gradient} shadow-[0_12px_28px_rgba(229,1,125,0.35)] flex items-center justify-center text-white`}
                            >
                                <Icon size={36} strokeWidth={2} />
                            </motion.div>

                            {/* Text */}
                            <div className="text-center flex flex-col gap-1.5">
                                <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-illa-pink/80">{data.subtitle}</p>
                                <h3 className="text-[24px] font-black tracking-tight text-slate-800 leading-tight">{data.title}</h3>
                                <p className="text-[14px] font-medium text-slate-500 leading-relaxed mt-1 px-1">{data.description}</p>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={handleCta}
                                className={`w-full py-4 bg-gradient-to-r ${data.gradient} text-white font-black tracking-wide rounded-2xl text-[15px] flex items-center justify-center gap-2 shadow-lg active:scale-[0.97] transition-transform`}
                            >
                                {data.cta}
                                <ArrowRight size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Scroll stimulant arrows — visual brand consistency */}
                        <div className="flex flex-col items-center pb-5 -mt-1 pointer-events-none gap-0">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        opacity: [0.15, 0.7, 0.15],
                                        y: [6, -6]
                                    }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
                                    className="-my-3"
                                >
                                    <ChevronUp
                                        size={36}
                                        strokeWidth={3.5}
                                        style={{ color: i === 0 ? '#FFC107' : i === 1 ? '#FF8A65' : '#E5017D' }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

// ─── Shared Types ─────────────────────────────────────────────────────────────
interface HeroGhostButtonsProps {
    progress: MotionValue<number>
    isMobile: boolean
    isTablet?: boolean | null
}

const buttons = [
    { label: 'PEDIR NO WHATSAPP', icon: MessageCircle, link: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%A2%21+Vim+do+site+da+Illa%21' },
    { label: 'IFOOD', icon: ShoppingBag, link: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04' },
    { label: 'LOCALIZAÇÃO', icon: MapPin, link: '#locations' },
    { label: 'FRANQUIAS', icon: Store, link: '#' },
]

// ─── Desktop Ghost Button ─────────────────────────────────────────────────────
function DesktopGhostButton({ btn, i, total, progress, onLinkClick }: { btn: (typeof buttons)[0], i: number, total: number, progress: MotionValue<number>, onLinkClick: (e: MouseEvent<HTMLAnchorElement>, link: string, isAction: boolean) => void }) {
    const step = 1 / total
    const start = step * i

    const opacity = useTransform(progress, [start, start + 0.1], [0, 1])
    const x = useTransform(progress, [start, start + 0.1], [50, 0])
    const scale = useTransform(progress, [start, start + 0.1], [0.8, 1])
    const display = useTransform(progress, p => p >= start ? 'flex' : 'none')

    const lenis = useLenis()

    const isAction = btn.label === 'QUEM SOMOS' || btn.label === 'CONTATO' || btn.label === 'FRANQUIAS' || btn.label === 'LOCALIZAÇÃO'

    return (
        <motion.a
            href={btn.link}
            target={isAction ? undefined : "_blank"}
            rel={isAction ? undefined : "noreferrer"}
            onClick={(e) => {
                onLinkClick(e, btn.link, isAction)
                if (btn.label === 'QUEM SOMOS') {
                    e.preventDefault()
                    window.dispatchEvent(new CustomEvent('open-about-modal'))
                } else if (btn.label === 'FRANQUIAS') {
                    e.preventDefault()
                    window.dispatchEvent(new CustomEvent('open-dev-modal'))
                } else if (btn.label === 'LOCALIZAÇÃO') {
                    e.preventDefault()
                    const el = document.getElementById('locations')
                    if (el) {
                        if (lenis) lenis.scrollTo(el, { offset: -50 })
                        else el.scrollIntoView({ behavior: 'smooth' })
                    }
                }
            }}
            style={{ opacity, x, scale, display }}
            className="
                flex items-center gap-3
                px-5 md:px-6 py-2.5 md:py-3.5
                bg-illa-pink/90 backdrop-blur-xl
                border border-white/50 rounded-full
                text-white text-xs md:text-sm font-bold tracking-wide whitespace-nowrap
                hover:bg-illa-yellow hover:text-dark hover:scale-105 hover:border-transparent
                active:scale-95
                transition-colors
                shadow-2xl shadow-black/20
                cursor-pointer
            "
        >
            <btn.icon size={20} />
            <span className="drop-shadow-sm">{btn.label}</span>
        </motion.a>
    )
}

function DesktopButtons({ progress, onLinkClick }: { progress: MotionValue<number>, onLinkClick: (e: MouseEvent<HTMLAnchorElement>, link: string, isAction: boolean) => void }) {
    const buttonSequenceProgress = useTransform(progress, [0.15, 0.8], [0, 1])
    const fadeOpacity = useTransform(progress, [0.98, 1], [1, 0])

    return (
        <motion.div style={{ opacity: fadeOpacity }} className="absolute bottom-8 left-0 right-0 z-20 flex justify-center pointer-events-none transition-all duration-300">
            <div className="w-full max-w-6xl px-4 pointer-events-auto">
                <div className="flex justify-center gap-4 items-center">
                    {buttons.map((btn, i) => (
                        <DesktopGhostButton key={btn.label} btn={btn} i={i} total={buttons.length} progress={buttonSequenceProgress} onLinkClick={onLinkClick} />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

// ─── Mobile Ghost Button ──────────────────────────────────────────────────────
function MobileGhostButton({ btn, i, progress, positions, onButtonClick }: { btn: typeof buttons[0], i: number, progress: MotionValue<number>, positions: { x: number; y: number }[], onButtonClick: (btn: typeof buttons[0]) => void }) {
    const targetX = positions[i].x
    const targetY = positions[i].y

    const delayStart = 0.15 + (i * 0.04)
    const expandEnd = Math.min(0.8, delayStart + 0.12)

    const x = useTransform(progress, [0.15, expandEnd], [0, targetX])
    const y = useTransform(progress, [0.15, expandEnd], [20, targetY])
    const scale = useTransform(progress, [0.15, expandEnd], [0.6, 1])
    const opacity = useTransform(progress, [0.12, 0.22], [0, 1])

    return (
        <motion.button
            type="button"
            onClick={() => onButtonClick(btn)}
            style={{ x, y, scale, opacity, zIndex: 20 - i }}
            className={`
                group absolute flex flex-col items-center justify-center gap-2
                w-[156px] h-[130px] p-4
                bg-illa-pink/95
                border-[2px] border-white/50 rounded-[1.5rem]
                shadow-[0_8px_16px_rgba(229,1,125,0.6),inset_0_1px_4px_rgba(255,255,255,0.3)]
                text-white font-black tracking-wider text-center
                pointer-events-auto cursor-pointer
                hover:bg-illa-yellow hover:text-dark hover:border-transparent
                active:scale-95 active:bg-illa-yellow/90
                transition-colors duration-300 ease-out
                will-change-transform
            `}
        >
            <btn.icon size={32} className="text-current transition-transform group-active:scale-90 duration-200" strokeWidth={2.5} />
            <span className="text-[10px] leading-tight uppercase font-script transition-colors duration-300">{btn.label}</span>
        </motion.button>
    )
}

function MobileButtons({ progress, onButtonClick }: { progress: MotionValue<number>, onButtonClick: (btn: typeof buttons[0]) => void }) {
    const gapX = 82
    const gapY = 70
    const positions = [
        { x: -gapX, y: -gapY },
        { x: gapX, y: -gapY },
        { x: -gapX, y: gapY },
        { x: gapX, y: gapY }
    ]

    const auraOpacity = useTransform(progress, [0.15, 0.4, 0.8, 1], [0, 0.6, 0.6, 0])

    return (
        <>
            {/* "Descubra ILLA / Deslize" oculto — substituído pelas setinhas ScrollStimulants */}

            {/* iOS Fix: removed [perspective:1000px] — creates a 3D stacking context that crashes iOS GPU */}
            <motion.div className="absolute bottom-[10vh] left-0 right-0 z-20 flex justify-center items-center pointer-events-none">
                <div className="relative w-full max-w-[360px] h-[400px] flex justify-center items-center">
                    {/* iOS Fix: aura uses CSS animation instead of framer-motion scale to reduce composite layers */}
                    <motion.div style={{ opacity: auraOpacity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] pointer-events-none z-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,107,107,0.6)_0%,rgba(255,202,40,0.4)_40%,transparent_75%)] rounded-full" />
                    </motion.div>

                    {buttons.map((btn, i) => (
                        <MobileGhostButton key={btn.label} btn={btn} i={i} progress={progress} positions={positions} onButtonClick={onButtonClick} />
                    ))}
                </div>
            </motion.div>
        </>
    )
}

// ─── Tablet Ghost Button ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabletGhostButton({ btn, i, progress, lenis, onLinkClick }: { btn: typeof buttons[0], i: number, progress: MotionValue<number>, lenis: any, onLinkClick: (e: MouseEvent<HTMLAnchorElement>, link: string, isAction: boolean) => void }) {
    const isLeft = i % 2 === 0
    const isTop = i < 2

    const targetX = isLeft ? -150 : 150
    const targetY = isTop ? -90 : 90

    const delayStart = 0.15 + (i * 0.04)
    const expandEnd = Math.min(0.8, delayStart + 0.15)

    const x = useTransform(progress, [0.15, expandEnd], [0, targetX])
    const y = useTransform(progress, [0.15, expandEnd], [40, targetY])
    const scale = useTransform(progress, [0.15, expandEnd - 0.05, expandEnd], [0.5, 1.05, 1])
    const opacity = useTransform(progress, [delayStart, delayStart + 0.15], [0, 1])

    const isAction = btn.label === 'QUEM SOMOS' || btn.label === 'CONTATO' || btn.label === 'FRANQUIAS' || btn.label === 'LOCALIZAÇÃO'

    return (
        <motion.a
            href={btn.link}
            target={isAction ? undefined : "_blank"}
            rel={isAction ? undefined : "noreferrer"}
            onClick={(e) => {
                onLinkClick(e, btn.link, isAction)
                if (btn.label === 'QUEM SOMOS') {
                    e.preventDefault()
                    window.dispatchEvent(new CustomEvent('open-about-modal'))
                } else if (btn.label === 'FRANQUIAS') {
                    e.preventDefault()
                    window.dispatchEvent(new CustomEvent('open-dev-modal'))
                } else if (btn.label === 'LOCALIZAÇÃO') {
                    e.preventDefault()
                    if (lenis) {
                        lenis.scrollTo('#locations', { offset: -50 })
                    } else {
                        const el = document.getElementById('locations')
                        el?.scrollIntoView({ behavior: 'smooth' })
                    }
                }
            }}
            style={{ x, y, scale, opacity }}
            className="
                group absolute flex flex-col items-center justify-center gap-4
                w-[240px] h-[140px] p-6 z-10
                bg-illa-pink/95
                border-[3px] border-white/60 rounded-[2.5rem]
                text-white font-black tracking-widest text-center
                pointer-events-auto cursor-pointer
                hover:bg-illa-yellow hover:text-dark hover:border-transparent
                hover:scale-105 hover:z-50
                active:scale-95 active:bg-illa-yellow/90
                transition-colors duration-300 ease-out
                shadow-[0_12px_30px_-6px_rgba(229,1,125,0.7),inset_0_2px_8px_rgba(255,255,255,0.3)]
                hover:shadow-[0_0_80px_rgba(255,223,0,0.8),inset_0_4px_16px_rgba(255,255,255,0.8)]
                will-change-transform
            "
        >
            <btn.icon size={48} className="text-current drop-shadow-md transition-transform group-hover:scale-110 duration-300" strokeWidth={2.5} />
            <span className="text-sm drop-shadow-lg leading-tight uppercase font-script text-[1.1rem] transition-colors duration-300">{btn.label}</span>
        </motion.a>
    )
}

function TabletButtons({ progress, onLinkClick }: { progress: MotionValue<number>, onLinkClick: (e: MouseEvent<HTMLAnchorElement>, link: string, isAction: boolean) => void }) {
    const lenis = useLenis()

    const fadeOpacity = useTransform(progress, [0.95, 1], [1, 0])
    const yFloat = useTransform(progress, [0.15, 0.8], [0, -120])
    const auraScale = useTransform(progress, [0.15, 0.4], [0.5, 1.2])
    const auraOpacity = useTransform(progress, [0.15, 0.4, 0.8, 1], [0, 0.6, 0.6, 0])
    const scrollHintOpacity = useTransform(progress, [0.05, 0.15], [1, 0])
    const scrollHintY = useTransform(progress, [0.05, 0.15], [0, 20])

    return (
        <motion.div style={{ opacity: fadeOpacity }} className="absolute bottom-[5vh] md:bottom-[15vh] left-0 right-0 z-20 flex justify-center items-center pointer-events-none">
            <motion.div style={{ opacity: scrollHintOpacity, y: scrollHintY }} className="absolute top-[80px] flex flex-col items-center gap-4 z-30">
                <motion.div animate={{ y: [0, 16, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} className="w-[1.5px] h-16 bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                <p className="text-white/90 uppercase font-black tracking-[0.5em] text-[12px] md:text-[15px] text-center font-body flex flex-col items-center gap-1.5 drop-shadow-xl">
                    <span className="opacity-80 text-[11px] md:text-[13px]">Descubra o Universo Illa</span>
                    <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Deslize para baixo</span>
                </p>
            </motion.div>

            <motion.div style={{ y: yFloat }} className="relative w-full max-w-[640px] h-[350px] flex justify-center items-center">
                <motion.div style={{ scale: auraScale, opacity: auraOpacity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[700px] md:h-[700px] pointer-events-none z-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,107,107,0.7)_0%,rgba(255,202,40,0.5)_40%,transparent_75%)] rounded-full" />
                    <div className="absolute w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(255,213,79,0.9)_0%,transparent_70%)] rounded-full" />
                </motion.div>

                {buttons.map((btn, i) => (
                    <TabletGhostButton key={btn.label} btn={btn} i={i} progress={progress} lenis={lenis} onLinkClick={onLinkClick} />
                ))}
            </motion.div>
        </motion.div>
    )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function HeroGhostButtons({ progress, isMobile, isTablet }: HeroGhostButtonsProps) {
    const [externalLink, setExternalLink] = useState<string | null>(null)
    const isModalOpen = externalLink !== null

    // Mobile popup state
    const [activePopupBtn, setActivePopupBtn] = useState<typeof buttons[0] | null>(null)
    const lenis = useLenis()

    const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, link: string, isAction: boolean) => {
        if (!isAction && link.startsWith('http')) {
            e.preventDefault()
            setExternalLink(link)
        }
    }

    const closeWarning = () => setExternalLink(null)

    const handleMobileButtonClick = (btn: typeof buttons[0]) => {
        setActivePopupBtn(btn)
    }

    const renderedButtons = isTablet ? <TabletButtons progress={progress} onLinkClick={handleLinkClick} /> :
        isMobile ? <MobileButtons progress={progress} onButtonClick={handleMobileButtonClick} /> :
            <DesktopButtons progress={progress} onLinkClick={handleLinkClick} />

    return (
        <>
            {renderedButtons}
            <ExternalLinkWarningModal isOpen={isModalOpen} link={externalLink} onClose={closeWarning} />
            {/* Mobile Popup — shown on button tap */}
            <HeroButtonPopup
                btn={activePopupBtn}
                isOpen={activePopupBtn !== null}
                onClose={() => setActivePopupBtn(null)}
                lenis={lenis}
            />
        </>
    )
}
