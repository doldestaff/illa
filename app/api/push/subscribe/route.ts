import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const subscription = await request.json()

        // Basic validation
        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
        }

        // Upsert subscription
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                user_agent: request.headers.get('user-agent') || 'unknown',
                last_seen_at: new Date().toISOString()
            }, {
                onConflict: 'user_id, endpoint'
            })

        if (error) throw error

        // Also update prefs to enabled
        await supabase
            .from('notification_prefs')
            .upsert({
                user_id: user.id,
                push_enabled: true
            })

        return NextResponse.json({ success: true })
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
