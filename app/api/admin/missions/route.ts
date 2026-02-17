import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

const ADMIN_TOKEN = '6c5e3a7b8f2d1e4a9c0b5d8f3e6a1b4c'

export async function GET(request: Request) {
    const token = request.headers.get('x-admin-token')
    if (token !== ADMIN_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
        return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    try {
        const supabase = await createSupabaseServer()

        // Fetch instances for this user for TODAY (or all active? prompt implies "quais missões cada usuário fez")
        // Let's filter by today's period key to match the daily dashboard view
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

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Format for frontend
        const formatted = data.map((mi: any) => ({
            instance_id: mi.id,
            title: mi.missions?.title,
            reward_xp: mi.missions?.reward_xp,
            reward_points: mi.missions?.reward_points,
            progress: mi.progress,
            target: mi.missions?.target,
            completed: !!mi.completed_at,
            claimed: !!mi.claimed_at
        }))

        return NextResponse.json(formatted)
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const token = request.headers.get('x-admin-token')
    if (token !== ADMIN_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { target_user_id, title, xp, points } = await request.json()

        if (!target_user_id || !title) {
            return NextResponse.json({ error: 'target_user_id and title are required' }, { status: 400 })
        }

        const supabase = await createSupabaseServer()

        const { data, error } = await supabase.rpc('admin_create_custom_mission', {
            p_target_user_id: target_user_id,
            p_title: title,
            p_xp: xp || 0,
            p_points: points || 0
        })

        if (error) {
            console.error('RPC Error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data)
    } catch (err: any) {
        console.error('Server Error:', err)
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
