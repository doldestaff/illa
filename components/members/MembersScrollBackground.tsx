'use client'

import { useState, useEffect, useRef } from 'react'
import { HeroEngine } from '@/components/hero/HeroEngine'

export default function MembersScrollBackground() {
    const [isMobile, setIsMobile] = useState(false)
    const [shouldRender, setShouldRender] = useState(false)
    const sentinelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        setTimeout(() => check(), 0)
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Defer mounting the heavy HeroEngine until the body is in viewport
    // This prevents loading 82 frames while user is still on hero section
    useEffect(() => {
        if (!isMobile) return

        const sentinel = sentinelRef.current
        if (!sentinel) {
            setTimeout(() => setShouldRender(true), 0)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setShouldRender(true), 0)
                    observer.disconnect() // Only need to trigger once
                }
            },
            {
                rootMargin: '200px', // Start loading 200px before visible
                threshold: 0
            }
        )
        observer.observe(sentinel)

        return () => observer.disconnect()
    }, [isMobile])

    if (!isMobile) return null

    return (
        <>
            {/* Sentinel div at top of dashboard to trigger lazy render */}
            <div ref={sentinelRef} className="sr-only" aria-hidden="true" />

            {shouldRender && (
                <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] md:hidden">
                    <HeroEngine
                        scrollMode="document"
                        manualFrames={{
                            frameCount: 82,
                            pathPrefix: "/members-bg/IllaMembers-mobile_",
                            pathSuffix: ".webp",
                            padStart: 3
                        }}
                        // Minimal priority — only first frame to avoid blocking main thread
                        priorityFrames={[0]}
                        posterUrl="/members-bg/IllaMembers-mobile_001.webp"
                        className="w-full h-full absolute inset-0 max-w-none opacity-30 object-cover"
                    />
                </div>
            )}
        </>
    )
}
