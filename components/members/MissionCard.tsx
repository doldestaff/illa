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
            whileHover={canClaim && !claiming ? { scale: 1.02, y: -4 } : {}}
            whileTap={canClaim && !claiming ? { scale: 0.98 } : {}}
            className={`relative overflow-hidden rounded-3xl border transition-all duration-500 group h-full flex flex-col justify-between ${isClaimed
                ? 'bg-white/5 border-white/5 opacity-50 grayscale contrast-75'
                : canClaim
                    ? 'bg-gradient-to-br from-gray-900/90 to-black/90 border-illa-pink/50 shadow-[0_8px_32px_rgba(229,1,125,0.25)] ring-1 ring-illa-pink/30'
                    : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-white/20 shadow-lg shadow-black/20'
                } backdrop-blur-xl`}
        >
            {/* Cinematic Spotlight (Only on active cards) */}
            {!isClaimed && (
                <motion.div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 mix-blend-overlay"
                    style={style}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-illa-pink to-purple-500 opacity-20" />
                </motion.div>
            )}

            {/* Content */}
            <div className="relative z-10 p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {isCompleted && !isClaimed && (
                                <span className="flex h-2 w-2 rounded-full bg-illa-yellow animate-pulse shadow-[0_0_8px_#FFED00]" />
                            )}
                            <h3 className={`font-bold text-base leading-tight tracking-tight trancate ${isClaimed ? 'text-white/40' : 'text-white drop-shadow-sm'}`}>
                                {mission.title}
                            </h3>
                        </div>
                        {mission.description && (
                            <p className="text-xs text-white/50 leading-relaxed line-clamp-2 min-h-[2.5em]">
                                {mission.description}
                            </p>
                        )}
                    </div>

                    {/* Status Badge / Button */}
                    <div className="shrink-0 pt-1">
                        {isClaimed ? (
                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                                <CheckCircle size={12} strokeWidth={3} />
                                <span>FEITO</span>
                            </div>
                        ) : canClaim ? (
                            <motion.button
                                onClick={() => onClaim(mission.instance_id)}
                                disabled={claiming}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-illa-pink to-purple-600 text-white text-[10px] font-black tracking-wide px-3 py-1.5 rounded-full shadow-[0_4px_12px_rgba(229,1,125,0.4)] border border-white/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed group/btn"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                                {claiming ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles size={12} fill="currentColor" className="animate-pulse" />
                                        RESGATAR
                                    </>
                                )}
                            </motion.button>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 shadow-inner">
                                <Circle size={14} strokeWidth={2.5} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer: Rewards & Progress */}
                <div className="mt-auto pt-4 space-y-3">
                    {/* Rewards Tags */}
                    <div className="flex flex-wrap gap-2">
                        {mission.reward_xp > 0 && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${isClaimed ? 'bg-white/5 text-white/30 border-white/5' : 'bg-purple-500/20 text-purple-200 border-purple-500/30'}`}>
                                <Sparkles size={10} className={isClaimed ? '' : "text-purple-300"} />
                                +{mission.reward_xp} XP
                            </span>
                        )}
                        {mission.reward_points > 0 && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${isClaimed ? 'bg-white/5 text-white/30 border-white/5' : 'bg-illa-pink/10 text-illa-pink border-illa-pink/20'}`}>
                                <Coins size={10} className={isClaimed ? '' : "text-illa-yellow"} />
                                +{mission.reward_points} Moedas
                            </span>
                        )}
                    </div>

                    {/* Neon Liquid Progress Bar */}
                    <div className="relative">
                        <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                            <span className={`${isCompleted ? 'text-emerald-400' : 'text-white/40'}`}>progresso</span>
                            <span className={`${isCompleted ? 'text-emerald-400' : 'text-white/60'}`}>
                                {mission.progress} <span className="text-white/30">/</span> {mission.target}
                            </span>
                        </div>
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className={`h-full rounded-full relative ${isClaimed
                                    ? 'bg-white/20'
                                    : isCompleted
                                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                                        : 'bg-gradient-to-r from-illa-yellow via-orange-400 to-illa-pink shadow-[0_0_12px_rgba(229,1,125,0.5)]'
                                    }`}
                            >
                                {canClaim && (
                                    <div className="absolute inset-0 bg-white/40 w-full animate-[shimmer_2s_infinite] skew-x-12 opacity-50" />
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
