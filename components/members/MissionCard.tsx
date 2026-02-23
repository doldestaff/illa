'use client'

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { CheckCircle, Circle, Sparkles, Loader2 } from 'lucide-react'
import type { MissionInstance } from '@/lib/gamification-types'
import { MouseEvent } from 'react'
import GlobalCoin from '@/components/ui/GlobalCoin'

interface MissionCardProps {
    mission: MissionInstance
    isClaimed: boolean
    canClaim: boolean
    claiming: boolean
    onClaim: (id: string) => void
    colorTheme?: 'pink' | 'yellow' | 'white'
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
            className={`relative overflow-hidden transition-all duration-500 group h-full flex flex-col justify-between ${isClaimed
                ? 'opacity-60 grayscale-[50%] py-3 px-2 border-b border-black/5 last:border-0' // Extremely subtle list-item style for claimed
                : canClaim
                    ? 'bg-white rounded-[1.5rem] border border-pink-100 shadow-[0_8px_32px_rgba(229,1,125,0.08)] ring-1 ring-pink-50 p-5' // Von Restorff: Highlight the actionable
                    : 'bg-white/60 rounded-[1.5rem] border border-black/5 hover:border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-5' // Clean, neutral for in progress
                } backdrop-blur-3xl`}
        >
            {/* Spotlight only on actionable cards */}
            {canClaim && !isClaimed && (
                <motion.div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 mix-blend-overlay"
                    style={style}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-100/40 to-white/10 opacity-40" />
                </motion.div>
            )}

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {isCompleted && !isClaimed && (
                                <span className="flex h-2 w-2 rounded-full animate-pulse bg-illa-pink shadow-[0_0_8px_rgba(229,1,125,0.5)]" />
                            )}
                            <h3 className={`font-bold text-[15px] leading-tight tracking-tight truncate ${isClaimed ? 'text-gray-500' : 'text-gray-900'}`}>
                                {mission.title}
                            </h3>
                        </div>
                        {!isClaimed && mission.description && (
                            <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-2 min-h-[2.5em]">
                                {mission.description}
                            </p>
                        )}
                    </div>

                    {/* Status Badge / Button */}
                    <div className="shrink-0 pt-1">
                        {isClaimed ? (
                            <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                                <CheckCircle size={12} strokeWidth={3} />
                                <span>CONCLUÍDO</span>
                            </div>
                        ) : canClaim ? (
                            <motion.button
                                onClick={() => onClaim(mission.instance_id)}
                                disabled={claiming}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative overflow-hidden flex items-center justify-center gap-1.5 bg-gradient-to-r from-illa-pink to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white shadow-[0_4px_12px_rgba(229,1,125,0.25)] border-pink-400 text-[11px] font-black tracking-widest uppercase px-4 py-2 rounded-full border transition-all disabled:opacity-70 disabled:cursor-not-allowed group/btn"
                            >
                                <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                                {claiming ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles size={13} fill="currentColor" className="animate-pulse" />
                                        COLETAR
                                    </>
                                )}
                            </motion.button>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-black/5 border border-black/10 flex items-center justify-center text-gray-300 shadow-inner">
                                <Circle size={14} strokeWidth={2.5} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer: Rewards & Progress */}
                {!isClaimed && (
                    <div className="mt-auto pt-4 space-y-3">
                        {/* Clean Rewards Tags */}
                        <div className="flex flex-wrap gap-2">
                            {mission.reward_xp > 0 && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${canClaim ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                    <Sparkles size={10} className={canClaim ? "text-purple-400" : "text-gray-400"} />
                                    +{mission.reward_xp} XP
                                </span>
                            )}
                            {mission.reward_points > 0 && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold pl-1.5 pr-2 py-0.5 rounded-md border ${canClaim ? 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                    <GlobalCoin size="sm" animate={canClaim} />
                                    <span>+{mission.reward_points} Moedas</span>
                                </span>
                            )}
                        </div>

                        {/* Minimalist Progress Bar */}
                        <div className="relative">
                            <div className="flex justify-between text-[10px] font-bold mb-1.5 tracking-wider uppercase">
                                <span className={`${isCompleted ? 'text-pink-500' : 'text-gray-400'}`}>PROGRESSO</span>
                                <span className={`${isCompleted ? 'text-pink-600' : 'text-gray-600'}`}>
                                    {mission.progress} <span className="text-gray-300 px-0.5">/</span> {mission.target}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex items-center p-0.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className={`h-full rounded-full relative transition-all duration-1000 ${isCompleted
                                        ? 'bg-gradient-to-r from-illa-pink to-pink-400 shadow-[0_0_8px_rgba(229,1,125,0.3)]'
                                        : 'bg-gray-300'
                                        }`}
                                >
                                    {canClaim && (
                                        <div className="absolute inset-0 bg-white/40 w-full animate-[shimmer_2s_infinite] skew-x-12 opacity-50" />
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
