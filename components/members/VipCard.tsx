'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { VipPayload } from '@/lib/gamification-types'
import { motion, useScroll, useTransform } from 'framer-motion'
import { QrCode, Copy, Check, Loader2, Crown, Clock } from 'lucide-react'

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

            {/* Main VIP Card - Image Based Layout */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0c0514] text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 transition-transform hover:scale-[1.01] duration-500 perspective-1000 group w-full aspect-square max-w-[400px] mx-auto">
                <img src="/digital-card/digitalcard-illa.webp?v=update2" alt="ILLA Exclusive Digital Card" className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />

                {/* Sub-container for interactive/dynamic elements overlaying the image */}
                <div className="absolute inset-0 z-10 flex flex-col">

                    {/* QR Code Container - Absolute positioned over the white square cavity */}
                    <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[40%] aspect-square flex items-center justify-center rounded-[1.5rem] overflow-hidden group/qr cursor-pointer">
                        {loading || !vip ? (
                            <div className="w-full h-full flex items-center justify-center bg-white">
                                <Loader2 size={24} className="animate-spin text-black/30" />
                            </div>
                        ) : (
                            <div className="w-full h-full bg-white flex items-center justify-center p-2 rounded-2xl relative">
                                {/* Scroll-Reactive Glare Layer */}
                                <motion.div
                                    className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay bg-gradient-to-r from-transparent via-white/80 to-transparent w-[150%] h-[150%] -rotate-45"
                                    style={{ x: glareX, y: glareY }}
                                />
                                <QrCodeCanvas value={`${origin}/vip/redeem?code=${vip.short_code}`} size={140} />
                            </div>
                        )}
                    </div>

                    {/* Bottom Area - Code & Expiration positioned over the glass oval */}
                    <div className="absolute bottom-[2%] left-0 right-0 px-6 py-4 flex flex-col justify-end h-[35%]">
                        {/* Access Code Row */}
                        <div className="flex items-center justify-between mb-4 mt-8 px-2">
                            <span className="font-mono font-bold text-2xl md:text-3xl tracking-[0.2em] text-white drop-shadow-md">
                                {vip?.short_code ?? '••••••••'}
                            </span>
                            {vip && (
                                <button
                                    onClick={() => copyToClipboard(vip.short_code, 'code')}
                                    className="p-2 md:p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 transition-all focus:scale-95 text-white/60 hover:text-white"
                                    title="Copiar código"
                                >
                                    {codeCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                                </button>
                            )}
                        </div>

                        {/* Footer Info Row */}
                        <div className="flex items-center justify-between text-[11px] md:text-xs text-white/50 px-2">
                            <div className="flex items-center gap-1.5 font-medium">
                                <Clock size={12} className="opacity-70" />
                                <span>Expira em: <span className="text-white/80">{vip ? new Date(vip.expires_at).toLocaleDateString('pt-BR') : '--/--'}</span></span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <QrCode size={12} className="opacity-70" />
                                <span>Uso presencial</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
