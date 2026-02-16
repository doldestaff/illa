'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { VipPayload } from '@/lib/gamification-types'
import { motion } from 'framer-motion'
import { CreditCard, QrCode, Copy, Check, Users, Loader2, Crown, Clock, Share2, Sparkles } from 'lucide-react'

interface Props {
    referralCode: string | null
    referralCount: number
    vipPayload: VipPayload | null
    onLoadVip: () => Promise<VipPayload>
    onShareCopy?: () => void
}

const MILESTONES = [1, 3, 10]

function QrCodeCanvas({ value, size = 140 }: { value: string; size?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const cellSize = Math.floor(size / 25)
        canvas.width = size
        canvas.height = size
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        ctx.fillStyle = '#0B0B0D'

        let seed = 0
        for (let i = 0; i < value.length; i++) {
            seed = ((seed << 5) - seed + value.charCodeAt(i)) | 0
        }

        const drawFinder = (x: number, y: number) => {
            for (let dy = 0; dy < 7; dy++) {
                for (let dx = 0; dx < 7; dx++) {
                    const isOuter = dy === 0 || dy === 6 || dx === 0 || dx === 6
                    const isInner = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4
                    if (isOuter || isInner) {
                        ctx.fillRect((x + dx) * cellSize, (y + dy) * cellSize, cellSize, cellSize)
                    }
                }
            }
        }

        drawFinder(1, 1)
        drawFinder(17, 1)
        drawFinder(1, 17)

        for (let y = 0; y < 25; y++) {
            for (let x = 0; x < 25; x++) {
                if (
                    (x >= 1 && x <= 7 && y >= 1 && y <= 7) ||
                    (x >= 17 && x <= 23 && y >= 1 && y <= 7) ||
                    (x >= 1 && x <= 7 && y >= 17 && y <= 23)
                ) continue
                seed = (seed * 1103515245 + 12345) & 0x7fffffff
                if (seed % 3 === 0) {
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
                }
            }
        }
    }, [value, size])

    return <canvas ref={canvasRef} className="rounded-xl mix-blend-multiply" style={{ width: size, height: size }} />
}

