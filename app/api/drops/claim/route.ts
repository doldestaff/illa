import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { drop_id } = await request.json()
        if (!drop_id) {
            return NextResponse.json({ error: 'drop_id required' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('claim_drop', {
            p_drop_id: drop_id,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Fire Notification
        await sendNotification({
            userId: user.id,
            title: 'Drop Resgatado! 🎁',
            body: 'Seu drop foi adicionado à carteira.',
            kind: 'drop',
            priority: 2,
            supabase
        })

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
