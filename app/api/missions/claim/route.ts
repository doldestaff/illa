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

    if (isRateLimited(`claim:mission:${user.id}`, 10, 60_000)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    try {
        const { mission_instance_id } = await request.json()
        if (!mission_instance_id) {
            return NextResponse.json({ error: 'mission_instance_id required' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('claim_mission_reward', {
            p_instance_id: mission_instance_id,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Fire Notification
        await sendNotification({
            userId: user.id,
            title: 'Missão Cumprida! 🎯',
            body: 'Você completou uma missão e ganhou recompensas.',
            kind: 'mission_claim',
            priority: 2,
            supabase
        })

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
