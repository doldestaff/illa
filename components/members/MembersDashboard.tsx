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
import { motion } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import DashboardHeader from './DashboardHeader'
import DailyMissions from './DailyMissions'
import StorePromoCard from './StorePromoCard'
import VipCard from './VipCard'
import OnlineCelebrationManager from './OnlineCelebrationManager'
import DashboardActionGrid from './DashboardActionGrid'
import ActionModal from './ActionModal'
import ScrollBg from './MembersScrollBackground'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'


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
const ReceitasCinematicButton = dynamic(() => import('./ReceitasCinematicButton'), {
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

// Dynamic Modals (Heavy framer motion / interactions)
const FlashDrop = dynamic(() => import('./FlashDrop'), {
    loading: () => <div className="h-96 flex items-center justify-center"><SectionSkeleton /></div>,
})
const SorvetesFreeCta = dynamic(() => import('./SorvetesFreeCta'), {
    loading: () => <div className="h-96 flex items-center justify-center"><SectionSkeleton /></div>,
})
const InviteModalContent = dynamic(() => import('./InviteModalContent'), {
    loading: () => <div className="h-48 flex items-center justify-center"><SectionSkeleton /></div>,
})

interface Props {
    snapshot: MemberSnapshot
    avatarUrl: string | null
}

export default function MembersDashboard({ snapshot: initial, avatarUrl }: Props) {
    const [snapshot, setSnapshot] = useState(initial)
    const [vipPayload, setVipPayload] = useState<VipPayload | null>(null)
    const [sorvetesCount] = useState(initial.sorvetes_free_count ?? 0)
    const [activeModal, setActiveModal] = useState<'history' | 'scanner' | 'sorvetes' | 'invite' | null>(null)
    const progressTracked = useRef(false)
    const { isSupported, isSubscribed, subscribe } = usePushNotifications()




    // ── Fetch real sorvetes count ──
    // Removed duplicate fetch on mount, relying on Snapshot unless stale?
    // User requested "Remove duplicate client refetches on mount".
    // So we just use initial state.

    // ── Supabase Realtime: Listen for new drops ──
    const fetchActiveDrop = useCallback(async () => {
        // Optimization: Don't fetch if tab hidden
        if (document.hidden) return

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

        // Poll every 2 minutes (120s) as backup, gated by visibility
        const interval = setInterval(fetchActiveDrop, 120000)

        // Initial fetch
        setTimeout(() => fetchActiveDrop(), 0)

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

    // ── Reactively hide "Complete seu perfil" CTA after user saves profile ──
    // When the user navigates to /members/profile, saves, and comes back,
    // the page doesn't re-run the Server Component automatically.
    // This listener polls the lightweight /api/profile/status endpoint on focus
    // and updates missing_fields in the snapshot so the CTA disappears without
    // requiring a full page reload.
    useEffect(() => {
        const checkProfileCompletion = async () => {
            try {
                const res = await fetch('/api/profile/status')
                if (!res.ok) return
                const { missing_fields } = await res.json()
                setSnapshot(prev => {
                    const current = prev.profile.missing_fields ?? []
                    if (JSON.stringify(current) === JSON.stringify(missing_fields)) return prev
                    return {
                        ...prev,
                        profile: { ...prev.profile, missing_fields },
                    }
                })
            } catch {
                // Non-critical, fail silently
            }
        }

        // Re-check when user switches back from another browser tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setTimeout(checkProfileCompletion, 300)
            }
        }

        // Re-check on in-app SPA back navigation (router.back())
        const handlePopState = () => {
            setTimeout(checkProfileCompletion, 400)
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('popstate', handlePopState)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('popstate', handlePopState)
        }
    }, [])


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
        async (instanceId: string, customReward?: { xp: number; points: number }) => {
            const res = await fetch('/api/missions/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mission_instance_id: instanceId }),
            })
            const data: ClaimMissionResult = await res.json()
            if (data.success) {
                // ── FIRST MISSION PROMPT ──
                // Check if this is the first mission completion (count is 0 before this claim)
                const completedCount = snapshot.missions.filter(m => m.completed).length
                if (completedCount === 0 && isSupported && !isSubscribed) {
                    toast('Parabéns pela primeira missão! 🚀', {
                        description: 'Quer ativar notificações para saber quando ganhar prêmios?',
                        action: {
                            label: 'Ativar',
                            onClick: () => subscribe()
                        },
                        duration: 8000,
                        icon: <Bell className="text-illa-pink" />
                    })
                }

                setSnapshot((prev) => {
                    const newXp = customReward ? prev.profile.xp + customReward.xp : data.xp
                    const newPoints = customReward ? prev.profile.points + customReward.points : data.points

                    return {
                        ...prev,
                        missions: prev.missions.map((m) =>
                            m.instance_id === instanceId ? { ...m, claimed: true } : m
                        ),
                        profile: {
                            ...prev.profile,
                            xp: newXp,
                            points: newPoints,
                            level: data.level ?? prev.profile.level,
                            xp_into_level: data.xp_into_level ?? prev.profile.xp_into_level,
                            xp_for_next_level: data.xp_for_next_level ?? prev.profile.xp_for_next_level,
                            xp_to_next_level: data.xp_to_next_level ?? prev.profile.xp_to_next_level,
                        }
                    }
                })
            }
            return data
        },
        [snapshot.missions, isSupported, isSubscribed, subscribe]
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

    // ── Drop claim handler (Restored for scanner) ──
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

    // ── Sorvetes redeem handler (Restored for popup) ──
    const handleSorvetesRedeem = useCallback(
        (result: SorvetesRedemption) => {
            if (result.success) {
                setSnapshot((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, points: result.new_points },
                }))
                // Optional: Close modal on success?
                // setActiveModal(null) 
            }
        },
        []
    )



    // ── Action Grid Handler ──
    const handleAction = useCallback((actionId: string) => {
        if (actionId === 'history' || actionId === 'scanner' || actionId === 'sorvetes' || actionId === 'invite') {
            setActiveModal(actionId as 'history' | 'scanner' | 'sorvetes' | 'invite')
        }
    }, [])

    return (
        <div className="min-h-screen relative font-sans text-white overflow-x-hidden selection:bg-illa-pink selection:text-white pb-32">

            {/* 0. Background Layer — static (no scroll listener = 60fps) */}
            <div
                className="fixed inset-0 z-[-2]"
                style={{ backgroundColor: '#0B0B0D' }}
            />

            {/* 0.5 Mobile Scroll Background (Frames) - Restored */}
            <ScrollBg />

            {/* 1. Global Ambient Background (Hidden on mobile to prioritize frames) */}
            <div className="hidden md:block">
                <IllaAmbientBackground />
            </div>

            {/* 2. Main Content Container */}
            <div className="relative z-10 w-full max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 pt-6 pb-20">

                {/* Responsive Grid Layout */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-10">

                    {/* LEFT COLUMN (Sticky Sidebar on Desktop/Large iPad) */}
                    <div className="lg:col-span-5 xl:col-span-4 relative">
                        <div className="lg:sticky lg:top-8 transition-all duration-300">
                            {/* HUD Header (User Stats) */}
                            <DashboardHeader profile={snapshot.profile} avatarUrl={avatarUrl} sorvetesCount={sorvetesCount} />

                            {/* Desktop/Tablet Only: Quick Action Links could go here later */}
                            <div className="hidden md:block mt-6 text-center">
                                <Link
                                    href="/members/profile"
                                    className="text-xs text-white/30 hover:text-white transition-colors"
                                >
                                    Gerenciar conta
                                </Link>
                            </div>
                            {/* ─── ACTION MODALS ─── */}
                            <ActionModal
                                isOpen={!!activeModal}
                                onClose={() => setActiveModal(null)}
                                title={
                                    activeModal === 'history' ? 'Histórico de Recompensas' :
                                        activeModal === 'scanner' ? 'Scanner de Drops' :
                                            activeModal === 'sorvetes' ? 'Picolés e Sorvetes Free' :
                                                activeModal === 'invite' ? 'Indique e Ganhe' : ''
                                }
                                themeGradient={
                                    activeModal === 'history' ? 'from-blue-500 to-cyan-500' :
                                        activeModal === 'scanner' ? 'from-illa-pink to-rose-500' :
                                            activeModal === 'sorvetes' ? 'from-amber-400 to-orange-500' :
                                                activeModal === 'invite' ? 'from-white to-gray-200' :
                                                    'from-white to-gray-400'
                                }
                            >
                                {activeModal === 'history' && <RewardTimeline />}

                                {activeModal === 'scanner' && (
                                    <div className="h-[400px] md:h-[500px]">
                                        <FlashDrop drop={snapshot.active_drop} onClaim={handleDropClaim} />
                                    </div>
                                )}

                                {activeModal === 'sorvetes' && (
                                    <SorvetesFreeCta
                                        currentPoints={snapshot.profile.points}
                                        onRedeem={handleSorvetesRedeem}
                                    />
                                )}

                                {activeModal === 'invite' && (
                                    <InviteModalContent
                                        referralCode={snapshot.profile.referral_code}
                                        referralCount={snapshot.referral_count}
                                        onShareCopy={handleShareCopy}
                                    />
                                )}
                            </ActionModal>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Scrollable Content) */}
                    <motion.div
                        className="lg:col-span-7 xl:col-span-8 space-y-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.05 }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.08, delayChildren: 0.1 },
                            },
                        }}
                    >


                        {/* Quick Actions Grid (Premium) */}
                        <DashboardActionGrid onAction={handleAction} />

                        {/* Daily Missions (Priority) */}
                        <motion.div id="missions" variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                            <DailyMissions missions={snapshot.missions} onClaim={handleMissionClaim} />
                        </motion.div>

                        {/* Store Promo Card (New Feature) */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
                            <StorePromoCard />
                        </motion.div>

                        {/* Secondary Content Grid */}
                        <motion.div
                            className="flex flex-col gap-6"
                            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        >
                            {/* Active Drop (Removed per user request) */}


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
                                <ReceitasCinematicButton />
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
