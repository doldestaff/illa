'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CelebrationWindow, CelebrationClaimResult } from '@/lib/gamification-types'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertCircle, ChevronRight, Coins, X } from 'lucide-react'
import GlobalCoin from '@/components/ui/GlobalCoin'
import Link from 'next/link'

interface Props {
    onClaim: (result: CelebrationClaimResult) => void
    pollIntervalMs?: number
    initialDelayMs?: number
}

// ─── Joyful Star-Burst Cloud (Claimed State) ─────────────────────────────────
const STAR_BURSTS = [
    { emoji: '✨', x: -70, y: -60, delay: 0, size: 22, rot: 15 },
    { emoji: '🌟', x: 70, y: -55, delay: 0.1, size: 18, rot: -20 },
    { emoji: '💫', x: -80, y: 20, delay: 0.15, size: 20, rot: 10 },
    { emoji: '✨', x: 80, y: 25, delay: 0.2, size: 16, rot: -10 },
    { emoji: '🌟', x: -30, y: -80, delay: 0.05, size: 14, rot: 5 },
    { emoji: '💛', x: 35, y: -75, delay: 0.12, size: 12, rot: -5 },
    { emoji: '🎉', x: -55, y: 65, delay: 0.25, size: 18, rot: 20 },
    { emoji: '🎊', x: 55, y: 65, delay: 0.18, size: 16, rot: -15 },
]

function GoldenShimmer() {
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none z-0"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{
                background: 'linear-gradient(120deg, transparent 30%, rgba(255,215,0,0.2) 50%, rgba(255,160,0,0.15) 70%, transparent 90%)',
                backgroundSize: '200% 200%',
                borderRadius: 'inherit'
            }}
        />
    )
}

function PremiumGoldenCloud({ children, isClaimed = false }: { children: React.ReactNode, isClaimed?: boolean }) {
    return (
        <div
            className="relative w-[220px] max-w-[92vw] mx-auto group"
            style={{
                filter: isClaimed
                    ? 'drop-shadow(0 -10px 40px rgba(255,215,0,0.5)) drop-shadow(0 0 60px rgba(255,160,0,0.5)) drop-shadow(0 18px 50px rgba(255,215,0,0.4))'
                    : 'drop-shadow(0 12px 32px rgba(255,160,0,0.3)) drop-shadow(0 0 15px rgba(255,215,0,0.2))'
            }}
        >
            {isClaimed && STAR_BURSTS.map((s, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.3, 1, 0.8], x: s.x, y: s.y, rotate: s.rot }}
                    transition={{ duration: 1.8, delay: s.delay, ease: 'easeOut', times: [0, 0.2, 0.7, 1] }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-20"
                    style={{ fontSize: s.size }}
                >
                    {s.emoji}
                </motion.span>
            ))}

            {/* Premium Golden Bumps */}
            <div className="absolute -top-6 left-[8%] w-[60px] h-[60px] rounded-full z-0 bg-gradient-to-br from-[#FFCF24] to-[#FFAD00] overflow-hidden">
                <GoldenShimmer />
            </div>
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[110px] h-[110px] rounded-full z-0 bg-gradient-to-b from-[#FFCF24] via-[#FFAD00] to-[#DF7A00] overflow-hidden">
                <GoldenShimmer />
            </div>
            <div className="absolute -top-6 right-[8%] w-[65px] h-[65px] rounded-full z-0 bg-gradient-to-bl from-[#FFCF24] to-[#FFAD00] overflow-hidden">
                <GoldenShimmer />
            </div>

            {/* Main Body Background (has overflow-hidden for texture, merges seamlessly via top shadow removal) */}
            <div
                className="absolute inset-x-0 bottom-0 top-0 rounded-[2.5rem] bg-[#FFCF24] bg-gradient-to-b from-transparent via-[#FFAD00] to-[#DF7A00] overflow-hidden z-10"
                style={{
                    boxShadow: 'inset 0 -12px 24px rgba(150,40,0,0.5)'
                }}
            >
                <GoldenShimmer />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay pointer-events-none z-0" />
            </div>

            {/* Content Container (no overflow-hidden, allows coin to escape bounds) */}
            <div className="relative z-20 px-3 pt-3 pb-4 w-full flex flex-col items-center justify-center min-h-[80px]">
                {children}
            </div>
        </div>
    )
}

