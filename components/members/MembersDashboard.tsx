'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type {
    MemberSnapshot,
    ClaimMissionResult,
    ClaimDropResult,
    VipPayload,
} from '@/lib/gamification-types'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Coins } from 'lucide-react'
import DashboardHeader from './DashboardHeader'
import DailyMissions from './DailyMissions'
import FlashDrop from './FlashDrop'
import VipCard from './VipCard'
import MembersScrollBackground from './MembersScrollBackground'

// ── Lazy-loaded below-fold components (perf: only ship JS when needed) ──
const SectionSkeleton = () => (
    <div className="rounded-2xl bg-white/5 border border-white/5 p-6 animate-pulse">
        <div className="h-4 w-1/3 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-2/3 bg-white/5 rounded" />
        </div>
    </div>
)

const SecretMenu = dynamic(() => import('./SecretMenu'), {
    loading: () => <SectionSkeleton />,
})
const RecipesLibrary = dynamic(() => import('./RecipesLibrary'), {
    loading: () => <SectionSkeleton />,
})
const WeeklyLeaderboard = dynamic(() => import('./WeeklyLeaderboard'), {
    loading: () => <SectionSkeleton />,
})
const BirthdayModule = dynamic(() => import('./BirthdayModule'), {
    loading: () => <SectionSkeleton />,
})
const IllaAmbientBackground = dynamic(() => import('./IllaAmbientBackground'), {
    ssr: false,
})

interface Props {
    snapshot: MemberSnapshot
    avatarUrl: string | null
}

