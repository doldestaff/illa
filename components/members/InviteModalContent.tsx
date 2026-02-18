'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Share2, Sparkles } from 'lucide-react'

interface Props {
    referralCode: string | null
    referralCount: number
    onShareCopy?: () => void
}

const MILESTONES = [1, 3, 10]

export default function InviteModalContent({ referralCode, referralCount, onShareCopy }: Props) {
    const [refCopied, setRefCopied] = useState(false)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text)
        setRefCopied(true)
        setTimeout(() => setRefCopied(false), 2000)
        onShareCopy?.()
    }

    if (!referralCode) return null

    return (
        <div className="relative rounded-3xl overflow-hidden">
            {/* Animated gradient border (soft pink tones) */}
            <div className="absolute inset-0 bg-gradient-to-br from-illa-pink/40 via-rose-300/50 to-pink-200/40 animate-[spin_8s_linear_infinite] opacity-70 blur-sm" />

            {/* Inner card — frosted glass */}
            <div className="relative m-[2px] rounded-[22px] bg-white/90 backdrop-blur-xl p-6 overflow-hidden">

                {/* Shimmer sweep */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-illa-pink/6 to-transparent skew-x-12 pointer-events-none"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
                />

                {/* Header */}
                <div className="relative flex items-center gap-3 mb-5">
                    <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="p-2.5 rounded-2xl bg-gradient-to-br from-illa-pink/10 to-rose-200/30 border border-illa-pink/15"
                    >
                        <Sparkles size={20} className="text-illa-pink" />
                    </motion.div>
                    <div>
                        <h3 className="text-lg font-black bg-gradient-to-r from-illa-pink to-rose-400 bg-clip-text text-transparent">
                            Indique e Ganhe
                        </h3>
                        <p className="text-xs text-dark/40">Compartilhe e desbloqueie recompensas exclusivas</p>
                    </div>
                </div>

                {/* Referral Link + Share */}
                <div className="relative flex items-center gap-2 bg-gray-50/80 border border-gray-200/60 rounded-xl p-2 pl-3 mb-6">
                    <input
                        type="text"
                        readOnly
                        value={`${origin}/?ref=${referralCode}`}
                        className="flex-1 bg-transparent text-xs text-dark/50 font-mono outline-none truncate"
                    />
                    <button
                        onClick={() => copyToClipboard(`${origin}/?ref=${referralCode}`)}
                        className="p-2 rounded-lg bg-white shadow-sm border border-gray-100 text-dark/60 hover:bg-illa-pink hover:text-white hover:border-illa-pink/30 transition-all active:scale-95"
                    >
                        {refCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>

                {/* Milestones */}
                <div className="relative mb-5">
                    {/* Progress track */}
                    <div className="absolute top-4 left-4 right-4 h-1 bg-gray-100 rounded-full z-0" />
                    {/* Animated progress fill */}
                    <motion.div
                        className="absolute top-4 left-4 h-1 bg-gradient-to-r from-illa-pink to-rose-400 rounded-full z-[1]"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (referralCount / MILESTONES[MILESTONES.length - 1]) * 100)}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                        style={{ maxWidth: 'calc(100% - 32px)' }}
                    />

                    <div className="relative z-10 flex justify-between">
                        {MILESTONES.map((m, i) => {
                            const achieved = referralCount >= m
                            return (
                                <motion.div
                                    key={m}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4 + i * 0.15, type: 'spring', stiffness: 300 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <motion.div
                                        animate={achieved ? {
                                            boxShadow: [
                                                '0 0 6px rgba(229,1,125,0.15)',
                                                '0 0 14px rgba(229,1,125,0.3)',
                                                '0 0 6px rgba(229,1,125,0.15)'
                                            ]
                                        } : {}}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${achieved
                                            ? 'bg-gradient-to-br from-illa-pink to-rose-400 border-illa-pink/30 text-white'
                                            : 'bg-gray-50 border-gray-200 text-gray-300'
                                            }`}
                                    >
                                        {achieved ? <Check size={14} strokeWidth={3} /> : <span className="text-[10px] font-bold">{m}</span>}
                                    </motion.div>
                                    <span className={`text-[10px] font-bold ${achieved ? 'text-illa-pink' : 'text-gray-300'}`}>
                                        {m} {m === 1 ? 'amigo' : 'amigos'}
                                    </span>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* Share CTA */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                        const url = `${origin}/?ref=${referralCode}`
                        if (navigator.share) {
                            navigator.share({ title: 'Illa Sorvetes', text: 'Entre no clube de membros da Illa!', url })
                        } else {
                            copyToClipboard(url)
                        }
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-illa-pink to-rose-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(229,1,125,0.25)] hover:shadow-[0_4px_24px_rgba(229,1,125,0.4)] transition-shadow"
                >
                    <Share2 size={16} />
                    Compartilhar Link
                </motion.button>
            </div>
        </div>
    )
}
