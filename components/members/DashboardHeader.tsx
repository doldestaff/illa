'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { User, Star, IceCream, Zap, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import type { MemberProfile } from '@/lib/gamification-types'
import { useRef } from 'react'

interface Props {
    profile: MemberProfile
    avatarUrl: string | null
    dropsCount: number
}

const SHIMMER_Animation = {
    initial: { backgroundPosition: '-200% 0' },
    animate: {
        backgroundPosition: '200% 0',
        transition: {
            repeat: Infinity,
            duration: 3,
            ease: "linear" as const,
            repeatDelay: 2
        }
    }
}

export default function DashboardHeader({ profile, avatarUrl, dropsCount }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollY } = useScroll()

    // Parallax only on desktop (mobile scrolls naturally with content)
    const scale = useTransform(scrollY, [0, 200], [1, 0.95])
    const opacity = useTransform(scrollY, [0, 300], [1, 0.9])
    const y = useTransform(scrollY, [0, 200], [0, 10])

    // XP progress toward next level (total XP / threshold)
    const totalXp = profile.xp
    const nextLevelXp = profile.next_level_xp
    const progressPercent =
        nextLevelXp > 0
            ? Math.min(100, Math.round((totalXp / nextLevelXp) * 100))
            : 0

    const missingFields = profile.missing_fields || []
    const shouldCompleteProfile = missingFields.length > 0

    return (
        <motion.div
            ref={ref}
            style={{ scale, opacity, y }}
            className="md:sticky md:top-4 z-40 mb-6 md:mb-8"
        >
            <div className="relative overflow-hidden rounded-[2rem] bg-black/40 backdrop-blur-lg md:backdrop-blur-2xl border border-white/10 text-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] group">

                {/* 1. Dynamic Ambient Background (Internal) */}
                <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                    <div className="absolute -top-32 -right-32 w-80 h-80 bg-illa-pink/20 rounded-full blur-[100px] animate-pulse mix-blend-screen" />
                    <div className="absolute top-1/2 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] mix-blend-screen" />
                </div>

                {/* Back to Home Button (Top Left) */}
                <Link
                    href="/"
                    className="absolute top-4 left-4 p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 transform hover:scale-110 active:scale-95"
                    title="Voltar para Home"
                >
                    <Home size={20} />
                </Link>

                {/* 2. Glass Shine Effect */}
                <motion.div
                    variants={SHIMMER_Animation}
                    initial="initial"
                    animate="animate"
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                    style={{ backgroundSize: '200% 100%' }}
                />

                <div className="relative z-10 flex items-center gap-5 mt-4">
                    {/* 3. 3D Avatar Container */}
                    <div className="relative group/avatar cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-br from-illa-pink to-illa-yellow rounded-full opacity-60 blur-md group-hover/avatar:opacity-100 group-hover/avatar:blur-lg transition duration-500"></div>
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 bg-dark ring-4 ring-black/40 shadow-2xl transform transition-transform group-hover/avatar:scale-105 duration-300">
                            {profile.avatar_path && avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={profile.full_name || 'User'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white/50">
                                    <User size={32} />
                                </div>
                            )}
                        </div>

                        {/* Floating Level Badge */}
                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-illa-yellow to-amber-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-dark flex items-center gap-0.5 z-20 transform group-hover/avatar:rotate-12 transition-transform">
                            <Star size={10} fill="currentColor" />
                            <span>LVL {profile.level}</span>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold truncate text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 tracking-tight drop-shadow-sm">
                                {profile.full_name || 'Membro ILLA'}
                            </h1>

                            {/* Drops Collected — compact accent chip */}
                            <motion.div
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E5017D]/10 border border-[#E5017D]/20 relative overflow-hidden"
                                animate={{
                                    borderColor: [
                                        'rgba(229,1,125,0.15)',
                                        'rgba(229,1,125,0.35)',
                                        'rgba(229,1,125,0.15)'
                                    ]
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <IceCream size={12} className="text-[#E5017D] relative z-10" />
                                <span className="text-[11px] font-bold text-[#E5017D] relative z-10">{dropsCount}</span>
                            </motion.div>
                        </div>

                        {/* ── Coins (Moedas) — Hero Reward Display ── */}
                        {/* UX: Von Restorff (focal isolation), Goal Gradient (visible accumulation),
                             Anchoring (large number = "I have value"), Peak-End (breathing glow) */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="mt-3 relative"
                        >
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#E5017D]/8 via-[#1a1a2e]/80 to-[#E5017D]/5 border border-[#E5017D]/15 backdrop-blur-md relative overflow-hidden group">
                                {/* Ambient radial glow behind icon */}
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#E5017D]/20 blur-xl pointer-events-none" />

                                {/* Shimmer sweep */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5017D]/8 to-transparent skew-x-12 pointer-events-none"
                                    animate={{ x: ['-150%', '250%'] }}
                                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
                                />

                                {/* Icon with breathing glow */}
                                <motion.div
                                    className="relative z-10 flex items-center justify-center w-8 h-8 rounded-xl bg-[#E5017D]/15 border border-[#E5017D]/20"
                                    animate={{
                                        boxShadow: [
                                            '0 0 0px rgba(229,1,125,0)',
                                            '0 0 16px rgba(229,1,125,0.35)',
                                            '0 0 0px rgba(229,1,125,0)'
                                        ]
                                    }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <Zap size={16} className="text-[#E5017D] fill-current" />
                                </motion.div>

                                {/* Number + Label (Anchoring: number large = perceived value) */}
                                <div className="relative z-10 flex items-baseline gap-2">
                                    <span className="text-xl font-black text-white tracking-tight tabular-nums">
                                        {profile.points.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E5017D]/70">
                                        Moedas
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* XP Progress Bar (Liquid Style) */}
                        <div className="mt-4 relative group/xp">
                            <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                                <span className="flex items-baseline gap-1">
                                    <span className="text-sm font-black text-white tabular-nums">{totalXp}</span>
                                    <span>XP</span>
                                </span>
                                <span className="flex items-baseline gap-1">
                                    <span className="text-white/60">/ {nextLevelXp}</span>
                                    <span>XP</span>
                                </span>
                            </div>
                            <div className="h-3 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5 shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-illa-pink via-purple-500 to-indigo-500 relative"
                                >
                                    {/* Liquid shine */}
                                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] skew-x-12 opacity-50" />
                                    {/* Glow tip */}
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px] shadow-[0_0_10px_white]" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Completion CTA (Only if incomplete) */}
                {shouldCompleteProfile && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-illa-yellow/20 flex items-center justify-center text-illa-yellow animate-bounce">
                                <Star size={14} fill="currentColor" />
                            </div>
                            <div className="text-xs text-white/60">
                                <p className="font-bold text-white">Complete seu perfil</p>
                                <p>Ganhe <span className="text-illa-yellow">+50 XP</span></p>
                            </div>
                        </div>
                        <Link
                            href="/members/profile"
                            className="flex items-center gap-1 text-xs font-bold bg-white text-dark px-4 py-2 rounded-xl hover:bg-illa-yellow hover:text-dark transition-all shadow-lg hover:shadow-illa-yellow/20 active:scale-95"
                        >
                            Completar
                            <ChevronRight size={12} />
                        </Link>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
