'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ActiveDrop, SurpriseDrop } from '@/lib/gamification-types'
import { IceCream, Clock, PackageCheck, Loader2, Gift, HelpCircle, X, Zap, Radio, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RARITY_STYLES, SURPRISE_DROPS_CATALOG } from '@/lib/surprise-drops-catalog'

interface Props {
    drop: ActiveDrop | null
    onClaim: (dropId: string) => Promise<{ success: boolean }>
}

export default function FlashDrop({ drop, onClaim }: Props) {
    const [timeLeft, setTimeLeft] = useState('')
    const [claiming, setClaiming] = useState(false)
    const [claimed, setClaimed] = useState(drop?.already_claimed ?? false)
    const [showWizard, setShowWizard] = useState(false)
    const [wizardStep, setWizardStep] = useState<'guide' | 'notifications'>('guide')

    // === SURPRISE DROPS ===
    const [surpriseDrop, setSurpriseDrop] = useState<SurpriseDrop | null>(null)
    const [dismissingSurprise, setDismissingSurprise] = useState(false)

    // Poll for surprise drops every 30s
    useEffect(() => {
        const checkSurprise = async () => {
            try {
                const res = await fetch('/api/drops/surprise')
                if (res.ok) {
                    const data = await res.json()
                    if (data.drops && data.drops.length > 0) {
                        setSurpriseDrop(data.drops[0])
                    }
                }
            } catch { /* silent */ }
        }
        checkSurprise()
        const interval = setInterval(checkSurprise, 30_000)
        return () => clearInterval(interval)
    }, [])

    const handleDismissSurprise = async () => {
        if (!surpriseDrop || dismissingSurprise) return
        setDismissingSurprise(true)
        try {
            await fetch('/api/drops/surprise', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ drop_id: surpriseDrop.id }),
            })
            setSurpriseDrop(null)
        } catch { /* silent */ } finally {
            setDismissingSurprise(false)
        }
    }

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
                                        Scanneando novos drops...
                                    </h3>
                                </motion.div>

                                <button
                                    onClick={() => {
                                        setWizardStep('guide')
                                        setShowWizard(true)
                                    }}
                                    className="group/hint flex flex-col items-center gap-3"
                                >
                                    <p className="text-sm font-bold text-gray-500 flex items-center justify-center gap-1 group-hover/hint:text-illa-pink transition-colors">
                                        <span className="relative">
                                            Fique de olho
                                            <motion.span
                                                className="absolute -bottom-1 left-0 w-full h-0.5 bg-illa-pink/30 rounded-full"
                                                animate={{ scaleX: [0, 1, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </span>
                                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>.</motion.span>
                                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}>.</motion.span>
                                        <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                                    </p>

                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm hover:shadow-md transition-all mt-1"
                                    >
                                        <Radio size={14} className="text-illa-pink animate-pulse" />
                                        <span className="text-[11px] font-black text-illa-pink uppercase tracking-wider">Ativar Notificações</span>
                                    </motion.div>
                                </button>
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
                        className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 rounded-[2.5rem]"
                        onClick={() => setShowWizard(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 10, opacity: 0 }}
                            className="w-full max-w-[330px] bg-white border border-pink-100 shadow-2xl shadow-pink-100 rounded-[2rem] p-6 md:p-8 text-center flex flex-col relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative background glow */}
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-100/50 rounded-full blur-3xl pointer-events-none" />

                            <AnimatePresence mode="wait">
                                {wizardStep === 'guide' ? (
                                    <motion.div
                                        key="guide"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex flex-col flex-1 justify-center items-center gap-6 my-auto"
                                    >
                                        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mt-2 rounded-full bg-pink-50 flex flex-shrink-0 items-center justify-center relative overflow-hidden">
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.3, 0, 0.3]
                                                }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0 bg-illa-pink rounded-full"
                                            />
                                            <Gift size={36} className="text-illa-pink relative z-10" strokeWidth={2.5} />
                                        </div>
                                        <div className="my-2">
                                            <h3 className="text-2xl font-black text-gray-800 font-script leading-tight">Como o Scanner Funciona?</h3>
                                            <p className="text-sm font-medium text-gray-500 mt-3 leading-relaxed">
                                                Fique sempre de olho nesta caixinha! Os <span className="text-illa-pink font-bold">Drops Surpresa</span> aparecem sem aviso e por tempo limitado.
                                                <br /><br />
                                                Quando um drop aparecer, corra: você terá poucos minutos para resgatar antes que ele fuja!
                                            </p>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setWizardStep('notifications')}
                                            className="w-full py-4 mt-2 bg-illa-pink text-white font-black rounded-2xl shadow-lg shadow-pink-500/20 transition-all uppercase tracking-wider text-sm flex-shrink-0"
                                        >
                                            Entendi, vou vigiar!
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="notifications"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex flex-col flex-1 justify-center items-center gap-6 my-auto"
                                    >
                                        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mt-2 rounded-full bg-blue-50 flex flex-shrink-0 items-center justify-center relative">
                                            <motion.div
                                                animate={{ rotate: [0, 15, -15, 0] }}
                                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                                            >
                                                <Zap size={36} className="text-blue-500" strokeWidth={2.5} />
                                            </motion.div>
                                            <motion.div
                                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="absolute inset-0 border-2 border-blue-200 rounded-full"
                                            />
                                        </div>
                                        <div className="my-2">
                                            <h3 className="text-2xl font-black text-gray-800 font-script leading-tight">Ative as Notificações!</h3>
                                            <p className="text-sm font-medium text-gray-500 mt-3 leading-relaxed">
                                                Não quer perder nenhum drop surpresa?
                                                <br /><br />
                                                Ative as notificações para ser avisado <span className="text-blue-500 font-bold">na mesma hora</span> quando um novo drop estiver logado no celular!
                                            </p>
                                        </div>
                                        <div className="space-y-3 mt-4 flex-shrink-0 w-full">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    // This would normally trigger browser notification request
                                                    setShowWizard(false)
                                                }}
                                                className="w-full py-4 bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                                            >
                                                <Radio size={18} /> ATIVAR AGORA
                                            </motion.button>
                                            <button
                                                onClick={() => setShowWizard(false)}
                                                className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
                                            >
                                                Talvez depois
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* === SURPRISE DROP NOTIFICATION OVERLAY === */}
            <AnimatePresence>
                {surpriseDrop && (() => {
                    const preset = SURPRISE_DROPS_CATALOG.find(p => p.id === surpriseDrop.preset_id)
                    const rarity = RARITY_STYLES[preset?.rarity || 'common']
                    return (
                        <motion.div
                            key="surprise-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
                        >
                            <motion.div
                                initial={{ scale: 0.5, y: 40, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.8, y: 40, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={`relative max-w-[340px] w-full rounded-[2rem] bg-[#0f0f11] border border-white/10 p-8 text-center shadow-2xl ${rarity.glow}`}
                            >
                                {/* Glow Background */}
                                <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-amber-500/20 via-transparent to-pink-500/10 blur-2xl pointer-events-none" />

                                {/* Emoji */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                                    className="text-6xl mb-4 relative z-10"
                                >
                                    {surpriseDrop.emoji}
                                </motion.div>

                                {/* Rarity Badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="relative z-10"
                                >
                                    <span className={`inline-block text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border ${rarity.bg} ${rarity.text} border-white/10 mb-3`}>
                                        {rarity.label}
                                    </span>
                                </motion.div>

                                {/* Title */}
                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                    className="text-2xl font-black text-white mb-2 relative z-10 leading-tight"
                                >
                                    {surpriseDrop.title}
                                </motion.h3>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.45 }}
                                    className="text-sm text-white/60 leading-relaxed mb-4 relative z-10 max-w-[260px] mx-auto"
                                >
                                    {surpriseDrop.description}
                                </motion.p>

                                {/* Reward Value */}
                                {surpriseDrop.reward_value > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="relative z-10 mb-5"
                                    >
                                        <span className={`inline-block text-lg font-black px-4 py-2 rounded-xl ${surpriseDrop.reward_type === 'xp' ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                            +{surpriseDrop.reward_value} {surpriseDrop.reward_type === 'xp' ? 'XP' : 'Moedas'}
                                        </span>
                                    </motion.div>
                                )}

                                {/* Dismiss Button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    onClick={handleDismissSurprise}
                                    disabled={dismissingSurprise}
                                    className="relative z-10 w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {dismissingSurprise ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
                                    Entendi!
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )
                })()}
            </AnimatePresence>
        </div>
    )
}

