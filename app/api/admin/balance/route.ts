import { NextResponse } from 'next/server'
import { requireAdmin, isRateLimited } from '@/lib/admin-auth'

export async function POST(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase, user } = auth

    if (isRateLimited(`admin:balance:${user.id}`, 20, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    try {
        const { target_user_id, xp_amount, points_amount, drops_amount } = await request.json()

        if (!target_user_id) {
            return NextResponse.json({ error: 'target_user_id is required' }, { status: 400 })
        }

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

        try {
            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', target_user_id)

            if (subs && subs.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const webPush = require('web-push')
                webPush.setVapidDetails(
                    process.env.VAPID_SUBJECT || 'mailto:admin@illasorvetes.com',
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
                    process.env.VAPID_PRIVATE_KEY!
                )

                const payload = JSON.stringify({
                    title: 'Recompensa Recebida! 🎁',
                    body: message,
                    icon: '/icons/icon-192x192.png',
                    data: { url: '/members' }
                })

                await Promise.all(subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
                    try {
                        await webPush.sendNotification(
                            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                            payload
                        )
                    } catch (e) {
                        console.error('Failed to send push to sub', sub.id, e)
                    }
                }))
            }
        } catch (pushErr) {
            console.error('Push error:', pushErr)
        }

        return NextResponse.json(data)

    } catch (err: unknown) {
        console.error('Server Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
