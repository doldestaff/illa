'use client'

import type { LeaderboardEntry } from '@/lib/gamification-types'
import { Trophy, Medal } from 'lucide-react'

interface Props {
    leaderboard: {
        top10: LeaderboardEntry[]
        user_position: number | null
    }
    currentUserId?: string
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

export default function WeeklyLeaderboard({ leaderboard }: Props) {
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

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-dark flex items-center gap-2">
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
                {top10.map((entry, i) => {
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

                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-illa-pink/20 to-orange-200/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-dark/50">
                                    {getInitials(entry.full_name)}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-dark truncate">
                                    {entry.full_name || 'Membro'}
                                </p>
                            </div>

                            <span className="text-xs font-bold text-dark/60 flex-shrink-0">
                                {entry.week_xp.toLocaleString('pt-BR')} XP
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
