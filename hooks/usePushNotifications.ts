import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'

// Helper
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [loading, setLoading] = useState(true)

    const supabase = createSupabaseBrowser()

    const checkStatus = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setIsSupported(false)
            setLoading(false)
            return
        }

        setIsSupported(true)
        setPermission(Notification.permission)

        // Check if SW is ready and has subscription
        try {
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.getSubscription()
            setIsSubscribed(!!sub)
        } catch (err) {
            console.error('Error checking SW status:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        checkStatus()
    }, [checkStatus])

    const subscribe = async () => {
        if (!isSupported) return false
        setLoading(true)

        try {
            // 1. Request Permission
            const perm = await Notification.requestPermission()
            setPermission(perm)

            if (perm !== 'granted') {
                setLoading(false)
                return false
            }

            // 2. Get Subscription
            const reg = await navigator.serviceWorker.ready
            const existingSub = await reg.pushManager.getSubscription()

            if (existingSub) {
                // Already subbed on client, sync with server just in case
                await saveSubscription(existingSub)
                setIsSubscribed(true)
                setLoading(false)
                return true
            }

            // 3. Subscribe
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidKey) {
                console.error('Missing VAPID key')
                setLoading(false)
                return false
            }

            const newSub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            })

            // 4. Save to Server
            await saveSubscription(newSub)
            setIsSubscribed(true)
            return true

        } catch (err) {
            console.error('Subscription failed:', err)
            return false
        } finally {
            setLoading(false)
        }
    }

    const unsubscribe = async () => {
        if (!isSupported) return false
        setLoading(true)

        try {
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.getSubscription()

            if (sub) {
                // 1. Unsub from Push Service
                await sub.unsubscribe()
                // 2. Remove from DB
                await supabase.auth.getUser().then(async ({ data }) => {
                    if (data.user) {
                        await fetch('/api/push/unsubscribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ endpoint: sub.endpoint })
                        })
                    }
                })
            }

            setIsSubscribed(false)
            return true
        } catch (err) {
            console.error('Unsubscribe failed:', err)
            return false
        } finally {
            setLoading(false)
        }
    }

    const saveSubscription = async (sub: PushSubscription) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const p256dh = sub.getKey('p256dh')
        const auth = sub.getKey('auth')

        if (!p256dh || !auth) return

        const body = {
            endpoint: sub.endpoint,
            p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
            auth: btoa(String.fromCharCode(...new Uint8Array(auth)))
        }

        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
    }

    const toggle = async () => {
        if (isSubscribed) {
            return unsubscribe()
        } else {
            return subscribe()
        }
    }

    return {
        isSupported,
        permission,
        isSubscribed,
        loading,
        subscribe,
        unsubscribe,
        toggle,
        checkStatus
    }
}
