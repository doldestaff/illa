'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type {
    MemberSnapshot,
    ClaimMissionResult,
    ClaimDropResult,
    CelebrationClaimResult,
    SorvetesRedemption,
    VipPayload,
} from '@/lib/gamification-types'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import DashboardHeader from './DashboardHeader'
import DailyMissions from './DailyMissions'
import StorePromoCard from './StorePromoCard'
import FlashDrop from './FlashDrop'
import VipCard from './VipCard'
import OnlineCelebrationManager from './OnlineCelebrationManager'
import SorvetesFreeCta from './SorvetesFreeCta'
import MembersScrollBackground from './MembersScrollBackground'
import { createSupabaseBrowser } from '@/lib/supabaseClient'

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
const RewardTimeline = dynamic(() => import('./RewardTimeline'), {
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
    const [sorvetesCount, setSorvetesCount] = useState(initial.sorvetes_free_count ?? 0)
    const progressTracked = useRef(false)

    // ── Fetch real sorvetes count from dedicated API (always in sync with admin) ──
    useEffect(() => {
        const fetchSorvetesCount = async () => {
            try {
                const res = await fetch('/api/sorvetes-free/count')
                if (res.ok) {
                    const data = await res.json()
                    setSorvetesCount(data.sorvetes_count ?? 0)
                }
            } catch {
                // Silent fail — use snapshot fallback
            }
        }
        fetchSorvetesCount()
    }, [])

    // ── Supabase Realtime: Listen for new drops ──
    const fetchActiveDrop = useCallback(async () => {
        try {
            const res = await fetch('/api/drops/active')
            if (res.ok) {
                const data = await res.json()
                setSnapshot(prev => ({ ...prev, active_drop: data.drop }))
            }
        } catch {
            // fail silent
        }
    }, [])

    useEffect(() => {
        const supabase = createSupabaseBrowser()
        const channel = supabase
            .channel('active_drops_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'active_drops' },
                () => {
                    fetchActiveDrop()
                }
            )
            .subscribe()

        // Poll every 30s as backup
        const interval = setInterval(fetchActiveDrop, 30000)

        // Initial fetch
        fetchActiveDrop()

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [fetchActiveDrop])

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

    // ── Update profile from any claim result (server is single source of truth) ──
    const updateProfileFromClaim = useCallback(
        (result: {
            xp: number
            points: number
            level?: number
            xp_into_level?: number
            xp_for_next_level?: number
            xp_to_next_level?: number
        }) => {
            setSnapshot((prev) => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    xp: result.xp,
                    points: result.points,
                    level: result.level ?? prev.profile.level,
                    xp_into_level: result.xp_into_level ?? prev.profile.xp_into_level,
                    xp_for_next_level: result.xp_for_next_level ?? prev.profile.xp_for_next_level,
                    xp_to_next_level: result.xp_to_next_level ?? prev.profile.xp_to_next_level,
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

    // ── Celebration / Sorvetes handlers ──
    const handleCelebrationClaim = useCallback(
        (result: CelebrationClaimResult) => {
            if (result.success) {
                setSnapshot((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, points: result.points },
                }))
            }
        },
        []
    )

    const handleSorvetesRedeem = useCallback(
        (result: SorvetesRedemption) => {
            if (result.success) {
                setSnapshot((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, points: result.new_points },
                }))
            }
        },
        []
    )

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
                            <DashboardHeader profile={snapshot.profile} avatarUrl={avatarUrl} dropsCount={snapshot.drops_claimed_count ?? 0} sorvetesCount={sorvetesCount} />

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

                        {/* Store Promo Card (New Feature) */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                            <StorePromoCard />
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
                                    currentUserId={snapshot.profile.id}
                                    currentUserXP={snapshot.profile.xp}
                                />
                            </motion.div>

                            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                                <BirthdayModule birthday={snapshot.birthday} />
                            </motion.div>

                            {/* Sorvetes Free CTA */}
                            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                                <SorvetesFreeCta
                                    currentPoints={snapshot.profile.points}
                                    onRedeem={handleSorvetesRedeem}
                                />
                            </motion.div>

                            {/* Reward Timeline (Audit Ledger) */}
                            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                                <RewardTimeline />
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

            {/* Online Celebration Manager (real server-backed claim toast) */}
            <OnlineCelebrationManager onClaim={handleCelebrationClaim} />
        </div>
    )
}
