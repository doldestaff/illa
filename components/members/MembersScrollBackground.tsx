'use client'

import { useState, useEffect } from 'react'
import { HeroEngine } from '@/components/hero/HeroEngine'

export default function MembersScrollBackground() {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    if (!isMobile) return null

    return (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] md:hidden">
            <HeroEngine
                scrollMode="document"
                // Manual frames configuration
                manualFrames={{
                    frameCount: 82,
                    pathPrefix: "/members-bg/IllaMembers-mobile_",
                    pathSuffix: ".webp",
                    padStart: 3
                }}
                priorityFrames={[0, 1, 2, 3, 4, 5]}
                posterUrl="/members-bg/IllaMembers-mobile_001.webp"
                className="w-full h-full opacity-60"
            />
        </div>
    )
}
