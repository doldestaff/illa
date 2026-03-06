/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import type { LeaderboardEntry } from '@/lib/gamification-types'
import { Trophy, Medal, ChevronRight } from 'lucide-react'
import FullRankingModal from './FullRankingModal'

interface Props {
    leaderboard: {
        top10: LeaderboardEntry[]
        user_position: number | null
    }
    currentUserId?: string
    currentUserXP?: number
}

function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy size={16} className="text-illa-yellow drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)]" />
    if (rank === 2) return <Medal size={16} className="text-gray-300 drop-shadow-[0_2px_4px_rgba(209,213,219,0.3)]" />
    if (rank === 3) return <Medal size={16} className="text-amber-600 drop-shadow-[0_2px_4px_rgba(217,119,6,0.3)]" />
    return <span className="text-xs font-black text-white/40 w-4 text-center">{rank}</span>
}

function getInitials(name: string | null): string {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function WeeklyLeaderboard({ leaderboard, currentUserId, currentUserXP }: Props) {
    const { top10, user_position } = leaderboard
    const [isModalOpen, setIsModalOpen] = useState(false)

    if (top10.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-center backdrop-blur-md">
                <Trophy size={20} className="mx-auto text-white/30 mb-1" />
                <p className="text-sm text-white/50 font-medium">Nenhuma atividade esta semana</p>
                <p className="text-xs text-white/30 mt-0.5">Complete missões para entrar no ranking!</p>
            </div>
        )
    }

    // Sync current user's XP if they are in the top 10
    const syncedTop10 = top10.map(entry => {
        if (currentUserId && entry.user_id === currentUserId && currentUserXP !== undefined) {
            return { ...entry, xp: currentUserXP }
        }
        return entry
    }).sort((a, b) => b.xp - a.xp).slice(0, 10) // Force Top 10 max

    return (
        <div className="space-y-3 relative group/ranking">
            {/* Ambient Background Glow matching Illa Exclusive */}
            <div className="absolute -inset-4 bg-gradient-to-br from-illa-pink/10 to-transparent blur-2xl pointer-events-none rounded-3xl" />

            <div className="flex items-center justify-between relative z-10">
                <h2 className="text-lg font-black text-white flex items-center gap-2 drop-shadow-md tracking-tight">
                    <Trophy size={20} className="text-illa-yellow drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                    Ranking Semanal
                </h2>
                {user_position && user_position > 10 && (
                    <span className="text-xs font-bold text-white/70 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 shadow-inner backdrop-blur-md shadow-black/20">
                        Você: #{user_position}
                    </span>
                )}
            </div>

            {/* Vitral Container */}
            <div className="rounded-[1.5rem] border border-white/10 bg-black/40 backdrop-blur-[20px] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)] relative z-10 transition-colors duration-500 group-hover/ranking:border-white/20">
                {/* Surface Shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />

                <div className="relative z-10">
                    {syncedTop10.map((entry, i) => {
                        const rank = i + 1
                        const isCurrentUser = currentUserId === entry.user_id

                        return (
                            <div
                                key={entry.user_id}
                                className={`flex items-center gap-3 px-4 py-3 transition-colors ${i < syncedTop10.length - 1 ? 'border-b border-white/5' : ''
                                    } ${rank <= 3 ? 'bg-gradient-to-r from-amber-500/10 to-transparent' : 'hover:bg-white/[0.02]'
                                    }`}
                            >
                                <div className="w-6 flex justify-center flex-shrink-0">
                                    {getRankIcon(rank)}
                                </div>

                                <div className={`relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border bg-gradient-to-br group ${rank === 1 ? 'from-amber-300 to-yellow-500 border-yellow-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                                    rank === 2 ? 'from-gray-300 to-gray-400 border-gray-100' :
                                        rank === 3 ? 'from-amber-600 to-amber-700 border-amber-500' :
                                            'from-gray-800 to-gray-900 border-white/10'
                                    }`}>
                                    {entry.avatar_path ? (
                                        <img
                                            src={entry.avatar_path.startsWith('http')
                                                ? entry.avatar_path
                                                : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${entry.avatar_path}`}
                                            alt={entry.full_name || 'User'}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.classList.add('fallback-avatar');
                                            }}
                                            className="w-full h-full rounded-full object-cover shadow-inner"
                                        />
                                    ) : (
                                        <span className={`text-[10px] font-black ${rank <= 3 ? 'text-black/60' : 'text-white/50'}`}>
                                            {getInitials(entry.full_name)}
                                        </span>
                                    )}
                                    {/* Fallback Initial if image fails */}
                                    {entry.avatar_path && (
                                        <div className="hidden group-[.fallback-avatar]:flex absolute inset-0 items-center justify-center">
                                            <span className={`text-[10px] font-black ${rank <= 3 ? 'text-black/60' : 'text-white/50'}`}>
                                                {getInitials(entry.full_name)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${isCurrentUser ? 'text-illa-pink' : 'text-white/90'}`}>
                                        {entry.full_name || 'Membro'}
                                        {isCurrentUser && <span className="ml-2 text-[8px] uppercase font-black bg-illa-pink text-white px-1 rounded-sm">Você</span>}
                                    </p>
                                </div>

                                <span className={`text-xs font-black flex-shrink-0 tabular-nums ${isCurrentUser ? 'text-white' : 'text-white/50'}`}>
                                    {entry.xp.toLocaleString('pt-BR')} XP
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Botão Ver Ranking Completo */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3.5 px-4 text-xs font-bold text-white/50 hover:text-white hover:bg-white/[0.04] transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider relative z-10 border-t border-white/5 group/btn"
                >
                    Ver Ranking Completo
                    <ChevronRight size={14} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            <FullRankingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentUserId={currentUserId}
            />
        </div>
    )
}
