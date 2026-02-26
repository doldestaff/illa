'use client'

import { motion } from 'framer-motion'
import { Tag, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function StorePromoCard() {
    return (
        <Link href="/descontos" className="block group relative">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, rotate: 0.5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 via-fuchsia-900/20 to-black/40 border border-white/10 shadow-2xl group-hover:shadow-purple-500/20 transition-all duration-500 backdrop-blur-xl"
            >
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/30 rounded-full blur-[80px] group-hover:bg-purple-500/40 transition-colors duration-500" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500/30 rounded-full blur-[80px] group-hover:bg-pink-500/40 transition-colors duration-500" />

                {/* Content Container */}
                <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">

                    {/* Content Top to Bottom Alignment */}
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 w-full">

                        {/* Novidade Badge centered above Title */}
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        >
                            <Sparkles size={12} className="text-amber-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Novidade</span>
                        </motion.div>

                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 transition-all">
                            Loja de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Descontos</span>
                        </h3>

                        <p className="text-sm sm:text-base text-white/60 max-w-sm font-medium leading-relaxed group-hover:text-white/80 transition-colors px-2 sm:px-0">
                            Troque suas moedas por vouchers exclusivos e economize na sua próxima compra.
                        </p>

                        {/* Right: Visual & CTA (Centrado abaixo do texto no mobile, lateral no desktop) */}
                        <div className="flex items-center justify-center sm:hidden mt-2 pt-2 gap-4 shrink-0">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl rotate-3 opacity-20 blur-lg group-hover:rotate-12 transition-transform duration-500" />
                                <div className="relative w-full h-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl shadow-inner group-hover:-translate-y-2 transition-transform duration-500 group-hover:border-purple-500/50">
                                    <Tag size={32} className="text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform" />
                                    <div className="absolute -top-2 -right-2 bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg rotate-12 animate-bounce">
                                        %
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right: Visual & CTA */}
                    <div className="flex items-center gap-4 shrink-0">
                        {/* 3D Icon Container */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl rotate-3 opacity-20 blur-lg group-hover:rotate-12 transition-transform duration-500" />
                            <div className="relative w-full h-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl shadow-inner group-hover:-translate-y-2 transition-transform duration-500 group-hover:border-purple-500/50">
                                <Tag size={32} className="text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform" />

                                {/* Floating Badge */}
                                <div className="absolute -top-2 -right-2 bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg rotate-12 animate-bounce">
                                    %
                                </div>
                            </div>
                        </div>

                        {/* CTA Button (Visible on Desktop, hidden on mobile to reduce clutter or maybe keep?) */}
                        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-white text-purple-900 shadow-lg group-hover:scale-110 group-hover:bg-purple-50 transition-all duration-300">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                </div>

                {/* Bottom Shine */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-purple-500/50 transition-colors" />
            </motion.div>
        </Link>
    )
}
