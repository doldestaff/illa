import { NextResponse } from 'next/server'
import { requireAdmin, isRateLimited } from '@/lib/admin-auth'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase, user } = auth

    if (isRateLimited(`admin:notify:${user.id}`, 30, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Send error', error)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
