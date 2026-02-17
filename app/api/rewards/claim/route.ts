import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { window_id } = await request.json()
        if (!window_id) {
            return NextResponse.json({ error: 'window_id required' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('claim_celebration_reward', {
            p_window_id: window_id,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
