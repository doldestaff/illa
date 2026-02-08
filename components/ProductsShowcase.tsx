'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const products = [
    { id: 1, name: 'Clássicos', color: 'bg-blue-100', image: '/brand/placeholder-icecream.svg' },
    { id: 2, name: 'Frutas', color: 'bg-green-100', image: '/brand/placeholder-popsicle.svg' },
    { id: 3, name: 'Kids', color: 'bg-pink-100', image: '/brand/placeholder-kids.svg' },
    { id: 4, name: 'Premium', color: 'bg-purple-100', image: '/brand/placeholder-premium.svg' },
]

export function ProductsShowcase() {
    const container = useRef(null)
    const titleRef = useRef(null)
    const cardsRef = useRef([])

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Title Reveal
            gsap.from(titleRef.current, {
                scrollTrigger: {
                    trigger: titleRef.current,
                    start: 'top 80%',
                },
                y: 50,
                opacity: 0,
                duration: 1,
                ease: 'power3.out'
            })

            // Cards Stagger
            gsap.from('.product-card', {
                scrollTrigger: {
                    trigger: container.current,
                    start: 'top 70%',
                },
                y: 100,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'back.out(1.2)'
            })

        }, container)
        return () => ctx.revert()
    }, [])

    return (
        <section id="products" ref={container} className="py-24 bg-white relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="text-illa-pink font-bold uppercase tracking-widest text-sm mb-2 block">Sabores Inesquecíveis</span>
                    <h2 ref={titleRef} className="font-script text-4xl md:text-6xl text-dark">Nossos Produtos</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className={`product-card group relative aspect-[3/4] rounded-[2rem] overflow-hidden ${product.color} cursor-pointer transition-transform hover:-translate-y-2 duration-500`}
                        >
                            {/* Placeholder content since we don't have real images yet */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                <div className="relative w-32 h-32 mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-contain drop-shadow-md"
                                        loading="lazy"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                                <h3 className="font-bold text-2xl text-dark mb-2">{product.name}</h3>
                                <p className="text-dark/60 text-sm">Explosão de sabor em cada pedaço.</p>

                                <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                                    <span className="bg-white text-dark px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                                        Ver Mais <ChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Link href="/produtos" className="inline-block border-b-2 border-illa-pink text-dark font-bold hover:text-illa-pink transition-colors pb-1">
                        Ver catálogo completo
                    </Link>
                </div>
            </div>
        </section>
    )
}
