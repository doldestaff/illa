'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import type { CelebrationClaimResult } from '@/lib/gamification-types'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const OnlineCelebrationManager = dynamic(
    () => import('@/components/members/OnlineCelebrationManager'),
    { ssr: false }
)

/**
 * Global provider that mounts the coin claim toast for authenticated users,
 * regardless of which page they're on (home, dashboard, etc.).
 * Skips rendering on the dashboard since it handles claims with its own state.
 */
export function GlobalCelebrationProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const pathname = usePathname()

    // Skip on /members pages — the dashboard manages its own OnlineCelebrationManager
    const isDashboard = pathname?.startsWith('/members')

    useEffect(() => {
        const supabase = createSupabaseBrowser()

        supabase.auth.getUser().then(({ data }) => {
            setIsLoggedIn(!!data.user)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session?.user)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleClaim = useCallback((result: CelebrationClaimResult) => {
        if (result.success) {
            // Points updated server-side; no local state to sync on non-dashboard pages
        }
    }, [])

    return (
        <>
            {children}
            {isLoggedIn && !isDashboard && (
                <OnlineCelebrationManager
                    onClaim={handleClaim}
                    pollIntervalMs={30_000}
                    initialDelayMs={5_000}
                />
            )}
        </>
    )
}
