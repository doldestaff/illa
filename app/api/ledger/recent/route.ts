import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function GET() {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { data, error } = await supabase
            .from('reward_ledger')
            .select('id, created_at, kind, delta_xp, delta_points, source_id, meta')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data ?? [])
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
