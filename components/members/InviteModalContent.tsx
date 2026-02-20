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
        <div className="relative rounded-3xl overflow-hidden p-[1px]">
            {/* Animated neon white border */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/10 animate-[spin_4s_linear_infinite]" />

            {/* Inner card — dark frosted glass */}
            <div className="relative rounded-[22px] bg-black/80 backdrop-blur-xl p-6 overflow-hidden border border-white/10 shadow-2xl">

                {/* Shimmer sweep */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
                />

                {/* Header */}
                <div className="relative flex items-center gap-3 mb-5">
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 10px rgba(255,255,255,0.2)', '0 0 20px rgba(255,255,255,0.5)', '0 0 10px rgba(255,255,255,0.2)'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="p-2.5 rounded-2xl bg-white/10 border border-white/30 backdrop-blur-md"
                    >
                        <Sparkles size={20} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </motion.div>
                    <div>
                        <h3 className="text-lg font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] tracking-tight">
                            Indique e Ganhe
                        </h3>
                        <p className="text-xs text-white/50">Compartilhe e desbloqueie recompensas exclusivas</p>
                    </div>
                </div>

                {/* Referral Link + Share */}
                <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 pl-3 mb-6 backdrop-blur-sm">
                    <input
                        type="text"
                        readOnly
                        value={`${origin}/?ref=${referralCode}`}
                        className="flex-1 bg-transparent text-xs text-white/70 font-mono outline-none truncate"
                    />
                    <button
                        onClick={() => copyToClipboard(`${origin}/?ref=${referralCode}`)}
                        className="p-2 rounded-lg bg-white/10 shadow-sm border border-white/20 text-white hover:bg-white hover:text-black transition-all active:scale-95"
                    >
                        {refCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>

                {/* Milestones */}
                <div className="relative mb-5">
                    {/* Progress track */}
                    <div className="absolute top-4 left-4 right-4 h-1 bg-white/10 rounded-full z-0" />
                    {/* Animated progress fill */}
                    <motion.div
                        className="absolute top-4 left-4 h-1 bg-white rounded-full z-[1] shadow-[0_0_10px_rgba(255,255,255,0.8)]"
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
                                                '0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.4)',
                                                '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(255,255,255,0.6)',
                                                '0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.4)'
                                            ]
                                        } : {}}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all backdrop-blur-md ${achieved
                                            ? 'bg-white border-white text-black'
                                            : 'bg-[#1a1a1a] border-white/20 text-white/40'
                                            }`}
                                    >
                                        {achieved ? <Check size={14} strokeWidth={4} /> : <span className="text-[10px] font-bold">{m}</span>}
                                    </motion.div>
                                    <span className={`text-[10px] font-bold ${achieved ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-white/40'}`}>
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
                    animate={{
                        boxShadow: [
                            '0 4px 16px rgba(255,255,255,0.2)',
                            '0 8px 24px rgba(255,255,255,0.5)',
                            '0 4px 16px rgba(255,255,255,0.2)'
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    onClick={() => {
                        const url = `${origin}/?ref=${referralCode}`
                        if (navigator.share) {
                            navigator.share({ title: 'Illa Sorvetes', text: 'Entre no clube de membros da Illa!', url })
                        } else {
                            copyToClipboard(url)
                        }
                    }}
                    className="w-full py-3 mt-4 rounded-xl bg-white text-black text-sm font-black flex items-center justify-center gap-2 transition-all border border-white/50"
                >
                    <Share2 size={16} strokeWidth={2.5} />
                    Compartilhar Link
                </motion.button>
            </div>
        </div>
    )
}
