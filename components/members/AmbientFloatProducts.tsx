'use client'

import { useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'

const PRODUCTS = [
    { src: '/brand/product/product-6.png', alt: 'Picolé decorativo', x: -8, y: 8, speed: 0.04, rotate: -12, scale: 0.9 },
    { src: '/brand/product/product-7.png', alt: 'Sorvete decorativo', x: 75, y: 35, speed: 0.025, rotate: 8, scale: 0.85 },
    { src: '/brand/product/product-2.png', alt: 'Picolé decorativo', x: -5, y: 68, speed: 0.035, rotate: 15, scale: 0.8 },
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
            const offsetY = scrollY * p.speed * 60
            const rotDeg = p.rotate + scrollY * p.speed * 2
            const s = p.scale + Math.sin(scrollY * 0.002 + i) * 0.03
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
            className="fixed inset-0 z-[1] pointer-events-none overflow-hidden"
            aria-hidden="true"
        >
            {PRODUCTS.map((p, i) => (
                <div
                    key={i}
                    className="absolute will-change-transform transition-none"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        opacity: i === 0 ? 0.18 : i === 1 ? 0.14 : 0.16,
                        filter: 'blur(1.5px) drop-shadow(0 8px 32px rgba(236,72,153,0.15))',
                        transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
                    }}
                >
                    <Image
                        src={p.src}
                        alt={p.alt}
                        width={180}
                        height={180}
                        className="w-28 h-28 md:w-44 md:h-44 object-contain select-none"
                        draggable={false}
                        priority={false}
                    />
                </div>
            ))}
        </div>
    )
}
