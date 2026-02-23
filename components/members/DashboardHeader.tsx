'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { User, Star, Coins, IceCream, ChevronRight, Home, Droplet } from 'lucide-react'
import Link from 'next/link'
import type { MemberProfile } from '@/lib/gamification-types'
import { useRef, useState } from 'react'
import InventoryModal from './InventoryModal'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import { NotificationBell } from '../notifications/NotificationBell'
import { Loader2, Camera } from 'lucide-react'
import GlobalCoin from '@/components/ui/GlobalCoin'

interface Props {
    profile: MemberProfile
    avatarUrl: string | null
    sorvetesCount: number
}

const SHIMMER_Animation = {
    initial: { backgroundPosition: '-200% 0' },
    animate: {
        backgroundPosition: '200% 0',
        transition: {
            repeat: Infinity,
            duration: 3,
            ease: "linear" as const,
            repeatDelay: 2
        }
    }
}

export default function DashboardHeader({ profile, avatarUrl, sorvetesCount }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollY } = useScroll()
    const router = useRouter()
    const [showInventory, setShowInventory] = useState(false)
    const [inventoryTab, setInventoryTab] = useState<'sorvetes' | 'drops'>('sorvetes')
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(avatarUrl)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Parallax only on desktop (mobile scrolls naturally with content)
    const scale = useTransform(scrollY, [0, 200], [1, 0.95])
    const opacity = useTransform(scrollY, [0, 300], [1, 0.9])
    const y = useTransform(scrollY, [0, 200], [0, 10])

    // XP progress within current level (server-provided)
    const xpInto = profile.xp_into_level
    const xpForNext = profile.xp_for_next_level
    const xpToNext = profile.xp_to_next_level
    const isMaxLevel = xpForNext === 0
    const progressPercent = isMaxLevel
        ? 100
        : xpForNext > 0
            ? Math.min(100, Math.round((xpInto / xpForNext) * 100))
            : 0

    const missingFields = profile.missing_fields || []
    const shouldCompleteProfile = missingFields.length > 0

    const openInventory = (tab: 'sorvetes' | 'drops') => {
        setInventoryTab(tab)
        setShowInventory(true)
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const MAX_FILE_SIZE = 3 * 1024 * 1024
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

        if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
            alert('Por favor, envie uma imagem válida (JPG, PNG, WebP) de até 3MB.')
            return
        }

        setUploadingAvatar(true)
        const supabase = createSupabaseBrowser()
        const ext = file.name.split('.').pop() ?? 'png'
        const path = `${profile.id}/avatar-${Date.now()}.${ext}`

        // Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, file, { upsert: true, contentType: file.type })

        if (!uploadError) {
            // Update Profile DB Record
            await supabase.from('profiles').upsert({ id: profile.id, avatar_path: path })

            // Get new signed URL to update UI immediately
            const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 3600)
            if (signed?.signedUrl) {
                setLocalAvatarUrl(signed.signedUrl)
            }
        }

        setUploadingAvatar(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <>
            <motion.div
                ref={ref}
                style={{ scale, opacity, y }}
                className="md:sticky md:top-4 z-40 mb-6 md:mb-8"
            >
                <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.02] backdrop-blur-[50px] border border-white/10 text-white p-6 md:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] ring-1 ring-white/20 group transition-all duration-500 hover:bg-white/[0.05]">

                    {/* 0. Gloss Overlay (Top-Down Reflection) */}
                    <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-white/15 via-white/5 to-transparent pointer-events-none" />

                    {/* 1. Dynamic 'Vitral' Ambient Background */}
                    <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
                        {/* Prismatic Orbs - intensified & animated */}
                        <div className="absolute -top-32 -right-32 w-[35rem] h-[35rem] bg-gradient-to-br from-rose-500/30 via-fuchsia-500/30 to-indigo-500/30 rounded-full blur-[80px] mix-blend-screen animate-pulse duration-[4000ms]" />
                        <div className="absolute top-20 -left-20 w-[28rem] h-[28rem] bg-gradient-to-tr from-cyan-500/30 via-sky-500/30 to-blue-500/30 rounded-full blur-[60px] mix-blend-screen animate-pulse duration-[5000ms]" />

                        {/* Glass Noise/Texture */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay" />
                    </div>

                    {/* Action Bar (Top) */}
                    <div className="absolute top-6 left-6 z-50">
                        <Link href="/" className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center backdrop-blur-md bg-black/10 border border-white/10 hover:scale-110 active:scale-95" title="Voltar para Home">
                            <Home size={18} />
                        </Link>
                    </div>
                    <div className="absolute top-6 right-6 z-50">
                        <NotificationBell />
                    </div>

                    {/* 2. Glass Shine Effect */}
                    <motion.div
                        variants={SHIMMER_Animation}
                        initial="initial"
                        animate="animate"
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                        style={{ backgroundSize: '200% 100%' }}
                    />

                    {/* Main Content Dashboard */}
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mt-8 md:mt-8">

                        {/* 3. 3D Magical Avatar */}
                        <div
                            className="relative flex-shrink-0 group/avatar cursor-pointer mx-auto md:mx-0"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-4 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(229,1,125,0.5)_360deg)] rounded-full blur-[6px] opacity-60 group-hover/avatar:opacity-100 transition-opacity"
                            />
                            <div className="absolute -inset-1 bg-gradient-to-br from-illa-pink via-purple-500 to-illa-yellow rounded-full opacity-40 blur-xl group-hover/avatar:opacity-80 group-hover/avatar:blur-2xl transition duration-500"></div>

                            {/* ENLARGED AVATAR */}
                            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-[3px] border-white/30 bg-black/40 shadow-[0_0_30px_rgba(0,0,0,0.5)] transform transition-transform group-hover/avatar:scale-105 duration-300 backdrop-blur-md">
                                {uploadingAvatar ? (
                                    <div className="w-full h-full bg-black/60 flex items-center justify-center">
                                        <Loader2 size={32} className="text-illa-pink animate-spin" />
                                    </div>
                                ) : profile.avatar_path && localAvatarUrl ? (
                                    <>
                                        <img
                                            src={localAvatarUrl}
                                            alt={profile.full_name || 'User'}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <Camera size={28} className="text-white drop-shadow-md" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white/50 relative">
                                        <User size={56} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <Camera size={28} className="text-white drop-shadow-md" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-left mt-2 md:mt-0">

                            {/* Name & Level Badge */}
                            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-2">
                                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/70 tracking-tight drop-shadow-[0_2px_15px_rgba(255,255,255,0.2)]">
                                    {profile.full_name || 'Membro ILLA'}
                                </h1>

                                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-illa-yellow to-amber-500 shadow-[0_4px_16px_rgba(245,158,11,0.4)] border border-white/50 transform hover:scale-105 transition-transform cursor-default mt-1 md:mt-0">
                                    <Star size={14} fill="black" className="text-black" />
                                    <span className="text-black text-sm font-black tracking-wider drop-shadow-sm">LVL {profile.level}</span>
                                </div>
                            </div>

                            <p className="text-white/60 font-medium text-sm md:text-base mb-6 max-w-sm">Explore seu painel gamificado e alcance recompensas exclusivas.</p>

                            {/* Counters (Drops, Moedas, Sorvetes) */}
                            <div className="flex w-full items-center justify-center md:justify-start gap-3 md:gap-4">

                                {/* Drops (Left) */}
                                <motion.button
                                    onClick={() => openInventory('drops')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative flex items-center justify-center gap-2.5 px-4 py-2 rounded-[1rem] bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.2)] min-w-[90px] group/drops"
                                >
                                    <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#0284c7] shadow-[0_2px_4px_rgba(56,189,248,0.5)] border border-white/20 group-hover/drops:scale-110 transition-transform duration-300">
                                        <Droplet size={14} fill="currentColor" className="text-white drop-shadow-md" strokeWidth={2} />
                                    </div>
                                    <span className="text-2xl font-black text-white relative z-10 drop-shadow-sm tabular-nums tracking-tight">
                                        {profile.drops || 0}
                                    </span>
                                </motion.button>

                                {/* Moedas (Center) */}
                                <div className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-[1.2rem] bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.2)] min-w-[140px] cursor-default group/coins">
                                    <div className="relative z-10 group-hover/coins:scale-110 transition-transform duration-300 -ml-1">
                                        <GlobalCoin size="md" />
                                    </div>
                                    <div className="relative z-10 flex flex-col items-start -space-y-1">
                                        <span className="text-2xl font-black text-white tracking-tight drop-shadow-sm tabular-nums">
                                            {profile.points.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FCD34D] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-90">
                                            Moedas
                                        </span>
                                    </div>
                                </div>

                                {/* Sorvetes (Right) */}
                                <motion.button
                                    onClick={() => openInventory('sorvetes')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    key={`sorvete-${sorvetesCount}`}
                                    className="relative flex items-center justify-center gap-2.5 px-4 py-2 rounded-[1rem] bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.2)] min-w-[90px] group/sorvete"
                                >
                                    <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-illa-pink to-[#c40068] shadow-[0_2px_4px_rgba(229,1,125,0.5)] border border-white/20 group-hover/sorvete:scale-110 transition-transform duration-300">
                                        <IceCream size={14} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-2xl font-black text-white relative z-10 drop-shadow-sm tabular-nums tracking-tight">
                                        {sorvetesCount}
                                    </span>
                                </motion.button>
                            </div>

                            {/* XP Progress Bar (Liquid Style) */}
                            <div className="mt-8 relative group/xp w-full max-w-md">
                                <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 px-1">
                                    <span className="flex items-baseline gap-1">
                                        <span className="text-sm font-black text-white tabular-nums drop-shadow-sm">{xpInto}</span>
                                        <span>/ {isMaxLevel ? '∞' : xpForNext} XP</span>
                                    </span>
                                    <span className="text-white/60 font-medium tracking-normal capitalize">
                                        {isMaxLevel ? 'Nível máximo!' : `Faltam ${xpToNext} XP`}
                                    </span>
                                </div>
                                <div className="h-5 md:h-6 bg-black/20 rounded-full overflow-hidden border border-white/10 shadow-[inner_0_2px_8px_rgba(0,0,0,0.3)] relative group/bar backdrop-blur-md">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-illa-pink via-purple-500 to-illa-yellow relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_2s_infinite] opacity-70 w-[200%]" />
                                        <div className="absolute right-0 top-0 bottom-0 w-3 bg-white blur-[4px] shadow-[0_0_20px_white]" />
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                                    </motion.div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Profile Completion CTA (Only if incomplete) */}
                    {shouldCompleteProfile && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="mt-10 relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-4 group/cta backdrop-blur-md shadow-xl"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                            <div className="absolute -left-20 w-32 h-full bg-amber-500/20 blur-3xl group-hover/cta:bg-amber-500/30 transition-colors duration-500 pointer-events-none" />

                            <div className="flex items-center gap-4 relative z-10 col-span-2">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse">
                                    <Star size={20} fill="currentColor" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-amber-50 text-base md:text-lg tracking-tight">Complete seu perfil</p>
                                    <p className="text-xs md:text-sm text-amber-200/80 font-medium mt-0.5">Ganhe <span className="text-amber-400 font-black drop-shadow-sm">+50 XP</span> para subir de nível rápido!</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/members/profile')}
                                className="flex items-center justify-center gap-2 text-sm font-black tracking-wide bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-6 py-3 rounded-xl hover:from-amber-300 hover:to-amber-400 hover:scale-105 transition-all shadow-lg shadow-amber-500/30 active:scale-95 w-full md:w-auto relative z-10"
                            >
                                Completar Agora
                                <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            <InventoryModal
                isOpen={showInventory}
                onClose={() => setShowInventory(false)}
                initialTab={inventoryTab}
            />
        </>
    )
}
