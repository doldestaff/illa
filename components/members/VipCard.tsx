/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { VipPayload, MemberProfile } from '@/lib/gamification-types'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { QrCode, Copy, Check, Loader2, Crown, Clock, X, IceCream, Tag, Zap, Flame, Gift, CheckCircle, Sparkles, TrendingUp } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
    profile: MemberProfile
    avatarUrl: string | null
    referralCount: number
    vipPayload: VipPayload | null
    onLoadVip: () => Promise<VipPayload>
    onShareCopy?: () => void
    onViewExclusive?: () => void
    missionsCompleted?: number
    totalMissions?: number
    sorvetesCount?: number
    dropsClaimed?: number
}

function QrCodeCanvas({ value, size = 140 }: { value: string; size?: number }) {
    return (
        <div className="bg-white p-2 rounded-2xl shadow-[inset_0_0_15px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden border border-amber-500/20">
            <QRCodeSVG
                value={value}
                size={size}
                level="M"
                includeMargin={true}
                className="w-full h-full"
            />
        </div>
    )
}

export default function VipCard({ 
    profile, avatarUrl, referralCount, vipPayload, onLoadVip, 
    onShareCopy, onViewExclusive, missionsCompleted = 0, 
    totalMissions = 0, sorvetesCount = 0, dropsClaimed = 0 
}: Props) {
    const [loading, setLoading] = useState(false)
    const [vip, setVip] = useState(vipPayload)
    const [codeCopied, setCodeCopied] = useState(false)
    const [showBenefits, setShowBenefits] = useState(false)
    const [isValidated, setIsValidated] = useState(false)
    const benefitsTracked = useRef(false)
    const [isMobile, setIsMobile] = useState(false)
    
    // Vouchers State
    const [myVouchers, setMyVouchers] = useState<any[]>([])
    const [loadingVouchers, setLoadingVouchers] = useState(false)

    useEffect(() => {
        setIsMobile(window.innerWidth < 768)
        
        const channel = supabase.channel('vip-notifications')
            .on('broadcast', { event: 'vip-scan-success' }, ({ payload }) => {
                if (payload.userId === profile.id) {
                    setIsValidated(true)
                    setTimeout(() => setIsValidated(false), 5000)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile.id])

    // Load Vouchers when Modal opens
    useEffect(() => {
        if (showBenefits && myVouchers.length === 0 && !loadingVouchers) {
            setLoadingVouchers(true)
            supabase.rpc('list_my_discounts', { p_limit: 10 }).then(({ data, error }) => {
                if (!error && data) setMyVouchers(data)
                setLoadingVouchers(false)
            }).catch(() => setLoadingVouchers(false))
        }
    }, [showBenefits, myVouchers.length, loadingVouchers])


    const cardRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "end start"]
    })

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

    const copyToClipboard = useCallback(async (text: string) => {
        await navigator.clipboard.writeText(text)
        setCodeCopied(true)
        setTimeout(() => setCodeCopied(false), 2000)
    }, [])

    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    return (
        <div className="space-y-6" ref={cardRef} id="vip">
            <div className="flex items-center gap-2">
                <Crown size={20} className="text-illa-yellow" fill="currentColor" />
                <h2 className="text-lg font-bold text-white">Área VIP</h2>
            </div>

            <div className="relative w-[calc(100%+1.5rem)] -ml-3 sm:w-full sm:mx-auto sm:max-w-[400px] filter drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition-transform hover:scale-[1.01] duration-500 perspective-1000 group rounded-[2rem] bg-[#0c0514] overflow-hidden border border-white/10">
                <div
                    className="relative w-full pt-[95%] sm:pt-[100%] bg-[#0c0514] overflow-hidden"
                >
                    <img src="/digital-card/digitalcard-illa.webp?v=update9" alt="ILLA Exclusive Digital Card" className="absolute inset-0 w-full h-[120%] object-cover object-top pointer-events-none z-0 scale-[1.02] -translate-y-[8%]" />
                </div>

                <div className="absolute inset-x-0 top-0 bottom-[120px] z-10 flex flex-col pointer-events-none">
                    <div className="absolute top-[25.5%] left-[51.5%] -translate-x-1/2 w-[42%] aspect-square flex items-center justify-center group/qr cursor-pointer pointer-events-auto">
                        {loading || !vip ? (
                            <div className="w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl border border-white/5">
                                <Loader2 size={24} className="animate-spin text-white/50" />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center relative">
                                {!isMobile && (
                                    <motion.div
                                        className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay bg-gradient-to-r from-transparent via-white/80 to-transparent w-[150%] h-[150%] -rotate-45"
                                        style={{ x: glareX, y: glareY }}
                                    />
                                )}
                                {isMobile && (
                                    <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                                )}
                                <QrCodeCanvas value={vip.qr_payload ? JSON.stringify(vip.qr_payload) : `${origin}/vip/redeem?code=${vip.short_code}`} size={200} />
                                <AnimatePresence>
                                    {isValidated && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.2 }}
                                            className="absolute inset-x-0 -inset-y-4 z-[60] flex flex-col items-center justify-center pointer-events-none"
                                        >
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"
                                            />
                                            <div className="bg-emerald-500/90 backdrop-blur-md p-3 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.5)] border border-emerald-400/50">
                                                <CheckCircle size={40} className="text-white" />
                                            </div>
                                            <motion.span 
                                                initial={{ y: 10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="mt-3 font-mono font-black text-emerald-400 text-sm tracking-[0.2em] drop-shadow-lg uppercase"
                                            >
                                                Verificado
                                            </motion.span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative z-20 px-4 py-2 pb-6 flex flex-col justify-end bg-gradient-to-t from-[#0c0514] via-[#0c0514]/90 to-transparent -mt-[8rem]">
                    <div className="flex items-center justify-between mb-3 mt-4 px-4">
                        <span className="font-mono font-bold text-3xl tracking-[0.15em] text-white drop-shadow-md z-10">
                            {vip?.short_code ?? '••••••••'}
                        </span>
                        {vip && (
                            <button
                                onClick={() => copyToClipboard(vip.short_code)}
                                className="p-2 md:p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 transition-all focus:scale-95 text-white/60 hover:text-white z-10 relative"
                            >
                                {codeCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] md:text-xs text-white/50 px-2 relative z-10">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Clock size={12} className="opacity-70" />
                            <span className="text-white/80 tracking-wide">{vip ? new Date(vip.expires_at).toLocaleDateString('pt-BR') : '--/--'}</span>
                        </div>
                        <span className="opacity-70 uppercase tracking-widest text-[9px] font-bold">Uso presencial</span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showBenefits && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBenefits(false)}
                            className="fixed inset-0 z-[500] bg-[#05020a]/80 backdrop-blur-2xl"
                        />
                        <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 pointer-events-none perspective-[2000px]">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, rotateX: 5, y: 40 }}
                                animate={{ scale: 1, opacity: 1, rotateX: 0, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, rotateX: -5, y: 20 }}
                                transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
                                className="w-full max-w-[440px] max-h-[92vh] overflow-y-auto no-scrollbar pointer-events-auto relative rounded-[2.5rem] bg-gradient-to-b from-[#1a0f2e] to-[#0c0514] border border-amber-500/20 shadow-[0_20px_100px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)] transform-style-3d"
                            >
                                {/* Magical ambient lights behind content */}
                                <div className="absolute top-0 left-0 w-full h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />
                                <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />

                                <button
                                    onClick={() => setShowBenefits(false)}
                                    className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/40 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                                >
                                    <X size={18} />
                                </button>

                                <div className="relative z-10 px-5 sm:px-7 pt-12 pb-10 flex flex-col gap-8">
                                    
                                    {/* 1. Golden Identity Header */}
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="relative">
                                            {/* Outer Ring animated glow */}
                                            <motion.div 
                                                animate={{ rotate: 360 }} 
                                                transition={{ duration: 15, ease: "linear", repeat: Infinity }}
                                                className="absolute -inset-1 rounded-full border border-dashed border-amber-500/40 opacity-50 pointer-events-none"
                                            />
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)] relative z-10" />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1a0f2e] to-black border-2 border-amber-400 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                                                    <Crown size={32} className="text-amber-400 drop-shadow-lg" />
                                                </div>
                                            )}
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 px-4 py-1.5 rounded-full border border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20">
                                                <span className="text-xs font-black text-black uppercase tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">Lvl {profile.level}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tight drop-shadow-md">{profile.full_name?.split(' ')[0] || 'Membro VIP'}</h3>
                                            <p className="text-xs text-amber-500/80 uppercase tracking-[0.2em] font-bold mt-1.5 flex items-center justify-center gap-1.5">
                                                <Sparkles size={12} /> Exclusivo ILLA
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. Premium Balances */}
                                    <div className="relative p-7 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent border border-white/5 flex flex-col items-center overflow-hidden shadow-inner group">
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-colors" />
                                        
                                        <span className="text-[10px] text-white/50 font-bold tracking-[0.3em] uppercase mb-2 relative z-10">Saldo Ouro</span>
                                        <div className="flex items-center gap-3 relative z-10">
                                            <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 drop-shadow-[0_2px_15px_rgba(251,191,36,0.4)] tracking-tighter">
                                                {profile.points.toLocaleString('pt-BR')}
                                            </span>
                                            <Crown size={28} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" fill="currentColor" />
                                        </div>
                                    </div>

                                    {/* 3. Gamified Inventory Grid (Badges) */}
                                    <div className="flex flex-col gap-3 relative z-10">
                                        <div className="flex items-center justify-between px-2">
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Suas Conquistas</p>
                                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4" />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            {/* Base Badge Style: Glassy, Inner Edge, Center alignment */}
                                            {/* Missões */}
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex flex-col items-center gap-1.5 relative overflow-hidden shadow-inner group">
                                                <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                                                <Zap size={22} className="text-amber-400 mb-1 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] group-hover:scale-110 transition-transform" />
                                                <span className="text-2xl font-black text-white tracking-tight">{missionsCompleted}<span className="text-sm text-white/40 font-bold">/{totalMissions}</span></span>
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Missões</span>
                                            </div>
                                            {/* Sorvetes */}
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex flex-col items-center gap-1.5 relative overflow-hidden shadow-inner group">
                                                <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                                                <IceCream size={22} className="text-cyan-400 mb-1 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] group-hover:scale-110 transition-transform" />
                                                <span className="text-2xl font-black text-white tracking-tight">{sorvetesCount}</span>
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Sorvetes Free</span>
                                            </div>
                                            {/* Drops */}
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex flex-col items-center gap-1.5 relative overflow-hidden shadow-inner group">
                                                <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                                                <Gift size={22} className="text-rose-400 mb-1 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)] group-hover:scale-110 transition-transform" />
                                                <span className="text-2xl font-black text-white tracking-tight">{dropsClaimed}</span>
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Baús/Drops</span>
                                            </div>
                                            {/* Streak */}
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex flex-col items-center gap-1.5 relative overflow-hidden shadow-inner group">
                                                <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                                                <Flame size={22} className="text-orange-500 mb-1 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:scale-110 transition-transform" />
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-white tracking-tight">{profile.streak_count}</span>
                                                    <span className="text-xs font-bold text-white/60">dias</span>
                                                </div>
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Ofensiva</span>
                                            </div>
                                            
                                            {/* Referrals - Wide Badge */}
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 flex items-center justify-between col-span-2 relative overflow-hidden shadow-[inset_0_2px_15px_rgba(59,130,246,0.1)] group">
                                                <div className="absolute inset-x-0 top-0 h-px bg-blue-400/30" />
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="text-2xl font-black text-white tracking-tight">{referralCount} Amigos</span>
                                                    <span className="text-[9px] font-black text-blue-400/80 uppercase tracking-widest">Indicados por você</span>
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                                    <TrendingUp size={24} className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. RPG XP Bar */}
                                    <div className="flex flex-col gap-3 relative z-10 px-1">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Experiência</span>
                                            <span className="text-[11px] font-black text-amber-500 tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{profile.xp_into_level} / {profile.xp_for_next_level} XP</span>
                                        </div>
                                        <div className="h-4 w-full bg-[#05020a] rounded-full overflow-hidden border border-white/10 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] relative">
                                            {/* Notches for details */}
                                            <div className="absolute inset-0 flex justify-evenly opacity-20 pointer-events-none z-10">
                                                <div className="w-px h-full bg-white/50" />
                                                <div className="w-px h-full bg-white/50" />
                                                <div className="w-px h-full bg-white/50" />
                                            </div>
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (profile.xp_into_level / (profile.xp_for_next_level || 1)) * 100)}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                                className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 relative"
                                            >
                                                <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/50 blur-[2px]" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* 5. Acquired Vouchers (From Database/Store) */}
                                    {myVouchers.length > 0 && (
                                        <div className="flex flex-col gap-3 relative z-10">
                                            <div className="flex items-center justify-between px-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                                <span>Meus Vouchers Ocultos</span>
                                                <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent ml-4" />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                {myVouchers.map((v) => (
                                                    <div key={v.id} className="relative flex items-center p-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-black/60 border border-emerald-500/30 overflow-hidden shadow-[0_4px_15px_rgba(16,185,129,0.1)] group">
                                                        {/* Ticket Perforations */}
                                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0B0514] border-r border-emerald-500/30" />
                                                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0B0514] border-l border-emerald-500/30" />
                                                        {/* Shimmer */}
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_2s_infinite]" />
                                                        
                                                        <div className="pl-3 pr-2 flex-1 flex flex-col items-start gap-1 border-r border-dashed border-emerald-500/30 mr-4">
                                                            <p className="text-sm font-black text-white/90 uppercase tracking-wide">{v.offer?.title || 'Desconto ILLA'}</p>
                                                            <p className="text-[10px] text-white/40 font-mono tracking-widest bg-black/40 px-2 py-0.5 rounded truncate w-full">COD: {v.voucher_code}</p>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center shrink-0 w-16">
                                                            <Tag size={16} className="text-emerald-400 mb-1" />
                                                            <span className="text-lg font-black text-emerald-400">{v.offer?.percent}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 6. Acesso Presencial QR */}
                                    {vip && (
                                        <div className="relative p-6 sm:p-8 rounded-[2rem] bg-black/60 border border-white/5 flex flex-col items-center gap-5 mt-4 shadow-inner overflow-hidden">
                                            {/* Spot light inside */}
                                            <div className="absolute -top-[50%] left-1/2 -translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                                            
                                            <div className="flex items-center gap-2 relative z-10 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10">
                                                <QrCode size={14} className="text-amber-400" />
                                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Acesso Exclusivo</span>
                                            </div>
                                            
                                            <div className="relative z-10 p-1.5 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500">
                                                <QrCodeCanvas value={vip.qr_payload ? JSON.stringify(vip.qr_payload) : `${origin}/vip/redeem?code=${vip.short_code}`} size={160} />
                                            </div>
                                            
                                            <div className="flex flex-col items-center relative z-10 mt-2">
                                                <p className="font-mono font-black text-3xl text-white tracking-[0.25em] drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                                                    {vip.short_code}
                                                </p>
                                                <p className="text-[9px] text-white/40 mt-1 uppercase tracking-widest font-bold">
                                                    Validade Premium: {new Date(vip.expires_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
