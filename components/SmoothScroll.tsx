'use client'

import { ReactNode } from 'react'
import { ReactLenis } from 'lenis/react'

export function SmoothScroll({ children }: { children: ReactNode }) {
    return (
        <ReactLenis root options={{
            lerp: 0.1,
            duration: 1.5,
            smoothWheel: true,
            // Prevent Lenis from blocking native touch scroll if needed, 
            // but for scrub animations we usually want it engaged.
            // However, ensuring 'touchInertiaMultiplier' is reasonable helps.
            touchMultiplier: 2,
        }}>
            {children}
        </ReactLenis>
    )
}
