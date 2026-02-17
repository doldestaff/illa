'use client'

import type { LeaderboardEntry } from '@/lib/gamification-types'
import { Trophy, Medal } from 'lucide-react'

interface Props {
    leaderboard: {
        top10: LeaderboardEntry[]
        user_position: number | null
    }
    currentUserId?: string
    currentUserXP?: number
}

function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy size={16} className="text-illa-yellow" />
    if (rank === 2) return <Medal size={16} className="text-gray-400" />
    if (rank === 3) return <Medal size={16} className="text-amber-600" />
    return <span className="text-xs font-bold text-dark/30 w-4 text-center">{rank}</span>
}

function getInitials(name: string | null): string {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function WeeklyLeaderboard({ leaderboard, currentUserId, currentUserXP }: Props) {
    const { top10, user_position } = leaderboard

    if (top10.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-200/60 bg-gray-50/50 p-5 text-center">
                <Trophy size={20} className="mx-auto text-gray-300 mb-1" />
                <p className="text-sm text-dark/30 font-medium">Nenhuma atividade esta semana</p>
                <p className="text-xs text-dark/20 mt-0.5">Complete missões para entrar no ranking!</p>
            </div>
        )
    }

    // Sync current user's XP if they are in the top 10
    const syncedTop10 = top10.map(entry => {
        if (currentUserId && entry.user_id === currentUserId && currentUserXP !== undefined) {
            return { ...entry, xp: currentUserXP }
        }
        return entry
    }).sort((a, b) => b.xp - a.xp) // Re-sort to maintain order if XP changes affect rank

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 drop-shadow-md">
                    <Trophy size={20} className="text-illa-yellow" />
                    Ranking Semanal
                </h2>
                {user_position && user_position > 10 && (
                    <span className="text-xs font-semibold text-dark/40 bg-dark/5 px-2.5 py-1 rounded-full">
                        Você: #{user_position}
                    </span>
                )}
            </div>

            <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm overflow-hidden">
                {syncedTop10.map((entry, i) => {
                    const rank = i + 1
                    return (
                        <div
                            key={entry.user_id}
                            className={`flex items-center gap-3 px-4 py-3 transition-colors ${i < top10.length - 1 ? 'border-b border-gray-100' : ''
                                } ${rank <= 3 ? 'bg-illa-yellow/5' : ''}`}
                        >
                            <div className="w-6 flex justify-center flex-shrink-0">
                                {getRankIcon(rank)}
                            </div>

                            <div className={`relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border bg-gradient-to-br ${rank === 1 ? 'from-amber-300 to-yellow-500 border-yellow-200 shadow-lg shadow-yellow-500/20' : 'from-gray-100 to-gray-200 border-gray-200'
                                }`}>
                                {entry.avatar_path ? (
                                    <img
                                        src={entry.avatar_path.startsWith('http')
                                            ? entry.avatar_path
                                            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${entry.avatar_path}`}
                                        alt={entry.full_name || 'User'}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className={`text-[10px] font-bold ${rank === 1 ? 'text-yellow-900' : 'text-gray-500'}`}>
                                        {getInitials(entry.full_name)}
                                    </span>
                                )}
                                {rank <= 3 && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <Trophy size={8} className="text-amber-500" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${currentUserId && entry.user_id === currentUserId ? 'text-illa-pink font-bold' : 'text-dark'}`}>
                                    {entry.full_name || 'Membro'}
                                </p>
                            </div>

                            <span className={`text-xs font-bold flex-shrink-0 tabular-nums ${currentUserId && entry.user_id === currentUserId ? 'text-illa-pink' : 'text-dark/60'}`}>
                                {entry.xp.toLocaleString('pt-BR')} XP
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