export default function VipCard({ referralCode, referralCount, vipPayload, onLoadVip, onShareCopy }: Props) {
    const [loading, setLoading] = useState(false)
    const [vip, setVip] = useState(vipPayload)
    const [codeCopied, setCodeCopied] = useState(false)
    const [refCopied, setRefCopied] = useState(false)

    useEffect(() => {
        if (!vip && !loading) {
            setLoading(true)
            onLoadVip().then((data) => {
                setVip(data)
                setLoading(false)
            }).catch(() => setLoading(false))
        }
    }, [vip, loading, onLoadVip])

    const copyToClipboard = useCallback(async (text: string, type: 'code' | 'ref') => {
        await navigator.clipboard.writeText(text)
        if (type === 'code') {
            setCodeCopied(true)
            setTimeout(() => setCodeCopied(false), 2000)
        } else {
            setRefCopied(true)
            setTimeout(() => setRefCopied(false), 2000)
            onShareCopy?.()
        }
    }, [onShareCopy])

    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    return (
        <div className="space-y-6">
            {/* Title */}
            <div className="flex items-center gap-2">
                <Crown size={20} className="text-illa-yellow" fill="currentColor" />
                <h2 className="text-lg font-bold text-white">Área VIP</h2>
            </div>

            {/* Main VIP Card - Holographic Look */}
            <div className="relative overflow-hidden rounded-[2rem] bg-black/40 backdrop-blur-xl text-white p-6 shadow-2xl border border-white/10 transition-transform hover:scale-[1.01] duration-500 perspective-1000 group">

                {/* Holographic Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/50 z-0" />
                <div className="absolute -inset-1/2 bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-20 rotate-[20deg] animate-[spin_10s_linear_infinite] mix-blend-overlay" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-illa-pink/30 rounded-full blur-[80px] mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-illa-yellow/20 rounded-full blur-[80px] mix-blend-screen" />

                {/* Mesh Texture instead of Noise */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                                <CreditCard size={20} className="text-illa-yellow" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg tracking-tight">ILLA Exclusive</h3>
                                <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Member Pass</p>
                            </div>
                        </div>
                        {/* Glossy Logo Placeholder */}
                        <div className="text-xl font-script text-white/20 -rotate-12 select-none">Illa</div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* QR Code Container */}
                        <div className="bg-white p-3 rounded-2xl shadow-xl shadow-black/20 flex-shrink-0 rotate-1 transition-transform group-hover:rotate-0">
                            {loading || !vip ? (
                                <div className="w-[120px] h-[120px] flex items-center justify-center bg-gray-50 rounded-xl">
                                    <Loader2 size={24} className="animate-spin text-dark/30" />
                                </div>
                            ) : (
                                <QrCodeCanvas value={`${origin}/vip/redeem?code=${vip.short_code}`} size={120} />
                            )}
                        </div>

                        {/* Code & Actions */}
                        <div className="flex-1 w-full space-y-4">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    Chave de Acesso <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                </p>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-mono font-bold text-2xl tracking-[0.2em] text-white text-shadow-sm">
                                        {vip?.short_code ?? '••••••••'}
                                    </span>
                                    {vip && (
                                        <button
                                            onClick={() => copyToClipboard(vip.short_code, 'code')}
                                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-95"
                                            title="Copiar código"
                                        >
                                            {codeCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-white/40">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={12} />
                                    <span>Expira em: <span className="text-white/70 font-medium">{vip ? new Date(vip.expires_at).toLocaleDateString('pt-BR') : '--/--'}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <QrCode size={12} />
                                    <span>Uso presencial</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Referral Section (Cinematic) ── */}
            {referralCode && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                    className="relative rounded-3xl overflow-hidden"
                >
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 bg-gradient-to-br from-illa-pink via-purple-600 to-amber-500 animate-[spin_8s_linear_infinite] opacity-60 blur-sm" />

                    {/* Inner card */}
                    <div className="relative m-[2px] rounded-[22px] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 overflow-hidden">

                        {/* Shimmer sweep */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
                        />

                        {/* Header */}
                        <div className="relative flex items-center gap-3 mb-5">
                            <motion.div
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                className="p-2.5 rounded-2xl bg-gradient-to-br from-illa-pink/20 to-amber-500/20 border border-illa-pink/20"
                            >
                                <Sparkles size={20} className="text-illa-pink" />
                            </motion.div>
                            <div>
                                <h3 className="text-lg font-black bg-gradient-to-r from-illa-pink via-pink-300 to-amber-400 bg-clip-text text-transparent">
                                    Indique e Ganhe
                                </h3>
                                <p className="text-xs text-white/40">Compartilhe e desbloqueie recompensas exclusivas</p>
                            </div>
                        </div>

                        {/* Referral Link + Share */}
                        <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 pl-3 mb-6 backdrop-blur-sm">
                            <input
                                type="text"
                                readOnly
                                value={`${origin}/?ref=${referralCode}`}
                                className="flex-1 bg-transparent text-xs text-white/50 font-mono outline-none truncate"
                            />
                            <button
                                onClick={() => copyToClipboard(`${origin}/?ref=${referralCode}`, 'ref')}
                                className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-illa-pink hover:text-white transition-all active:scale-95"
                            >
                                {refCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>

                        {/* Milestones */}
                        <div className="relative mb-5">
                            {/* Progress track */}
                            <div className="absolute top-4 left-4 right-4 h-1 bg-white/5 rounded-full z-0" />
                            {/* Animated progress fill */}
                            <motion.div
                                className="absolute top-4 left-4 h-1 bg-gradient-to-r from-illa-pink to-amber-400 rounded-full z-[1]"
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
                                                        '0 0 8px rgba(229,1,125,0.3)',
                                                        '0 0 20px rgba(229,1,125,0.6)',
                                                        '0 0 8px rgba(229,1,125,0.3)'
                                                    ]
                                                } : {}}
                                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${achieved
                                                    ? 'bg-gradient-to-br from-illa-pink to-pink-600 border-illa-pink/50 text-white'
                                                    : 'bg-white/5 border-white/10 text-white/30'
                                                    }`}
                                            >
                                                {achieved ? <Check size={14} strokeWidth={3} /> : <span className="text-[10px] font-bold">{m}</span>}
                                            </motion.div>
                                            <span className={`text-[10px] font-bold ${achieved ? 'text-illa-pink' : 'text-white/20'}`}>
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
                                    copyToClipboard(url, 'ref')
                                }
                            }}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-illa-pink to-pink-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(229,1,125,0.4)] hover:shadow-[0_4px_28px_rgba(229,1,125,0.6)] transition-shadow"
                        >
                            <Share2 size={16} />
                            Compartilhar Link
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
