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
        <div className="relative overflow-hidden rounded-[2.5rem] transition-all duration-500 group h-full">
            <AnimatePresence mode="wait">
                {!drop ? (
                    // ─── SIGNAL SCANNER MODE (NO DROP - CUTE) ───
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative h-full min-h-[300px] w-full bg-gradient-to-b from-white to-pink-50/50 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center overflow-hidden shadow-[0_8px_40px_rgba(229,1,125,0.08)]"
                    >
                        {/* 1. Soft Bubbly Glows Background */}
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(255,192,203,0.3)_0%,transparent_60%)] pointer-events-none"
                        />

                        {/* 2. Floating Cute Stars */}
                        {[
                            { top: '30%', left: '20%', duration: 4.5, delay: 0.5, size: 16 },
                            { top: '65%', left: '80%', duration: 3.8, delay: 1.0, size: 22 },
                            { top: '25%', left: '70%', duration: 4.2, delay: 1.5, size: 18 },
                            { top: '75%', left: '25%', duration: 3.5, delay: 2.0, size: 14 },
                            { top: '45%', left: '85%', duration: 4.8, delay: 2.5, size: 20 }
                        ].map((star, i) => (
                            <motion.div
                                key={i}
                                initial={{ y: 0, opacity: 0 }}
                                animate={{
                                    y: [-10, 10, -10],
                                    opacity: [0, 1, 0],
                                    scale: [0.8, 1.2, 0.8],
                                    rotate: [0, 45, -45, 0]
                                }}
                                transition={{
                                    duration: star.duration,
                                    repeat: Infinity,
                                    delay: star.delay,
                                    ease: "easeInOut"
                                }}
                                className="absolute text-illa-pink/40"
                                style={{
                                    top: star.top,
                                    left: star.left,
                                    fontSize: `${star.size}px`
                                }}
                            >
                                ✨
                            </motion.div>
                        ))}

                        {/* 3. Cute Bouncy Heart/Radar */}
                        <div className="relative z-10 flex flex-col items-center justify-center gap-6 mt-4">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                {/* Soft pulsing rings */}
                                {[1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{
                                            scale: [0.8, 2],
                                            opacity: [0, 0.4, 0],
                                            borderWidth: ["4px", "1px", "0px"]
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                            delay: i * 0.8,
                                            ease: "easeOut"
                                        }}
                                        className="absolute inset-0 rounded-full border-illa-pink/30"
                                    />
                                ))}

                                {/* Center Bouncy Icon */}
                                <motion.div
                                    animate={{ y: [-5, 5, -5], scale: [0.95, 1.05, 0.95] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative z-20 bg-white p-5 rounded-full shadow-[0_10px_30px_rgba(229,1,125,0.15)] border-2 border-pink-100 flex items-center justify-center"
                                >
                                    <Gift size={36} className="text-illa-pink" strokeWidth={2.5} />
                                </motion.div>
                            </div>

                            <div className="space-y-1 relative z-10 pt-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center"
                                >
                                    <h3 className="text-lg font-bold text-gray-800 tracking-wide font-script">
                                        Preparando surpresas
                                    </h3>
                                </motion.div>

                                <p className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1">
                                    <span>Fique de olho</span>
                                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>.</motion.span>
                                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}>.</motion.span>
                                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // ─── LIVE EVENT MODE (ACTIVE DROP - CUTE) ───
                    <motion.div
                        key="active-drop"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                        className="relative h-full bg-white border-2 border-pink-200 text-dark p-6 shadow-2xl shadow-pink-500/20 rounded-[2.5rem] overflow-hidden flex flex-col"
                    >
                        {/* Soft celebration background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-pink-100/50" />

                        {/* Bouncing Confetti blobs */}
                        <motion.div
                            animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-8 -right-8 w-32 h-32 bg-yellow-200/40 rounded-full blur-2xl"
                        />
                        <motion.div
                            animate={{ y: [0, 20, 0], rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, delay: 1, ease: "easeInOut" }}
                            className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-300/30 rounded-full blur-2xl"
                        />

                        {/* Top Bar */}
                        <div className="relative z-10 flex justify-between items-center mb-4">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="flex items-center gap-2 bg-pink-100 px-3 py-1.5 rounded-full border border-pink-200"
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-illa-pink opacity-50"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-illa-pink"></span>
                                </span>
                                <span className="text-[10px] font-bold text-illa-pink uppercase tracking-widest">Surpresa!</span>
                            </motion.div>

                            <button
                                onClick={() => setShowWizard(true)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
                            >
                                <HelpCircle size={16} />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="relative z-10 flex flex-col items-center flex-1 justify-center space-y-5 text-center">

                            <motion.div
                                animate={{ y: [-3, 3, -3], rotate: [-2, 2, -2] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                className="bg-white p-4 rounded-3xl shadow-lg border border-pink-100 mb-2"
                            >
                                <Gift size={40} className="text-illa-pink drop-shadow-sm" strokeWidth={2} />
                            </motion.div>

                            <div>
                                <h2 className="text-2xl font-black text-gray-800 drop-shadow-sm font-script mb-1">
                                    Opa, Drop liberado!
                                </h2>
                                <p className="text-sm font-medium text-gray-500 leading-tight">
                                    {drop.title}
                                </p>
                            </div>

                            {/* Rewards Box (Cute Pill) */}
                            <div className="bg-pink-50 rounded-2xl p-3 px-6 border border-pink-100 inline-flex flex-col items-center">
                                <div className="text-[10px] font-bold uppercase text-pink-400 mb-0.5 tracking-wider">Você ganha</div>
                                <div className="text-2xl font-black text-illa-pink drop-shadow-sm flex items-baseline gap-1">
                                    +{drop.reward_value} <span className="text-sm text-pink-400">{drop.reward_type === 'points' ? 'PTS' : 'XP'}</span>
                                </div>
                            </div>

                            {/* Countdown (Soft Pill) */}
                            <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-4 py-1.5">
                                <Clock size={14} className="text-gray-400" />
                                <span>{timeLeft} restantes</span>
                            </div>

                            {/* Action Button (Jelly Bouncy) */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClaim}
                                disabled={claimed || claiming}
                                className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 mt-auto ${claimed
                                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-default'
                                    : 'bg-illa-pink text-white hover:bg-pink-600 shadow-pink-500/30 hover:shadow-pink-500/40'
                                    }`}
                            >
                                {claiming ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : claimed ? (
                                    <>
                                        <PackageCheck size={20} /> Resgatado! 🎉
                                    </>
                                ) : (
                                    <>
                                        Pegar Mimo <Gift size={18} fill="currentColor" className="opacity-80" />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wizard Modal (Softer version) */}
            <AnimatePresence>
                {showWizard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-6 rounded-[2.5rem]"
                        onClick={() => setShowWizard(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 10, opacity: 0 }}
                            className="w-full bg-white border border-pink-100 shadow-2xl shadow-pink-100 rounded-3xl p-6 text-center space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 mx-auto rounded-full bg-pink-50 flex items-center justify-center animate-bounce">
                                <AlertCircle size={32} className="text-illa-pink" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 font-script">Como Funciona?</h3>
                                <p className="text-sm text-gray-500 mt-2 max-w-[220px] mx-auto leading-relaxed">
                                    Fique de olho nesta caixinha. Quando um mimo aparecer, você terá poucos minutos para resgatar antes que fuja!
                                </p>
                            </div>
                            <button
                                onClick={() => setShowWizard(false)}
                                className="w-full py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition-colors"
                            >
                                Entendi, vou vigiar!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

