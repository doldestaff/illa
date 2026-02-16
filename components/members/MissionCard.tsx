'use client'

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { CheckCircle, Circle, Sparkles, Loader2, Coins } from 'lucide-react'
import type { MissionInstance } from '@/lib/gamification-types'
import { MouseEvent } from 'react'

interface MissionCardProps {
    mission: MissionInstance
    isClaimed: boolean
    canClaim: boolean
    claiming: boolean
    onClaim: (id: string) => void
}

export default function MissionCard({ mission, isClaimed, canClaim, claiming, onClaim }: MissionCardProps) {
    const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100))
    const isCompleted = mission.progress >= mission.target

    // 3D Tilt Effect
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }

    const maskImage = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, white, transparent)`
    const style = { maskImage, WebkitMaskImage: maskImage }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-2xl border transition-colors duration-500 group ${isClaimed
                ? 'bg-white/5 border-white/5 opacity-50 grayscale'
                : canClaim
                    ? 'bg-black/80 border-illa-pink/50 shadow-[0_0_20px_rgba(229,1,125,0.15)] backdrop-blur-md'
                    : 'bg-black/60 border-white/10 hover:bg-black/70 hover:border-white/20 backdrop-blur-md'
                }`}
        >
            {/* Spotlight Effect (Only on non-claimed) */}
            {!isClaimed && (
                <motion.div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                    style={style}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-illa-pink/20 to-purple-500/20 opacity-50" />
                </motion.div>
            )}

            {/* Content */}
            <div className="relative z-10 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className={`font-bold text-sm leading-tight ${isClaimed ? 'text-white/40' : 'text-white'}`}>
                            {mission.title}
                        </h3>
                        {mission.description && (
                            <p className="text-xs text-white/50 mt-1 line-clamp-1">
                                {mission.description}
                            </p>
                        )}
                    </div>

                    {/* Action Button Area */}
                    <div className="shrink-0">
                        {isClaimed ? (
                            <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                <CheckCircle size={12} />
                                <span>FEITO</span>
                            </div>
                        ) : canClaim ? (
                            <motion.button
                                onClick={() => onClaim(mission.instance_id)}
                                disabled={claiming}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-illa-pink to-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-illa-pink/30 hover:shadow-illa-pink/50 border border-white/20 transition-all disabled:opacity-70"
                            >
                                {claiming ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles size={12} fill="currentColor" />
                                        RESGATAR
                                    </>
                                )}
                            </motion.button>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                                <Circle size={14} strokeWidth={2.5} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/30 mb-1.5 uppercase tracking-wider">
                        <span>{mission.progress} / {mission.target}</span>
                        <div className="flex items-center gap-1.5">
                            {mission.reward_xp > 0 && (
                                <span className="flex items-center gap-0.5 text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                    <Coins size={8} className="text-[#FAFF00]" /> +{mission.reward_xp} XP
                                </span>
                            )}
                            {mission.reward_points > 0 && (
                                <span className="flex items-center gap-0.5 text-illa-pink bg-illa-pink/10 px-1.5 py-0.5 rounded border border-illa-pink/20">
                                    <Coins size={8} className="text-[#FAFF00]" /> +{mission.reward_points} Moedas
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Liquid Progress Bar */}
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full relative ${canClaim
                                ? 'bg-gradient-to-r from-illa-pink to-purple-500 shadow-[0_0_8px_rgba(229,1,125,0.6)]'
                                : isCompleted
                                    ? 'bg-emerald-400'
                                    : 'bg-white/20'
                                }`}
                        >
                            {canClaim && (
                                <div className="absolute inset-0 bg-white/50 animate-[shimmer_1s_infinite] skew-x-12" />
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
