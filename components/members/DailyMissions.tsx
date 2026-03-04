'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { MissionInstance } from '@/lib/gamification-types'
import { Compass, Sparkles, ArrowRight, LayoutGrid, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MissionCard from './MissionCard'
import MissionsModal from './MissionsModal'

function InteractiveMarquee({ children, onIndexChange }: { children: React.ReactNode, onIndexChange?: (index: number) => void }) {
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

        // Calculate a safe scroll maximum before wrapping.
        // We know we rendered 3 identical sets of children.
        // We want to seamlessly wrap when it reaches exactly 1 set's scroll distance.
        const scroll = (currentTime: number) => {
            if (document.hidden || isInteractingRef.current) {
                lastTime = currentTime
                animationId = requestAnimationFrame(scroll)
                return
            }

            const deltaTime = currentTime - lastTime
            lastTime = currentTime

            // A third of the scroll width represents one full set of cards.
            // When we cross that distance, we reset back to 0 seamlessly.
            const thirdWidth = container.scrollWidth / 3
            if (container.scrollLeft >= thirdWidth) {
                // To keep it perfectly seamless, we only subtract exactly the width of one set
                container.scrollLeft -= thirdWidth
            }
            container.scrollLeft += speed * (deltaTime / 16)

            // Catch accidental backwards scroll (e.g., user swiping left fast)
            if (container.scrollLeft <= 0) {
                container.scrollLeft += thirdWidth
            }

            animationId = requestAnimationFrame(scroll)
        }

        animationId = requestAnimationFrame(scroll)
        return () => cancelAnimationFrame(animationId)
    }, [isVisible, children])

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

    // New Observer to detect which card is centered for the slide counter
    useEffect(() => {
        if (!onIndexChange) return
        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver((entries) => {
            let maxRatio = 0
            let targetIndex = -1
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio
                    targetIndex = Number((entry.target as HTMLElement).dataset.index)
                }
            })
            if (targetIndex >= 0) {
                onIndexChange(targetIndex)
            }
        }, { root: container, threshold: [0.4, 0.6, 0.8, 1.0] })

        const items = container.querySelectorAll('.marquee-item')
        items.forEach(item => observer.observe(item))

        return () => observer.disconnect()
    }, [onIndexChange, children])

    return (
        <div
            ref={containerRef}
            className="flex overflow-x-auto gap-5 pb-8 py-4 snap-mandatory snap-x md:snap-none"
            style={{
                willChange: 'scroll-position',
                overscrollBehaviorX: 'contain',
                scrollbarWidth: 'none',   /* Firefox */
                msOverflowStyle: 'none'  /* IE and Edge */
            }}
        >
            {/* Inline style for webkit scrollbar hide fallback */}
            <style dangerouslySetInnerHTML={{
                __html: `
                div::-webkit-scrollbar { display: none; }
            `}} />
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

    const [activeIndex, setActiveIndex] = useState(0)

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

    // Determine all missions for the mural - Sort completed and claimed to the end
    const sortedMissions = [...missions].sort((a, b) => {
        const aCompleted = a.progress >= a.target || a.claimed || claimedIds.has(a.instance_id)
        const bCompleted = b.progress >= b.target || b.claimed || claimedIds.has(b.instance_id)

        if (!aCompleted && bCompleted) return -1
        if (aCompleted && !bCompleted) return 1
        return 0
    })

    const previewMissions = sortedMissions

    return (
        <div className="flex flex-col pt-4 pb-2 relative">

            {/* Header - Interactive & Cinematic */}
            <div
                onClick={() => setIsModalOpen(true)}
                className="relative z-10 flex items-center justify-between cursor-pointer group select-none px-4 md:px-0 mb-3"
            >

                <div className="flex items-center gap-3 relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="w-12 h-12 bg-[#201d1a] border border-amber-900/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4),0_2px_10px_rgba(0,0,0,0.3)] rounded-full flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-[2px] rounded-full border border-amber-500/10 bg-gradient-to-tr from-amber-700/10 to-amber-400/5" />
                            <Compass size={22} className="text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)] group-hover:rotate-12 transition-transform duration-500 relative z-10" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-tight">
                            Missões do Dia
                            <ArrowRight size={20} className="text-illa-pink opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </h2>
                        <p className="text-xs font-medium text-white/60 group-hover:text-white/80 transition-colors uppercase tracking-widest mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                            Ver todas as missões
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="px-4 py-2 rounded-full border backdrop-blur-md bg-[#25252a]/60 border-white/10 text-white/70 shadow-inner group-hover:border-white/20 transition-all duration-300">
                        <span className="text-sm font-bold tracking-wider">{activeIndex + 1} <span className="opacity-50">/</span> {previewMissions.length}</span>
                    </div>
                </div>
            </div>

            {/* Unified Marquee Preview (Desktop & Mobile) - Disney Experience */}
            <div className="relative group/mural py-8 -mx-4 px-4 w-full max-w-[100vw] overflow-hidden">
                <InteractiveMarquee onIndexChange={setActiveIndex}>
                    {previewMissions.map((mission, index) => {
                        const isClaimed = claimedIds.has(mission.instance_id) || mission.claimed
                        const isCompleted = mission.progress >= mission.target
                        const canClaim = isCompleted && !isClaimed

                        return (
                            <div
                                key={`mission-${mission.instance_id}`}
                                data-index={index}
                                // Format: Wide horizontal card for the WebP content.
                                // Increased margin/padding so the magical glow from MissionCard can escape freely.
                                className="marquee-item w-[310px] sm:w-[340px] md:w-[380px] h-[180px] md:h-[220px] shrink-0 snap-center first:pl-2 md:first:pl-0 relative cursor-pointer"
                            >
                                <MissionCard
                                    mission={mission}
                                    isClaimed={isClaimed}
                                    canClaim={canClaim}
                                    claiming={claimingId === mission.instance_id}
                                    onClaim={handleClaim}
                                />
                            </div>
                        )
                    })}
                </InteractiveMarquee>
            </div>

            {/* Clear Call to Action for Missions Panel */}
            <div className="px-4 -mt-5 relative z-20 pointer-events-none">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group flex w-full md:w-auto md:mx-auto items-center justify-center gap-2 py-2 px-6 transition-all duration-300 relative pointer-events-auto"
                >
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-white/50 group-hover:text-white transition-all duration-300 drop-shadow-md">
                        Abrir Mural de Missões
                    </span>
                    <ArrowRight size={16} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-transform duration-300 ease-out" strokeWidth={2.5} />
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
