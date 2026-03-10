/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { VipPayload } from '@/lib/gamification-types'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { QrCode, Copy, Check, Loader2, Crown, Clock, X, IceCream, Tag, Zap } from 'lucide-react'

interface Props {
    referralCode: string | null
    referralCount: number
    vipPayload: VipPayload | null
    onLoadVip: () => Promise<VipPayload>
    onShareCopy?: () => void
    onViewExclusive?: () => void
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

export default function VipCard({ referralCode, referralCount, vipPayload, onLoadVip, onShareCopy, onViewExclusive }: Props) {
    const [loading, setLoading] = useState(false)
    const [vip, setVip] = useState(vipPayload)
    const [codeCopied, setCodeCopied] = useState(false)
    const [refCopied, setRefCopied] = useState(false)
    const [showBenefits, setShowBenefits] = useState(false)
    const benefitsTracked = useRef(false)

    // --- Scroll Reactive Lighting Setup ---
    const cardRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "end start"]
    })

    // Map scroll progress to glare movement (diagonally across the QR box)
    const glareX = useTransform(scrollYProgress, [0, 1], ['-150%', '250%'])
    const glareY = useTransform(scrollYProgress, [0, 1], ['-100%', '200%'])


    useEffect(() => {
        if (!vip && !loading) {
            setTimeout(() => {
                setLoading(true)
                onLoadVip().then((data) => {
                    setVip(data)
                    setLoading(false)
                }).catch(() => setLoading(false))
            }, 0)
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
        <div className="space-y-6" ref={cardRef} id="vip">
            {/* Title */}
            <div className="flex items-center gap-2">
                <Crown size={20} className="text-illa-yellow" fill="currentColor" />
                <h2 className="text-lg font-bold text-white">Área VIP</h2>
            </div>

            {/* Main VIP Card Container */}
            <div className="relative w-[calc(100%+1.5rem)] -ml-3 sm:w-full sm:mx-auto sm:max-w-[400px] filter drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition-transform hover:scale-[1.01] duration-500 perspective-1000 group rounded-[2rem] bg-[#0c0514] overflow-hidden border border-white/10">

                {/* Background Image Native Shape - Shorter height to crop empty bottom space */}
                <div
                    className="relative w-full pt-[95%] sm:pt-[100%] bg-[#0c0514] overflow-hidden cursor-pointer"
                    onClick={() => {
                        setShowBenefits(true)
                        if (!benefitsTracked.current) {
                            benefitsTracked.current = true
                            onViewExclusive?.()
                        }
                    }}
                >
                    <img src="/digital-card/digitalcard-illa.webp?v=update9" alt="ILLA Exclusive Digital Card" className="absolute inset-0 w-full h-[120%] object-cover object-top pointer-events-none z-0 scale-[1.02] -translate-y-[8%]" />
                </div>

                {/* Sub-container for interactive/dynamic elements overlaying the image */}
                <div className="absolute inset-x-0 top-0 bottom-[120px] z-10 flex flex-col">

                    {/* QR Code Container - positioned over the white square on the webp art */}
                    <div className="absolute top-[37.2%] left-[51.5%] -translate-x-1/2 w-[35%] aspect-square flex items-center justify-center group/qr cursor-pointer">
                        {loading || !vip ? (
                            <div className="w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl">
                                <Loader2 size={24} className="animate-spin text-white/50" />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center relative">
                                {/* Scroll-Reactive Glare Layer */}
                                <motion.div
                                    className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay bg-gradient-to-r from-transparent via-white/80 to-transparent w-[150%] h-[150%] -rotate-45"
                                    style={{ x: glareX, y: glareY }}
                                />
                                <QrCodeCanvas value={`${origin}/vip/redeem?code=${vip.short_code}`} size={160} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Area - Code & Expiration close to the CHAVE DE ACESSO text on webp art */}
                <div className="relative z-20 px-4 py-2 pb-6 flex flex-col justify-end bg-gradient-to-t from-[#0c0514] via-[#0c0514]/90 to-transparent -mt-[8rem]">
                    {/* Access Code Row */}
                    <div className="flex items-center justify-between mb-3 mt-4 px-4">
                        <span className="font-mono font-bold text-3xl tracking-[0.15em] text-white drop-shadow-md z-10">
                            {vip?.short_code ?? '••••••••'}
                        </span>
                        {vip && (
                            <button
                                onClick={() => copyToClipboard(vip.short_code, 'code')}
                                className="p-2 md:p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 transition-all focus:scale-95 text-white/60 hover:text-white z-10 relative"
                                title="Copiar código"
                            >
                                {codeCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                            </button>
                        )}
                    </div>

                    {/* Footer Info Row */}
                    <div className="flex items-center justify-between text-[11px] md:text-xs text-white/50 px-2 relative z-10">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Clock size={12} className="opacity-70" />
                            <span className="text-white/80 tracking-wide">{vip ? new Date(vip.expires_at).toLocaleDateString('pt-BR') : '--/--'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <QrCode size={12} className="opacity-70" />
                            <span>Uso presencial</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Popup */}
            <AnimatePresence>
                {showBenefits && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBenefits(false)}
                            className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md"
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                className="w-full max-w-[400px] pointer-events-auto relative overflow-hidden rounded-[2.5rem] bg-[#0c0514]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
                            >
                                {/* Ambient glows */}
                                <div className="absolute -top-20 -left-20 w-56 h-56 bg-amber-500/15 rounded-full blur-[60px] pointer-events-none" />
                                <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />

                                {/* Close button */}
                                <button
                                    onClick={() => setShowBenefits(false)}
                                    className="absolute top-5 right-5 z-20 p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/40 hover:text-white transition-all border border-white/5"
                                >
                                    <X size={16} />
                                </button>

                                {/* Header */}
                                <div className="relative z-10 px-8 pt-10 pb-6 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.1, damping: 12 }}
                                        className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center mb-4 shadow-[0_8px_30px_rgba(251,191,36,0.3)]"
                                    >
                                        <Crown size={30} className="text-white" fill="currentColor" />
                                    </motion.div>
                                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200 tracking-tight">
                                        ILLA Exclusive
                                    </h3>
                                    <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">Seus benefícios VIP</p>
                                </div>

                                {/* Benefits List */}
                                <div className="relative z-10 px-6 pb-6 space-y-3">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                                            <IceCream size={22} className="text-cyan-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">Sorvetes & Picolés Free</p>
                                            <p className="text-xs text-white/40">Troque moedas por produtos gratuitos</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                            <Tag size={22} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">Super Descontos</p>
                                            <p className="text-xs text-white/40">Promoções exclusivas para membros VIP</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                            <Zap size={22} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">Acesso Antecipado</p>
                                            <p className="text-xs text-white/40">Novos sabores e lançamentos antes de todos</p>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* QR Code Section */}
                                {vip && (
                                    <div className="relative z-10 px-6 pb-8">
                                        <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Apresente na loja</p>
                                            <div className="bg-white rounded-xl p-2">
                                                <QrCodeCanvas value={`${origin}/vip/redeem?code=${vip.short_code}`} size={120} />
                                            </div>
                                            <p className="font-mono font-bold text-lg text-white/80 tracking-[0.2em]">{vip.short_code}</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div >
    )
}
