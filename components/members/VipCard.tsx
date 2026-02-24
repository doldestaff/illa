'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { VipPayload } from '@/lib/gamification-types'
import { motion, useScroll, useTransform } from 'framer-motion'
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

    // --- Scroll Reactive Lighting Setup ---
    const cardRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "end start"]
    })

    // Map scroll progress to glare movement (diagonally across the QR box)
    const glareX = useTransform(scrollYProgress, [0, 1], ['-150%', '250%'])
    const glareY = useTransform(scrollYProgress, [0, 1], ['-100%', '200%'])

    // Map scroll progress to border highlight intensity and position
    const borderHighlightRotation = useTransform(scrollYProgress, [0, 1], ['0deg', '180deg'])


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
        <div className="space-y-6" ref={cardRef}>
            {/* Title */}
            <div className="flex items-center gap-2">
                <Crown size={20} className="text-illa-yellow" fill="currentColor" />
                <h2 className="text-lg font-bold text-white">Área VIP</h2>
            </div>

            {/* Main VIP Card - Holographic Look */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0f0f11] md:bg-black/40 md:backdrop-blur-xl text-white p-6 shadow-2xl border border-white/10 transition-transform hover:scale-[1.01] duration-500 perspective-1000 group">

                {/* Holographic Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/50 z-0" />
                <div className="absolute -inset-1/2 bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-20 rotate-[20deg] animate-[spin_10s_linear_infinite] mix-blend-overlay" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-illa-pink/30 rounded-full blur-[80px] mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-illa-yellow/20 rounded-full blur-[80px] mix-blend-screen" />

                {/* Mesh Texture instead of Noise */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            {/* Premium Icon Container */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 ring-1 ring-inset ring-illa-yellow/20 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1),0_4px_15px_rgba(0,0,0,0.5)]">
                                <CreditCard size={22} className="text-illa-yellow drop-shadow-[0_2px_4px_rgba(255,237,0,0.4)]" />
                            </div>
                            <div className="flex flex-col justify-center">
                                {/* Metallic Gold Typography */}
                                <h3 className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-[#FFF8D6] to-[#E5C100] drop-shadow-sm leading-none mb-1">
                                    ILLA Exclusive
                                </h3>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <Sparkles size={10} className="text-illa-yellow" />
                                    <p className="text-[9px] uppercase tracking-[0.3em] font-black leading-none">Digital Card</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* 
                            CINEMATIC QR CODE CONTAINER 
                            Replacing static white box with a premium scroll-reactive glossy box
                        */}
                        <motion.div
                            className="bg-white p-3 rounded-2xl shadow-2xl shadow-black/40 flex-shrink-0 relative overflow-hidden group/qr transition-transform hover:scale-105 duration-500 ease-out cursor-pointer"
                            whileHover={{ y: -5, rotateX: 5, rotateY: -5, z: 20 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                perspective: 1000,
                                transformStyle: "preserve-3d"
                            }}
                        >
                            {/* Scroll-Reactive Glare Layer */}
                            <motion.div
                                className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay bg-gradient-to-r from-transparent via-white/80 to-transparent w-[150%] h-[150%] -rotate-45"
                                style={{ x: glareX, y: glareY }}
                            />

                            {/* Additional subtle pulse glow on hover */}
                            <div className="absolute inset-0 rounded-2xl ring-2 ring-white/0 group-hover/qr:ring-illa-yellow/50 transition-all duration-500 z-10 pointer-events-none" />

                            <div className="relative z-0">
                                {loading || !vip ? (
                                    <div className="w-[120px] h-[120px] flex items-center justify-center bg-gray-50 rounded-xl">
                                        <Loader2 size={24} className="animate-spin text-dark/30" />
                                    </div>
                                ) : (
                                    <QrCodeCanvas value={`${origin}/vip/redeem?code=${vip.short_code}`} size={120} />
                                )}
                            </div>
                        </motion.div>

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

        </div>
    )
}
