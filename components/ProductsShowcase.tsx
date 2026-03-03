'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Wrench, X, Sparkles } from 'lucide-react'

const realProducts = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Sabor Illa ${i + 1}`,
    image: `/brand/product/product-${i + 1}.png`,
    color: i % 2 === 0 ? 'bg-pink-50' : 'bg-yellow-50',
}))

const marqueeProducts = [...realProducts, ...realProducts]

function ShowcaseMarquee() {
    const [duration, setDuration] = useState(30)

    useEffect(() => {
        const updateDuration = () => {
            setDuration(window.innerWidth < 768 ? 15 : 30)
        }
        updateDuration()
        window.addEventListener('resize', updateDuration)
        return () => window.removeEventListener('resize', updateDuration)
    }, [])

    return (
        <motion.div
            className="flex gap-8 w-max"
            animate={{ x: "-50%" }}
            transition={{ repeat: Infinity, ease: "linear", duration }}
            whileHover={{ animationPlayState: 'paused' }}
            style={{ x: 0 }}
        >
            {marqueeProducts.map((product, index) => (
                <div
                    key={`${product.id}-${index}`}
                    className={`group relative flex-shrink-0 w-[280px] h-[400px] rounded-[2.5rem] ${product.color} p-8 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-illa-pink/20 cursor-pointer`}
                >
                    <div className="relative w-full h-[75%] mb-2 mt-2">
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            loading="lazy"
                            className="object-contain drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-500 scale-[1.2] group-hover:scale-[1.3]"
                            sizes="280px"
                        />
                    </div>
                    <h3 className="font-bold text-xl text-dark mb-1 text-center font-sans tracking-tight">
                        {product.name}
                    </h3>
                    <p className="text-dark/50 text-xs font-medium uppercase tracking-wider">
                        Premium
                    </p>
                    <div className="absolute bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <span className="bg-white text-dark px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                            Ver Detalhes
                        </span>
                    </div>
                </div>
            ))}
        </motion.div>
    )
}

function CatalogComingSoonModal({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 30 }}
                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-10 text-center shadow-2xl shadow-illa-pink/20 border border-pink-100 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative background glow */}
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-amber-100/60 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-pink-100/60 blur-3xl pointer-events-none" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all"
                >
                    <X size={18} />
                </button>

                {/* Animated icon */}
                <motion.div
                    animate={{ rotate: [0, -10, 10, -8, 8, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-pink-100 flex items-center justify-center relative"
                >
                    <Wrench size={40} className="text-illa-pink" strokeWidth={1.8} />
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 border-2 border-pink-200 rounded-full"
                    />
                </motion.div>

                {/* Animated title */}
                <motion.h3
                    className="text-2xl font-black text-dark font-script mb-3"
                >
                    Catálogo em construção
                    <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    >...</motion.span>
                </motion.h3>

                {/* Sparkle badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span className="text-[11px] font-black text-amber-700 uppercase tracking-widest">Em breve!</span>
                </div>

                <p className="text-sm font-medium text-gray-400 leading-relaxed max-w-[220px] mx-auto">
                    Estamos preparando algo incrível! Nosso catálogo completo chega logo.
                </p>

                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                    className="mt-8 w-full py-4 bg-gradient-to-br from-illa-pink to-orange-400 text-white font-black rounded-2xl shadow-lg shadow-pink-400/25 text-sm uppercase tracking-wider"
                >
                    Entendido!
                </motion.button>
            </motion.div>
        </motion.div>
    )
}

export function ProductsShowcase() {
    const [showPopup, setShowPopup] = useState(false)

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
                <ShowcaseMarquee />
            </div>

            <div className="text-center mt-16">
                <button
                    onClick={() => setShowPopup(true)}
                    className="inline-block border-b-2 border-illa-pink text-dark font-bold hover:text-illa-pink transition-colors pb-1 text-lg cursor-pointer"
                >
                    Ver catálogo completo
                </button>
            </div>

            <AnimatePresence>
                {showPopup && <CatalogComingSoonModal onClose={() => setShowPopup(false)} />}
            </AnimatePresence>
        </section>
    )
}