function PostClaimContainer({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } }}
            className="w-full"
        >
            <PremiumGoldenCloud isClaimed>{children}</PremiumGoldenCloud>
        </motion.div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnlineCelebrationManager({ onClaim, pollIntervalMs = 5 * 60 * 1000, initialDelayMs = 10_000 }: Props) {
    const [window, setWindow] = useState<CelebrationWindow | null>(null)
    const [claiming, setClaiming] = useState(false)
    const [timeLeft, setTimeLeft] = useState('')
    const [claimed, setClaimed] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const isVisible = useCallback(() => document.visibilityState === 'visible', [])

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
        } catch { /* Silent */ }
    }, [isVisible])

    useEffect(() => {
        const t = setTimeout(checkWindow, initialDelayMs)
        pollingRef.current = setInterval(checkWindow, pollIntervalMs)
        const vis = () => { if (document.visibilityState === 'visible') checkWindow() }
        document.addEventListener('visibilitychange', vis)
        return () => { clearTimeout(t); if (pollingRef.current) clearInterval(pollingRef.current); document.removeEventListener('visibilitychange', vis) }
    }, [checkWindow])

    useEffect(() => {
        if (!window || window.status !== 'open') { setTimeLeft(''); return }
        const tick = () => {
            const diff = new Date(window.window_end).getTime() - Date.now()
            if (diff <= 0) { setTimeLeft('00:00'); setWindow(null); return }
            const m = Math.floor(diff / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
        }
        tick()
        intervalRef.current = setInterval(tick, 1000)
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [window])

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
                const e = await res.json().catch(() => ({ error: 'Erro de conexão' }))
                setError(e.error || 'Não foi possível resgatar')
                setTimeout(() => setError(null), 4000)
                return
            }
            const data: CelebrationClaimResult = await res.json()
            if (data.success) {
                setClaimed(true)
                onClaim(data)
                setTimeout(() => { setWindow(null); setClaimed(false) }, 4000)
            } else {
                setError('Moedas já resgatadas!')
                setTimeout(() => { setError(null); setWindow(null) }, 3000)
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
                    initial={{ y: -120, opacity: 0, scale: 0.6, rotate: -5 }}
                    animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ y: -120, opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', stiffness: 360, damping: 22, mass: 1 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-[94vw] w-auto pointer-events-auto"
                >
                    <AnimatePresence mode="wait">

                        {/* ── CLAIMED: celebratory, floating ── */}
                        {claimed ? (
                            <motion.div
                                key="cloud-claimed"
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.7, opacity: 0 }}
                                transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                                className="my-10"
                            >
                                <PostClaimContainer>
                                    {/* Burst particles */}
                                    {[
                                        { x: -55, y: -70, scale: 1.2, color: '#FF007F' },
                                        { x: 55, y: -45, scale: 0.8, color: '#FFD700' },
                                        { x: -45, y: 55, scale: 1.5, color: '#4ADE80' },
                                        { x: 65, y: 55, scale: 1.1, color: '#FF007F' },
                                        { x: 0, y: -80, scale: 0.9, color: '#FFD700' },
                                        { x: 0, y: 70, scale: 1.3, color: '#4ADE80' },
                                    ].map((p, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                                            animate={{ opacity: 0, scale: p.scale, x: p.x, y: p.y }}
                                            transition={{ duration: 1.2, ease: 'easeOut' }}
                                            className="absolute w-2.5 h-2.5 rounded-full pointer-events-none mix-blend-multiply left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                            style={{ backgroundColor: p.color }}
                                        />
                                    ))}

                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, -4, 4, 0] }}
                                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
                                        className="relative flex items-center justify-center z-20 mt-1 drop-shadow-[0_0_25px_rgba(255,160,0,0.5)]"
                                    >
                                        <div className="relative z-10 w-[96px] h-[96px] flex items-center justify-center drop-shadow-2xl -mt-20 mb-1">
                                            <GlobalCoin size="lg" animate />
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                                        className="text-center z-10 -mt-2"
                                    >
                                        <span className="block text-[52px] font-black text-white drop-shadow-[0_4px_8px_rgba(220,38,38,0.6)] leading-none tracking-tight">
                                            +{window.reward_points}
                                        </span>
                                        <span className="text-[18px] font-black text-white drop-shadow-[0_2px_4px_rgba(220,38,38,0.6)] uppercase tracking-[0.15em] mt-0.5 block">
                                            {window.reward_points === 1 ? 'MOEDA!' : 'MOEDAS!'}
                                        </span>
                                        <span className="text-[9px] font-bold text-amber-950/60 uppercase tracking-[0.4em] mt-1.5 block">
                                            {window.reward_points === 1 ? 'Coletada' : 'Coletadas'}
                                        </span>
                                    </motion.div>

                                    {/* Dashboard CTA (Soft glowing link) */}
                                    <motion.div
                                        initial={{ y: 5, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.8, duration: 0.5 }}
                                        className="z-10 mt-2 flex justify-center w-full"
                                    >
                                        <Link
                                            href="/members"
                                            className="flex items-center justify-center gap-1.5 px-3 py-1 group animate-pulse hover:animate-none"
                                        >
                                            <Coins size={14} className="text-white/90 group-hover:text-white transition-colors drop-shadow-md" />
                                            <span className="text-[12px] font-black text-white group-hover:text-amber-100 uppercase tracking-widest transition-colors drop-shadow-md">
                                                Minhas Moedas
                                            </span>
                                            <ChevronRight size={14} className="text-white/90 group-hover:translate-x-1 group-hover:text-white transition-all drop-shadow-md" />
                                        </Link>
                                    </motion.div>
                                </PostClaimContainer>
                            </motion.div>

                        ) : error ? (

                            /* ── ERROR state ── */
                            <motion.div
                                key="cloud-error"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="my-10"
                            >
                                <PremiumGoldenCloud>
                                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                                        <AlertCircle size={36} className="text-red-700" />
                                        <span className="text-sm font-black text-red-800 tracking-wide uppercase">{error}</span>
                                    </div>
                                </PremiumGoldenCloud>
                            </motion.div>

                        ) : (

                            /* ── PRE-CLAIM: solid, static ── */
                            <motion.div
                                key="cloud-unclaimed"
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0, rotate: -15, filter: 'blur(10px)', y: 20 }}
                                transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
                                className="my-10"
                            >
                                <PremiumGoldenCloud>
                                    {/* Coin + text */}
                                    <div className="flex items-center justify-center gap-3 w-full -mt-2">
                                        <motion.div
                                            animate={{ y: [-3, 3, -3] }}
                                            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="shrink-0 drop-shadow-xl"
                                        >
                                            <GlobalCoin size="lg" />
                                        </motion.div>
                                        <div className="flex flex-col gap-0 text-left">
                                            <span className="text-[14px] font-bold text-amber-950/70 leading-tight uppercase tracking-wide">
                                                Você ganhou
                                            </span>
                                            <span className="text-white drop-shadow-[0_2px_4px_rgba(220,38,38,0.7)] text-[28px] font-black tracking-tight leading-none">
                                                {window.reward_points} Moeda{window.reward_points > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-center mt-3">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-white/50 backdrop-blur-sm shadow-sm border border-white/40 px-3 py-1.5 rounded-full">
                                            <Clock size={12} className="text-orange-600" strokeWidth={3} />
                                            Expira em <span className="text-amber-950 font-black">{timeLeft}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 w-full mt-4">
                                        {/* Claim Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleClaim}
                                            disabled={claiming}
                                            // Adding a custom hover animation with a sweeping light effect to grab attention
                                            className="flex-1 relative overflow-hidden bg-gradient-to-r from-illa-pink via-[#FF4A6B] to-orange-500 rounded-2xl px-4 py-3.5 shadow-[0_8px_20px_-5px_rgba(229,0,126,0.35)] transition-all focus:outline-none focus:ring-4 focus:ring-illa-pink/30 group disabled:opacity-50 disabled:cursor-not-allowed border-b-4 border-orange-600/30"
                                        >
                                            {/* Sweeping Light Animation Overlay */}
                                            <motion.div
                                                animate={{ x: ['-200%', '200%'] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 z-0 pointer-events-none"
                                                style={{ width: '150%' }}
                                            />

                                            <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[0%] transition-transform duration-500 z-0 pointer-events-none" />

                                            {claiming ? (
                                                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin mx-auto relative z-10 pointer-events-none" />
                                            ) : (
                                                <span className="relative z-10 text-white font-black text-[16px] flex items-center justify-center gap-1.5 uppercase tracking-widest drop-shadow-sm pointer-events-none">
                                                    Coletar <ChevronRight size={18} className="group-hover:translate-x-1.5 transition-transform" strokeWidth={3} />
                                                </span>
                                            )}
                                        </motion.button>

                                        {/* Dismiss/Close Button (Premium Ghost Style) */}
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setWindow(null)}
                                            disabled={claiming}
                                            className="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-colors border border-white/30 disabled:opacity-50 shadow-sm"
                                            aria-label="Dispensar"
                                        >
                                            <X size={18} strokeWidth={3} />
                                        </motion.button>
                                    </div>
                                </PremiumGoldenCloud>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
