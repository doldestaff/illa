'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, ArrowRight, Play } from 'lucide-react'
import Image from 'next/image'

export default function ReceitasCinematicButton() {
    return (
        <Link href="/receitas" className="block w-full group outline-none">
            <motion.div
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="relative overflow-hidden rounded-3xl p-[2px] w-full"
            >
                {/* Animated Neon Border - Balanced Opacity */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 rounded-3xl opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse" />

                {/* Inner Content */}
                <div className="relative h-full w-full bg-[#0B0B0D] rounded-[22px] overflow-hidden flex flex-col md:flex-row items-stretch border border-white/10 z-10">

                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/4 w-full h-full bg-orange-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-amber-500/30 transition-colors duration-700" />

                    {/* Image Area - Cinematic Banner */}
                    <div className="w-full md:w-2/5 min-h-[220px] md:min-h-[300px] relative overflow-hidden bg-zinc-900/50 order-1 md:order-2 flex-shrink-0 flex">
                        {/* Mobile Image */}
                        <Image
                            src="/receitas-ocultas/receitas-bg-mobile.webp"
                            alt="Receitas Ocultas ILLA"
                            fill
                            priority
                            className="object-cover transition-transform duration-[3s] group-hover:scale-110 md:hidden"
                            quality={100}
                        />
                        {/* Desktop Image */}
                        <Image
                            src="/receitas-ocultas/receitas-banner.webp"
                            alt="Receitas Ocultas ILLA"
                            fill
                            priority
                            className="object-cover transition-transform duration-[3s] group-hover:scale-110 hidden md:block"
                            quality={100}
                        />
                        {/* Overlay Gradient for seamless blend - Maintaining modal cinematic feel */}
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0B0B0D] via-[#0B0B0D]/20 to-transparent opacity-100 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-pink-500/10 opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    </div>

                    {/* Text Area */}
                    <div className="w-full md:w-3/5 p-8 flex flex-col justify-center relative z-20 order-2 md:order-1">
                        {/* Background Glow for Text Area - Cinematic Modal Aesthetic */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-pink-500/[0.03] -z-10 pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-amber-500/[0.02] blur-[100px] rounded-full -z-10 pointer-events-none group-hover:bg-amber-500/[0.05] transition-colors duration-700" />

                        <div className="flex flex-wrap md:flex-nowrap items-center gap-1.5 mb-3">
                            <span className="px-1.5 md:px-3 py-0.5 md:py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[8px] md:text-xs font-black tracking-widest uppercase flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.2)] whitespace-nowrap shrink-0">
                                <Sparkles className="w-2 md:w-3 h-2 md:h-3" />
                                APENAS PARA MEMBROS
                            </span>
                            <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[9px] md:text-xs font-bold tracking-widest uppercase whitespace-nowrap">
                                Grátis
                            </span>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight">
                            Receitas Ocultas <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">ILLA</span>
                        </h3>

                        <p className="text-sm md:text-base text-white/60 mb-6 max-w-md font-medium leading-relaxed">
                            Desbloqueie sobremesas cinematográficas, ganhe moedas a cada missão concluída e surpreenda-se.
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] transition-all duration-300 group-hover:scale-110">
                                <Play className="w-5 h-5 ml-1 fill-current" />
                            </div>
                            <span className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-amber-400 transition-colors flex items-center gap-2">
                                Iniciar Sessão <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </div>
                    </div>

                </div>
            </motion.div>
        </Link>
    )
}
