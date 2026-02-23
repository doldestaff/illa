import { createSupabaseServer } from '@/lib/supabaseServerClient'
import { NextResponse } from 'next/server'

/**
 * Verifies that the current request comes from an authenticated admin user.
 * 
 * 1. Creates a Supabase server client (session-aware via cookies).
 * 2. Calls getUser() to verify the JWT — no trust in client headers.
 * 3. Checks the `admin_users` table for the authenticated user's ID.
 * 
 * Returns: { supabase, user } on success, or a NextResponse error.
 */
export async function requireAdmin() {
    const supabase = await createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return {
            error: NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }
    }

    // Verify user exists in admin_users table
    const { data: adminRow, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (adminError || !adminRow) {
        return {
            error: NextResponse.json(
                { error: 'Forbidden: admin access required' },
                { status: 403 }
            )
        }
    }

    return { supabase, user }
}

// ─── Simple in-memory rate limiter ───────────────────────────
const hitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Returns true if the caller should be BLOCKED (rate exceeded).
 * @param key   Unique identifier (e.g. userId + action)
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function isRateLimited(
    key: string,
    limit: number = 10,
    windowMs: number = 60_000,
): boolean {
    const now = Date.now()
    const entry = hitMap.get(key)

    if (!entry || now > entry.resetAt) {
        hitMap.set(key, { count: 1, resetAt: now + windowMs })
        return false
    }

    entry.count++
    if (entry.count > limit) {
        return true
    }
    return false
}
