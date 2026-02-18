import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

// Simple Admin Token (matches the one in other admin routes)
const ADMIN_TOKEN = '6c5e3a7b8f2d1e4a9c0b5d8f3e6a1b4c'

export async function POST(request: Request) {
    const token = request.headers.get('x-admin-token')
    if (token !== ADMIN_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { target_user_id, xp_amount, points_amount, drops_amount } = await request.json()

        if (!target_user_id) {
            return NextResponse.json({ error: 'target_user_id is required' }, { status: 400 })
        }

        const supabase = supabaseServer

        const { data, error } = await supabase.rpc('admin_grant_currency', {
            p_target_user_id: target_user_id,
            p_xp_amount: Number(xp_amount) || 0,
            p_points_amount: Number(points_amount) || 0,
            p_drops_amount: Number(drops_amount) || 0
        })

        if (error) {
            console.error('RPC Error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // --- ADDED: Send Push Notification ---
        // We trigger the notification API internally or insert into notifications table
        // For simplicity and consistency, let's insert into notifications table which triggers the trigger (if configured)
        // OR directly use the send-notification endpoint logic if we want immediate push

        // Let's create a notification record which should be picked up by realtime or a trigger
        // Ideally we call the internal helper to send push

        const xp = Number(xp_amount) || 0
        const points = Number(points_amount) || 0
        const drops = Number(drops_amount) || 0

        let message = 'Você recebeu recompensas!'
        if (xp > 0) message = `Você ganhou +${xp} XP!`
        if (points > 0) message = `Você ganhou +${points} Pontos!`
        if (drops > 0) message = `Você ganhou +${drops} Drops!`
        if (xp > 0 && points > 0) message = `Você ganhou +${xp} XP e +${points} Pontos!`

        await supabase.from('notifications').insert({
            user_id: target_user_id,
            title: 'Recompensa Recebida! 🎁',
            message: message,
            type: 'reward',
            read: false,
            data: { xp, points, drops }
        })

        // Also try to send immediate push if they have a subscription
        // We can do this by fetching their subscription and using web-push, 
        // OR simply rely on the 'notifications' insert trigger if we set one up (we did for mission claim)
        // Let's manually trigger the push endpoint for robustness:

        try {
            // Only if we have the helper, but since we are in API route, we can just insert into DB
            // and if we have a Database Webhook or Cron it would send.
            // BUT simpler: let's fetch the subscription and send it right here.

            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', target_user_id)

            if (subs && subs.length > 0) {
                const webPush = require('web-push')
                webPush.setVapidDetails(
                    'mailto:admin@illa.com',
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
                    process.env.VAPID_PRIVATE_KEY!
                )

                const payload = JSON.stringify({
                    title: 'Recompensa Recebida! 🎁',
                    body: message,
                    icon: '/icons/icon-192x192.png',
                    data: { url: '/members' }
                })

                await Promise.all(subs.map(async (sub: any) => {
                    try {
                        const subscription = {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
                        }
                        await webPush.sendNotification(subscription, payload)
                    } catch (e) {
                        console.error('Failed to send push to sub', sub.id, e)
                    }
                }))
            }
        } catch (pushErr) {
            console.error('Push error:', pushErr)
            // Don't fail the request if push fails
        }

        return NextResponse.json(data)

    } catch (err: any) {
        console.error('Server Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
