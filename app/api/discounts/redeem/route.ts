import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'
import { sendNotification } from '@/lib/notifications'
import { isRateLimited } from '@/lib/admin-auth'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isRateLimited(`redeem:discount:${user.id}`, 5, 60_000)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
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

        // Fire Notification
        await sendNotification({
            userId: user.id,
            title: 'Desconto Resgatado! 🏷️',
            body: 'Aproveite seu desconto na loja.',
            kind: 'discount',
            priority: 2,
            supabase
        })

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
