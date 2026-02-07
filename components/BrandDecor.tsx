'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BrandDecorProps {
    className?: string
    opacity?: number
    speed?: number
    size?: number | string
}

export function BrandDecor({
    className,
    opacity = 0.1,
    speed = 0.2,
    size = 500
}: BrandDecorProps) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        gsap.to(el, {
            y: () => (document.documentElement.scrollHeight - window.innerHeight) * speed * -1,
            ease: 'none',
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0,
                invalidateOnRefresh: true // Handle resize
            }
        })

        return () => {
            // Cleanup if needed, though scrollTrigger handles most
        }
    }, [speed])

    return (
        <div
            ref={ref}
            className={cn("pointer-events-none absolute z-0 select-none mix-blend-multiply dark:mix-blend-overlay", className)}
            style={{ opacity }}
        >
            <div className="relative" style={{ width: size, height: size }}>
                <Image
                    src="/brand/circle.png"
                    alt=""
                    fill
                    className="object-contain blur-xl"
                    priority={false}
                />
            </div>
        </div>
    )
}
