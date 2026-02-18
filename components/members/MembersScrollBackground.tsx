'use client'

import { ScrollFrameCanvasEngine } from '@/components/hero/ScrollFrameCanvasEngine'
import { useEffect, useState } from 'react'

// Configuration
const TOTAL_SOURCE_FRAMES = 82
const FRAME_STEP = 3 // Load every 3rd frame
const ENGINE_FRAME_COUNT = Math.ceil(TOTAL_SOURCE_FRAMES / FRAME_STEP)

const PATH_PREFIX = '/members-bg/IllaMembers-mobile_'
const PATH_SUFFIX = '.webp'

export default function MembersScrollBackground() {
    // We need to know the scrollable height to map progress correctly
    // The previous implementation used useScroll() which maps 0..1 over the page
    // My engine maps window.scrollY / (height - vh).
    // If I don't pass `scrollContainerHeight`, the engine assumes 400vh default.
    // But Members dashboard is variable height.
    // Actually, `useScroll()` (Framer Motion) maps scroll progress of the *target* (default window).
    // So 0 is top, 1 is bottom.
    // My Engine uses `progress = scrollY / (totalHeight - viewH)`.
    // So if I pass `scrollContainerHeight = document.documentElement.scrollHeight`, it works perfectly.

    // However, the document height changes as content loads.
    // The engine's default behavior is fixed height mapping (for hero).
    // I need to update the engine to support "Auto Document Height" mapping?
    // OR, I can pass a massive number if I just want it to scrub slowly?
    // The previous implementation scrubbed from 0 to 1 over the full page.

    // Let's use a dynamic height state.
    const [docHeight, setDocHeight] = useState(4000)

    useEffect(() => {
        const update = () => {
            setDocHeight(document.documentElement.scrollHeight)
        }
        update()
        // ResizeObserver implementation is better but this is a decent fallback
        window.addEventListener('resize', update)
        const interval = setInterval(update, 2000) // Poll for dynamic content load

        return () => {
            window.removeEventListener('resize', update)
            clearInterval(interval)
        }
    }, [])

    return (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] md:hidden">
            <ScrollFrameCanvasEngine
                frameCount={ENGINE_FRAME_COUNT}
                getFrameUrl={(i) => {
                    const sourceIndex = Math.min(TOTAL_SOURCE_FRAMES - 1, i * FRAME_STEP)
                    return `${PATH_PREFIX}${sourceIndex.toString().padStart(3, '0')}${PATH_SUFFIX}`
                }}
                posterUrl="/members-bg/IllaMembers-mobile_001.webp"
                scrollContainerHeight={docHeight}
                priorityFrames={[0, 1, 2]} // First few frames
                className="w-full h-full"
            />
            {/* Overlay for tint if needed, but the frames seem to have it */}
        </div>
    )
}
