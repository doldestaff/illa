'use client'

import { useState, useCallback, useRef } from 'react'
import type { MissionInstance } from '@/lib/gamification-types'
import { Target, Sparkles, ArrowRight, LayoutGrid } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import MissionCard from './MissionCard'
import MissionsModal from './MissionsModal'

interface Props {
    missions: MissionInstance[]
    onClaim: (instanceId: string) => Promise<{ success: boolean }>
}

export default function DailyMissions({ missions, onClaim }: Props) {
    const [claimingId, setClaimingId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [claimedIds, setClaimedIds] = useState<Set<string>>(
        new Set(missions.filter((m) => m.claimed).map((m) => m.instance_id))
    )
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollXProgress } = useScroll({ container: containerRef })

    const completedCount = missions.filter((m) => m.completed).length
    const totalCount = missions.length
    const allCompleted = totalCount > 0 && completedCount === totalCount

    const handleClaim = useCallback(async (instanceId: string) => {
        setClaimingId(instanceId)
        try {
            const result = await onClaim(instanceId)
            if (result.success) {
                setClaimedIds((prev) => new Set([...prev, instanceId]))
            }
        } catch (err) {
            console.error('Claim failed:', err)
        } finally {
            setClaimingId(null)
        }
    }, [onClaim])

    if (missions.length === 0) return null

    // Determine featured missions for the mural (top 3)
    const previewMissions = missions.slice(0, 3)

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

            {/* Mural Preview - Horizontal Scroll with Depth */}
            <div className="relative group/mural">
                <div
                    ref={containerRef}
                    className="flex overflow-x-auto gap-5 pb-8 -mx-4 px-4 md:px-0 md:mx-0 scrollbar-hide snap-x snap-mandatory py-4"
                >
                    {previewMissions.map((mission, index) => {
                        const isClaimed = claimedIds.has(mission.instance_id) || mission.claimed
                        const isCompleted = mission.progress >= mission.target
                        const canClaim = isCompleted && !isClaimed

                        return (
                            <motion.div
                                key={mission.instance_id}
                                className="min-w-[85%] sm:min-w-[340px] md:min-w-[360px] snap-center first:pl-2 md:first:pl-0 h-[220px]"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                            >
                                <div className="h-full transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                                    <MissionCard
                                        mission={mission}
                                        isClaimed={isClaimed}
                                        canClaim={canClaim}
                                        claiming={claimingId === mission.instance_id}
                                        onClaim={handleClaim}
                                    />
                                </div>
                            </motion.div>
                        )
                    })}

                    {/* "See All" Card - Glassmorphism */}
                    {missions.length > 3 && (
                        <div
                            onClick={() => setIsModalOpen(true)}
                            className="min-w-[40%] sm:min-w-[180px] snap-center flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all cursor-pointer backdrop-blur-sm h-[220px] group/more"
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center group-hover/more:scale-110 transition-transform duration-300 shadow-lg">
                                <LayoutGrid size={28} className="text-white/40 group-hover/more:text-white transition-colors" />
                            </div>
                            <span className="text-sm font-bold text-white/50 group-hover/more:text-white transition-colors uppercase tracking-wider">Ver +{missions.length - 3}</span>
                        </div>
                    )}
                </div>

                {/* Fade Gradients & Scroll Hints */}


                {/* Animated Scroll Arrow */}
                {/* Animated Scroll Arrow - Interactive */}
                <motion.div
                    onClick={() => setIsModalOpen(true)}
                    className="absolute bottom-12 right-2 md:hidden bg-illa-pink text-white p-2 rounded-full shadow-[0_0_15px_rgba(229,1,125,0.5)] z-30 cursor-pointer active:scale-90 transition-transform"
                    animate={{ x: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                    <ArrowRight size={18} />
                </motion.div>
            </div>

            {/* All Completed Bonus State */}
            {allCompleted && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white shadow-xl shadow-emerald-500/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
        </div>
    )
}
