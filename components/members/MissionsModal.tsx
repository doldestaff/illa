'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Sparkles } from 'lucide-react'
import type { MissionInstance } from '@/lib/gamification-types'
import MissionCard from './MissionCard'
import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

// Idiomatic React 18 client-mount detection (avoids setState-in-effect lint)
function subscribe() { return () => { } }
function useIsClientMounted() {
    return useSyncExternalStore(subscribe, () => true, () => false)
}

interface Props {
    isOpen: boolean
    onClose: () => void
    missions: MissionInstance[]
    claimingId: string | null
    claimedIds: Set<string>
    onClaim: (id: string) => void
}

export default function MissionsModal({ isOpen, onClose, missions, claimingId, claimedIds, onClaim }: Props) {
    const mounted = useIsClientMounted()

    // Lock body scroll when open
    useEffect(() => {
        if (!mounted) return
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen, mounted])

    if (!mounted) return null

    const claimableCount = missions.filter(m => {
        const isClaimed = claimedIds.has(m.instance_id) || m.claimed
        return m.progress >= m.target && !isClaimed
    }).length

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.97, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            className="w-full max-w-lg sm:max-h-[88vh] h-[92dvh] sm:h-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden pointer-events-auto flex flex-col relative bg-[#0a0616]/60 backdrop-blur-3xl border border-white/10 shadow-[0_-8px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]"
                        >
                            {/* Ambient glows */}
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-illa-pink/15 rounded-full blur-[80px] pointer-events-none" />
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

                            {/* Header */}
                            <div className="relative px-6 pt-7 pb-5 border-b border-white/[0.07] flex-shrink-0">
                                {/* Pill handle (mobile) */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20 sm:hidden" />

                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-5 p-2 rounded-full bg-white/8 hover:bg-white/15 text-white/40 hover:text-white/80 transition-all border border-white/10"
                                >
                                    <X size={18} />
                                </button>

                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-illa-pink/40 blur-xl rounded-full" />
                                        <div className="relative w-13 h-13 w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-illa-pink via-pink-500 to-rose-600 shadow-lg shadow-pink-600/40 flex items-center justify-center border border-pink-400/30">
                                            <Target size={26} className="text-white drop-shadow-md" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-[22px] font-black text-white tracking-tight leading-none">
                                            Mural de Missões
                                        </h2>
                                        <p className="text-[13px] font-medium text-white/40 mt-1">
                                            Complete desafios para ganhar recompensas
                                        </p>
                                    </div>
                                </div>

                                {/* Stats bar */}
                                {claimableCount > 0 && (
                                    <div className="mt-4 flex items-center gap-2 bg-illa-pink/10 border border-illa-pink/20 rounded-full px-4 py-2 w-fit">
                                        <Sparkles size={13} className="text-illa-pink animate-pulse" />
                                        <span className="text-[12px] font-bold text-illa-pink tracking-wide">
                                            {claimableCount} {claimableCount === 1 ? 'missão disponível' : 'missões disponíveis'} para coletar
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Scrollable Content */}
                            <div
                                data-lenis-prevent
                                className="flex-1 overflow-y-auto p-5 pb-8 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                            >
                                {[...missions]
                                    .sort((a, b) => {
                                        const aClaimed = claimedIds.has(a.instance_id) || a.claimed;
                                        const bClaimed = claimedIds.has(b.instance_id) || b.claimed;
                                        const aCompleted = a.progress >= a.target;
                                        const bCompleted = b.progress >= b.target;
                                        const aCanClaim = aCompleted && !aClaimed;
                                        const bCanClaim = bCompleted && !bClaimed;

                                        if (aCanClaim && !bCanClaim) return -1;
                                        if (!aCanClaim && bCanClaim) return 1;
                                        if (!aClaimed && bClaimed) return -1;
                                        if (aClaimed && !bClaimed) return 1;
                                        return 0;
                                    })
                                    .map((mission, index) => {
                                        const isClaimed = claimedIds.has(mission.instance_id) || mission.claimed
                                        const isCompleted = mission.progress >= mission.target
                                        const canClaim = isCompleted && !isClaimed

                                        return (
                                            <motion.div
                                                key={mission.instance_id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                                                className="h-[200px]"
                                            >
                                                <MissionCard
                                                    mission={mission}
                                                    isClaimed={isClaimed}
                                                    canClaim={canClaim}
                                                    claiming={claimingId === mission.instance_id}
                                                    onClaim={onClaim}
                                                    colorTheme={['pink', 'yellow', 'white'][index % 3] as 'pink' | 'yellow' | 'white'}
                                                />
                                            </motion.div>
                                        )
                                    })}
                            </div>

                            {/* Footer gradient fade using transparency */}
                            <div className="h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none -mt-12 relative z-20 flex-shrink-0" />
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}
