'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Hammer } from 'lucide-react'

interface DevelopmentModalProps {
    isOpen: boolean
    onClose: () => void
}

export function DevelopmentModal({ isOpen, onClose }: DevelopmentModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop-blur-md bg-black/40"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Background Decoration */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-illa-pink/10 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-illa-pink/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Hammer className="text-illa-pink" size={32} />
                            </div>

                            <h2 className="text-2xl font-bold text-dark mb-3">
                                Em desenvolvimento...
                            </h2>

                            <p className="text-dark/60 mb-8 leading-relaxed">
                                Estamos trabalhando para trazer novidades incríveis para você. Fique ligado!
                            </p>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-illa-pink text-white rounded-2xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 active:scale-95 transition-all text-sm tracking-widest uppercase"
                            >
                                Voltar
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
