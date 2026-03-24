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
import Link from 'next/link'
import dynamic from 'next/dynamic'
import DashboardHeader from './DashboardHeader'
import DailyMissions from './DailyMissions'
import DashboardActionGrid from './DashboardActionGrid'
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

const StorePromoCard = dynamic(() => import('./StorePromoCard'), {
    loading: () => <SectionSkeleton />,
})
const VipCard = dynamic(() => import('./VipCard'), {
    loading: () => <SectionSkeleton />,
})
const ActionModal = dynamic(() => import('./ActionModal'), {
    ssr: false, // Modals should not SSR anyway
})
const OnlineCelebrationManager = dynamic(() => import('./OnlineCelebrationManager'), {
    ssr: false, // Toast managers should not SSR
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
    const sorvetesCount = snapshot.sorvetes_free_count ?? 0
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
        let channel: any
        let interval: any

        // PERF: Delay websocket connection by 1.5s to free up main thread for initial render
        const initDelay = setTimeout(() => {
            const supabase = createSupabaseBrowser()
            channel = supabase
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
            interval = setInterval(fetchActiveDrop, 120000)

            // Initial fetch
            fetchActiveDrop()
        }, 1500)

        return () => {
            clearTimeout(initDelay)
            if (channel) createSupabaseBrowser().removeChannel(channel)
            if (interval) clearInterval(interval)
        }
    }, [fetchActiveDrop])

    // ── Auto-track "visit" mission on mount ──
    useEffect(() => {
        if (progressTracked.current) return
        progressTracked.current = true

        // PERF: Delay analytics/progress background pings by 2 seconds
        const delayProgressTracking = setTimeout(() => {
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
        }, 2000)

        return () => clearTimeout(delayProgressTracking)
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Reserved for future recipe feature
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
                        body: JSON.stringify({ kind: 'view_recipes' }),
                    })
                    const progressData = await progressRes.json()
                    if (progressData.updated) {
                        setSnapshot((prev) => ({
                            ...prev,
                            missions: prev.missions.map((m) =>
                                m.kind === 'view_recipes'
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

                // Track mission progress for "Caçador de Relíquias"
                fetch('/api/missions/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ kind: 'visit' }),
                }).then(async (res) => {
                    const progressData = await res.json()
                    if (progressData.updated) {
                        setSnapshot((prev) => ({
                            ...prev,
                            missions: prev.missions.map((m) =>
                                m.kind === 'visit'
                                    ? { ...m, progress: progressData.progress, completed: progressData.completed }
                                    : m
                            ),
                        }))
                    }
                }).catch(() => { /* non-critical */ })
            }
            return data
        },
        [updateProfileFromClaim]
    )

    // ── View Exclusive (Fan Exclusive mission) ──
    const handleViewExclusive = useCallback(async () => {
        try {
            await fetch('/api/missions/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind: 'view_exclusive' }),
            })
            setSnapshot((prev) => ({
                ...prev,
                missions: prev.missions.map((m) =>
                    m.kind === 'view_exclusive'
                        ? { ...m, progress: m.target, completed: true }
                        : m
                ),
            }))
        } catch {
            // Silent fail
        }
    }, [])

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
            <div
                className="relative z-10 w-full max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 pt-6 pb-20"
                style={{
                    paddingBottom: 'max(5rem, env(safe-area-inset-bottom, 0px))',
                    paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
                    paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
                }}
            >

                {/* Responsive Grid Layout */}
                <div className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8 lg:gap-10">

                    {/* LEFT COLUMN (Sticky Sidebar on Desktop/Large iPad) */}
                    <div className="md:col-span-5 xl:col-span-4 relative">
                        <div className="md:sticky md:top-8 transition-all duration-300">
                            {/* HUD Header (User Stats) */}
                            <DashboardHeader
                                profile={snapshot.profile}
                                avatarUrl={avatarUrl}
                                sorvetesCount={sorvetesCount}
                                profileMissionId={
                                    snapshot.missions.find(m => m.kind === 'profile')?.instance_id
                                }
                                isProfileClaimed={
                                    snapshot.missions.find(m => m.kind === 'profile')?.claimed ?? false
                                }
                                onClaimProfile={handleMissionClaim}
                            />

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
                    {/* PERF: Unified high-performance CSS animations for instant SSR load, no JS unmount hydration flashes. */}
                    <div className="md:col-span-7 xl:col-span-8 space-y-6">

                        {/* Quick Actions Grid */}
                            <DashboardActionGrid onAction={handleAction} />

                            {/* Daily Missions */}
                            <div id="missions" className="anim-fade-in-up anim-delay-1">
                                <DailyMissions
                                    missions={snapshot.missions}
                                    onClaim={handleMissionClaim}
                                    onInviteClick={() => setActiveModal('invite')}
                                />
                            </div>

                            {/* Store Promo Card */}
                            <div className="anim-fade-in-up anim-delay-2">
                                <StorePromoCard />
                            </div>

                            {/* VIP Card */}
                            <div className="anim-fade-in-up anim-delay-3">
                                <VipCard
                                    profile={snapshot.profile}
                                    avatarUrl={avatarUrl}
                                    referralCount={snapshot.referral_count}
                                    vipPayload={vipPayload}
                                    onLoadVip={handleVipLoad}
                                    onShareCopy={handleShareCopy}
                                    onViewExclusive={handleViewExclusive}
                                    missionsCompleted={(snapshot.missions ?? []).filter(m => m.completed || m.claimed).length}
                                    totalMissions={snapshot.missions?.length ?? 0}
                                    sorvetesCount={snapshot.sorvetes_free_count ?? 0}
                                    dropsClaimed={snapshot.drops_claimed_count ?? 0}
                                />
                            </div>

                            {/* Wide Modules */}
                            <div className="space-y-6">
                                <div className="anim-fade-in-up anim-delay-4 content-auto">
                                    <SecretMenu items={snapshot.secret_menu} />
                                </div>

                                <div id="recipes" className="anim-fade-in-up anim-delay-5 content-auto">
                                    <ReceitasCinematicButton />
                                </div>

                                <div className="anim-fade-in-up anim-delay-6 content-auto">
                                    <WeeklyLeaderboard
                                        leaderboard={snapshot.leaderboard}
                                        currentUserId={snapshot.profile.id}
                                        currentUserXP={snapshot.profile.xp}
                                    />
                                </div>

                                <div className="anim-fade-in-up anim-delay-7 content-auto">
                                    <BirthdayModule birthday={snapshot.birthday} />
                                </div>
                            </div>

                            <div className="md:hidden text-center py-8">
                                <Link
                                    href="/members/profile"
                                    className="text-sm text-white/40 hover:text-illa-pink transition-colors underline underline-offset-4"
                                >
                                    Editar perfil completo →
                                </Link>
                            </div>
                        </div>
                </div>
            </div>

            {/* Online Celebration Manager (real server-backed claim toast) */}
            <OnlineCelebrationManager onClaim={handleCelebrationClaim} />
        </div>
    )
}
