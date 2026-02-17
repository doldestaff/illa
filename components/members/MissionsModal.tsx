'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Sparkles } from 'lucide-react'
import type { MissionInstance } from '@/lib/gamification-types'
import MissionCard from './MissionCard'
import { useEffect } from 'react'

interface Props {
    isOpen: boolean
    onClose: () => void
    missions: MissionInstance[]
    claimingId: string | null
    claimedIds: Set<string>
    onClaim: (id: string) => void
}

export default function MissionsModal({ isOpen, onClose, missions, claimingId, claimedIds, onClaim }: Props) {
    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    return (
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
                            className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
                        >
                            {/* Header */}
                            <div className="relative p-6 pb-4 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                                <button
                                    onClick={onClose}
                                    className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-illa-pink/20 flex items-center justify-center border border-illa-pink/30">
                                        <Target size={20} className="text-illa-pink" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Mural de Missões</h2>
                                        <p className="text-xs text-white/40">Complete desafios para ganhar recompensas</p>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                <div className="space-y-4">
                                    {missions.map((mission, index) => {
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
                            <div className="h-6 bg-gradient-to-t from-[#1a1a1a] to-transparent pointer-events-none -mt-6 relative z-10" />
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
