import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()

    // Check admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { user_id, title, body, kind, priority, data: extraData } = await request.json()

        if (!user_id || !title || !body) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const notif = await sendNotification({
            userId: user_id,
            title,
            body,
            kind: kind || 'system',
            priority: priority || 1,
            data: extraData || {},
            supabase
        })

        if (!notif) {
            throw new Error('Failed to create notification')
        }

        return NextResponse.json({ success: true, notification: notif })
    } catch (error: any) {
        console.error('Send error', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
