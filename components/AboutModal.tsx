'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const slides = [
    {
        id: 1,
        title: "Nossa Origem",
        text: "Fundada em dezembro de 2002 por Douglas Diniz e Luciana Rocha, a empresa iniciou com um balcão para a venda de sorvetes na garagem de sua residência."
    },
    {
        id: 2,
        title: "Qualidade & Produção",
        text: "Atualmente nossa fábrica possui maquinário moderno com capacidade de produção de 900 litros de sorvete/hora e 2 mil picolés/hora. Junto a uma equipe de profissionais treinados buscamos sempre a máxima qualidade de nossos produtos, os quais são preparados sob rígidos padrões de higiene."
    },
    {
        id: 3,
        title: "Expansão & Alcance",
        text: "Contamos com 2 câmaras frias, 2 caminhões frigoríficos e 3 carros para entrega de nossos produtos em mais 70 municípios de Alagoas, mantendo assim, nosso padrão de qualidade, bem como carrinhos de picolé e freezers para eventos."
    },
    {
        id: 4,
        title: "Nossa Missão",
        text: "Em nossas 3 lojas da fábrica, estão disponíveis todos os nossos produtos e uma vasta linha de coberturas. Fabricar felicidade é a nossa missão. Afinal, mais importante que vender sorvetes é ter o prazer de proporcionar momentos felizes."
    }
]

interface AboutModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [direction, setDirection] = useState(0)

    // Reset slide on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setCurrentSlide(0), 0)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    const paginate = (newDirection: number) => {
        const nextSlide = currentSlide + newDirection
        if (nextSlide >= 0 && nextSlide < slides.length) {
            setDirection(newDirection)
            setCurrentSlide(nextSlide)
        }
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        })
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
                >
                    {/* Dark Backdrop */}
                    <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-md" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-95 md:top-8 md:right-8"
                    >
                        <X size={24} />
                    </button>

                    {/* Content Card */}
                    <div className="relative z-10 w-full max-w-2xl min-h-[400px] flex flex-col items-center justify-center">
                        <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-12 shadow-2xl overflow-hidden relative min-h-[300px] flex flex-col justify-between">

                            {/* Brand Tag */}
                            <div className="absolute top-6 left-6 md:top-8 md:left-8">
                                <span className="text-illa-yellow font-bold text-xs tracking-widest uppercase">Quem Somos Nós</span>
                            </div>

                            {/* Slides */}
                            <div className="relative w-full flex-1 flex items-center justify-center mt-8 mb-8">
                                <AnimatePresence initial={false} custom={direction} mode='wait'>
                                    <motion.div
                                        key={currentSlide}
                                        custom={direction}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            x: { type: "spring", stiffness: 300, damping: 30 },
                                            opacity: { duration: 0.2 }
                                        }}
                                        className="text-center md:text-left w-full"
                                    >
                                        <h2 className="text-3xl md:text-5xl font-script text-white mb-6 drop-shadow-md">
                                            {slides[currentSlide].title}
                                        </h2>
                                        <p className="text-white/90 text-lg md:text-xl leading-relaxed font-medium drop-shadow-sm">
                                            {slides[currentSlide].text}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-white/10">
                                {/* Dots */}
                                <div className="flex gap-2">
                                    {slides.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "w-2 h-2 rounded-full transition-all duration-300",
                                                idx === currentSlide ? "bg-illa-pink w-6" : "bg-white/30"
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Arrows */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => paginate(-1)}
                                        disabled={currentSlide === 0}
                                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all active:scale-95"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={() => paginate(1)}
                                        disabled={currentSlide === slides.length - 1}
                                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all active:scale-95"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
