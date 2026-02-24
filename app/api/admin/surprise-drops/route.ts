import { NextResponse } from 'next/server'
import { requireAdmin, isRateLimited } from '@/lib/admin-auth'

export async function GET() {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase } = auth

    try {
        const { data, error } = await supabase.rpc('admin_list_surprise_drops')
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

    if (isRateLimited(`admin:surprise:create:${user.id}`, 20, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    try {
        const { user_id, preset_id, title, description, category, emoji, reward_type, reward_value } = await request.json()

        if (!user_id || !preset_id || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('admin_activate_surprise_drop', {
            p_user_id: user_id,
            p_preset_id: Number(preset_id),
            p_title: title,
            p_description: description || '',
            p_category: category || 'coins',
            p_emoji: emoji || '🎁',
            p_reward_type: reward_type || 'custom',
            p_reward_value: Number(reward_value) || 0,
        })

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
