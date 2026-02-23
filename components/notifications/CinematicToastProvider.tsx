'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createSupabaseBrowser } from '@/lib/supabaseClient'

// Types
export type NotificationKind = 'mission_claim' | 'drop' | 'discount' | 'sorvetes_free' | 'system'

export interface CinematicToast {
    id: string
    title: string
    body: string
    kind: NotificationKind
    priority: number // 1=normal, 2=important, 3=win
}

interface CinematicToastContextType {
    showToast: (toast: Omit<CinematicToast, 'id'>) => void
    playSfx: (type: 'popup' | 'success' | 'error') => void
}

const CinematicToastContext = createContext<CinematicToastContextType | undefined>(undefined)

export const useCinematicToasts = () => {
    const context = useContext(CinematicToastContext)
    if (!context) {
        throw new Error('useCinematicToasts must be used within a CinematicToastProvider')
    }
    return context
}

// ------------------------------------------------------------------
// SFX Helper (Minimal - placeholder for now)
// ------------------------------------------------------------------
const playSound = (type: 'popup' | 'success' | 'error') => {
    // In a real app, load Audio objects here.
    // For MVP/Cinematic feel, we just log or try to play if file exists.
    // const audio = new Audio(`/sfx/${type}.mp3`)
    // audio.volume = 0.5
    // audio.play().catch(() => {}) 
    // (Disabled to avoid 404s until user adds files)
}

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------
export const CinematicToastProvider = ({ children }: { children: ReactNode }) => {
    const [queue, setQueue] = useState<CinematicToast[]>([])
    const [activeToast, setActiveToast] = useState<CinematicToast | null>(null)
    const [isPaused, setIsPaused] = useState(false)

    // Rate limit configuration
    const PROCESSING_INTERVAL = 15000 // 15s between toasts to avoid spam (premium feel)
    // If priority 3 (WIN), show immediately? Let's stick to queue for consistency, or bump to front.

    const showToast = useCallback((toastData: Omit<CinematicToast, 'id'>) => {
        const newToast = { ...toastData, id: Math.random().toString(36).substring(7) }

        setQueue(prev => {
            // Priority sort: higher priority comes first
            const newQueue = [...prev, newToast].sort((a, b) => b.priority - a.priority)
            return newQueue
        })
    }, [])

    // Register Service Worker
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered:', registration)
                })
                .catch(error => {
                    console.error('SW registration failed:', error)
                })
        }
    }, [])

    const playSfx = useCallback((type: 'popup' | 'success' | 'error') => {
        playSound(type)
    }, [])

    // Queue Processor
    useEffect(() => {
        if (activeToast || isPaused || queue.length === 0) return

        const nextToast = queue[0]
        setTimeout(() => {
            setActiveToast(nextToast)
            setQueue(prev => prev.slice(1))
        }, 0)

        // Play sound
        const sfxType = nextToast.priority >= 2 ? 'success' : 'popup'
        playSound(sfxType)

        // Auto dismiss logic
        const duration = nextToast.priority >= 3 ? 6000 : 4000
        const timer = setTimeout(() => {
            setActiveToast(null)
            // Wait a bit before processing next to breathe
            setIsPaused(true)
            setTimeout(() => setIsPaused(false), 2000)
        }, duration)

        return () => clearTimeout(timer)
    }, [queue, activeToast, isPaused])

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
        <CinematicToastContext.Provider value={{ showToast, playSfx }}>
            {children}

            {/* TOAST CONTAINER */}
            <div className="fixed top-24 right-4 z-[9999] pointer-events-none flex flex-col items-end sm:top-6 sm:right-6">
                <AnimatePresence>
                    {activeToast && (
                        <ToastUI toast={activeToast} onClose={() => setActiveToast(null)} />
                    )}
                </AnimatePresence>
            </div>
        </CinematicToastContext.Provider>
    )
}

// ------------------------------------------------------------------
// UI Component
// ------------------------------------------------------------------
const ToastUI = ({ toast, onClose }: { toast: CinematicToast, onClose: () => void }) => {
    // Styling based on kind/priority
    const isWin = toast.priority >= 3

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`
                pointer-events-auto cursor-pointer relative overflow-hidden
                w-80 rounded-2xl p-4 shadow-2xl border
                backdrop-blur-xl bg-white/80 border-white/40
                dark:bg-black/60 dark:border-white/10
            `}
            onClick={onClose}
        >
            {/* Glow Effect */}
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${isWin ? 'from-yellow-400 to-pink-500' : 'from-blue-400 to-purple-500'}`} />

            {/* Sparkle (CSS only for now) */}
            {isWin && (
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-white blur-xl opacity-40 animate-pulse" />
            )}

            <div className="relative flex gap-3 items-start">
                {/* Icon */}
                <div className={`
                    shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner
                    ${isWin ? 'bg-gradient-to-br from-yellow-300 to-orange-400 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                    {getIcon(toast.kind)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold leading-tight mb-1 truncate ${isWin ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600' : 'text-gray-900 dark:text-white'}`}>
                        {toast.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug line-clamp-2">
                        {toast.body}
                    </p>
                </div>

                {/* Close X */}
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Progress Bar (optional, maybe too noisy for 'cinematic') */}
        </motion.div>
    )
}

function getIcon(kind: NotificationKind) {
    switch (kind) {
        case 'mission_claim': return '🎯'
        case 'drop': return '🎁'
        case 'discount': return '🏷️'
        case 'sorvetes_free': return '🍦'
        default: return '🔔'
    }
}
