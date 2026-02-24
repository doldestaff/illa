import { createSupabaseServer } from '@/lib/supabaseServerClient'
import { NextResponse } from 'next/server'

// GET: Fetch user's pending surprise drops
export async function GET() {
    const supabase = await createSupabaseServer()

    try {
        const { data, error } = await supabase.rpc('get_pending_surprise_drops')
        if (error) return NextResponse.json({ drops: [] }, { status: 200 })
        return NextResponse.json({ drops: data || [] })
    } catch {
        return NextResponse.json({ drops: [] }, { status: 500 })
    }
}

// POST: Dismiss a surprise drop
export async function POST(request: Request) {
    const supabase = await createSupabaseServer()

    try {
        const { drop_id } = await request.json()
        if (!drop_id) return NextResponse.json({ error: 'Drop ID required' }, { status: 400 })

        const { data, error } = await supabase.rpc('dismiss_surprise_drop', { p_drop_id: drop_id })
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
