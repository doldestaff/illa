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

export default function MissionCard({ mission, isClaimed, canClaim, claiming, onClaim, colorTheme = 'pink' }: MissionCardProps) {
    const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100))
    const isCompleted = mission.progress >= mission.target

    const themeStyles = {
        pink: {
            border: 'border-pink-500/30',
            shadow: 'shadow-[0_8px_32px_rgba(236,72,153,0.15)]',
            ring: 'ring-pink-500/20',
            button: 'from-pink-500 to-rose-500 hover:from-rose-500 hover:to-rose-600 border-pink-400 text-white shadow-[0_4px_12px_rgba(236,72,153,0.25)]',
            pulse: 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]',
            text: 'text-pink-400',
            progress: 'bg-gradient-to-r from-pink-500 to-rose-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
        },
        yellow: {
            border: 'border-amber-400/30',
            shadow: 'shadow-[0_8px_32px_rgba(251,191,36,0.15)]',
            ring: 'ring-amber-400/20',
            button: 'from-amber-400 to-orange-500 hover:from-orange-400 hover:to-orange-500 border-amber-300 text-black shadow-[0_4px_12px_rgba(251,191,36,0.25)]',
            pulse: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
            text: 'text-amber-400',
            progress: 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
        },
        white: {
            border: 'border-white/30',
            shadow: 'shadow-[0_8px_32px_rgba(255,255,255,0.1)]',
            ring: 'ring-white/20',
            button: 'from-white to-gray-200 hover:from-gray-100 hover:to-gray-200 border-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.25)]',
            pulse: 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]',
            text: 'text-white/90',
            progress: 'bg-gradient-to-r from-gray-300 to-white shadow-[0_0_8px_rgba(255,255,255,0.5)]'
        }
    }

    const theme = themeStyles[colorTheme]

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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={canClaim && !claiming ? { scale: 1.02, y: -4 } : { scale: 1.01 }}
            whileTap={canClaim && !claiming ? { scale: 0.98 } : { scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`relative overflow-hidden transition-colors duration-500 group h-full flex flex-col justify-between ${isClaimed
                ? 'opacity-60 grayscale border-b border-white/5 last:border-0 py-3 px-2'
                : canClaim
                    ? `bg-white/[0.12] rounded-[2rem] border ${theme.border} ${theme.shadow} ring-1 ${theme.ring} p-5 backdrop-blur-2xl bg-blend-overlay`
                    : 'bg-white/[0.08] rounded-[2rem] border border-white/15 hover:border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.25)] p-5 backdrop-blur-2xl bg-blend-overlay'
                }`}
        >
            {/* Spotlight only on actionable cards */}
            {canClaim && !isClaimed && (
                <motion.div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 mix-blend-overlay"
                    style={style}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-80" />
                </motion.div>
            )}

            {/* Glowing orb fallback under glass */}
            {!isClaimed && (
                <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 transition-opacity duration-700 pointer-events-none ${theme.pulse}`} />
            )}

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {isCompleted && !isClaimed && (
                                <span className={`flex h-2 w-2 rounded-full animate-pulse ${theme.pulse}`} />
                            )}
                            <h3 className={`font-bold text-[15px] leading-tight tracking-tight max-w-full drop-shadow-md line-clamp-2 ${isClaimed ? 'text-white/40' : 'text-white/90'}`}>
                                {mission.title}
                            </h3>
                        </div>
                        {!isClaimed && mission.description && (
                            <p className="text-[11px] text-white/50 font-medium leading-relaxed line-clamp-2 min-h-[2.5em]">
                                {mission.description}
                            </p>
                        )}
                    </div>

                    {/* Status Badge / Button */}
                    <div className="shrink-0 pt-0.5">
                        {isClaimed ? (
                            <div className="flex items-center gap-1.5 text-white/40 font-bold text-[9px] bg-white/5 px-2.5 py-1 rounded border border-white/5 mt-1">
                                <CheckCircle size={10} strokeWidth={3} />
                                <span>COMPLETO</span>
                            </div>
                        ) : canClaim ? (
                            <motion.button
                                onClick={() => onClaim(mission.instance_id)}
                                disabled={claiming}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative overflow-hidden flex items-center justify-center gap-1 focus:outline-none bg-gradient-to-br ${theme.button} text-[11px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full shadow-lg transition-transform focus:scale-[0.98] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group/btn`}
                            >
                                <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out mix-blend-overlay" />
                                {claiming ? (
                                    <Loader2 size={13} className="animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles size={12} fill="currentColor" className="animate-pulse" />
                                        COLETAR
                                    </>
                                )}
                            </motion.button>
                        ) : (
                            <div className="w-7 h-7 mt-1 ml-1 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 shadow-inner backdrop-blur-sm">
                                <Circle size={12} strokeWidth={2.5} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer: Rewards & Progress */}
                {!isClaimed && (
                    <div className="mt-auto pt-4 space-y-3">
                        {/* Clean Rewards Tags */}
                        <div className="flex flex-wrap gap-1.5">
                            {mission.reward_xp > 0 && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border backdrop-blur-md ${canClaim ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-white/5 text-white/40 border-white/10'}`}>
                                    <Sparkles size={10} className={canClaim ? "text-rose-400" : "text-white/30"} />
                                    +{mission.reward_xp} XP
                                </span>
                            )}
                            {mission.reward_points > 0 && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold pl-1.5 pr-2 py-0.5 rounded border backdrop-blur-md ${canClaim ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-sm' : 'bg-white/5 text-white/40 border-white/10'}`}>
                                    <GlobalCoin size="sm" animate={canClaim} />
                                    <span>+{mission.reward_points} Moedas</span>
                                </span>
                            )}
                        </div>

                        {/* Minimalist Progress Bar */}
                        <div className="relative">
                            <div className="flex justify-between text-[9px] font-bold mb-1.5 tracking-widest uppercase">
                                <span className={`${isCompleted ? theme.text : 'text-white/40'}`}>PROGRESSO</span>
                                <span className={`${isCompleted ? theme.text : 'text-white/50'}`}>
                                    {mission.progress} <span className="text-white/20">/</span> {mission.target}
                                </span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden flex items-center shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut", type: "spring", bounce: 0.3 }}
                                    className={`h-full rounded-full relative transition-colors duration-1000 ${isCompleted
                                        ? theme.progress
                                        : 'bg-white/40'
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
