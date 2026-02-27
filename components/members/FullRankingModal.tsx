'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, X, Loader2 } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import type { LeaderboardEntry } from '@/lib/gamification-types'

interface FullRankingModalProps {
    isOpen: boolean
    onClose: () => void
    currentUserId?: string
}

function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy size={20} className="text-illa-yellow drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]" />
    if (rank === 2) return <Medal size={20} className="text-gray-300 drop-shadow-[0_2px_10px_rgba(209,213,219,0.5)]" />
    if (rank === 3) return <Medal size={20} className="text-amber-600 drop-shadow-[0_2px_10px_rgba(217,119,6,0.5)]" />
    return <span className="text-sm font-black text-white/40 w-5 text-center">{rank}</span>
}

function getInitials(name: string | null): string {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function FullRankingModal({ isOpen, onClose, currentUserId }: FullRankingModalProps) {
    const [ranking, setRanking] = useState<LeaderboardEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!isOpen) return

        const fetchFullRanking = async () => {
            setIsLoading(true)
            try {
                const supabase = createSupabaseBrowser()

                // Calculate the start of the current week (Monday)
                const now = new Date()
                const startOfWeek = new Date(now)
                const day = now.getDay()
                const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
                startOfWeek.setDate(diff)
                startOfWeek.setHours(0, 0, 0, 0)

                // Try calling RPC if it exists, otherwise fallback to standard query
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('get_weekly_leaderboard', { week_start: startOfWeek.toISOString() })

                if (!rpcError && rpcData) {
                    setRanking(rpcData as LeaderboardEntry[])
                } else {
                    // Fallback purely by total XP if RPC fails
                    const { data: fallbackData } = await supabase
                        .from('profiles')
                        .select('user_id:id, full_name, avatar_path, xp:points') // Assume points as XP fallback for demo
                        .order('points', { ascending: false })
                        .limit(100)

                    if (fallbackData) {
                        setRanking(fallbackData as unknown as LeaderboardEntry[])
                    }
                }
            } catch (error) {
                console.error("Error fetching full ranking", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchFullRanking()

        const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', bounce: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-[2rem] bg-gradient-to-br from-gray-900/90 to-black/95 border border-white/10 shadow-[0_0_50px_rgba(229,1,125,0.15)] overflow-hidden"
                    >
                        {/* Ambient Backlight */}
                        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-illa-pink/20 to-transparent pointer-events-none mix-blend-screen" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 blur-[60px] pointer-events-none mix-blend-screen rounded-full" />

                        {/* Glass Gloss */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

                        {/* Header */}
                        <div className="relative p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 drop-shadow-md tracking-tight">
                                <Trophy size={24} className="text-illa-yellow shrink-0" />
                                Ranking Semanal Completo
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all backdrop-blur-sm self-start"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="relative flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar scroll-smooth">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-white/50">
                                    <Loader2 size={32} className="animate-spin mb-4 text-illa-pink" />
                                    <p className="font-medium tracking-wide">Carregando combatentes...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 relative z-10">
                                    {ranking.map((entry, index) => {
                                        const rank = index + 1
                                        const isCurrentUser = currentUserId === entry.user_id
                                        const isTop3 = rank <= 3

                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.02, ease: "easeOut" }}
                                                key={entry.user_id}
                                                className={`flex items-center gap-4 px-4 py-3.5 rounded-[1.2rem] border transition-all ${isCurrentUser
                                                        ? 'bg-illa-pink/10 border-illa-pink/30 shadow-[0_0_20px_rgba(229,1,125,0.15)] ring-1 ring-illa-pink/20'
                                                        : isTop3
                                                            ? 'bg-white/[0.06] border-white/10 backdrop-blur-sm'
                                                            : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                                                    }`}
                                            >
                                                <div className="w-8 flex justify-center shrink-0">
                                                    {getRankIcon(rank)}
                                                </div>

                                                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border bg-gradient-to-br overflow-hidden shadow-inner ${rank === 1 ? 'from-amber-300 to-yellow-500 border-yellow-200' :
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
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.parentElement?.classList.add('fallback-avatar');
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className={`text-xs font-black ${isTop3 ? 'text-black/60' : 'text-white/50'}`}>
                                                            {getInitials(entry.full_name)}
                                                        </span>
                                                    )}
                                                    {/* Fallback Initial if image fails */}
                                                    {entry.avatar_path && (
                                                        <div className="hidden group-[.fallback-avatar]:flex absolute inset-0 items-center justify-center">
                                                            <span className={`text-xs font-black ${isTop3 ? 'text-black/60' : 'text-white/50'}`}>
                                                                {getInitials(entry.full_name)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-base font-bold truncate ${isCurrentUser ? 'text-illa-pink' : 'text-white/90'}`}>
                                                        {entry.full_name || 'Membro ILLA'}
                                                        {isCurrentUser && <span className="ml-2 text-[10px] uppercase font-black bg-illa-pink text-white px-1.5 py-0.5 rounded-sm">Você</span>}
                                                    </p>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                                                    <span className={`text-sm font-black tabular-nums tracking-tight ${isCurrentUser ? 'text-white' : 'text-illa-yellow'}`}>
                                                        {entry.xp.toLocaleString('pt-BR')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-white/40 uppercase">XP</span>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
