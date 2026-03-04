'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Coins } from 'lucide-react'
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import GlobalCoin from '@/components/ui/GlobalCoin'

interface CasinoCoinsModalProps {
    isOpen: boolean
    onClose: () => void
    totalCoins: number
}

// ─── Slot Machine Counter Component ──────────────────────────────────────────
function SlotCounter({ value }: { value: number }) {
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        // Start from 0 and spin up rapidly
        let start = 0
        const duration = 2000 // 2 seconds spin
        const startTime = performance.now()

        const updateCounter = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Easing function for a "slot machine slowing down" effect
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            const currentCount = Math.floor(start + (value - start) * easeOutQuart)

            setDisplayValue(currentCount)

            if (progress < 1) {
                requestAnimationFrame(updateCounter)
            } else {
                setDisplayValue(value)
                // Fire mini confetti burst when counter lands
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FFA500', '#FF4500'],
                    zIndex: 200
                })
            }
        }

        requestAnimationFrame(updateCounter)
    }, [value])

    return (
        <div className="relative overflow-hidden bg-black/40 border-y border-amber-500/30 py-4 px-8 mt-6 w-full flex justify-center items-center shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
            {/* Slot Machine Roll Lines */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

            {/* Inner Shadow for Depth */}
            <div className="absolute inset-0 shadow-[inset_0_10px_20px_rgba(0,0,0,0.6)] pointer-events-none" />
            <div className="absolute inset-0 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.6)] pointer-events-none" />

            <div className="flex items-center gap-4">
                <GlobalCoin size="lg" animate />
                <span className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFCF24] via-[#FFE57F] to-[#DF7A00] drop-shadow-[0_4px_10px_rgba(255,215,0,0.4)] tabular-nums tracking-tighter">
                    {displayValue.toLocaleString()}
                </span>
            </div>

            {/* Golden Overlay Reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none mix-blend-overlay" />
        </div>
    )
}

// ─── Main Modal Component ──────────────────────────────────────────────────────
export default function CasinoCoinsModal({ isOpen, onClose, totalCoins }: CasinoCoinsModalProps) {
    useEffect(() => {
        if (isOpen) {
            // Main Confetti Explosion on open
            const duration = 3000
            const end = Date.now() + duration

            const frame = () => {
                confetti({
                    particleCount: 8,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 },
                    colors: ['#FFD700', '#FFA500', '#FF1493', '#00FFFF'],
                    zIndex: 150
                })
                confetti({
                    particleCount: 8,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 },
                    colors: ['#FFD700', '#FFA500', '#FF1493', '#00FFFF'],
                    zIndex: 150
                })

                if (Date.now() < end) {
                    requestAnimationFrame(frame)
                }
            }
            frame()
        }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    {/* Dark Cinematic Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    {/* Rotating Las Vegas Rays Background */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 360 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                            rotate: { duration: 40, repeat: Infinity, ease: "linear" },
                            opacity: { duration: 0.4 },
                            scale: { duration: 0.6, type: "spring" }
                        }}
                        className="absolute w-[150vw] h-[150vw] sm:w-[1000px] sm:h-[1000px] pointer-events-none opacity-40 mix-blend-screen"
                        style={{
                            background: 'conic-gradient(from 0deg, transparent 0 15deg, rgba(255,215,0,0.3) 15deg 30deg, transparent 30deg 45deg, rgba(255,160,0,0.2) 45deg 60deg, transparent 60deg 75deg, rgba(255,215,0,0.4) 75deg 90deg, transparent 90deg 105deg, rgba(255,160,0,0.2) 105deg 120deg, transparent 120deg 135deg, rgba(255,215,0,0.3) 135deg 150deg, transparent 150deg 165deg, rgba(255,160,0,0.2) 165deg 180deg, transparent 180deg 195deg, rgba(255,215,0,0.4) 195deg 210deg, transparent 210deg 225deg, rgba(255,160,0,0.2) 225deg 240deg, transparent 240deg 255deg, rgba(255,215,0,0.3) 255deg 270deg, transparent 270deg 285deg, rgba(255,160,0,0.2) 285deg 300deg, transparent 300deg 315deg, rgba(255,215,0,0.4) 315deg 330deg, transparent 330deg 345deg, rgba(255,160,0,0.2) 345deg 360deg)',
                            borderRadius: '50%'
                        }}
                    />

                    {/* Main Casino Box */}
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#1A0B00] to-[#0A0400] rounded-[2.5rem] p-1 border-2 border-amber-500/30 overflow-hidden shadow-[0_0_100px_rgba(255,160,0,0.3)] z-10"
                    >
                        {/* Premium Border Inner Glow */}
                        <div className="absolute inset-0 rounded-[2.4rem] border border-[#FFD700]/10 pointer-events-none" />

                        {/* Dynamic Top Lighting */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-amber-500/30 blur-[40px] pointer-events-none"
                        />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white/60 hover:text-white hover:bg-white/10 transition-colors z-20 backdrop-blur-md border border-white/5"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>

                        <div className="relative flex flex-col items-center pt-10 pb-10 z-10">

                            {/* Header Label */}
                            <motion.div
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-[0.2em] mb-4"
                            >
                                <Sparkles size={14} />
                                Conta ILLA
                            </motion.div>

                            <motion.h2
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="text-3xl sm:text-4xl font-black text-white px-6 text-center leading-tight mb-2"
                            >
                                Você acumula o<br className="hidden sm:block" /> verdadeiro tesouro.
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-white/60 text-sm font-medium uppercase tracking-widest"
                            >
                                Saldo Disponível
                            </motion.p>

                            {/* Slot Machine Display */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="w-full mt-2"
                            >
                                <SlotCounter value={totalCoins} />
                            </motion.div>

                            {/* Call to Action Container */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1.5 }}
                                className="px-6 w-full mt-8"
                            >
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FFCF24] via-[#FFAD00] to-[#DF7A00] text-black font-black text-lg uppercase tracking-wider shadow-[0_8px_30px_rgba(255,160,0,0.4)] hover:shadow-[0_12px_40px_rgba(255,160,0,0.6)] hover:-translate-y-1 transition-all"
                                >
                                    Continuar Explorando
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
