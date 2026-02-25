'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransitionLoader() {
    const pathname = usePathname()
    const [visible, setVisible] = useState(false)
    const [progress, setProgress] = useState(0)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const rafRef = useRef<number | null>(null)
    const prevPathRef = useRef(pathname)

    useEffect(() => {
        if (pathname === prevPathRef.current) return
        prevPathRef.current = pathname

        // Reset and start
        setTimeout(() => {
            setProgress(0)
            setVisible(true)
        }, 0)

        // Animate progress bar quickly to 85%, then wait for paint
        let start = 0
        const animate = (ts: number) => {
            if (!start) start = ts
            const elapsed = ts - start
            // Fast: 0→85% in 400ms with easeOutExpo
            const p = Math.min(1, elapsed / 400)
            const eased = 1 - Math.pow(1 - p, 4)
            const val = eased * 85

            setProgress(val)
            if (val < 85) {
                rafRef.current = requestAnimationFrame(animate)
            }
        }
        rafRef.current = requestAnimationFrame(animate)

        // After route settles (next paint) → complete bar and fade out
        timerRef.current = setTimeout(() => {
            setProgress(100)
            setTimeout(() => setVisible(false), 350)
        }, 450)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [pathname])

    if (!visible) return null

    return (
        /* Thin neon progress bar at top + centered logo backdrop */
        <div
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                // PERF: Never block interactions during the fade out phase
                pointerEvents: visible && progress < 100 ? 'auto' : 'none',
                // Fade out when progress reaches 100
                opacity: progress === 100 ? 0 : 1,
                transition: 'opacity 350ms ease-out',
            }}
        >
            {/* Progress bar */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '3px',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #E5017D 0%, #ff69b4 60%, #FFED00 100%)',
                    boxShadow: '0 0 12px #E5017D, 0 0 24px #E5017D88',
                    transition: 'width 120ms linear',
                    borderRadius: '0 99px 99px 0',
                }}
            />

            {/* Subtle dark scrim so content below doesn't flash weirdly */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(11,11,13,0.08)',
                }}
            />

            {/* ILLA logo pulse in center */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'illa-loader-fade-in 200ms ease-out forwards',
                }}
            >
                <div
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(11,11,13,0.85)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
                        animation: 'illa-loader-pulse 1s ease-in-out infinite',
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/brand/logo.png"
                        alt="ILLA"
                        width={40}
                        height={40}
                        style={{ objectFit: 'contain', width: '40px', height: '40px' }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes illa-loader-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.9; }
                    50%       { transform: scale(1.07); opacity: 1; }
                }
                @keyframes illa-loader-fade-in {
                    from { opacity: 0; transform: translate(-50%, calc(-50% + 8px)); }
                    to   { opacity: 1; transform: translate(-50%, -50%); }
                }
            `}</style>
        </div>
    )
}
