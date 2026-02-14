'use client'

import { useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'

const PRODUCTS = [
    // Top Left - Huge popsicle framing the start
    { src: '/brand/product/product-6.png', alt: 'Picolé decorativo', x: -15, y: 5, speed: 0.02, rotate: -15, scale: 1.2 },
    // Middle Right - Scoop framing the mid-section
    { src: '/brand/product/product-7.png', alt: 'Sorvete decorativo', x: 85, y: 40, speed: 0.015, rotate: 12, scale: 1.1 },
    // Bottom Left - Another popsicle framing the end
    { src: '/brand/product/product-2.png', alt: 'Picolé decorativo', x: -10, y: 75, speed: 0.025, rotate: 20, scale: 1.0 },
]

export default function AmbientFloatProducts() {
    const containerRef = useRef<HTMLDivElement>(null)
    const rafRef = useRef<number>(0)
    const reducedMotion = useRef(false)

    const tick = useCallback(() => {
        if (reducedMotion.current || !containerRef.current) return
        const scrollY = window.scrollY
        const children = containerRef.current.children

        for (let i = 0; i < children.length; i++) {
            const el = children[i] as HTMLElement
            const p = PRODUCTS[i]
            // Slower parallax for massive items to feel heavy/premium
            const offsetY = scrollY * p.speed * 40
            const rotDeg = p.rotate + scrollY * p.speed * 1
            const s = p.scale + Math.sin(scrollY * 0.001 + i) * 0.02
            el.style.transform = `translate3d(0, ${-offsetY}px, 0) rotate(${rotDeg}deg) scale(${s})`
        }

        rafRef.current = requestAnimationFrame(tick)
    }, [])

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        reducedMotion.current = mq.matches

        const onChange = (e: MediaQueryListEvent) => {
            reducedMotion.current = e.matches
            if (e.matches) {
                cancelAnimationFrame(rafRef.current)
            } else {
                rafRef.current = requestAnimationFrame(tick)
            }
        }

        mq.addEventListener('change', onChange)

        if (!reducedMotion.current) {
            rafRef.current = requestAnimationFrame(tick)
        }

        return () => {
            mq.removeEventListener('change', onChange)
            cancelAnimationFrame(rafRef.current)
        }
    }, [tick])

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[0] pointer-events-none overflow-hidden"
            aria-hidden="true"
        >
            {PRODUCTS.map((p, i) => (
                <div
                    key={i}
                    className="absolute will-change-transform transition-none"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        opacity: 0.25, // Increased visibility
                        filter: 'blur(1px) drop-shadow(0 10px 40px rgba(229,1,125,0.2))',
                        transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
                    }}
                >
                    <Image
                        src={p.src}
                        alt={p.alt}
                        width={400}
                        height={400}
                        className="w-64 h-64 md:w-[32rem] md:h-[32rem] object-contain select-none"
                        draggable={false}
                        priority={i === 0}
                    />
                </div>
            ))}
        </div>
    )
}
