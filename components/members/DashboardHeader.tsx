/* eslint-disable @next/next/no-img-element */
'use client'

import { motion } from 'framer-motion'
import { User, Star, IceCream, ChevronRight, Home, LogOut } from 'lucide-react'
import Link from 'next/link'
import type { MemberProfile } from '@/lib/gamification-types'
import { useRef, useState, useEffect } from 'react'
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
    const router = useRouter()
    const [showInventory, setShowInventory] = useState(false)
    const [inventoryTab, setInventoryTab] = useState<'sorvetes' | 'drops'>('sorvetes')
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(avatarUrl)
    const [imageError, setImageError] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [levelUpTrigger, setLevelUpTrigger] = useState(false)
    const prevLevelRef = useRef(profile.level)

    // Detect Level Up
    useEffect(() => {
        if (profile.level > prevLevelRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLevelUpTrigger(true)
            prevLevelRef.current = profile.level
            // Auto reset animation trigger
            const timeout = setTimeout(() => setLevelUpTrigger(false), 3000)
            return () => clearTimeout(timeout)
        }
    }, [profile.level])

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

    const handleLogout = async () => {
        try {
            const supabase = createSupabaseBrowser()
            await supabase.auth.signOut()
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Logout error:', error)
        }
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
        try {
            const supabase = createSupabaseBrowser()

            // Get the REAL authenticated user ID from the session (bulletproof)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.id) {
                console.error('Avatar upload: user not authenticated')
                setUploadingAvatar(false)
                return
            }

            const ext = file.name.split('.').pop() ?? 'png'
            const path = `${user.id}/avatar-${Date.now()}.${ext}`

            // Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, file, { upsert: true, contentType: file.type })

            if (uploadError) {
                console.error('Avatar upload error:', uploadError.message)
            } else {
                // Update Profile DB Record
                await supabase.from('profiles').update({ avatar_path: path }).eq('id', user.id)

                // Get new signed URL to update UI immediately
                const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 315360000)
                if (signed?.signedUrl) {
                    setLocalAvatarUrl(signed.signedUrl)
                    setImageError(false)
                    router.refresh()
                }
            }
        } catch (err) {
            console.error('Avatar upload failed:', err)
        }

        setUploadingAvatar(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <>
            <div
                className="md:sticky md:top-4 z-40 mb-6 md:mb-8"
            >
                <div className="relative rounded-[2.5rem] bg-gradient-to-b from-white-[0.08] via-black/40 to-black/80 md:from-white/[0.05] md:via-white/[0.01] md:to-black/80 backdrop-blur-[40px] border border-white/10 text-white p-6 md:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] ring-1 ring-white/20 group transition-all duration-500 hover:border-white/20">

                    {/* Background & Effects Wrapper (Contained) */}
                    <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                        {/* 0. Gloss Overlay (Softened, as gradient handles the base fade) */}
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none mix-blend-overlay" />

                        {/* 1. Dynamic 'Vitral' Ambient Background (Smoky Neon Orbs) */}
                        <div className="absolute inset-0 block">
                            {/* Prismatic Orbs - Active on ALL devices (warm brand palette) */}
                            <div
                                className="absolute -top-[10%] -right-[10%] w-[120vw] md:w-[25rem] h-[50vh] md:h-[25rem] transform-gpu will-change-transform rounded-[100%] opacity-40 mix-blend-screen animate-pulse duration-[4000ms] z-0 blur-2xl"
                                style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(229,1,125,0.4) 0%, rgba(244,63,94,0.3) 40%, transparent 70%)' }}
                            />
                            <div
                                className="absolute top-[20%] -left-[10%] w-[100vw] md:w-[20rem] h-[40vh] md:h-[20rem] transform-gpu will-change-transform rounded-[100%] opacity-40 mix-blend-screen animate-pulse duration-[5000ms] z-0 blur-2xl"
                                style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(245,158,11,0.4) 0%, rgba(234,88,12,0.3) 40%, transparent 70%)' }}
                            />
                            {/* Central Body Illuminator */}
                            <div
                                className="absolute top-[30%] left-[20%] w-[80vw] h-[60vh] transform-gpu will-change-transform rounded-[100%] opacity-20 mix-blend-screen animate-[pulse_6s_ease-in-out_infinite] z-0 blur-2xl"
                                style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)' }}
                            />
                        </div>
                    </div>

                    {/* Action Bar (Top) */}
                    <div className="absolute top-6 left-6 z-50">
                        <Link href="/" className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center backdrop-blur-md bg-black/10 border border-white/10 hover:scale-110 active:scale-95" title="Voltar para Home">
                            <Home size={18} />
                        </Link>
                    </div>
                    <div className="absolute top-6 right-6 z-50 flex items-center gap-2 md:gap-3">
                        <NotificationBell />
                        <button
                            onClick={handleLogout}
                            className="p-2 text-white/50 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 rounded-full transition-all flex items-center justify-center backdrop-blur-md bg-black/10 border border-white/10 hover:scale-110 active:scale-95"
                            title="Desconectar"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>

                    {/* 2. Glass Shine Effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                        <motion.div
                            variants={SHIMMER_Animation}
                            initial="initial"
                            animate="animate"
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                            style={{ backgroundSize: '200% 100%' }}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="relative z-10 mt-8">

                        <div className="flex flex-col md:grid md:grid-cols-[auto_1fr] md:gap-8 md:items-start">

                            {/* Avatar */}
                            <div
                                className="relative flex-shrink-0 group/avatar cursor-pointer mx-auto md:mx-0 transition-transform duration-500 hover:scale-[1.03]"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {/* Sleek Cinematic Spinning Neon Border */}
                                <div className="absolute -inset-[3px] md:-inset-[4px] rounded-full overflow-hidden bg-black z-0 shadow-[0_0_30px_rgba(229,1,125,0.3)] pointer-events-none">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute -inset-[100%] opacity-90"
                                        style={{
                                            background: 'conic-gradient(from 0deg, transparent 60%, rgba(229,1,125,0.9) 80%, rgba(245,158,11,1) 100%)'
                                        }}
                                    />
                                    <div className="absolute inset-[2px] bg-[url('/noise.png')] bg-cover bg-black rounded-full" />
                                </div>

                                {/* Subtle Ambient Backlight */}
                                <div className="absolute -inset-2 bg-gradient-to-br from-illa-pink to-amber-500 rounded-full opacity-20 blur-xl group-hover/avatar:opacity-40 group-hover/avatar:blur-2xl transition duration-700 z-0 pointer-events-none" />

                                <div className="relative z-10 w-36 h-36 md:w-36 md:h-36 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-full overflow-hidden border-2 border-black/80 bg-black/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
                                    {uploadingAvatar ? (
                                        <div className="w-full h-full bg-black/60 flex items-center justify-center">
                                            <Loader2 size={32} className="text-illa-pink animate-spin" />
                                        </div>
                                    ) : profile.avatar_path && localAvatarUrl && !imageError ? (
                                        <>
                                            <img
                                                key={localAvatarUrl}
                                                src={localAvatarUrl}
                                                alt={profile.full_name || 'User'}
                                                className="w-full h-full object-cover"
                                                onError={() => setImageError(true)}
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm pointer-events-none">
                                                <Camera size={28} className="text-white drop-shadow-md" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white/50 relative">
                                            <User size={56} />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm pointer-events-none">
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
                            <div className="flex-1 min-w-0 w-full flex flex-col items-center md:items-start text-center md:text-left mt-2 md:mt-0">

                                {/* ÔöÇÔöÇ Row 1: Name + LVL badge ÔöÇÔöÇ */}
                                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-2">
                                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/70 tracking-tight drop-shadow-[0_2px_15px_rgba(255,255,255,0.2)]">
                                        {profile.full_name || 'Membro ILLA'}
                                    </h1>
                                    <motion.div
                                        animate={levelUpTrigger ? {
                                            scale: [1, 1.3, 1],
                                            boxShadow: [
                                                "0 4px 16px rgba(245,158,11,0.4)",
                                                "0 0 60px rgba(251,191,36,1)",
                                                "0 4px 16px rgba(245,158,11,0.4)"
                                            ],
                                            rotate: [0, -5, 5, 0]
                                        } : {}}
                                        transition={{ duration: 1.2, type: "spring", bounce: 0.5 }}
                                        className="relative inline-flex shrink-0 w-fit items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-illa-yellow to-amber-500 shadow-[0_4px_16px_rgba(245,158,11,0.4)] border border-white/50 transform hover:scale-105 transition-transform cursor-default mt-1 md:mt-0 whitespace-nowrap mx-auto md:mx-0"
                                    >
                                        {levelUpTrigger && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: [0, 1, 0], scale: [1, 2.5] }}
                                                transition={{ duration: 1 }}
                                                className="absolute inset-0 bg-amber-400 rounded-full blur-xl pointer-events-none"
                                            />
                                        )}
                                        <Star size={14} fill="black" className="text-black shrink-0 relative z-10" />
                                        <span className="text-black text-sm font-black tracking-wider drop-shadow-sm whitespace-nowrap relative z-10">LVL {profile.level}</span>
                                    </motion.div>
                                </div>

                                {/* ÔöÇÔöÇ Row 2: Description ÔöÇÔöÇ */}
                                <p className="text-white/60 font-medium text-sm md:text-base mb-2 md:mb-6 max-w-sm">
                                    Explore seu painel ILLA e ganhe recompensas exclusivas.
                                </p>

                                {/* ÔöÇÔöÇ MOBILE-ONLY: Counters + XP Bar ÔöÇÔöÇ */}
                                <div className="md:hidden w-full flex flex-col items-center mt-2">
                                    <div className="flex w-full overflow-hidden items-center justify-center gap-1.5 sm:gap-2 mb-6 px-1">

                                        {/* Drops ÔåÆ Ba├║ Gamer */}
                                        <motion.button
                                            onClick={() => openInventory('drops')}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-[1rem] bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.2)] flex-1 min-w-0 group/drops"
                                        >
                                            <div className="relative z-10 flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#0284c7] shadow-[0_2px_4px_rgba(56,189,248,0.5)] border border-white/20 group-hover/drops:scale-110 transition-transform duration-300">
                                                <div className="absolute inset-0 m-auto w-2 h-2 bg-white rounded-full blur-[3px] animate-[pulse_2s_ease-in-out_infinite]" />
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white relative z-10 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                                                    <path d="M4 4h16a2 2 0 0 1 2 2v3H2V6a2 2 0 0 1 2-2z" />
                                                    <path d="M2 11v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8h-9v1a1 1 0 0 1-2 0v-1H2z" />
                                                </svg>
                                            </div>
                                            <span className="text-xl font-black text-white relative z-10 drop-shadow-sm tabular-nums tracking-tight truncate">{profile.drops || 0}</span>
                                        </motion.button>

                                        {/* Moedas (Larger in the middle) */}
                                        <div className="relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-[1.2rem] bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-[inner_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.2)] flex-[1.2] min-w-0 cursor-default group/coins">
                                            <div className="relative z-10 group-hover/coins:scale-110 transition-transform duration-300 shrink-0 -ml-1">
                                                <GlobalCoin size="sm" />
                                            </div>
                                            <div className="relative z-10 flex flex-col items-start -space-y-1 overflow-hidden">
                                                <span className="text-2xl font-black text-white tracking-tight drop-shadow-sm tabular-nums truncate">{profile.points.toLocaleString()}</span>
                                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-[#FCD34D] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-90 truncate">Moedas</span>
                                            </div>
                                        </div>

                                        {/* Sorvetes */}
                                        <motion.button
                                            key={`sorvete-mobile-${sorvetesCount}`}
                                            onClick={() => openInventory('sorvetes')}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-[1rem] bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.2)] flex-1 min-w-0 group/sorvete"
                                        >
                                            <div className="relative z-10 flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-illa-pink to-[#c40068] shadow-[0_2px_4px_rgba(229,1,125,0.5)] border border-white/20 group-hover/sorvete:scale-110 transition-transform duration-300">
                                                <IceCream size={12} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                            </div>
                                            <span className="text-xl font-black text-white relative z-10 drop-shadow-sm tabular-nums tracking-tight truncate">{sorvetesCount}</span>
                                        </motion.button>
                                    </div>

                                    {/* Mobile XP Bar */}
                                    <div className="w-full relative group/xp max-w-md mt-2">
                                        <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 px-1">
                                            <span className="flex items-baseline gap-1">
                                                <span className="text-sm font-black text-white drop-shadow-sm tabular-nums">{xpInto}</span>
                                                <span>/ {isMaxLevel ? '∞' : xpForNext} XP</span>
                                            </span>
                                            <span className="text-white/60 font-medium tracking-normal capitalize">
                                                {isMaxLevel ? 'Nível máximo!' : `Faltam ${xpToNext} XP`}
                                            </span>
                                        </div>
                                        <div className="h-6 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative backdrop-blur-xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.6)] p-[2px]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercent}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut", type: "spring", bounce: 0.15 }}
                                                className="h-full relative rounded-full shadow-[0_0_20px_rgba(229,1,125,0.4)] flex items-center min-w-[2%]"
                                            >
                                                <div className="absolute inset-0 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite] rounded-full" style={{ backgroundImage: 'linear-gradient(90deg, #E5017D, #F59E0B, #E5017D)' }} />
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/5 to-black/30 mix-blend-overlay rounded-full" />
                                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay rounded-full pointer-events-none" />
                                                {progressPercent > 2 && (
                                                    <div className="absolute inset-y-0 right-0 w-16 flex justify-end items-center pointer-events-none">
                                                        <div className="absolute inset-y-0 right-0 w-full bg-gradient-to-r from-transparent via-amber-500/20 to-amber-200/60 rounded-r-full" />
                                                        <div className="relative h-[calc(100%-2px)] w-2 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1),-3px_0_15px_rgba(245,158,11,1)] mr-[1px] blur-[0.3px]" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>

                        {/* ── DESKTOP-ONLY: Bottom stats bar ── */}
                        <div className="hidden md:block mt-8 pt-6 border-t border-white/[0.07]">

                            {/* 3 equal counter chips */}
                            <div className="flex items-stretch gap-1.5 mb-5">

                                {/* Drops */}
                                <motion.button
                                    onClick={() => openInventory('drops')}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="group/drops relative flex flex-1 items-center justify-center gap-2 px-2 py-3 rounded-2xl bg-white/[0.05] hover:bg-[#38bdf8]/[0.08] backdrop-blur-md border border-white/[0.08] hover:border-[#38bdf8]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_24px_rgba(56,189,248,0.15)] transition-all duration-300"
                                >
                                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#0284c7] shadow-[0_0_16px_rgba(56,189,248,0.5)] border border-white/20 group-hover/drops:scale-110 transition-transform duration-300 shrink-0">
                                        <div className="absolute w-4 h-4 bg-white rounded-full blur-[5px] opacity-50 animate-[pulse_2s_ease-in-out_infinite]" />
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] text-white relative z-10">
                                            <path d="M4 4h16a2 2 0 0 1 2 2v3H2V6a2 2 0 0 1 2-2z" />
                                            <path d="M2 11v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8h-9v1a1 1 0 0 1-2 0v-1H2z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col items-start leading-none min-w-0">
                                        <span className="text-xl font-black text-white tabular-nums tracking-tight truncate">{profile.drops || 0}</span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.12em] text-[#38bdf8]/70 mt-0.5">Drops</span>
                                    </div>
                                </motion.button>

                                {/* Vertical separator */}
                                <div className="w-px bg-gradient-to-b from-transparent via-white/10 to-transparent self-stretch mx-1" />

                                {/* Moedas */}
                                <div className="group/coins relative flex flex-1 items-center justify-center gap-2 px-2 py-3 rounded-2xl bg-white/[0.05] hover:bg-amber-500/[0.08] backdrop-blur-md border border-white/[0.08] hover:border-amber-500/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_24px_rgba(245,158,11,0.15)] transition-all duration-300 cursor-default">
                                    <div className="relative group-hover/coins:scale-110 transition-transform duration-300 shrink-0">
                                        <GlobalCoin size="md" />
                                    </div>
                                    <div className="flex flex-col items-start leading-none min-w-0">
                                        <span className="text-xl font-black text-white tracking-tight tabular-nums truncate">{profile.points.toLocaleString()}</span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.12em] text-[#FCD34D]/70 mt-0.5">Moedas</span>
                                    </div>
                                </div>

                                {/* Vertical separator */}
                                <div className="w-px bg-gradient-to-b from-transparent via-white/10 to-transparent self-stretch mx-1" />

                                {/* Sorvetes */}
                                <motion.button
                                    key={`sorvete-desktop-${sorvetesCount}`}
                                    onClick={() => openInventory('sorvetes')}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="group/sorvete relative flex flex-1 items-center justify-center gap-2 px-2 py-3 rounded-2xl bg-white/[0.05] hover:bg-illa-pink/[0.08] backdrop-blur-md border border-white/[0.08] hover:border-illa-pink/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_24px_rgba(229,1,125,0.15)] transition-all duration-300"
                                >
                                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-illa-pink to-[#c40068] shadow-[0_0_16px_rgba(229,1,125,0.5)] border border-white/20 group-hover/sorvete:scale-110 transition-transform duration-300 shrink-0">
                                        <IceCream size={16} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col items-start leading-none min-w-0">
                                        <span className="text-xl font-black text-white tabular-nums tracking-tight truncate">{sorvetesCount}</span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.12em] text-illa-pink/70 mt-0.5">Sorvetes</span>
                                    </div>
                                </motion.button>

                            </div>

                            {/* Desktop XP Bar — full-width */}
                            <div className="w-full relative group/xp">
                                <div className="flex justify-between items-baseline text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2 px-0.5">
                                    <span className="flex items-baseline gap-1.5">
                                        <span className="text-[13px] font-black text-white tabular-nums">{xpInto}</span>
                                        <span>/ {isMaxLevel ? '∞' : xpForNext} XP</span>
                                    </span>
                                    <span className="text-white/50 font-medium tracking-normal capitalize">
                                        {isMaxLevel ? '🏆 Nível máximo!' : `Faltam ${xpToNext} XP`}
                                    </span>
                                </div>
                                <div className="h-[1.65rem] w-full bg-black/50 rounded-full overflow-hidden border border-white/[0.06] relative backdrop-blur-xl shadow-[inset_0_3px_8px_rgba(0,0,0,0.7)] p-[2px]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut", type: "spring", bounce: 0.15 }}
                                        className="h-full relative rounded-full shadow-[0_0_24px_rgba(229,1,125,0.5)] min-w-[2%]"
                                    >
                                        <div
                                            className="absolute inset-0 rounded-full bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]"
                                            style={{ backgroundImage: 'linear-gradient(90deg, #E5017D, #F59E0B, #E5017D)' }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/5 to-black/30 mix-blend-overlay rounded-full" />
                                        {progressPercent > 2 && (
                                            <div className="absolute inset-y-0 right-0 w-16 flex justify-end items-center pointer-events-none">
                                                <div className="absolute inset-y-0 right-0 w-full bg-gradient-to-r from-transparent via-amber-500/20 to-amber-200/60 rounded-r-full" />
                                                <div className="relative h-[calc(100%-2px)] w-[3px] bg-white rounded-full shadow-[0_0_14px_rgba(255,255,255,1),-3px_0_18px_rgba(245,158,11,1)] mr-[1px] blur-[0.3px]" />
                                            </div>
                                        )}
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
            </div>

            <InventoryModal
                isOpen={showInventory}
                onClose={() => setShowInventory(false)}
                initialTab={inventoryTab}
            />
        </>
    )
}
