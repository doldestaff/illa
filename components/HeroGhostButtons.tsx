'use client'

import { motion, useTransform, MotionValue } from 'framer-motion'
import { MessageCircle, MapPin, ShoppingBag, Store } from 'lucide-react'
import { useLenis } from 'lenis/react'

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

function DesktopGhostButton({ btn, i, total, progress }: { btn: (typeof buttons)[0], i: number, total: number, progress: MotionValue<number> }) {
    const step = 1 / total
    const start = step * i

    const opacity = useTransform(progress, [start, start + 0.1], [0, 1])
    const x = useTransform(progress, [start, start + 0.1], [50, 0])
    const scale = useTransform(progress, [start, start + 0.1], [0.8, 1])
    const display = useTransform(progress, p => p >= start ? 'flex' : 'none')

    const lenis = useLenis()

    // These labels are treated as internal actions (scroll or modal)
    const isAction = btn.label === 'QUEM SOMOS' || btn.label === 'CONTATO' || btn.label === 'FRANQUIAS' || btn.label === 'LOCALIZAÇÃO'

    return (
        <motion.a
            href={btn.link}
            target={isAction ? undefined : "_blank"}
            rel={isAction ? undefined : "noreferrer"}
            onClick={(e) => {
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

function DesktopButtons({ progress }: { progress: MotionValue<number> }) {
    // Map the raw [0.15, 0.8] range to [0, 1] to preserve sequence animations untouched
    const buttonSequenceProgress = useTransform(progress, [0.15, 0.8], [0, 1])

    // Fade out entirely at the very end of the scroll (0.98 -> 1)
    const fadeOpacity = useTransform(progress, [0.98, 1], [1, 0])

    return (
        <motion.div style={{ opacity: fadeOpacity }} className="absolute bottom-8 left-0 right-0 z-20 flex justify-center pointer-events-none transition-all duration-300">
            <div className="w-full max-w-6xl px-4 pointer-events-auto">
                <div className="flex justify-center gap-4 items-center">
                    {buttons.map((btn, i) => (
                        <DesktopGhostButton key={btn.label} btn={btn} i={i} total={buttons.length} progress={buttonSequenceProgress} />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

// iOS Fix: rotateX/rotateY removed — 3D perspective causes GPU overload on iOS Safari during native scroll
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MobileGhostButton({ btn, i, progress, lenis, positions }: { btn: typeof buttons[0], i: number, progress: MotionValue<number>, lenis: any, positions: any[] }) {
    const targetX = positions[i].x
    const targetY = positions[i].y

    const delayStart = 0.15 + (i * 0.04)
    // Accelerated animation: 0.12 scroll distance instead of 0.25
    const expandEnd = Math.min(0.8, delayStart + 0.12)

    const x = useTransform(progress, [0.15, expandEnd], [0, targetX])
    const y = useTransform(progress, [0.15, expandEnd], [20, targetY])
    const scale = useTransform(progress, [0.15, expandEnd], [0.6, 1])
    // ONLY fade in. Do not fade out at the end so they persist!
    const opacity = useTransform(progress, [0.12, 0.22], [0, 1])

    const isAction = btn.label === 'QUEM SOMOS' || btn.label === 'CONTATO' || btn.label === 'FRANQUIAS' || btn.label === 'LOCALIZAÇÃO'

    return (
        <motion.a
            href={btn.link}
            target={isAction ? undefined : "_blank"}
            rel={isAction ? undefined : "noreferrer"}
            onClick={(e) => {
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
        </motion.a>
    )
}

function MobileButtons({ progress }: { progress: MotionValue<number> }) {
    const lenis = useLenis()

    const gapX = 82
    const gapY = 70
    const positions = [
        { x: -gapX, y: -gapY },
        { x: gapX, y: -gapY },
        { x: -gapX, y: gapY },
        { x: gapX, y: gapY }
    ]

    // yFloat removed: floating the container while the hero itself is scroll-driven
    // creates compound motion that jitters on mobile. Per-button animations are kept.

    // auraScale removed for iOS perf
    const auraOpacity = useTransform(progress, [0.15, 0.4, 0.8, 1], [0, 0.6, 0.6, 0])

    // Extended visibility: fade out happens later [0.05 -> 0.15]
    const scrollHintOpacity = useTransform(progress, [0.05, 0.15], [1, 0])
    const scrollHintY = useTransform(progress, [0.05, 0.15], [0, 15])

    return (
        // iOS Fix: removed [perspective:1000px] — creates a 3D stacking context that crashes iOS GPU
        <motion.div className="absolute bottom-[2vh] left-0 right-0 z-20 flex justify-center items-center pointer-events-none">
            <motion.div style={{ opacity: scrollHintOpacity, y: scrollHintY }} className="absolute top-[40px] flex flex-col items-center gap-3 z-30">
                {/* Longer line (h-12), higher contrast opacity cycle */}
                <motion.div animate={{ y: [0, 12, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} className="w-[1.5px] h-12 bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                <p className="text-white/90 uppercase font-black tracking-[0.5em] text-[12px] text-center font-body flex flex-col items-center gap-1 drop-shadow-lg">
                    <span className="opacity-80 text-[10px]">Descubra a Illa</span>
                    <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Deslize</span>
                </p>
            </motion.div>

            <div className="relative w-full max-w-[360px] h-[300px] flex justify-center items-center">
                {/* iOS Fix: aura uses CSS animation instead of framer-motion scale to reduce composite layers */}
                <motion.div style={{ opacity: auraOpacity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] pointer-events-none z-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,107,107,0.6)_0%,rgba(255,202,40,0.4)_40%,transparent_75%)] rounded-full" />
                </motion.div>

                {buttons.map((btn, i) => (
                    <MobileGhostButton key={btn.label} btn={btn} i={i} progress={progress} lenis={lenis} positions={positions} />
                ))}
            </div>
        </motion.div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabletGhostButton({ btn, i, progress, lenis }: { btn: typeof buttons[0], i: number, progress: MotionValue<number>, lenis: any }) {
    const isLeft = i % 2 === 0
    const isTop = i < 2

    const targetX = isLeft ? -150 : 150
    const targetY = isTop ? -90 : 90

    const delayStart = 0.15 + (i * 0.04)
    // Accelerated animation: 0.15 scroll distance instead of 0.25 (tablets have higher physical scroll length)
    const expandEnd = Math.min(0.8, delayStart + 0.15)

    // iOS Fix: rotateX/rotateY removed — 3D transforms cause GPU crash on iOS Safari during scroll
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

function TabletButtons({ progress }: { progress: MotionValue<number> }) {
    const lenis = useLenis()

    const fadeOpacity = useTransform(progress, [0.95, 1], [1, 0])
    const yFloat = useTransform(progress, [0.15, 0.8], [0, -120])
    const auraScale = useTransform(progress, [0.15, 0.4], [0.5, 1.2])
    const auraOpacity = useTransform(progress, [0.15, 0.4, 0.8, 1], [0, 0.6, 0.6, 0])
    // Extended visibility: fade out happens later [0.05 -> 0.15]
    const scrollHintOpacity = useTransform(progress, [0.05, 0.15], [1, 0])
    const scrollHintY = useTransform(progress, [0.05, 0.15], [0, 20])

    return (
        // iOS Fix: removed [perspective:1200px] — creates 3D context that taxes iOS GPU alongside canvas
        <motion.div style={{ opacity: fadeOpacity }} className="absolute bottom-[5vh] md:bottom-[15vh] left-0 right-0 z-20 flex justify-center items-center pointer-events-none">
            <motion.div style={{ opacity: scrollHintOpacity, y: scrollHintY }} className="absolute top-[80px] flex flex-col items-center gap-4 z-30">
                {/* Longer line (h-16), higher contrast opacity cycle */}
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
                    <TabletGhostButton key={btn.label} btn={btn} i={i} progress={progress} lenis={lenis} />
                ))}
            </motion.div>
        </motion.div>
    )
}

export function HeroGhostButtons({ progress, isMobile, isTablet }: HeroGhostButtonsProps) {
    if (isTablet) {
        return <TabletButtons progress={progress} />
    }
    if (isMobile) {
        return <MobileButtons progress={progress} />
    }
    return <DesktopButtons progress={progress} />
}
