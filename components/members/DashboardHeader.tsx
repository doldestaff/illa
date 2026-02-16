'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { User, Star, IceCream, Zap, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import type { MemberProfile } from '@/lib/gamification-types'
import { useRef } from 'react'

interface Props {
    profile: MemberProfile
    avatarUrl: string | null
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

export default function DashboardHeader({ profile, avatarUrl }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollY } = useScroll()

    // Parallax & Resize effects based on scroll
    // Header shrinks from 110% scale to 95%
    const scale = useTransform(scrollY, [0, 200], [1, 0.95])
    // Opacity fades slightly to focus on content
    const opacity = useTransform(scrollY, [0, 300], [1, 0.9])
    const y = useTransform(scrollY, [0, 200], [0, 10])

    const progressPercent =
        profile.next_level_xp > 0
            ? Math.min(100, Math.round((profile.xp / profile.next_level_xp) * 100))
            : 0

    const missingFields = profile.missing_fields || []
    const shouldCompleteProfile = missingFields.length > 0

    return (
        <motion.div
            ref={ref}
            style={{ scale, opacity, y }}
            className="sticky top-4 z-40 mb-8"
        >
            <div className="relative overflow-hidden rounded-[2rem] bg-black/40 backdrop-blur-2xl border border-white/10 text-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-500 group">

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

                            {/* Ice Cream Streak */}
                            {profile.streak_count > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                    <IceCream size={14} className="text-orange-400 animate-[bounce_2s_infinite]" />
                                    <span className="text-xs font-bold">{profile.streak_count}</span>
                                </div>
                            )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-sm font-medium text-white/60 mt-2">
                            <div className="flex items-center gap-1.5 text-white/90 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                <Zap size={14} className="text-illa-pink fill-current" />
                                <span className="font-bold">{profile.points.toLocaleString()}</span>
                                <span className="text-[10px] uppercase tracking-wider opacity-60 text-illa-pink">Moedas</span>
                            </div>
                        </div>

                        {/* XP Progress Bar (Liquid Style) */}
                        <div className="mt-4 relative group/xp">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                                <span>XP Progress</span>
                                <span className="text-white/70">{progressPercent}%</span>
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
