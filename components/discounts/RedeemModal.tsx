'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Copy, Loader2, AlertCircle } from 'lucide-react'

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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#1a1a1a] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 pointer-events-auto"
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {!redemptionResult ? (
                                // Confirmation View
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-illa-pink/10 flex items-center justify-center mx-auto mb-4 border border-illa-pink/20">
                                        <span className="text-2xl font-bold text-illa-pink">{offer.percent}%</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">Confirmar Troca</h2>
                                    <p className="text-white/60 text-sm mb-6">
                                        Você está prestes a trocar <strong className="text-white">{offer.cost_points} moedas</strong> pelo voucher de <strong>{offer.title}</strong>.
                                    </p>

                                    <div className="bg-white/5 rounded-xl p-4 mb-6 text-sm">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-white/50">Seu saldo:</span>
                                            <span className="text-white font-mono">{userPoints}</span>
                                        </div>
                                        <div className="flex justify-between mb-2 text-illa-pink">
                                            <span>Custo:</span>
                                            <span className="font-mono">-{offer.cost_points}</span>
                                        </div>
                                        <div className="border-t border-white/10 my-2" />
                                        <div className="flex justify-between font-bold">
                                            <span className="text-white">Saldo restante:</span>
                                            <span className="text-emerald-400 font-mono">{userPoints - offer.cost_points}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={onConfirm}
                                        disabled={isRedeeming}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-illa-pink to-purple-600 text-white font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isRedeeming ? (
                                            <Loader2 className="animate-spin" />
                                        ) : (
                                            'CONFIRMAR TROCA'
                                        )}
                                    </button>
                                </div>
                            ) : (
                                // Success View
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 animate-in zoom-in spin-in-1">
                                        <CheckCircle size={32} className="text-emerald-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">Resgate com Sucesso!</h2>
                                    <p className="text-white/60 text-sm mb-6">
                                        Seu voucher foi gerado. Copie o código abaixo para usar em nosso site.
                                    </p>

                                    <div className="bg-black/30 rounded-xl p-4 mb-6 border border-dashed border-white/20 relative group">
                                        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Código do Voucher</p>
                                        <code className="text-2xl font-mono text-illa-pink tracking-wider block mb-2">{redemptionResult.voucher_code}</code>
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white transition-colors mx-auto"
                                        >
                                            <Copy size={12} />
                                            {copied ? 'Copiado!' : 'Copiar código'}
                                        </button>
                                    </div>

                                    <p className="text-xs text-white/30 mb-6">
                                        Válido até {new Date(redemptionResult.expires_at).toLocaleDateString()}
                                    </p>

                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20"
                                    >
                                        FECHAR
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
