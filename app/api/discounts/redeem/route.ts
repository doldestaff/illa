import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { offer_id } = await request.json()

        if (!offer_id) {
            return NextResponse.json({ error: 'Missing offer_id' }, { status: 400 })
        }

        // Call secure transactional RPC
        const { data, error } = await supabase.rpc('redeem_discount_offer', {
            p_offer_id: offer_id
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
