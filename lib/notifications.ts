import { SupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export type NotificationKind = 'mission_claim' | 'drop' | 'discount' | 'sorvetes_free' | 'system'

interface SendNotificationParams {
    userId: string
    title: string
    body: string
    kind: NotificationKind
    priority?: number
    data?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient
}

const initWebPush = () => {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@illasorvetes.com'

    if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(
            vapidSubject,
            vapidPublicKey,
            vapidPrivateKey
        )
        return true
    }
    return false
}

export async function sendNotification({
    userId,
    title,
    body,
    kind,
    priority = 1,
    data = {},
    supabase
}: SendNotificationParams) {
    try {
        // 1. Insert into DB
        const { data: notif, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                body,
                kind,
                priority,
                data
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating notification:', error)
            return null
        }

        // 2. Check prefs & Send Push
        // We do this fire-and-forget to not block the main response time too much, 
        // OR await it if critical. For an API route, maybe await ensures reliability.
        // Let's await but catch errors so we don't fail the request.

        try {
            if (!initWebPush()) return notif

            const { data: prefs } = await supabase
                .from('notification_prefs')
                .select('push_enabled')
                .eq('user_id', userId)
                .single()

            if (prefs?.push_enabled) {
                const { data: subs } = await supabase
                    .from('push_subscriptions')
                    .select('*')
                    .eq('user_id', userId)

                if (subs && subs.length > 0) {
                    const payload = JSON.stringify({
                        title,
                        body,
                        icon: '/icon-192x192.png',
                        data: {
                            url: '/members/notifications',
                            notification_id: notif.id,
                            ...(data as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                        }
                    })

                    await Promise.all(subs.map(async sub => {
                        try {
                            await webpush.sendNotification({
                                endpoint: sub.endpoint,
                                keys: {
                                    p256dh: sub.p256dh,
                                    auth: sub.auth
                                }
                            }, payload)
                        } catch (err: unknown) {
                            if ((err as any).statusCode === 410 || (err as any).statusCode === 404) { // eslint-disable-line @typescript-eslint/no-explicit-any
                                await supabase
                                    .from('push_subscriptions')
                                    .delete()
                                    .eq('id', sub.id)
                            }
                        }
                    }))
                }
            }
        } catch (pushError) {
            console.error('Push failed:', pushError)
        }

        return notif
    } catch (e) {
        console.error('Notification failed:', e)
        return null
    }
}
