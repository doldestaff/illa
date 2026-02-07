'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import NextImage from 'next/image'
import { BrandDecor } from './BrandDecor'

// Quick configuration for frames
const FRAME_COUNT = 120
const FRAME_PATH_DESKTOP = '/hero/desktop/frames/frame_'
const FRAME_PATH_MOBILE = '/hero/mobile/frames/frame_'

export function HeroFramePlaceholder() {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const [hasFrames, setHasFrames] = useState(false)

    // Check if frames exist (simple check of first frame)
    useEffect(() => {
        const testImage = new Image()
        // Simple responsive check without state re-render
        const isMobile = window.innerWidth < 768
        const path = isMobile ? FRAME_PATH_MOBILE : FRAME_PATH_DESKTOP
        // Pad standard number format e.g., 0001
        const firstFrame = `${path}0001.jpg`

        testImage.onload = () => setHasFrames(true)
        testImage.onerror = () => setHasFrames(false)
        testImage.src = firstFrame
    }, [])

    // Setup Canvas & ScrollTrigger for Frames
    useEffect(() => {
        if (!hasFrames || !canvasRef.current || !containerRef.current) return

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return

        // Placeholder logic for when frames ARE added later
    }, [hasFrames])

    // GSAP Animation for Content & Fallback
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Initial Reveal
            gsap.from(textRef.current, {
                y: 50,
                opacity: 0,
                duration: 1.2,
                ease: 'power3.out',
                delay: 0.2
            })

            // Parallax Effect for Background (even if no frames)
            gsap.to(containerRef.current, {
                backgroundPosition: '50% 100%',
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            })
        }, containerRef)

        return () => ctx.revert()
    }, [])

    return (
        <section
            ref={containerRef}
            className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-white"
            style={{
                background: !hasFrames ? 'radial-gradient(circle at 50% 50%, #fff 0%, #FFF5F9 100%)' : 'none'
            }}
        >
            {/* Pattern Overlay (Subtle Doodles) */}
            {!hasFrames && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'url(/brand/pattern.png)',
                        backgroundSize: '150px' // adjusted size
                    }}
                >
                    {/* Fallback if pattern fails */}
                    <div className="w-full h-full" style={{
                        backgroundImage: 'radial-gradient(#E5017D 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        opacity: 0.5
                    }} />
                </div>
            )}

            {/* Frame Canvas (Only if frames exist) */}
            {hasFrames && (
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent pointer-events-none" />

            {/* Content */}
            <div ref={textRef} className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20 flex flex-col items-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-illa-yellow/20 text-dark font-bold text-xs uppercase tracking-wider mb-8 border border-illa-yellow/50 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-illa-pink animate-pulse" />
                    Novos Sabores Disponíveis
                </div>

                {/* Hero Logo */}
                <div className="relative w-48 h-48 md:w-64 md:h-64 mb-6 hover:scale-105 transition-transform duration-700 ease-out">
                    <NextImage
                        src="/brand/logo-circle.png"
                        alt="Illa Sorvetes"
                        fill
                        className="object-contain drop-shadow-xl"
                        priority
                    />
                </div>

                <h1 className="sr-only">Illa Sorvetes</h1>

                <p className="text-dark/80 text-lg md:text-2xl font-light mb-8 max-w-2xl mx-auto leading-relaxed text-balance">
                    Sorvetes artesanais. Experiência leve, divertida e <span className="font-semibold text-illa-pink">premium</span>.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <Link
                        href="#products"
                        className="group bg-illa-pink text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-pink-600 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
                    >
                        Ver Produtos
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="/pedido"
                        className="group bg-white text-dark border-2 border-transparent px-8 py-4 rounded-full font-bold text-lg hover:border-illa-pink hover:text-illa-pink transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <ShoppingBag size={20} />
                        Pedir Agora
                    </Link>
                </div>
            </div>

            {/* Decorative Elements */}
            <BrandDecor className="top-10 right-0 opacity-[0.1]" size={600} speed={0.2} />
            <BrandDecor className="bottom-0 left-0 opacity-[0.05]" size={400} speed={0.1} />

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
                <div className="w-6 h-10 border-2 border-dark/20 rounded-full flex justify-center p-1">
                    <div className="w-1 h-2 bg-illa-pink rounded-full animate-float" />
                </div>
            </div>
        </section>
    )
}
