/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { VipPayload, MemberProfile } from '@/lib/gamification-types'
import { motion, AnimatePresence, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { QrCode, Copy, Check, Loader2, Crown, Clock, X, IceCream, Tag, Zap, Flame, Gift } from 'lucide-react'

interface Props {
    profile: MemberProfile
    avatarUrl: string | null
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

export default function VipCard({ profile, avatarUrl, referralCount, vipPayload, onLoadVip, onShareCopy, onViewExclusive }: Props) {
    const [loading, setLoading] = useState(false)
    const [vip, setVip] = useState(vipPayload)
    const [codeCopied, setCodeCopied] = useState(false)
    const [refCopied, setRefCopied] = useState(false)
    const [showBenefits, setShowBenefits] = useState(false)
    const benefitsTracked = useRef(false)

    // PERF: Detect mobile to disable scroll-reactive glare (fires per-frame)
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        setIsMobile(window.innerWidth < 768)
    }, [])

    // --- Scroll Reactive Lighting Setup ---
    // PERF: Only create scroll listeners on desktop. On mobile this fires
    // a JS callback on EVERY scroll frame, competing with the compositor.
    const cardRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "end start"]
    })

    // Map scroll progress to glare movement (diagonally across the QR box)
    // On mobile these MotionValues exist but won't be consumed by any motion.div
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
                                {/* Scroll-Reactive Glare Layer — PERF: disabled on mobile */}
                                {!isMobile && (
                                    <motion.div
                                        className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay bg-gradient-to-r from-transparent via-white/80 to-transparent w-[150%] h-[150%] -rotate-45"
                                        style={{ x: glareX, y: glareY }}
                                    />
                                )}
                                {/* On mobile: static subtle glare for premium feel */}
                                {isMobile && (
                                    <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                                )}
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

            {/* Liquid Digital Identity Modal */}
            <AnimatePresence>
                {showBenefits && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBenefits(false)}
                            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl"
                        />

                        {/* Modal Container */}
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto no-scrollbar pointer-events-auto relative rounded-[2.5rem] bg-[#0c0514]/95 border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.9)]"
                            >
                                {/* Immersive Glows */}
                                <div className="absolute -top-32 -left-20 w-72 h-72 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />
                                <div className="absolute top-1/2 -right-20 w-64 h-64 bg-rose-500/15 rounded-full blur-[80px] pointer-events-none" />

                                {/* Close button */}
                                <button
                                    onClick={() => setShowBenefits(false)}
                                    className="absolute top-5 right-5 z-30 p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/40 hover:text-white transition-all border border-white/5 backdrop-blur-md"
                                >
                                    <X size={18} />
                                </button>

                                <div className="relative z-10 px-6 pt-10 pb-8 flex flex-col gap-8">
                                    
                                    {/* 1. Header Identity Stream */}
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="flex flex-col items-center text-center gap-3"
                                    >
                                        <div className="relative">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]" />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/20 to-rose-500/20 border-2 border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                                    <Crown size={32} className="text-amber-400/50" />
                                                </div>
                                            )}
                                            {/* Level Badge Overlay */}
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-rose-500 px-3 py-1 rounded-full border border-black shadow-lg">
                                                <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider whitespace-nowrap">Lvl {profile.level}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-2">
                                            <h3 className="text-2xl font-black text-white tracking-tight">
                                                {profile.full_name?.split(' ')[0] || 'Membro VIP'}
                                            </h3>
                                            <p className="text-xs text-amber-200/60 uppercase tracking-widest font-bold mt-1">Identidade Digital</p>
                                        </div>
                                    </motion.div>

                                    {/* 2. Core Wealth Stream (Points/Coins) */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                        className="relative p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] to-transparent border border-white/[0.08] overflow-hidden flex flex-col items-center justify-center text-center"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-rose-500/10 mix-blend-overlay" />
                                        <span className="text-xs text-white/50 font-bold tracking-widest uppercase mb-1 relative z-10">Saldo Illa</span>
                                        <div className="flex items-baseline gap-2 relative z-10">
                                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm">
                                                {profile.points.toLocaleString('pt-BR')}
                                            </span>
                                            <Crown size={20} className="text-amber-400" fill="currentColor" />
                                        </div>
                                    </motion.div>

                                    {/* 3. Tactical Stats Stream */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* XP Progress */}
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="col-span-2 p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3"
                                        >
                                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                                                <span className="text-white/50">Progresso</span>
                                                <span className="text-amber-400">{profile.xp_into_level} / {profile.xp_for_next_level} XP</span>
                                            </div>
                                            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/10">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (profile.xp_into_level / (profile.xp_for_next_level || 1)) * 100)}%` }}
                                                    transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                                                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                                                />
                                            </div>
                                        </motion.div>

                                        {/* Drops */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center gap-1"
                                        >
                                            <Gift size={20} className="text-rose-400 mb-1" />
                                            <span className="text-2xl font-black text-white">{profile.drops}</span>
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Drops Salvos</span>
                                        </motion.div>

                                        {/* Streak */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center gap-1"
                                        >
                                            <Flame size={20} className="text-orange-500 mb-1" />
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-white">{profile.streak_count}</span>
                                                <span className="text-xs font-bold text-white/60">dias</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Ofensiva</span>
                                        </motion.div>
                                    </div>

                                    {/* 4. QR Code Validation Block */}
                                    {vip && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                            className="relative p-5 rounded-3xl bg-black/40 border border-white/10 flex flex-col items-center gap-4 mt-2"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none" />
                                            <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest relative z-10">Acesso Presencial Exclusivo</p>
                                            <div className="bg-white p-3 rounded-2xl relative z-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                                                <QrCodeCanvas value={`${origin}/vip/redeem?code=${vip.short_code}`} size={140} />
                                            </div>
                                            <div className="flex flex-col items-center relative z-10">
                                                <p className="font-mono font-black text-2xl text-white tracking-[0.2em]">{vip.short_code}</p>
                                                <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
                                                    Expira em {new Date(vip.expires_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 5. Legacy Benefits Reminder (Subtle) */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.7 }}
                                        className="pt-4 border-t border-white/10 flex items-center justify-center gap-6"
                                    >
                                        <div className="flex items-center gap-2 text-white/40">
                                            <IceCream size={14} className="text-cyan-500/70" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Free</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/40">
                                            <Tag size={14} className="text-emerald-500/70" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">VIP</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/40">
                                            <Zap size={14} className="text-amber-500/70" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Acesso</span>
                                        </div>
                                    </motion.div>

                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div >
    )
}
