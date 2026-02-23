import { NextResponse } from 'next/server'
import { requireAdmin, isRateLimited } from '@/lib/admin-auth'

export async function GET(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase } = auth

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
        return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    try {
        const todayKey = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('mission_instances')
            .select(`
                id,
                progress,
                completed_at,
                claimed_at,
                missions (
                    title,
                    reward_xp,
                    reward_points,
                    target
                )
            `)
            .eq('user_id', userId)
            .eq('period_key', todayKey)

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        const formatted = (data || []).map((mi: Record<string, unknown>) => {
            const missions = mi.missions as Record<string, unknown> | null
            return {
                instance_id: mi.id,
                title: missions?.title,
                reward_xp: missions?.reward_xp,
                reward_points: missions?.reward_points,
                progress: mi.progress,
                target: missions?.target,
                completed: !!mi.completed_at,
                claimed: !!mi.claimed_at
            }
        })

        return NextResponse.json(formatted)
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase, user } = auth

    if (isRateLimited(`admin:missions:${user.id}`, 15, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    try {
        const { target_user_id, title, xp, points } = await request.json()

        if (!target_user_id || !title) {
            return NextResponse.json({ error: 'target_user_id and title are required' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('admin_create_custom_mission', {
            p_target_user_id: target_user_id,
            p_title: title,
            p_xp: xp || 0,
            p_points: points || 0
        })

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
