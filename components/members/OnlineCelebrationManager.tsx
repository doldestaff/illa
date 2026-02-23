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
                }, 4000) // Extendido de 3s para 4s para ver a celebração
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
                    initial={{ y: -100, opacity: 0, scale: 0.5, rotate: -5 }}
                    animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ y: -100, opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, mass: 1 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-[92vw] w-auto"
                >
                    {/* The "Fofinho" Container */}
                    <div className="relative group flex items-center gap-4 px-6 py-4 rounded-[2rem] bg-white/95 backdrop-blur-2xl border-2 border-white/60 shadow-[0_15px_40px_-10px_rgba(229,0,126,0.3)] hover:shadow-[0_20px_50px_-5px_rgba(229,0,126,0.4)] transition-shadow duration-500 overflow-hidden">

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />

                        {/* Background subtle glow */}
                        <div className="absolute -inset-10 bg-gradient-to-r from-illa-pink/10 to-illa-yellow/10 opacity-50 blur-xl pointer-events-none" />

                        {claimed ? (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center justify-center gap-2 w-full min-w-[200px]"
                            >
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, -10, 10, -5, 5, 0]
                                    }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <PartyPopper size={32} className="text-illa-pink" />
                                </motion.div>
                                <span className="text-lg font-black text-illa-pink tracking-tight drop-shadow-sm">
                                    {window.reward_points} Moeda{window.reward_points > 1 ? 's' : ''}!
                                </span>
                                <span className="text-xs text-black/50 font-medium">Creditado na sua carteira</span>
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                initial={{ x: [0, -10, 10, -10, 10, 0] }}
                                transition={{ duration: 0.4 }}
                                className="flex items-center gap-3 w-full"
                            >
                                <AlertCircle size={24} className="text-red-500 shrink-0" />
                                <span className="text-sm font-bold text-red-600">
                                    {error}
                                </span>
                            </motion.div>
                        ) : (
                            <>
                                <div className="relative z-10">
                                    <motion.div
                                        animate={{
                                            rotate: [-5, 5, -5],
                                            y: [-2, 2, -2]
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 3,
                                            ease: "easeInOut"
                                        }}
                                        className="bg-gradient-to-br from-illa-pink to-pink-500 p-2.5 rounded-2xl shadow-lg shadow-pink-500/30"
                                    >
                                        <Gift size={24} className="text-white" />
                                    </motion.div>
                                </div>

                                <div className="flex flex-col gap-0.5 z-10">
                                    <span className="text-base font-black text-[#111] leading-tight">
                                        Pegue <span className="text-illa-pink">{window.reward_points} Moeda{window.reward_points > 1 ? 's' : ''}</span>
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/40 bg-black/5 px-2 py-0.5 rounded-full w-fit">
                                        <Clock size={12} className="text-illa-pink/70" />
                                        Expira em <span className="text-black/70 font-black">{timeLeft}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleClaim}
                                    disabled={claiming}
                                    className="relative overflow-hidden ml-2 px-5 py-2.5 rounded-[1.25rem] bg-illa-yellow text-black text-sm font-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-yellow-500/30 border border-yellow-200 z-10 group/btn"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                    {claiming ? (
                                        <Loader2 size={16} className="animate-spin relative z-10" />
                                    ) : (
                                        <>
                                            <Coins size={16} className="relative z-10 text-orange-600" />
                                            <span className="relative z-10">Resgatar</span>
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
