'use client'

import React, { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { useCinematicToasts } from '@/components/notifications/CinematicToastProvider'

// Push Helpers
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

export default function NotificationCenterPage() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [pushEnabled, setPushEnabled] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
    const { showToast } = useCinematicToasts()

    const supabase = createSupabaseBrowser()

    useEffect(() => {
        fetchNotifications()
        checkPushStatus()
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            const data = await res.json()
            if (data.notifications) setNotifications(data.notifications)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const checkPushStatus = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

        setIsSupported(true)


        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
            setPushEnabled(true)
            setPermissionState('granted')
        } else {
            setPermissionState(Notification.permission)
        }
    }

    const togglePush = async () => {
        if (pushEnabled) {
            // Unsubscribe
            try {
                const reg = await navigator.serviceWorker.ready
                const sub = await reg.pushManager.getSubscription()
                if (sub) {
                    await sub.unsubscribe()
                    await fetch('/api/push/unsubscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ endpoint: sub.endpoint })
                    })
                }
                setPushEnabled(false)
            } catch (e) {
                console.error(e)
                showToast({ kind: 'system', title: 'Erro', body: 'Falha ao desativar push', priority: 1 })
            }
        } else {
            // Subscribe
            try {
                // Request permission
                const result = await Notification.requestPermission()
                setPermissionState(result)
                if (result !== 'granted') return

                const reg = await navigator.serviceWorker.ready
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

                if (!vapidKey) {
                    console.error('Missing VAPID key')
                    return
                }

                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey)
                })

                // Send to server
                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sub)
                })

                setPushEnabled(true)
                showToast({ kind: 'system', title: 'Notificações Ativadas', body: 'Você receberá novidades em tempo real!', priority: 1 })
            } catch (e) {
                console.error(e)
                showToast({ kind: 'system', title: 'Erro', body: 'Năo foi possível ativar push', priority: 1 })
            }
        }
    }

    const markAllRead = async () => {
        await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ all: true })
        })
        // Refresh local
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl text-dark">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-pacifico text-pink-500 mb-1">Notificações</h1>
                    <p className="text-sm text-gray-500">Fique por dentro das novidades da ILLA.</p>
                </div>
                {/* Push Toggle */}
                {isSupported && (
                    <button
                        onClick={togglePush}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${pushEnabled ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        {pushEnabled ? '🔔 Push Ativo' : '🔕 Ativar Push'}
                    </button>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Carregando...</div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-gray-500">Nenhuma notificação por enquanto.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={markAllRead} className="text-xs text-pink-500 hover:underline">
                            Marcar tudo como lido
                        </button>
                    </div>

                    {notifications.map(n => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-2xl border transition-all ${!n.read_at ? 'bg-white border-pink-200 shadow-sm' : 'bg-gray-50 border-transparent opacity-70'}`}
                        >
                            <div className="flex gap-4">
                                <div className="text-2xl mt-1">
                                    {n.kind === 'mission_claim' ? '🎯' : n.kind === 'drop' ? '🎁' : n.kind === 'discount' ? '🏷️' : '🔔'}
                                </div>
                                <div>
                                    <h4 className={`font-bold ${!n.read_at ? 'text-gray-900' : 'text-gray-500'}`}>{n.title}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{n.body}</p>
                                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
