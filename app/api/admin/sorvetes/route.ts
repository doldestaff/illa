import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

const ADMIN_TOKEN = '6c5e3a7b8f2d1e4a9c0b5d8f3e6a1b4c'

export async function POST(request: Request) {
    const token = request.headers.get('x-admin-token')
    if (token !== ADMIN_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { user_id, action } = await request.json()

        if (!user_id || !['add', 'subtract'].includes(action)) {
            return NextResponse.json({ error: 'user_id and action (add|subtract) required' }, { status: 400 })
        }

        const supabase = await createSupabaseServer()

        const { data, error } = await supabase.rpc('admin_manage_sorvetes', {
            p_user_id: user_id,
            p_action: action,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
