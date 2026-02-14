'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ActiveDrop, MemberProfile } from '@/lib/gamification-types'
import { Zap, Clock, PackageCheck, Loader2, Gift } from 'lucide-react'

interface Props {
    drop: ActiveDrop | null
    onClaim: (dropId: string) => Promise<{ success: boolean }>
}

export default function FlashDrop({ drop, onClaim }: Props) {
    const [timeLeft, setTimeLeft] = useState('')
    const [claiming, setClaiming] = useState(false)
    const [claimed, setClaimed] = useState(drop?.already_claimed ?? false)

    const calculateTimeLeft = useCallback(() => {
        if (!drop) return ''
        const end = new Date(drop.ends_at).getTime()
        const now = new Date().getTime()
        const diff = end - now
        if (diff <= 0) return '00:00:00'

        const h = Math.floor(diff / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }, [drop])

    useEffect(() => {
        if (!drop) return
        setTimeLeft(calculateTimeLeft())
        const timer = setInterval(() => {
            const left = calculateTimeLeft()
            setTimeLeft(left)
            if (left === '00:00:00') clearInterval(timer)
        }, 1000)
        return () => clearInterval(timer)
    }, [drop, calculateTimeLeft])

    const handleClaim = async () => {
        if (!drop || claiming || claimed) return
        setClaiming(true)
        try {
            const result = await onClaim(drop.id)
            if (result.success) {
                setClaimed(true)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setClaiming(false)
        }
    }

    if (!drop) {
        return (
            <div className="rounded-3xl border border-dashed border-gray-200/50 bg-gray-50/50 p-6 flex flex-col items-center justify-center text-center gap-2 group hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform">
                    <PackageCheck size={24} />
                </div>
                <div>
                    <p className="text-sm font-bold text-dark/40">Sem Drops Ativos</p>
                    <p className="text-xs text-dark/30">Fique atento para recompensas relâmpago!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6 shadow-2xl shadow-purple-900/40 border border-white/10 group">
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/30 rounded-full blur-[80px] animate-pulse" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-illa-pink/30 rounded-full blur-[80px] animate-pulse" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg ${!claimed ? 'animate-bounce' : ''}`}>
                            <Zap size={20} className="text-illa-yellow" fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold leading-tight drop-shadow-md">Flash Drop Ativo!</h2>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-white/70 bg-black/20 px-2 py-0.5 rounded-lg w-fit mt-1">
                                <Clock size={12} />
                                <span className="font-mono tracking-wide countdown-pulse text-illa-yellow">{timeLeft}</span>
                            </div>
                        </div>
                    </div>

                    {drop.reward_type && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Recompensa</span>
                            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-illa-yellow to-amber-300 drop-shadow-sm">
                                +{drop.reward_value} {drop.reward_type === 'points' ? 'Pts' : 'XP'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                        <h3 className="font-bold text-sm text-white mb-1">{drop.title}</h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                            {drop.description || 'Resgate esta recompensa exclusiva por tempo limitado!'}
                        </p>
                    </div>

                    <button
                        onClick={handleClaim}
                        disabled={claimed || claiming}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${claimed
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                : 'bg-gradient-to-r from-illa-pink to-purple-600 hover:from-purple-600 hover:to-illa-pink text-white hover:scale-[1.02] active:scale-95 shadow-purple-600/30 ring-2 ring-white/20'
                            }`}
                    >
                        {claiming ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : claimed ? (
                            <>
                                <PackageCheck size={18} />
                                Drop Resgatado
                            </>
                        ) : (
                            <>
                                <Gift size={18} className="animate-pulse" />
                                Resgatar Recompensa
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
