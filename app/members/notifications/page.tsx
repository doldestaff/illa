'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Bell, Check, Loader2, Trash2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useCinematicToasts } from '@/components/notifications/CinematicToastProvider'

interface NotificationItem {
    id: string
    title: string
    body: string
    kind: string
    read_at: string | null
    created_at: string
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [loading, setLoading] = useState(true)

    // New Hook
    const { isSupported, isSubscribed, loading: pushLoading, toggle } = usePushNotifications()
    const { showToast } = useCinematicToasts()

    const supabase = createSupabaseBrowser()

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
