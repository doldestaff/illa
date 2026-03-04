'use client'

import type { MemberProfile } from '@/lib/gamification-types'
import { User, Star, Flame, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import GlobalCoin from '@/components/ui/GlobalCoin'


interface Props {
    profile: MemberProfile
    avatarUrl: string | null
}

export default function HudHeader({ profile, avatarUrl }: Props) {
    // Calculate progress within current level (server-provided)
    const isMaxLevel = profile.xp_for_next_level === 0
    const progressPercent = isMaxLevel
        ? 100
        : profile.xp_for_next_level > 0
            ? Math.min(100, Math.round((profile.xp_into_level / profile.xp_for_next_level) * 100))
            : 0

    // Check if profile is incomplete (for CTA)
    const missingFields = profile.missing_fields || []
    const shouldCompleteProfile = missingFields.length > 0



    return (
        <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] group hover:border-white/20 transition-all duration-500">
            {/* Ambient background effects */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-illa-pink/30 rounded-full blur-[80px] animate-pulse mix-blend-screen" />
            <div className="absolute top-1/2 -left-20 w-40 h-40 bg-illa-yellow/20 rounded-full blur-[60px] mix-blend-screen" />

            {/* Subtle grain/texture overlay - REMOVED NOISE & Added Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />

            <div className="relative z-10 flex items-center gap-5">
                {/* Avatar with ring */}
                <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-illa-pink to-illa-yellow rounded-full opacity-70 blur group-hover:opacity-100 transition duration-700"></div>
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dark bg-dark ring-2 ring-white/10 shadow-xl">
                        {profile.avatar_path && avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={profile.full_name || 'User'}
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white/50">
                                <User size={32} />
                            </div>
                        )}
                    </div>

                    {/* Level Badge */}
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-illa-yellow to-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-dark flex items-center gap-0.5 z-20 transform hover:scale-110 transition-transform">
                        <Star size={10} fill="currentColor" />
                        <span>LVL {profile.level}</span>
                    </div>


                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold truncate text-white tracking-tight drop-shadow-sm">
                            {profile.full_name || 'Membro ILLA'}
                        </h1>

                        {/* Streak Flame (Mobile/Desktop) */}
                        {profile.streak_count > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 animate-in fade-in zoom-in duration-500">
                                <Flame size={14} fill="currentColor" className="animate-pulse" />
                                <span className="text-xs font-bold">{profile.streak_count} dias</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-2.5 flex items-center">
                        <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-b from-white/10 to-black/10 border border-white/20 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-illa-yellow/15 to-transparent pointer-events-none" />

                            <div className="relative z-10">
                                <GlobalCoin size="sm" />
                            </div>

                            <div className="relative z-10 flex items-baseline gap-1.5 pr-1">
                                <span className="text-sm font-black text-white tracking-tight drop-shadow-sm tabular-nums">
                                    {profile.points.toLocaleString()}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wider text-[#FCD34D] drop-shadow-sm">
                                    Moedas
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div className="mt-4 relative group/xp">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5 group-hover/xp:text-white/50 transition-colors">
                            <span>{profile.xp_into_level} / {isMaxLevel ? '∞' : profile.xp_for_next_level} XP</span>
                            <span>{isMaxLevel ? 'Nível máximo!' : `Faltam ${profile.xp_to_next_level} XP`}</span>
                        </div>
                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-illa-pink to-purple-500 progress-glow relative transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12"></div>
                            </div>
                        </div>
                        <p className="text-right text-[10px] text-white/30 mt-1 group-hover/xp:text-white/50 transition-colors">
                            {isMaxLevel
                                ? <span className="text-white/70 font-bold">Nível máximo alcançado! 🎉</span>
                                : <>Faltam <span className="text-white/70 font-bold">{profile.xp_to_next_level} XP</span> para o próximo nível</>
                            }
                        </p>
                    </div>
                </div>
            </div>

            {shouldCompleteProfile && (
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2 fade-in duration-700 delay-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-illa-yellow/20 flex items-center justify-center text-illa-yellow animate-bounce">
                            <Star size={14} fill="currentColor" />
                        </div>
                        <div className="text-xs text-white/60">
                            <p className="font-bold text-white">Complete seu perfil</p>
                            <p>Ganhe <span className="text-illa-yellow">+50 XP</span> e <span className="text-illa-pink">+25 Pontos</span></p>
                        </div>
                    </div>
                    <Link
                        href="/members/profile"
                        className="flex items-center gap-1 text-xs font-bold bg-white text-dark px-4 py-2 rounded-xl hover:bg-illa-yellow hover:text-dark transition-all shadow-lg shadow-white/5 hover:scale-105 active:scale-95"
                    >
                        Completar
                        <ChevronRight size={12} />
                    </Link>
                </div>
            )}
        </div>
    )
}
