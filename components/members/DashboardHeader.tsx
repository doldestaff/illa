'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { User, Star, Coins, IceCream, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import type { MemberProfile } from '@/lib/gamification-types'
import { useRef } from 'react'

interface Props {
    profile: MemberProfile
    avatarUrl: string | null
    dropsCount: number
    sorvetesCount: number
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

export default function DashboardHeader({ profile, avatarUrl, dropsCount, sorvetesCount }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollY } = useScroll()

    // Parallax only on desktop (mobile scrolls naturally with content)
    const scale = useTransform(scrollY, [0, 200], [1, 0.95])
    const opacity = useTransform(scrollY, [0, 300], [1, 0.9])
    const y = useTransform(scrollY, [0, 200], [0, 10])

    // XP progress within current level (server-provided)
    const xpInto = profile.xp_into_level
    const xpForNext = profile.xp_for_next_level
    const xpToNext = profile.xp_to_next_level
    const isMaxLevel = xpForNext === 0
    const progressPercent = isMaxLevel
        ? 100
        : xpForNext > 0
            ? Math.min(100, Math.round((xpInto / xpForNext) * 100))
            : 0

    const missingFields = profile.missing_fields || []
    const shouldCompleteProfile = missingFields.length > 0

    return (
        <motion.div
            ref={ref}
            style={{ scale, opacity, y }}
            className="md:sticky md:top-4 z-40 mb-6 md:mb-8"
        >
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.02] backdrop-blur-[50px] border border-white/10 text-white p-6 md:p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] ring-1 ring-white/20 group transition-all duration-500 hover:bg-white/[0.05]">

                {/* 0. Gloss Overlay (Top-Down Reflection) */}
                <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-white/15 via-white/5 to-transparent pointer-events-none" />

                {/* 1. Dynamic 'Vitral' Ambient Background */}
                <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
                    {/* Prismatic Orbs - intensified & animated */}
                    <div className="absolute -top-32 -right-32 w-[35rem] h-[35rem] bg-gradient-to-br from-rose-500/30 via-fuchsia-500/30 to-indigo-500/30 rounded-full blur-[80px] mix-blend-screen animate-pulse duration-[4000ms]" />
                    <div className="absolute top-20 -left-20 w-[28rem] h-[28rem] bg-gradient-to-tr from-cyan-500/30 via-sky-500/30 to-blue-500/30 rounded-full blur-[60px] mix-blend-screen animate-pulse duration-[5000ms]" />

                    {/* Glass Noise/Texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay" />
                </div>

                {/* Back to Home Button (Top Left) */}
                <Link
                    href="/"
                    className="absolute top-4 left-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 transform hover:scale-110 active:scale-95"
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
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/50 bg-black/20 ring-4 ring-white/20 shadow-2xl transform transition-transform group-hover/avatar:scale-105 duration-300">
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
                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-illa-yellow to-amber-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-0.5 z-20 transform group-hover/avatar:rotate-12 transition-transform">
                            <Star size={10} fill="currentColor" />
                            <span>LVL {profile.level}</span>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold truncate text-white tracking-tight drop-shadow-sm filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                {profile.full_name || 'Membro ILLA'}
                            </h1>

                            {/* Sorvetes Free — Animated & Premium */}
                            <motion.div
                                key={sorvetesCount} // Triggers animation on change
                                initial={{ scale: 0.8 }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E5017D]/30 border border-[#E5017D]/40 relative overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(229,1,125,0.3)] group/sorvete"
                            >
                                {/* Internal Glow */}
                                <div className="absolute inset-0 bg-[#E5017D]/20 blur-md" />

                                <IceCream size={14} className="text-white drop-shadow-md relative z-10 group-hover/sorvete:rotate-12 transition-transform" />
                                <span className="text-sm font-black text-white relative z-10 drop-shadow-sm">{sorvetesCount}</span>

                                {/* Sparkle Effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                                    animate={{ x: ['-200%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                />
                            </motion.div>
                        </div>

                        {/* ── Coins (Moedas) — Refined & Palatable ── */}
                        <div className="mt-3 flex items-center gap-3">
                            <div className="relative group/coins cursor-default">
                                <div className="flex items-center gap-3 px-4 py-2 rounded-[1.2rem] bg-black/30 border border-white/10 backdrop-blur-md relative overflow-hidden shadow-lg shadow-black/10">
                                    {/* Ambient gold glow */}
                                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-[#FCD34D]/10 blur-xl pointer-events-none" />

                                    {/* Icon Container - Single Coin Representation */}
                                    <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] shadow-[0_2px_8px_rgba(245,158,11,0.4)] border border-[#FCD34D]/50 group-hover/coins:scale-110 transition-transform duration-300">
                                        <span className="text-[#78350F] font-bold text-lg leading-none pt-[1px]">$</span>
                                    </div>

                                    {/* Number + Label */}
                                    <div className="relative z-10 flex items-baseline gap-2">
                                        <span className="text-xl font-black text-white tracking-tight tabular-nums drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                                            {profile.points.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FCD34D]">
                                            Moedas
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Drops Counter ── */}
                            <div className="relative group/drops cursor-default">
                                <div className="flex items-center gap-2 px-3 py-2 rounded-[1.2rem] bg-blue-900/40 border border-blue-500/30 backdrop-blur-md relative overflow-hidden shadow-lg shadow-blue-900/20">
                                    <div className="relative z-10 flex items-center justify-center w-6 h-6">
                                        {/* Simple droplet icon using CSS/SVG since we might not have the icon imported yet or want a custom look */}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">
                                            <path d="M12 2.25c-5.385 5.965-8.25 10.518-8.25 14.12 0 4.293 3.409 7.63 7.828 7.63 1.954 0 3.829-.68 5.3-1.956 2.37-2.057 3.543-5.074 2.871-7.859-1.28-5.32-6.505-10.74-7.749-11.935Z" />
                                        </svg>
                                    </div>
                                    <span className="text-lg font-black text-white tabular-nums drop-shadow-sm">
                                        {profile.drops || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* XP Progress Bar (Liquid Style) */}
                        <div className="mt-4 relative group/xp">
                            <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                                <span className="flex items-baseline gap-1">
                                    <span className="text-sm font-black text-white tabular-nums">{xpInto}</span>
                                    <span>/ {isMaxLevel ? '∞' : xpForNext} XP</span>
                                </span>
                                <span className="text-white/50">
                                    {isMaxLevel
                                        ? 'Nível máximo!'
                                        : `Faltam ${xpToNext} XP`
                                    }
                                </span>
                            </div>
                            <div className="h-5 bg-black/10 rounded-full overflow-hidden border border-white/10 shadow-[inner_0_2px_4px_rgba(0,0,0,0.1)] relative group/bar">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-illa-pink via-purple-500 to-illa-yellow relative"
                                >
                                    {/* Palatable Glow (Juicy) */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/20" />

                                    {/* Liquid shimmer - enticing movement */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_2s_infinite] opacity-70 w-[200%]" />

                                    {/* Leading Edge Glow (Peak-End Rule) */}
                                    <div className="absolute right-0 top-0 bottom-0 w-3 bg-white blur-[4px] shadow-[0_0_20px_white]" />

                                    {/* Particles/Bubbles (Optional delight) */}
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                                </motion.div>

                                {/* Glass Tube Highlight - curve sensation */}
                                <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Completion CTA (Only if incomplete) */}
                {shouldCompleteProfile && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 animate-bounce">
                                <Star size={14} fill="currentColor" />
                            </div>
                            <div className="text-xs text-gray-500">
                                <p className="font-bold text-gray-900">Complete seu perfil</p>
                                <p>Ganhe <span className="text-amber-600 font-bold">+50 XP</span></p>
                            </div>
                        </div>
                        <Link
                            href="/members/profile"
                            className="flex items-center gap-1 text-xs font-bold bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-illa-yellow hover:text-gray-900 transition-all shadow-lg hover:shadow-illa-yellow/20 active:scale-95"
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
