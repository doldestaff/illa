'use client'

import { useState, useEffect } from 'react'
import type { LedgerEntry } from '@/lib/gamification-types'
import { motion } from 'framer-motion'
import {
    Target, Zap, Gift, IceCream, PartyPopper, Coins, History
} from 'lucide-react'

const KIND_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; color: string }> = {
    mission_claim: { icon: Target, label: 'Missão completa', color: 'text-emerald-400' },
    drop_claim: { icon: Zap, label: 'Drop resgatado', color: 'text-purple-400' },
    celebration_claim: { icon: PartyPopper, label: 'Celebração', color: 'text-[#FAFF00]' },
    sorvetes_free_redeem: { icon: IceCream, label: 'Sorvete Free', color: 'text-illa-pink' },
}

function formatRelativeTime(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diff = now - then

    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'agora'
    if (minutes < 60) return `${minutes}min`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`

    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`

    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function RewardTimeline() {
    const [entries, setEntries] = useState<LedgerEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const res = await fetch('/api/ledger/recent')
                const data = await res.json()
                if (Array.isArray(data)) {
                    setEntries(data)
                }
            } catch {
                // Silent fail
            } finally {
                setLoading(false)
            }
        }
        fetchLedger()
    }, [])

    if (loading) {
        return (
            <div className="rounded-2xl bg-white/5 border border-white/5 p-6 animate-pulse">
                <div className="h-4 w-1/3 bg-white/10 rounded mb-4" />
                <div className="space-y-3">
                    <div className="h-3 w-full bg-white/5 rounded" />
                    <div className="h-3 w-2/3 bg-white/5 rounded" />
                </div>
            </div>
        )
    }

    if (entries.length === 0) return null

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 drop-shadow-md">
                <History size={20} className="text-white/60" />
                Histórico de Recompensas
            </h2>

            <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 p-4 space-y-1">
                {entries.slice(0, 5).map((entry, i) => {
                    const config = KIND_CONFIG[entry.kind] || {
                        icon: Gift,
                        label: entry.kind,
                        color: 'text-white/60',
                    }
                    const Icon = config.icon

                    const deltaText = []
                    if (entry.delta_xp !== 0)
                        deltaText.push(`${entry.delta_xp > 0 ? '+' : ''}${entry.delta_xp} XP`)
                    if (entry.delta_points !== 0)
                        deltaText.push(`${entry.delta_points > 0 ? '+' : ''}${entry.delta_points} Moedas`)

                    return (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
                        >
                            <div className={`p-1.5 rounded-lg bg-white/5 ${config.color}`}>
                                <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white/80 truncate">
                                    {config.label}
                                </p>
                                {deltaText.length > 0 && (
                                    <p className="text-[10px] text-white/40">
                                        {deltaText.join(' · ')}
                                    </p>
                                )}
                            </div>
                            <span className="text-[10px] text-white/30 shrink-0">
                                {formatRelativeTime(entry.created_at)}
                            </span>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
