import { NextResponse } from 'next/server'
import { requireAdmin, isRateLimited } from '@/lib/admin-auth'

export async function GET() {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase } = auth

    try {
        const { data, error } = await supabase.rpc('admin_list_all_drops')
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data || [])
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase, user } = auth

    if (isRateLimited(`admin:drops:create:${user.id}`, 10, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    try {
        const { title, description, reward_type, reward_value, duration_minutes } = await request.json()

        if (!title || !reward_value || !duration_minutes) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('admin_create_drop', {
            p_title: title,
            p_description: description || '',
            p_reward_type: reward_type || 'points',
            p_reward_value: Number(reward_value),
            p_duration_minutes: Number(duration_minutes)
        })

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase, user } = auth

    if (isRateLimited(`admin:drops:delete:${user.id}`, 10, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Drop ID required' }, { status: 400 })

        const { data, error } = await supabase.rpc('admin_delete_drop', { p_drop_id: id })
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
