'use client'

import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const realProducts = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Sabor Illa ${i + 1}`, // Placeholder names since we don't know exact flavors
    image: `/brand/product/product-${i + 1}.png`,
    color: i % 2 === 0 ? 'bg-pink-50' : 'bg-blue-50', // Alternating soft backgrounds
}))

// Duplicate for infinite loop
const marqueeProducts = [...realProducts, ...realProducts]

export function ProductsShowcase() {
    return (
        <section id="products" className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4 mb-16 text-center">
                <span className="text-illa-pink font-bold uppercase tracking-widest text-sm mb-2 block">
                    Sabores Inesquecíveis
                </span>
                <h2 className="font-script text-4xl md:text-6xl text-dark">
                    Nossos Produtos
                </h2>
            </div>

            {/* Marquee Container */}
            <div className="relative w-full">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                <motion.div
                    className="flex gap-8 w-max"
                    animate={{ x: "-50%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30, // Adjust speed here
                    }}
                    whileHover={{ animationPlayState: 'paused' }} // CSS handling for pause might be better, but let's try motion's hover
                    style={{ x: 0 }}
                >
                    {marqueeProducts.map((product, index) => (
                        <div
                            key={`${product.id}-${index}`}
                            className={`group relative flex-shrink-0 w-[280px] h-[400px] rounded-[2.5rem] ${product.color} p-8 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-illa-pink/20 cursor-pointer`}
                        >
                            <div className="relative w-full h-[60%] mb-6">
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-contain drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-500 group-hover:scale-110"
                                    sizes="280px"
                                />
                            </div>

                            <h3 className="font-bold text-xl text-dark mb-1 text-center font-sans tracking-tight">
                                {product.name}
                            </h3>
                            <p className="text-dark/50 text-xs font-medium uppercase tracking-wider">
                                Premium
                            </p>

                            {/* Hover Overlay/Button */}
                            <div className="absolute bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                <span className="bg-white text-dark px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                                    Ver Detalhes
                                </span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            <div className="text-center mt-16">
                <Link
                    href="/produtos"
                    className="inline-block border-b-2 border-illa-pink text-dark font-bold hover:text-illa-pink transition-colors pb-1 text-lg"
                >
                    Ver catálogo completo
                </Link>
            </div>
        </section>
    )
}
