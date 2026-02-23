import { NextResponse } from 'next/server'
import { requireAdmin, isRateLimited } from '@/lib/admin-auth'

export async function POST(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase, user } = auth

    if (isRateLimited(`admin:sorvetes:${user.id}`, 20, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    try {
        const { user_id, action } = await request.json()

        if (!user_id || !['add', 'subtract'].includes(action)) {
            return NextResponse.json({ error: 'user_id and action (add|subtract) required' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('admin_manage_sorvetes', {
            p_user_id: user_id,
            p_action: action,
        })

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