export default function MembersDashboard({ snapshot: initial, avatarUrl }: Props) {
    const [snapshot, setSnapshot] = useState(initial)
    const [vipPayload, setVipPayload] = useState<VipPayload | null>(null)
    const progressTracked = useRef(false)
    const [rewardToast, setRewardToast] = useState<{ message: string; icon: React.ReactNode } | null>(null)

    // ── Auto-track "visit" mission on mount ──
    useEffect(() => {
        if (progressTracked.current) return
        progressTracked.current = true

        // Fire-and-forget: track visit + profile missions
        const trackProgress = async (kind: string) => {
            try {
                const res = await fetch('/api/missions/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ kind }),
                })
                const data = await res.json()
                if (data.updated && data.completed) {
                    // Update mission state optimistically
                    setSnapshot((prev) => ({
                        ...prev,
                        missions: prev.missions.map((m) =>
                            m.kind === kind
                                ? { ...m, progress: data.target, completed: true }
                                : m
                        ),
                    }))
                }
            } catch {
                // Silent fail — non-critical
            }
        }

        trackProgress('visit')

        // Check if profile is complete and track if so
        const missing = initial.profile.missing_fields || []
        if (missing.length === 0) {
            trackProgress('profile')
        }
    }, [initial.profile.missing_fields])

    // ── Update profile from any claim result ──
    const updateProfileFromClaim = useCallback(
        (result: { xp: number; points: number; level?: number }) => {
            setSnapshot((prev) => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    xp: result.xp,
                    points: result.points,
                    level: result.level ?? prev.profile.level,
                    next_level_xp:
                        result.level && result.level > prev.profile.level
                            ? (result.level + 1) * (result.level + 1) * 50
                            : prev.profile.next_level_xp,
                },
            }))
        },
        []
    )

    // ── Mission claim handler ──
    const handleMissionClaim = useCallback(
        async (instanceId: string) => {
            const res = await fetch('/api/missions/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mission_instance_id: instanceId }),
            })
            const data: ClaimMissionResult = await res.json()
            if (data.success) {
                setSnapshot((prev) => ({
                    ...prev,
                    missions: prev.missions.map((m) =>
                        m.instance_id === instanceId ? { ...m, claimed: true } : m
                    ),
                }))
                updateProfileFromClaim(data)
            }
            return data
        },
        [updateProfileFromClaim]
    )

    // ── Drop claim handler ──
    const handleDropClaim = useCallback(
        async (dropId: string) => {
            const res = await fetch('/api/drops/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ drop_id: dropId }),
            })
            const data: ClaimDropResult = await res.json()
            if (data.success) {
                setSnapshot((prev) => ({
                    ...prev,
                    active_drop: prev.active_drop
                        ? { ...prev.active_drop, already_claimed: true }
                        : null,
                    drops_claimed_count: (prev.drops_claimed_count ?? 0) + 1,
                }))
                updateProfileFromClaim(data)
            }
            return data
        },
        [updateProfileFromClaim]
    )

    // ── Recipe toggle handler (also tracks recipe mission progress) ──
    const handleRecipeToggle = useCallback(
        async (recipeId: string, field: 'saved' | 'favorited' | 'done', value: boolean) => {
            // Optimistic update
            setSnapshot((prev) => ({
                ...prev,
                recipes: prev.recipes.map((r) =>
                    r.id === recipeId ? { ...r, [field]: value } : r
                ),
            }))

            const res = await fetch('/api/recipes/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipe_id: recipeId, field, value }),
            })
            const data = await res.json()

            if (!data.success) {
                // Revert on failure
                setSnapshot((prev) => ({
                    ...prev,
                    recipes: prev.recipes.map((r) =>
                        r.id === recipeId ? { ...r, [field]: !value } : r
                    ),
                }))
            } else if (value) {
                // Track recipe mission progress when interacting
                try {
                    const progressRes = await fetch('/api/missions/progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ kind: 'recipes' }),
                    })
                    const progressData = await progressRes.json()
                    if (progressData.updated) {
                        setSnapshot((prev) => ({
                            ...prev,
                            missions: prev.missions.map((m) =>
                                m.kind === 'recipes'
                                    ? {
                                        ...m,
                                        progress: progressData.progress,
                                        completed: progressData.completed,
                                    }
                                    : m
                            ),
                        }))
                    }
                } catch {
                    // Silent fail
                }
            }
        },
        []
    )

    // ── VIP token loader ──
    const handleVipLoad = useCallback(async () => {
        const res = await fetch('/api/vip/token', { method: 'POST' })
        const data: VipPayload = await res.json()
        setVipPayload(data)
        return data
    }, [])


    // ── Share link copy handler (tracks share mission) ──
    const handleShareCopy = useCallback(async () => {
        try {
            await fetch('/api/missions/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind: 'share' }),
            })
            setSnapshot((prev) => ({
                ...prev,
                missions: prev.missions.map((m) =>
                    m.kind === 'share'
                        ? { ...m, progress: m.target, completed: true }
                        : m
                ),
            }))
        } catch {
            // Silent fail
        }
    }, [])

    // ── Random Coin Reward Timer (every 60s) ──
    // UX Psychology: Variable Ratio Reinforcement — random rewards
    // trigger dopamine more effectively than fixed rewards
    useEffect(() => {
        const interval = setInterval(() => {
            const coins = Math.ceil(Math.random() * 5) // 1-5 random coins
            // Optimistic update — instantly reflect in counter
            setSnapshot((prev) => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    points: prev.profile.points + coins,
                },
            }))
            setRewardToast({
                message: `Você ganhou ${coins} 🪙 Moeda${coins > 1 ? 's' : ''}!`,
                icon: <Coins size={18} className="text-[#FAFF00] drop-shadow-[0_0_6px_rgba(250,255,0,0.6)]" />,
            })
            setTimeout(() => setRewardToast(null), 4000)
        }, 60_000)

        return () => clearInterval(interval)
    }, [])

    // ── Scroll Background Effect ──
    const { scrollY } = useScroll()
    const backgroundColor = useTransform(
        scrollY,
        [0, 300, 600],
        ['#0B0B0D', '#1a0b1a', '#140F00'] // Dark -> Purple-ish -> Dark Gold
    )

    return (
        <div className="min-h-screen relative font-sans text-white overflow-x-hidden selection:bg-illa-pink selection:text-white pb-32">

            {/* 0. Background Layer (Desktop Color Stream) */}
            <motion.div
                className="fixed inset-0 z-[-2]"
                style={{ backgroundColor }}
            />

            {/* 0.5 Mobile Scroll Background (Frames) */}
            <MembersScrollBackground />

            {/* 1. Global Ambient Background (Hidden on mobile to prioritize frames) */}
            <div className="hidden md:block">
                <IllaAmbientBackground />
            </div>

            {/* 2. Main Content Container */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-6 pb-20">

                {/* Responsive Grid Layout */}
                <div className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-10">

                    {/* LEFT COLUMN (Sticky Sidebar on iPad+) */}
                    <div className="md:col-span-5 lg:col-span-4 relative">
                        <div className="md:sticky md:top-8 transition-all duration-300">
                            {/* HUD Header (User Stats) */}
                            <DashboardHeader profile={snapshot.profile} avatarUrl={avatarUrl} dropsCount={snapshot.drops_claimed_count ?? 0} />

                            {/* Desktop/Tablet Only: Quick Action Links could go here later */}
                            <div className="hidden md:block mt-6 text-center">
                                <Link
                                    href="/members/profile"
                                    className="text-xs text-white/30 hover:text-white transition-colors"
                                >
                                    Gerenciar conta
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Scrollable Content) */}
                    <motion.div
                        className="md:col-span-7 lg:col-span-8 space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.12, delayChildren: 0.15 },
                            },
                        }}
                    >

                        {/* Daily Missions (Priority) */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                            <DailyMissions missions={snapshot.missions} onClaim={handleMissionClaim} />
                        </motion.div>

                        {/* Secondary Content Grid */}
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        >
                            {/* Active Drop */}
                            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                                <FlashDrop drop={snapshot.active_drop} onClaim={handleDropClaim} />
                            </motion.div>

                            {/* VIP Card */}
                            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                                <VipCard
                                    referralCode={snapshot.profile.referral_code}
                                    referralCount={snapshot.referral_count}
                                    vipPayload={vipPayload}
                                    onLoadVip={handleVipLoad}
                                    onShareCopy={handleShareCopy}
                                />
                            </motion.div>
                        </motion.div>

                        {/* Wide Modules */}
                        <motion.div
                            className="space-y-6"
                            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        >
                            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                                <SecretMenu items={snapshot.secret_menu} />
                            </motion.div>

                            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                                <RecipesLibrary
                                    recipes={snapshot.recipes}
                                    userLevel={snapshot.profile.level}
                                    onToggle={handleRecipeToggle}
                                />
                            </motion.div>

                            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                                <WeeklyLeaderboard
                                    leaderboard={snapshot.leaderboard}
                                />
                            </motion.div>

                            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                                <BirthdayModule birthday={snapshot.birthday} />
                            </motion.div>
                        </motion.div>

                        <div className="md:hidden text-center py-8">
                            <Link
                                href="/members/profile"
                                className="text-sm text-white/40 hover:text-illa-pink transition-colors underline underline-offset-4"
                            >
                                Editar perfil completo →
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Reward Toast */}
            <AnimatePresence>
                {rewardToast && (
                    <motion.div
                        initial={{ y: -80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -80, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-[90vw]"
                    >
                        {rewardToast.icon}
                        <span className="text-sm font-medium text-white">{rewardToast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
