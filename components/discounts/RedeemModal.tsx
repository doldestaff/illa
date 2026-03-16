'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Copy, Loader2, Sparkles } from 'lucide-react'

interface DiscountOffer {
    id: string
    title: string
    percent: number
    cost_points: number
    image_path: string
}

interface Props {
    isOpen: boolean
    onClose: () => void
    offer: DiscountOffer | null
    userPoints: number
    onConfirm: () => Promise<void>
    isRedeeming: boolean
    redemptionResult: { voucher_code: string, expires_at: string, remaining_points: number } | null
}

export default function RedeemModal({ isOpen, onClose, offer, userPoints, onConfirm, isRedeeming, redemptionResult }: Props) {
    const [copied, setCopied] = useState(false)

    if (!isOpen || !offer) return null

    const handleCopy = () => {
        if (redemptionResult?.voucher_code) {
            navigator.clipboard.writeText(redemptionResult.voucher_code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Dark Overlay with Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 pointer-events-none perspective-[2000px]">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, rotateX: 10, y: 40 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, rotateX: -10, y: 20 }}
                            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
                            className="relative w-full max-w-md pointer-events-auto transform-style-3d group"
                        >
                            {/* Magical Ambient Backlight (Disney-like glow) */}
                            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] bg-black pointer-events-none z-0 shadow-[0_0_80px_rgba(229,1,125,0.2)]">
                                {/* Base Glass */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/90 to-black/95 backdrop-blur-2xl z-10" />

                                <motion.div
                                    animate={{
                                        translateY: ['-10%', '10%', '-10%'],
                                        translateX: ['-10%', '5%', '-10%'],
                                        scale: [1, 1.2, 1]
                                    }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-[30%] -left-[20%] w-[120%] h-[100%] rounded-[100%] mix-blend-screen opacity-40 blur-[80px] z-0"
                                    style={{ backgroundImage: 'radial-gradient(circle at center, rgba(229,1,125,0.5) 0%, transparent 70%)' }}
                                />
                                <motion.div
                                    animate={{
                                        translateY: ['10%', '-10%', '10%'],
                                        translateX: ['5%', '-10%', '5%'],
                                        scale: [1, 1.3, 1]
                                    }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -bottom-[30%] -right-[20%] w-[120%] h-[100%] rounded-[100%] mix-blend-screen opacity-30 blur-[80px] z-0"
                                    style={{ backgroundImage: 'radial-gradient(circle at center, rgba(251,191,36,0.4) 0%, transparent 70%)' }}
                                />

                                {/* Shimmer Texture */}
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay z-10" />

                                {/* Inner Border Glow */}
                                <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 z-20 pointer-events-none group-hover:border-white/20 transition-colors duration-500 box-shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
                            </div>

                            {/* Content Container */}
                            <div className="relative z-30 p-8 flex flex-col items-center">
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 p-2 rounded-full text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-all z-50 backdrop-blur-sm"
                                >
                                    <X size={20} />
                                </button>

                                {!redemptionResult ? (
                                    // Confirmation View
                                    <div className="text-center w-full flex flex-col items-center mt-2">
                                        {/* Epic % Icon */}
                                        <div className="relative w-24 h-24 mb-6 perspective-[1000px]">
                                            <motion.div
                                                animate={{ rotateY: 360 }}
                                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 flex items-center justify-center transform-style-3d"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-tr from-illa-pink to-purple-500 rounded-full blur-xl opacity-50" />
                                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center backdrop-blur-xl shadow-[inset_0_4px_10px_rgba(255,255,255,0.3),0_10px_20px_rgba(229,1,125,0.5)]">
                                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-md">{offer.percent}%</span>
                                                </div>
                                            </motion.div>
                                        </div>

                                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 mb-2 tracking-tight drop-shadow-lg">Confirmar Resgate</h2>
                                        <p className="text-white/60 text-sm mb-8 leading-relaxed max-w-[280px]">
                                            Você vai usar <strong className="text-amber-400 font-bold">{offer.cost_points} moedas</strong> para resgatar o voucher de <strong>{offer.title}</strong>.
                                        </p>

                                        {/* Ticket Receipt Styler */}
                                        <div className="w-full bg-black/50 backdrop-blur-md rounded-2xl p-5 mb-8 border border-white/5 relative overflow-hidden shadow-inner font-mono text-sm max-w-[300px]">
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-white/40 font-sans text-xs uppercase tracking-widest font-bold">Saldo Atual</span>
                                                <span className="text-white text-base">{userPoints}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-4 text-illa-pink">
                                                <span className="font-sans text-xs uppercase tracking-widest font-bold">Investimento</span>
                                                <span className="text-base">-{offer.cost_points}</span>
                                            </div>

                                            <div className="w-full border-t border-dashed border-white/20 mb-4" />

                                            <div className="flex justify-between items-center font-black">
                                                <span className="text-white font-sans tracking-wide">Saldo Final</span>
                                                <span className="text-emerald-400 text-lg">{userPoints - offer.cost_points}</span>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(229,1,125,0.6)" }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={onConfirm}
                                            disabled={isRedeeming}
                                            className="relative w-full py-4 rounded-2xl bg-gradient-to-r from-illa-pink to-rose-600 text-white font-black tracking-widest uppercase shadow-[0_10px_20px_rgba(229,1,125,0.3)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group/btn"
                                        >
                                            {/* Button Inner Glow */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                            <div className="relative z-10 flex items-center justify-center gap-2">
                                                {isRedeeming ? (
                                                    <Loader2 className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <Sparkles size={18} className="text-white group-hover/btn:animate-spin" />
                                                        RESGATAR VOUCHER
                                                    </>
                                                )}
                                            </div>
                                        </motion.button>
                                    </div>
                                ) : (
                                    // Success View (Disney Surprise)
                                    <div className="text-center w-full flex flex-col items-center mt-2">
                                        <div className="relative w-24 h-24 mb-6">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 border border-emerald-400/30 flex items-center justify-center backdrop-blur-xl shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                                                    <CheckCircle size={40} className="text-emerald-400 drop-shadow-[0_2px_10px_rgba(52,211,153,0.8)]" />
                                                </div>
                                            </motion.div>
                                        </div>

                                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200 mb-2 tracking-tight drop-shadow-lg">Voucher Liberado!</h2>
                                        <p className="text-white/60 text-sm mb-8 leading-relaxed max-w-[280px]">
                                            Copie o código abaixo e apresente na loja para aproveitar seu desconto.
                                        </p>

                                        {/* Golden Ticket Output */}
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="w-full bg-gradient-to-br from-white/10 to-transparent p-[1px] rounded-2xl mb-8 shadow-2xl relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-150%] animate-[shimmer_3s_infinite]" />
                                            <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6 border border-white/5 h-full flex flex-col items-center relative z-10">
                                                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mb-2">Seu Voucher</p>
                                                <code className="text-3xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 tracking-widest drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] mb-4">{redemptionResult.voucher_code}</code>

                                                <button
                                                    onClick={handleCopy}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all backdrop-blur-md active:scale-95"
                                                >
                                                    {copied ? (
                                                        <><CheckCircle size={14} className="text-emerald-400" /> Copiado!</>
                                                    ) : (
                                                        <><Copy size={14} /> Copiar Código</>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>

                                        <div className="flex justify-between items-center w-full px-2">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-white/30">
                                                Validade: <span className="text-white/60">{new Date(redemptionResult.expires_at).toLocaleDateString()}</span>
                                            </p>
                                            <button
                                                onClick={onClose}
                                                className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest border-b border-transparent hover:border-white/50 pb-0.5 transition-all"
                                            >
                                                Fechar e Voltar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
