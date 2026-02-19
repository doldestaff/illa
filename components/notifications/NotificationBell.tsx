'use client'

import { Bell, Settings, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { AnimatePresence, motion } from 'framer-motion'

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const popoverRef = useRef<HTMLDivElement>(null)

    const { isSupported, isSubscribed, loading, toggle } = usePushNotifications()
    const supabase = createSupabaseBrowser()

    const fetchCount = async () => {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .is('read_at', null)

        if (!error && count !== null) {
            setUnreadCount(count)
        }
    }

    useEffect(() => {
        fetchCount()
        let channel: ReturnType<typeof supabase.channel> | null = null

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            channel = supabase
                .channel(`notifications:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, () => fetchCount())
                .subscribe()
        }

        setupRealtime()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [])

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group mr-2 focus:outline-none"
            >
                <Bell size={20} className={`transition-colors ${isOpen ? 'text-illa-pink' : 'text-gray-400 group-hover:text-illa-pink'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-illa-pink text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 ring-1 ring-black/5 z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-sm">Notificações</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-900">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-2">
                            {/* Push Toggle */}
                            {isSupported && (
                                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                                        <span className="text-xs text-gray-500">
                                            {isSubscribed ? 'Ativado no dispositivo' : 'Receba no celular/PC'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={toggle}
                                        disabled={loading}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-illa-pink/20 ${isSubscribed ? 'bg-illa-pink' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`${isSubscribed ? 'translate-x-6' : 'translate-x-1'
                                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                        />
                                    </button>
                                </div>
                            )}

                            <div className="h-px bg-gray-100 my-1" />

                            <Link
                                href="/members/notifications"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-gray-50 transition-colors group/link"
                            >
                                <span className="text-sm font-medium text-gray-700">Ver todas</span>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <span className="bg-illa-pink text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {unreadCount} novos
                                        </span>
                                    )}
                                    <Settings size={16} className="text-gray-400 group-hover/link:text-gray-900" />
                                </div>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
