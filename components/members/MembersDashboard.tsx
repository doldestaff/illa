'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type {
    MemberSnapshot,
    ClaimMissionResult,
    ClaimDropResult,
    VipPayload,
} from '@/lib/gamification-types'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import DashboardHeader from './DashboardHeader'
import DailyMissions from './DailyMissions'
import FlashDrop from './FlashDrop'
import SecretMenu from './SecretMenu'
import RecipesLibrary from './RecipesLibrary'
import VipCard from './VipCard'
import WeeklyLeaderboard from './WeeklyLeaderboard'
import BirthdayModule from './BirthdayModule'
import IllaAmbientBackground from './IllaAmbientBackground'
import MembersScrollBackground from './MembersScrollBackground'

interface Props {
    snapshot: MemberSnapshot
    avatarUrl: string | null
}

export default function MembersDashboard({ snapshot: initial, avatarUrl }: Props) {
    const [snapshot, setSnapshot] = useState(initial)
    const [vipPayload, setVipPayload] = useState<VipPayload | null>(null)
    const progressTracked = useRef(false)

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
                    <div className="md:col-span-7 lg:col-span-8 space-y-6">

                        {/* Daily Missions (Priority) */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                            <DailyMissions missions={snapshot.missions} onClaim={handleMissionClaim} />
                        </div>

                        {/* Secondary Content Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Active Drop */}
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                <FlashDrop drop={snapshot.active_drop} onClaim={handleDropClaim} />
                            </div>

                            {/* VIP Card */}
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                <VipCard
                                    referralCode={snapshot.profile.referral_code}
                                    referralCount={snapshot.referral_count}
                                    vipPayload={vipPayload}
                                    onLoadVip={handleVipLoad}
                                    onShareCopy={handleShareCopy}
                                />
                            </div>
                        </div>

                        {/* Wide Modules */}
                        <div className="space-y-6">
                            <SecretMenu items={snapshot.secret_menu} />

                            <RecipesLibrary
                                recipes={snapshot.recipes}
                                userLevel={snapshot.profile.level}
                                onToggle={handleRecipeToggle}
                            />

                            <WeeklyLeaderboard
                                leaderboard={snapshot.leaderboard}
                            />

                            <BirthdayModule birthday={snapshot.birthday} />
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
        </div>
    )
}
