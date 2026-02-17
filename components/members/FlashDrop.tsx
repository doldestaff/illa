'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ActiveDrop } from '@/lib/gamification-types'
import { IceCream, Clock, PackageCheck, Loader2, Gift, HelpCircle, X, Zap, Radio, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
    drop: ActiveDrop | null
    onClaim: (dropId: string) => Promise<{ success: boolean }>
}

export default function FlashDrop({ drop, onClaim }: Props) {
    const [timeLeft, setTimeLeft] = useState('')
    const [claiming, setClaiming] = useState(false)
    const [claimed, setClaimed] = useState(drop?.already_claimed ?? false)
    const [showWizard, setShowWizard] = useState(false)

    // Calculate time left
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

    return (
        <div className="relative overflow-hidden rounded-3xl transition-all duration-500 group h-full">
            <AnimatePresence mode="wait">
                {!drop ? (
                    // ─── SIGNAL SCANNER MODE (NO DROP) ───
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative h-full min-h-[240px] w-full bg-white/5 backdrop-blur-2xl border border-white/30 rounded-3xl flex flex-col items-center justify-center p-6 text-center overflow-hidden group shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_80px_rgba(255,255,255,0.25)] transition-shadow duration-700"
                    >
                        {/* 1. Dynamic Conic Background */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(229,1,125,0.1)_90deg,transparent_180deg,rgba(252,211,77,0.1)_270deg,transparent_360deg)] opacity-50 blur-xl"
                        />

                        {/* 2. Grid & Noise Overlay */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

                        {/* 3. Scanner Radar Effect */}
                        <div className="relative z-10 flex flex-col items-center justify-center gap-6">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                {/* Core Pulse */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        boxShadow: [
                                            "0 0 0 0px rgba(229, 1, 125, 0)",
                                            "0 0 0 10px rgba(229, 1, 125, 0.2)",
                                            "0 0 0 20px rgba(229, 1, 125, 0)"
                                        ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 rounded-full bg-gradient-to-br from-illa-pink/20 to-illa-yellow/20 backdrop-blur-sm border border-white/10"
                                />

                                {/* Harmonic Rings */}
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{
                                            opacity: [0, 0.5, 0],
                                            scale: [0.8, 2.5],
                                            borderColor: ["rgba(252, 211, 77, 0.8)", "rgba(229, 1, 125, 0.8)", "rgba(59, 130, 246, 0)"]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            delay: i * 0.8,
                                            ease: "easeOut"
                                        }}
                                        className="absolute inset-0 rounded-full border border-t-transparent border-l-transparent border-r-white/20 border-b-white/20"
                                        style={{ rotate: i * 45 }}
                                    />
                                ))}

                                {/* Rotating Scanner Beam */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-t-2 border-illa-pink/80 shadow-[0_0_15px_rgba(229,1,125,0.5)]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-illa-pink/20 to-transparent opacity-50 blur-sm" />
                                </motion.div>

                                {/* Center Icon */}
                                <motion.div
                                    animate={{ color: ["#E5017D", "#FCD34D", "#E5017D"] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="relative z-20 bg-black/50 p-3 rounded-full border border-white/10 backdrop-blur-md"
                                >
                                    <Radio size={28} />
                                </motion.div>
                            </div>

                            <div className="space-y-2 relative">
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center justify-center gap-2"
                                >
                                    {/* Light removed */}
                                    <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 tracking-[0.2em] uppercase">
                                        SCANNER ONLINE
                                    </h3>
                                </motion.div>

                                <p className="text-xs font-medium text-white/60 h-4 flex items-center justify-center gap-1 tracking-wide">
                                    <span>Aguardando por novos drops</span>
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.2, times: [0, 0.2, 1] }}
                                    >.</motion.span>
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.2, delay: 0.2, times: [0, 0.2, 1] }}
                                    >.</motion.span>
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.2, delay: 0.4, times: [0, 0.2, 1] }}
                                    >.</motion.span>
                                </p>
                            </div>
                        </div>

                        {/* Scanline removed */}
                    </motion.div>
                ) : (
                    // ─── LIVE EVENT MODE (ACTIVE DROP) ───
                    <motion.div
                        key="active-drop"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative h-full bg-gradient-to-br from-illa-pink via-purple-600 to-indigo-900 text-white p-6 shadow-2xl shadow-purple-500/30 border border-white/20 rounded-3xl overflow-hidden"
                    >
                        {/* Chaotic Background Energy */}
                        <motion.div
                            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -top-32 -right-32 w-64 h-64 bg-illa-yellow/30 rounded-full blur-[80px] mix-blend-overlay"
                        />
                        <motion.div
                            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
                            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                            className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-400/30 rounded-full blur-[80px] mix-blend-overlay"
                        />
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />

                        {/* Top Bar */}
                        <div className="relative z-10 flex justify-between items-start mb-6">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-white">Event Live</span>
                            </motion.div>

                            <button
                                onClick={() => setShowWizard(true)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <HelpCircle size={14} />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="relative z-10 text-center space-y-4">
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <h2 className="text-2xl md:text-3xl font-black italic uppercase leading-none drop-shadow-xl">
                                    Flash Drop!
                                </h2>
                                <p className="text-sm font-medium text-white/80 mt-2 line-clamp-2">
                                    {drop.title}
                                </p>
                            </motion.div>

                            {/* Rewards Box */}
                            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                <div className="text-[10px] font-bold uppercase text-white/50 mb-1">Recompensa</div>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80 drop-shadow-sm">
                                    +{drop.reward_value} <span className="text-lg text-illa-yellow">{drop.reward_type === 'points' ? 'PTS' : 'XP'}</span>
                                </div>
                            </div>

                            {/* Countdown */}
                            <div className="flex items-center justify-center gap-2 font-mono text-xs text-white/60 bg-black/20 rounded-lg py-1">
                                <Clock size={12} />
                                <span>{timeLeft} restantes</span>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleClaim}
                                disabled={claimed || claiming}
                                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 ${claimed
                                    ? 'bg-emerald-500 text-white cursor-default'
                                    : 'bg-white text-illa-pink hover:bg-gray-50'
                                    }`}
                            >
                                {claiming ? (
                                    <Loader2 size={18} className="animate-spin text-illa-pink" />
                                ) : claimed ? (
                                    <>
                                        <PackageCheck size={18} /> Resgatado!
                                    </>
                                ) : (
                                    <>
                                        <Zap size={18} fill="currentColor" /> RESGATAR AGORA
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wizard Modal (Reuse existing structure with slight tweak) */}
            <AnimatePresence>
                {showWizard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 rounded-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full text-center space-y-6"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full bg-illa-pink/20 flex items-center justify-center animate-pulse">
                                <AlertCircle size={40} className="text-illa-pink" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Zonas de Drops</h3>
                                <p className="text-sm text-white/50 mt-2 max-w-[200px] mx-auto">
                                    Fique atento ao scanner. Quando um drop aparecer, você terá poucos minutos para resgatar!
                                </p>
                            </div>
                            <button
                                onClick={() => setShowWizard(false)}
                                className="px-8 py-3 bg-white text-black font-bold rounded-xl"
                            >
                                Entendi
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

