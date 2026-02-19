'use client'

import { HeroEngine } from '@/components/hero/HeroEngine'

export default function MembersScrollBackground() {
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
                posterUrl="/members-bg/IllaMembers-mobile_001.webp"
                className="w-full h-full opacity-30 mix-blend-overlay"
            />
            {/* The previous component had opacity/blend logic implicitly? No, it was just frames. */}
        </div>
    )
}
