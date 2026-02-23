'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CelebrationWindow, CelebrationClaimResult } from '@/lib/gamification-types'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Coins, Clock, Loader2, PartyPopper, AlertCircle } from 'lucide-react'

interface Props {
    onClaim: (result: CelebrationClaimResult) => void
    /** How often to poll for new celebration windows (ms). Default: 5 min */
    pollIntervalMs?: number
    /** Delay before first poll (ms). Default: 10s */
    initialDelayMs?: number
}

export default function OnlineCelebrationManager({ onClaim, pollIntervalMs = 5 * 60 * 1000, initialDelayMs = 10_000 }: Props) {
    const [window, setWindow] = useState<CelebrationWindow | null>(null)
    const [claiming, setClaiming] = useState(false)
    const [timeLeft, setTimeLeft] = useState('')
    const [claimed, setClaimed] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Check if tab is visible
    const isVisible = useCallback(() => document.visibilityState === 'visible', [])

    // Fetch/create celebration window
    const checkWindow = useCallback(async () => {
        if (!isVisible()) return

        try {
            const res = await fetch('/api/rewards/window')
            const data = await res.json()

            if (data.status === 'open' && data.window_id) {
                setWindow(data as CelebrationWindow)
                setClaimed(false)
                setError(null)
            } else {
                setWindow(null)
            }
        } catch {
            // Silent fail
        }
    }, [isVisible])

    // Poll every 5 minutes
    useEffect(() => {
        const initialTimeout = setTimeout(checkWindow, initialDelayMs)
        pollingRef.current = setInterval(checkWindow, pollIntervalMs)

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                checkWindow()
            }
        }
        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            clearTimeout(initialTimeout)
            if (pollingRef.current) clearInterval(pollingRef.current)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [checkWindow])

    // Countdown timer for open window
    useEffect(() => {
        if (!window || window.status !== 'open') {
            setTimeLeft('')
            return
        }

        const updateTimer = () => {
            const end = new Date(window.window_end).getTime()
            const now = Date.now()
            const diff = end - now

            if (diff <= 0) {
                setTimeLeft('00:00')
                setWindow(null)
                return
            }

            const m = Math.floor(diff / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
        }

        updateTimer()
        intervalRef.current = setInterval(updateTimer, 1000)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [window])

    // Claim handler
    const handleClaim = useCallback(async () => {
        if (!window || claiming || claimed) return
        setClaiming(true)
        setError(null)

        try {
            const res = await fetch('/api/rewards/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ window_id: window.window_id }),
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Erro de conexão' }))
                setError(errData.error || 'Não foi possível resgatar')
                setTimeout(() => setError(null), 4000)
                return
            }

            const data: CelebrationClaimResult = await res.json()

            if (data.success) {
                setClaimed(true)
                onClaim(data)
                setTimeout(() => {
                    setWindow(null)
                    setClaimed(false)
                }, 3000)
            } else {
                setError('Moedas já resgatadas!')
                setTimeout(() => {
                    setError(null)
                    setWindow(null)
                }, 3000)
            }
        } catch {
            setError('Erro de conexão. Tente novamente.')
            setTimeout(() => setError(null), 4000)
        } finally {
            setClaiming(false)
        }
    }, [window, claiming, claimed, onClaim])

    return (
        <AnimatePresence>
            {window && window.status === 'open' && (
                <motion.div
                    initial={{ y: -80, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -80, opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-[92vw] w-auto"
                >
                    <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                        {claimed ? (
                            <>
                                <PartyPopper size={20} className="text-[#FAFF00] animate-bounce" />
                                <span className="text-sm font-bold text-white">
                                    +{window.reward_points} Moeda{window.reward_points > 1 ? 's' : ''} resgatada{window.reward_points > 1 ? 's' : ''}!
                                </span>
                            </>
                        ) : error ? (
                            <>
                                <AlertCircle size={20} className="text-red-400 shrink-0" />
                                <span className="text-sm font-bold text-red-300">
                                    {error}
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <Gift size={20} className="text-[#FAFF00] animate-pulse" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-bold text-white">
                                        🎉 +{window.reward_points} Moeda{window.reward_points > 1 ? 's' : ''} grátis!
                                    </span>
                                    <span className="text-[10px] text-white/50 flex items-center gap-1">
                                        <Clock size={10} />
                                        Expira em {timeLeft}
                                    </span>
                                </div>
                                <button
                                    onClick={handleClaim}
                                    disabled={claiming}
                                    className="ml-2 px-4 py-1.5 rounded-xl bg-[#FAFF00] text-black text-xs font-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {claiming ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Coins size={14} />
                                            Resgatar
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
