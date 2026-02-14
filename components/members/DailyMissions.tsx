'use client'

import { useState, useCallback } from 'react'
import type { MissionInstance } from '@/lib/gamification-types'
import { CheckCircle, Circle, Target, Gift, Loader2, Sparkles, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import MissionCard from './MissionCard'

interface Props {
    missions: MissionInstance[]
    onClaim: (instanceId: string) => Promise<{ success: boolean }>
}

export default function DailyMissions({ missions, onClaim }: Props) {
    const [claimingId, setClaimingId] = useState<string | null>(null)
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
            }
        } catch (err) {
            console.error('Claim failed:', err)
        } finally {
            setClaimingId(null)
        }
    }, [onClaim])

    if (missions.length === 0) return null

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                    <Target size={20} className="text-illa-pink" />
                    Missões do Dia
                </h2>
                <div className="bg-gray-100 text-xs font-bold text-dark/50 px-2.5 py-1 rounded-full border border-gray-200">
                    {completedCount}/{totalCount}
                </div>
            </div>

            <motion.div
                className="space-y-3"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                {missions.map((mission) => {
                    const isClaimed = claimedIds.has(mission.instance_id) || mission.claimed
                    const isCompleted = mission.progress >= mission.target
                    const canClaim = isCompleted && !isClaimed
                    const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100))

                    return (
                        <MissionCard
                            key={mission.instance_id}
                            mission={mission}
                            isClaimed={isClaimed}
                            canClaim={canClaim}
                            claiming={claimingId === mission.instance_id}
                            onClaim={handleClaim}
                        />
                    )
                })}
            </motion.div>

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
        </div>
    )
}
