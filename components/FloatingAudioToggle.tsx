'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Music, Square } from 'lucide-react'
import { useGlobalAudio } from '@/components/GlobalAudioProvider'

export default function FloatingAudioToggle() {
    const { isPlaying, hasStarted, stop } = useGlobalAudio()

    // Requirements:
    // "O icone que aparece só quando inicia o som no cabeçalho do dashboard coloque no da
    // home flutuante também e permita o user parar o som a qualquer momento em qualquer área
    // do site, entretanto, se o stop naõ for feito no dashboard aí o icone do som
    // desaparece com a musica."
    // 
    // This implies: Only show this floating button if hasStarted is true.
    // If they click STOP here, hasStarted becomes false, the music ends, and this button unmounts.

    if (!hasStarted) return null

    return (
        <AnimatePresence>
            <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                onClick={stop}
                className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all group"
                aria-label="Stop Dashboard Music"
            >
                <div className="relative flex items-center justify-center w-5 h-5">
                    {isPlaying ? (
                        <>
                            <Music size={16} className="absolute opacity-100 group-hover:opacity-0 transition-opacity animate-bounce" />
                            <Square size={16} fill="currentColor" className="absolute opacity-0 group-hover:opacity-100 transition-opacity text-red-400" />
                        </>
                    ) : (
                        <Square size={16} fill="currentColor" className="text-red-400" />
                    )}
                </div>
                <span className="text-xs font-bold tracking-wide">
                    {isPlaying ? 'PARAR MÚSICA' : 'MÚSICA PAUSADA'}
                </span>

                {/* Ambient glow */}
                {isPlaying && (
                    <div className="absolute inset-0 rounded-full bg-illa-yellow/20 blur-md -z-10 animate-pulse" />
                )}
            </motion.button>
        </AnimatePresence>
    )
}
