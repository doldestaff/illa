'use client'

import { useState, useCallback } from 'react'
import type { SorvetesRedemption } from '@/lib/gamification-types'
import { motion, AnimatePresence } from 'framer-motion'
import { IceCream, Lock, Copy, Check, Loader2, Sparkles, Clock } from 'lucide-react'

const SORVETES_FREE_COST = 900

interface Props {
    currentPoints: number
    onRedeem: (result: SorvetesRedemption) => void
}

export default function SorvetesFreeCta({ currentPoints, onRedeem }: Props) {
    const [redeeming, setRedeeming] = useState(false)
    const [voucher, setVoucher] = useState<SorvetesRedemption | null>(null)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const canRedeem = currentPoints >= SORVETES_FREE_COST
    const pointsNeeded = SORVETES_FREE_COST - currentPoints

    const handleRedeem = useCallback(async () => {
        if (!canRedeem || redeeming) return
        setRedeeming(true)
        setError(null)

        try {
            const res = await fetch('/api/sorvetes-free/redeem', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setVoucher(data as SorvetesRedemption)
                onRedeem(data as SorvetesRedemption)
            } else {
                setError(data.error || 'Erro ao resgatar')
            }
        } catch {
            setError('Erro de conexão')
        } finally {
            setRedeeming(false)
        }
    }, [canRedeem, redeeming, onRedeem])

    const handleCopy = useCallback(async () => {
        if (!voucher) return
        try {
            await navigator.clipboard.writeText(voucher.voucher_code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback: select text
        }
    }, [voucher])

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a0f0a] via-[#2a1510] to-[#0f0a06] p-6 shadow-2xl"
        >
            {/* Ambient glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-illa-pink/20 rounded-full blur-[60px] animate-pulse" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-illa-yellow/15 rounded-full blur-[60px]" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-illa-pink/15 border border-illa-pink/20 backdrop-blur-md">
                        <IceCream size={22} className="text-illa-pink" fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Sorvete Free
                            <Sparkles size={14} className="text-illa-yellow" />
                        </h3>
                        <p className="text-xs text-white/50">
                            {SORVETES_FREE_COST} Moedas = 1 sorvete grátis
                        </p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {voucher ? (
                        /* ── Redeemed State ── */
                        <motion.div
                            key="redeemed"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-3"
                        >
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                                    Seu Voucher
                                </p>
                                <p className="text-2xl font-black text-white tracking-[0.2em] font-mono">
                                    {voucher.voucher_code}
                                </p>
                                <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-white/40">
                                    <Clock size={10} />
                                    Válido até {new Date(voucher.expires_at).toLocaleDateString('pt-BR')}
                                </div>
                            </div>

                            <button
                                onClick={handleCopy}
                                className="w-full py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/15 transition-colors active:scale-95"
                            >
                                {copied ? (
                                    <>
                                        <Check size={14} className="text-emerald-400" />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} />
                                        Copiar Voucher
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ) : canRedeem ? (
                        /* ── Unlocked State ── */
                        <motion.div key="unlocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <button
                                onClick={handleRedeem}
                                disabled={redeeming}
                                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-illa-pink to-purple-600 text-white hover:from-purple-600 hover:to-illa-pink transition-all shadow-lg shadow-illa-pink/20 ring-2 ring-white/10 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {redeeming ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <IceCream size={18} />
                                        Resgatar Sorvete Free
                                    </>
                                )}
                            </button>
                            {error && (
                                <p className="text-xs text-red-400 text-center mt-2">{error}</p>
                            )}
                        </motion.div>
                    ) : (
                        /* ── Locked State ── */
                        <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* Progress bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                                    <span>{currentPoints} / {SORVETES_FREE_COST}</span>
                                    <span>Faltam {pointsNeeded}</span>
                                </div>
                                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (currentPoints / SORVETES_FREE_COST) * 100)}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-illa-pink to-illa-yellow relative"
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12 opacity-50" />
                                    </motion.div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 text-white/30 text-xs font-bold">
                                <Lock size={14} />
                                Faltam {pointsNeeded} Moedas
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
