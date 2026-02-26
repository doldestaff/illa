'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { MissionInstance } from '@/lib/gamification-types'
import { Target, Sparkles, ArrowRight, LayoutGrid, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MissionCard from './MissionCard'
import MissionsModal from './MissionsModal'

function InteractiveMarquee({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    // Interaction/Scroll state tracked purely in refs to avoid React renders
    const isInteractingRef = useRef(false)
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const onOpenModalRef = useRef<(() => void) | undefined>(undefined)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.1 }
        )
        observer.observe(container)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const container = containerRef.current
        if (!container || !isVisible) return

        let animationId: number
        let lastTime = performance.now()
        const speed = 0.5 // pixels per frame roughly

        const scroll = (currentTime: number) => {
            // Pause if tab is hidden (battery) or if user is touching/scrolling
            if (document.hidden || isInteractingRef.current) {
                lastTime = currentTime // prevent massive jump when resuming
                animationId = requestAnimationFrame(scroll)
                return
            }

            const deltaTime = currentTime - lastTime
            lastTime = currentTime

            // Seamless wrap: If scroll passes the halfway point (first duplicated set)
            if (container.scrollLeft >= container.scrollWidth / 2) {
                container.scrollLeft = 0
            }
            container.scrollLeft += speed * (deltaTime / 16)
            animationId = requestAnimationFrame(scroll)
        }

        animationId = requestAnimationFrame(scroll)
        return () => cancelAnimationFrame(animationId)
    }, [isVisible])

    // Handle high-frequency events directly on the DOM node for max performance
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const setInteracting = () => { isInteractingRef.current = true }

        // Debounced scroll end detection protects native momentum scroll
        const handleScroll = () => {
            isInteractingRef.current = true
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
            scrollTimeoutRef.current = setTimeout(() => {
                isInteractingRef.current = false
            }, 500) // Resume 500ms after scroll STOPS completely
        }

        container.addEventListener('pointerdown', setInteracting, { passive: true })
        container.addEventListener('touchstart', setInteracting, { passive: true })
        container.addEventListener('mouseenter', setInteracting, { passive: true })
        container.addEventListener('mouseleave', () => {
            if (!scrollTimeoutRef.current) isInteractingRef.current = false
        })
        container.addEventListener('pointerup', () => { handleScroll() }, { passive: true })
        container.addEventListener('touchend', () => { handleScroll() }, { passive: true })
        container.addEventListener('scroll', handleScroll, { passive: true })

        return () => {
            container.removeEventListener('pointerdown', setInteracting)
            container.removeEventListener('touchstart', setInteracting)
            container.removeEventListener('mouseenter', setInteracting)
            container.removeEventListener('pointerup', handleScroll)
            container.removeEventListener('touchend', handleScroll)
            container.removeEventListener('scroll', handleScroll)
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className="flex overflow-x-auto gap-5 pb-8 scrollbar-hide py-4 snap-mandatory snap-x md:snap-none"
            style={{ willChange: 'scroll-position', overscrollBehaviorX: 'contain' }}
        >
            <div className="flex shrink-0 gap-5">
                {children}
            </div>
            <div className="flex shrink-0 gap-5">
                {children}
            </div>
            <div className="flex shrink-0 gap-5">
                {children}
            </div>
        </div>
    )
}

interface Props {
    missions: MissionInstance[]
    onClaim: (instanceId: string) => Promise<{ success: boolean }>
}

