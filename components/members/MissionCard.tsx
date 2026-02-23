'use client'

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { CheckCircle, Circle, Sparkles, Loader2, Coins } from 'lucide-react'
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

    const themeStyles = {
        pink: {
            bgClaim: 'bg-white/90 border-pink-200/50 shadow-[0_8px_32px_rgba(229,1,125,0.08)] ring-1 ring-pink-100',
            bgIdle: 'bg-white/60 border-black/5 hover:border-pink-200/30 shadow-[0_4px_16px_rgba(0,0,0,0.03)]',
            glow: 'from-pink-100/40 to-white/10',
            btn: 'bg-gradient-to-r from-illa-pink to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white shadow-[0_4px_12px_rgba(229,1,125,0.25)] border-pink-400',
            progress: 'from-illa-pink via-pink-400 to-pink-600 shadow-[0_0_12px_rgba(229,1,125,0.3)]',
            text: 'text-gray-900',
            pulse: 'bg-illa-pink shadow-[0_0_8px_rgba(229,1,125,0.5)]'
        },
        yellow: {
            bgClaim: 'bg-white/90 border-yellow-200/50 shadow-[0_8px_32px_rgba(255,237,0,0.08)] ring-1 ring-yellow-100',
            bgIdle: 'bg-white/60 border-black/5 hover:border-yellow-200/30 shadow-[0_4px_16px_rgba(0,0,0,0.03)]',
            glow: 'from-yellow-100/40 to-white/10',
            btn: 'bg-gradient-to-r from-illa-yellow to-[#E5C100] hover:from-[#E5C100] hover:to-yellow-500 text-black shadow-[0_4px_12px_rgba(255,237,0,0.25)] border-yellow-300',
            progress: 'from-orange-400 via-illa-yellow to-yellow-200 shadow-[0_0_12px_rgba(255,237,0,0.3)]',
            text: 'text-gray-900',
            pulse: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
        },
        white: {
            bgClaim: 'bg-white/90 border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-black/5',
            bgIdle: 'bg-white/60 border-black/5 hover:border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.03)]',
            glow: 'from-gray-100/50 to-white/10',
            btn: 'bg-gray-900 hover:bg-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] border-gray-800',
            progress: 'from-gray-600 via-gray-400 to-gray-300 shadow-[0_0_12px_rgba(0,0,0,0.1)]',
            text: 'text-gray-900',
            pulse: 'bg-gray-900 shadow-[0_0_8px_rgba(0,0,0,0.3)]'
        }
    }

    const currentTheme = themeStyles[colorTheme]

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={canClaim && !claiming ? { scale: 1.02, y: -4 } : {}}
            whileTap={canClaim && !claiming ? { scale: 0.98 } : {}}
            className={`relative overflow-hidden rounded-[1.5rem] border transition-all duration-500 group h-full flex flex-col justify-between ${isClaimed
                ? 'bg-white/5 border-white/5 opacity-50 grayscale contrast-75'
                : canClaim
                    ? currentTheme.bgClaim
                    : currentTheme.bgIdle
                } backdrop-blur-3xl`}
        >
            {/* Cinematic Spotlight (Only on active cards) */}
            {!isClaimed && (
                <motion.div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 mix-blend-overlay"
                    style={style}
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${currentTheme.glow} opacity-40`} />
                </motion.div>
            )}

            {/* Content */}
            <div className="relative z-10 p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {isCompleted && !isClaimed && (
                                <span className={`flex h-2 w-2 rounded-full animate-pulse ${currentTheme.pulse}`} />
                            )}
                            <h3 className={`font-bold text-[15px] leading-tight tracking-tight trancate ${isClaimed ? 'text-gray-400' : currentTheme.text}`}>
                                {mission.title}
                            </h3>
                        </div>
                        {mission.description && (
                            <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2 min-h-[2.5em]">
                                {mission.description}
                            </p>
                        )}
                    </div>

                    {/* Status Badge / Button */}
                    <div className="shrink-0 pt-1">
                        {isClaimed ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                                <CheckCircle size={12} strokeWidth={3} />
                                <span>FEITO</span>
                            </div>
                        ) : canClaim ? (
                            <motion.button
                                onClick={() => onClaim(mission.instance_id)}
                                disabled={claiming}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative overflow-hidden flex items-center justify-center gap-1.5 ${currentTheme.btn} text-[11px] font-black tracking-widest uppercase px-4 py-2 rounded-full border border-white/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed group/btn shadow-xl`}
                            >
                                <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                                {claiming ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles size={13} fill="currentColor" className="animate-pulse" />
                                        RESGATAR
                                    </>
                                )}
                            </motion.button>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-black/5 border border-black/10 flex items-center justify-center text-gray-400 shadow-inner">
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
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold pl-1 pr-2 py-0.5 rounded-md border ${isClaimed ? 'bg-white/5 text-white/30 border-white/5 grayscale' : 'bg-illa-pink/5 text-illa-pink border-illa-pink/20 shadow-sm shadow-illa-pink/10'}`}>
                                <GlobalCoin size="sm" />
                                <span className={isClaimed ? '' : 'text-[#78350F]'}>+{mission.reward_points} Moedas</span>
                            </span>
                        )}
                    </div>

                    {/* Neon Liquid Progress Bar */}
                    <div className="relative">
                        <div className="flex justify-between text-[10px] font-bold mb-1.5 tracking-wider uppercase">
                            <span className={`${isCompleted ? 'text-emerald-500' : 'text-gray-500'}`}>PROGRESSO</span>
                            <span className={`${isCompleted ? 'text-emerald-600' : 'text-gray-800'}`}>
                                {mission.progress} <span className="text-gray-400 px-0.5">/</span> {mission.target}
                            </span>
                        </div>
                        <div className="h-2 bg-black/5 rounded-full overflow-hidden shadow-inner flex items-center ring-1 ring-black/5 p-0.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className={`h-full rounded-full relative transition-all duration-1000 ${isClaimed
                                    ? 'bg-gray-300'
                                    : isCompleted
                                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                                        : `bg-gradient-to-r ${currentTheme.progress}`
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
