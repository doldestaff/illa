'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CelebrationWindow, CelebrationClaimResult } from '@/lib/gamification-types'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Coins, Clock, Loader2, PartyPopper, AlertCircle, IceCream, ChevronRight } from 'lucide-react'
import GlobalCoin from '@/components/ui/GlobalCoin'

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
                    className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] max-w-[92vw] w-auto pointer-events-auto"
                >
                    {/* 
                      THE PREMIUM CLOUD WRAPPER 
                      Uses a combination of a central pill + 3 absolute overlapping circles.
                      Because they are all solid white, they fuse seamlessly.
                      The parent uses CSS `drop-shadow` to cast a unified shadow around the entire complex shape.
                    */}
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative group my-8 w-[340px] max-w-[90vw] mx-auto filter drop-shadow-[0_15px_30px_rgba(229,0,126,0.25)] hover:drop-shadow-[0_20px_40px_rgba(229,0,126,0.35)] transition-all duration-700"
                    >
                        {/* --- Cloud Geometry (Solid White) --- */}
                        <div className="absolute -top-4 left-[10%] w-[4.5rem] h-[4.5rem] bg-white rounded-full" />
                        <div className="absolute -top-11 left-1/2 -translate-x-1/2 w-[7.5rem] h-[7.5rem] bg-white rounded-full" />
                        <div className="absolute -top-6 right-[10%] w-[5.5rem] h-[5.5rem] bg-white rounded-full" />

                        {/* Bottom Humps */}
                        <div className="absolute -bottom-5 left-[12%] w-[4rem] h-[4rem] bg-white rounded-full" />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[6.5rem] h-[6.5rem] bg-white rounded-full" />
                        <div className="absolute -bottom-4 right-[12%] w-[4.5rem] h-[4.5rem] bg-white rounded-full" />

                        {/* Left Humps */}
                        <div className="absolute top-1/2 -translate-y-1/2 -left-6 w-[5.5rem] h-[5.5rem] bg-white rounded-full" />
                        <div className="absolute top-[15%] -left-3 w-[4rem] h-[4rem] bg-white rounded-full" />
                        <div className="absolute bottom-[15%] -left-3 w-[4.5rem] h-[4.5rem] bg-white rounded-full" />

                        {/* Right Humps */}
                        <div className="absolute top-1/2 -translate-y-1/2 -right-6 w-[5.5rem] h-[5.5rem] bg-white rounded-full" />
                        <div className="absolute top-[15%] -right-3 w-[4rem] h-[4rem] bg-white rounded-full" />
                        <div className="absolute bottom-[15%] -right-3 w-[4.5rem] h-[4.5rem] bg-white rounded-full" />

                        {/* Core Base Rectangle */}
                        <div className="absolute inset-0 bg-white rounded-[2.5rem]" />

                        {/* --- Content Wrapper --- */}
                        <div className="relative z-10 px-8 py-7 flex flex-col items-center justify-center min-h-[160px]">
                            <AnimatePresence mode="wait">
                                {claimed ? (
                                    <motion.div
                                        key="claimed"
                                        initial={{ scale: 0.3, opacity: 0, y: 30, filter: "blur(10px)" }}
                                        animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
                                        transition={{ type: 'spring', bounce: 0.7, duration: 0.8 }}
                                        className="flex flex-col items-center justify-center w-full relative"
                                    >
                                        {/* Premium Burst Particles (Screen blended over white) */}
                                        {[
                                            { x: -50, y: -60, scale: 1.2, color: '#FF007F' },
                                            { x: 50, y: -40, scale: 0.8, color: '#FFD700' },
                                            { x: -40, y: 50, scale: 1.5, color: '#4ADE80' },
                                            { x: 60, y: 50, scale: 1.1, color: '#FF007F' },
                                            { x: 0, y: -70, scale: 0.9, color: '#FFD700' },
                                            { x: 0, y: 60, scale: 1.3, color: '#4ADE80' }
                                        ].map((particle, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                                                animate={{
                                                    opacity: 0,
                                                    scale: particle.scale,
                                                    x: particle.x,
                                                    y: particle.y
                                                }}
                                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                                className="absolute w-2 h-2 rounded-full pointer-events-none mix-blend-multiply"
                                                style={{ backgroundColor: particle.color }}
                                            />
                                        ))}

                                        <motion.div
                                            animate={{
                                                scale: [1, 1.15, 1],
                                                rotate: [0, -8, 8, -4, 4, 0]
                                            }}
                                            transition={{ duration: 0.9, ease: 'easeOut' }}
                                            className="relative flex items-center justify-center z-20"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-tr from-illa-pink to-amber-400 blur-2xl opacity-40 animate-pulse rounded-full" />
                                            <div className="relative z-10 w-24 h-24 flex items-center justify-center drop-shadow-xl -mt-16 mb-2">
                                                <GlobalCoin size="lg" animate />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                                            className="text-center z-10"
                                        >
                                            <span className="block text-[42px] font-black text-transparent bg-clip-text bg-gradient-to-br from-illa-pink via-[#FF4A6B] to-orange-500 filter leading-none tracking-tight">
                                                +{window.reward_points}
                                            </span>
                                            <span className="text-[14px] font-black text-transparent bg-clip-text bg-gradient-to-br from-illa-pink to-orange-500 uppercase tracking-widest mt-1 block">
                                                {window.reward_points === 1 ? 'Moeda!' : 'Moedas!'}
                                            </span>
                                            <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.4em] mt-2 block">
                                                {window.reward_points === 1 ? 'Coletada' : 'Coletadas'}
                                            </span>
                                        </motion.div>
                                    </motion.div>
                                ) : error ? (
                                    <motion.div
                                        key="error"
                                        initial={{ x: [0, -10, 10, -10, 10, 0] }}
                                        transition={{ duration: 0.4 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="flex flex-col items-center justify-center gap-2 w-full py-4 text-center"
                                    >
                                        <AlertCircle size={32} className="text-red-500 shrink-0 drop-shadow-sm mb-1" />
                                        <span className="text-sm font-black text-red-600 tracking-wide uppercase">
                                            {error}
                                        </span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="unclaimed"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ scale: 0, opacity: 0, rotate: -15, filter: "blur(10px)", y: 20 }}
                                        transition={{ duration: 0.35, ease: "easeIn" }}
                                        className="w-full h-full flex flex-col pt-2"
                                    >
                                        {/* Unclaimed state perfectly crafted for the cloud proportions */}
                                        <div className="flex items-center justify-center gap-4 w-full px-2">
                                            <motion.div
                                                animate={{ y: [-4, 4, -4] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                                className="relative z-20 shrink-0 drop-shadow-lg"
                                            >
                                                <GlobalCoin size="lg" />
                                            </motion.div>
                                            <div className="flex flex-col gap-0.5 z-10 text-left">
                                                <span className="text-[17px] font-black text-[#111] leading-tight">
                                                    Você ganhou
                                                    <br />
                                                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-illa-pink to-orange-500 text-xl tracking-tight leading-none">
                                                        {window.reward_points} Moeda{window.reward_points > 1 ? 's' : ''}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-center mt-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-black/50 bg-black/5 px-2.5 py-1 rounded-full w-fit">
                                                <Clock size={12} className="text-illa-pink/80" />
                                                Expira em <span className="text-black/80 font-black">{timeLeft}</span>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={handleClaim}
                                            disabled={claiming}
                                            className="w-full mt-5 relative overflow-hidden bg-gradient-to-r from-illa-pink to-orange-500 rounded-xl px-4 py-3 shadow-[0_8px_20px_-5px_rgba(229,0,126,0.3)] transition-all focus:outline-none focus:ring-4 focus:ring-illa-pink/30 group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500" />
                                            {claiming ? (
                                                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin mx-auto" />
                                            ) : (
                                                <span className="relative z-10 text-white font-black text-[15px] flex items-center justify-center gap-1.5 uppercase tracking-wide">
                                                    Coletar <ChevronRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                                                </span>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