export default function DailyMissions({ missions, onClaim }: Props) {
    const [claimingId, setClaimingId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showPopup, setShowPopup] = useState(false)
    const [claimedIds, setClaimedIds] = useState<Set<string>>(
        new Set(missions.filter((m) => m.claimed).map((m) => m.instance_id))
    )

    const completedCount = missions.filter((m) => m.completed).length
    const totalCount = missions.length
    const allCompleted = totalCount > 0 && completedCount === totalCount

    const handleClaim = useCallback(async (instanceId: string) => {
        setClaimingId(instanceId)
        try {
            const result = await onClaim(instanceId)
            if (result.success) {
                setClaimedIds((prev) => new Set([...prev, instanceId]))
                setShowPopup(true)
                setTimeout(() => setShowPopup(false), 3000)
            }
        } catch (err) {
            console.error('Claim failed:', err)
        } finally {
            setClaimingId(null)
        }
    }, [onClaim])

    if (missions.length === 0) return null

    // Determine featured missions for the mural
    const previewMissions = missions.slice(0, 3)
    const hasMore = missions.length > 3

    // Duplicated array for seamless infinite marquee loop (desktop)
    const marqueeMissions = [...previewMissions, ...previewMissions]

    return (
        <div className="space-y-6 py-6 relative">
            {/* Ambient Background Glows */}
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-illa-pink/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute top-20 right-0 w-64 h-64 bg-illa-yellow/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header - Interactive & Cinematic */}
            <div
                onClick={() => setIsModalOpen(true)}
                className="relative z-10 flex items-center justify-between cursor-pointer group select-none px-4 md:px-0"
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-illa-pink/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="bg-gradient-to-br from-white/10 to-white/5 p-3 rounded-2xl border border-white/10 group-hover:border-illa-pink/30 group-hover:bg-white/10 transition-all duration-300 relative z-10 backdrop-blur-sm">
                            <Target size={24} className="text-illa-pink group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 ease-out" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 drop-shadow-lg tracking-tight">
                            Missões do Dia
                            <ArrowRight size={20} className="text-illa-pink opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </h2>
                        <p className="text-xs font-medium text-white/40 group-hover:text-white/60 transition-colors uppercase tracking-widest mt-1">
                            Ver todas as missões
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-full border backdrop-blur-md transition-all duration-300 ${allCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-white/5 border-white/10 text-white/50 group-hover:border-white/20 group-hover:bg-white/10'
                        }`}>
                        <span className="text-sm font-bold tracking-wider">{completedCount} <span className="opacity-50">/</span> {totalCount}</span>
                    </div>
                </div>
            </div>

            {/* Unified Marquee Preview (Desktop & Mobile) */}
            <div className="relative group/mural py-4 -mx-4 px-4 w-full max-w-[100vw] overflow-hidden">
                <InteractiveMarquee>
                    {previewMissions.map((mission, index) => {
                        const isClaimed = claimedIds.has(mission.instance_id) || mission.claimed
                        const isCompleted = mission.progress >= mission.target
                        const canClaim = isCompleted && !isClaimed

                        return (
                            <div
                                key={`mission-${mission.instance_id}`}
                                className="w-[300px] sm:w-[340px] md:w-[360px] h-[220px] shrink-0 snap-center first:pl-2 md:first:pl-0"
                            >
                                <div className="h-full transform transition-all duration-300 md:hover:scale-[1.03] md:hover:-translate-y-2 hover:shadow-2xl hover:shadow-illa-pink/20 cursor-pointer">
                                    <MissionCard
                                        mission={mission}
                                        isClaimed={isClaimed}
                                        canClaim={canClaim}
                                        claiming={claimingId === mission.instance_id}
                                        onClaim={handleClaim}
                                        colorTheme={['pink', 'yellow', 'white'][index % 3] as 'pink' | 'yellow' | 'white'}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </InteractiveMarquee>
            </div>

            {/* Clear Call to Action for Missions Panel */}
            <div className="px-4 mt-2">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group flex w-full md:w-auto md:mx-auto items-center justify-center gap-2 py-3 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden backdrop-blur-md"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-full translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                        Abrir Mural de Missões
                    </span>
                    <ArrowRight size={14} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
            </div>

            {/* All Completed Bonus State */}
            {allCompleted && (
                <div className="bg-[#0f0f11] md:bg-white/5 md:backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl shadow-emerald-500/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Dia Perfeito!</p>
                            <p className="text-xs text-white/80">Você completou todas as missões hoje.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Full List Modal */}
            <MissionsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                missions={missions}
                claimingId={claimingId}
                claimedIds={claimedIds}
                onClaim={handleClaim}
            />

            {/* Mission Completion Centered Popup */}
            <AnimatePresence>
                {showPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.8, y: 20, opacity: 0 }}
                            transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                            className="bg-white px-8 py-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-3 text-center relative overflow-hidden max-w-[300px] w-full border-b-[8px] border-slate-100"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-illa-pink/5 to-orange-400/5 opacity-50" />

                            <motion.div
                                animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, -5, 5, 0] }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="w-16 h-16 bg-gradient-to-tr from-illa-pink to-orange-400 rounded-full flex items-center justify-center shadow-lg relative z-10"
                            >
                                <CheckCircle2 className="text-white" size={36} strokeWidth={3} />
                            </motion.div>

                            <div className="relative z-10 mt-2">
                                <h3 className="text-[28px] leading-tight font-black text-transparent bg-clip-text bg-gradient-to-r from-illa-pink to-orange-500 uppercase tracking-tight">
                                    Missão<br />Concluída!
                                </h3>
                                <p className="font-bold text-black/40 text-sm mt-3 uppercase tracking-widest">
                                    Moedas adicionadas
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
