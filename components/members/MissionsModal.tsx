'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Target } from 'lucide-react'
import type { MissionInstance } from '@/lib/gamification-types'
import MissionCard from './MissionCard'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
    isOpen: boolean
    onClose: () => void
    missions: MissionInstance[]
    claimingId: string | null
    claimedIds: Set<string>
    onClaim: (id: string) => void
}

export default function MissionsModal({ isOpen, onClose, missions, claimingId, claimedIds, onClaim }: Props) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

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
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white/95 backdrop-blur-2xl border-2 border-white/60 w-full max-w-lg max-h-[85vh] rounded-[2rem] shadow-[0_15px_40px_-5px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto flex flex-col relative"
                        >
                            {/* Ambient background subtle glow */}
                            <div className="absolute inset-x-0 -top-10 h-32 bg-gradient-to-br from-illa-pink/20 to-transparent blur-2xl pointer-events-none" />

                            {/* Header */}
                            <div className="relative p-6 pt-8 pb-4 border-b border-black/5 bg-gradient-to-b from-white/40 to-transparent z-10">
                                <button
                                    onClick={onClose}
                                    className="absolute top-5 right-5 p-2 rounded-full bg-black/5 hover:bg-black/10 text-black/40 hover:text-black/70 transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-illa-pink to-pink-500 shadow-lg shadow-pink-500/30 flex items-center justify-center border border-pink-400">
                                        <Target size={24} className="text-white drop-shadow-sm" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Mural de Missões</h2>
                                        <p className="text-sm font-medium text-gray-500">Complete desafios para ganhar recompensas</p>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent relative z-10">
                                <div className="space-y-4">
                                    {[...missions]
                                        .sort((a, b) => {
                                            const aClaimed = claimedIds.has(a.instance_id) || a.claimed;
                                            const bClaimed = claimedIds.has(b.instance_id) || b.claimed;
                                            const aCompleted = a.progress >= a.target;
                                            const bCompleted = b.progress >= b.target;
                                            const aCanClaim = aCompleted && !aClaimed;
                                            const bCanClaim = bCompleted && !bClaimed;

                                            // 1. Claimables first
                                            if (aCanClaim && !bCanClaim) return -1;
                                            if (!aCanClaim && bCanClaim) return 1;

                                            // 2. In progress middle
                                            if (!aClaimed && bClaimed) return -1;
                                            if (aClaimed && !bClaimed) return 1;

                                            // 3. Keep original order within the same group
                                            return 0;
                                        })
                                        .map((mission, index) => {
                                            const isClaimed = claimedIds.has(mission.instance_id) || mission.claimed
                                            const isCompleted = mission.progress >= mission.target
                                            const canClaim = isCompleted && !isClaimed

                                            return (
                                                <motion.div
                                                    key={mission.instance_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <MissionCard
                                                        mission={mission}
                                                        isClaimed={isClaimed}
                                                        canClaim={canClaim}
                                                        claiming={claimingId === mission.instance_id}
                                                        onClaim={onClaim}
                                                    />
                                                </motion.div>
                                            )
                                        })}
                                </div>
                            </div>

                            {/* Footer Gradient Fade */}
                            <div className="h-8 bg-gradient-to-t from-[#f8f9fa] to-transparent pointer-events-none -mt-8 relative z-20" />
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}
