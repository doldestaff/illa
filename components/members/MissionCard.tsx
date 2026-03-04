'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react'
import type { MissionInstance } from '@/lib/gamification-types'

interface MissionCardProps {
    mission: MissionInstance
    isClaimed: boolean
    canClaim: boolean
    claiming: boolean
    onClaim: (id: string) => void
    colorTheme?: 'pink' | 'yellow' | 'white'
}

/**
 * Maps mission `kind` (or title keywords) to the correct WebP card image.
 * Falls back to a default card if no match is found.
 */
const CARD_IMAGE_MAP: Record<string, string> = {
    // By mission kind slug
    'share_link': '/mission-cards/compartilhar-link.webp',
    'view_exclusive': '/mission-cards/fan-exclusive.webp',
    'view_recipes': '/mission-cards/alquimia-de-sabor.webp',
    'visit': '/mission-cards/cacador-de-reliquias.webp',
    'survey': '/mission-cards/critico-gastromico.webp',
    'profile': '/mission-cards/critico-gastromico.webp', // Fallback for profile
}

/** Fallback title-based matching for missions without slugified `kind` */
function resolveCardImage(mission: MissionInstance): string {
    // 1. Try exact kind match
    const byKind = CARD_IMAGE_MAP[mission.kind]
    if (byKind) return byKind

    // 2. Fuzzy match by title keywords
    const titleLower = (mission.title || '').toLowerCase()
    if (titleLower.includes('compartilhar') || titleLower.includes('link') || titleLower.includes('indicação'))
        return CARD_IMAGE_MAP['share_link']
    if (titleLower.includes('exclusiv') || titleLower.includes('cartão') || titleLower.includes('benefíc'))
        return CARD_IMAGE_MAP['view_exclusive']
    if (titleLower.includes('receita') || titleLower.includes('explorar') || titleLower.includes('alquimia'))
        return CARD_IMAGE_MAP['view_recipes']
    if (titleLower.includes('visita') || titleLower.includes('entrar') || titleLower.includes('caçador'))
        return CARD_IMAGE_MAP['visit']
    if (titleLower.includes('avalia') || titleLower.includes('crítico') || titleLower.includes('feedback'))
        return CARD_IMAGE_MAP['survey']

    // 3. Default fallback (sequence-based or first available)
    return CARD_IMAGE_MAP['view_recipes']
}

export default function MissionCard({ mission, isClaimed, canClaim, claiming, onClaim }: MissionCardProps) {
    const cardImage = resolveCardImage(mission)

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={!isClaimed ? "hover" : "idle"}
            // Keep the magical state active while user is holding their finger on the card
            whileTap={!isClaimed ? "hover" : "idle"}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`relative h-full w-full group ${isClaimed ? 'opacity-50 grayscale saturate-50' : ''}`}
        >
            {/* 1. Atmospheric Volumetric Light (Optimized for Mobile) */}
            <motion.div
                animate={{
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear" // Linear is cheaper for GPU
                }}
                className="absolute inset-[-5%] bg-gradient-to-tr from-illa-pink/20 via-orange-500/10 to-rose-600/20 rounded-[3rem] pointer-events-none -z-20 blur-[30px] will-change-transform"
                style={{ transform: 'translateZ(0)' }} // Force GPU layer
            />

            {/* 2. Smoky Neon Effect (Simplified for performance) */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-illa-pink/20 rounded-[2rem] pointer-events-none -z-10 blur-[15px]" />

            {/* 3. The "Matter" - Optimized Glassmorphism */}
            <motion.div
                variants={{
                    idle: { scale: 1, y: 0 },
                    hover: { scale: 1.05, y: -5 }
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative w-full h-full rounded-[1.8rem] overflow-hidden bg-black/40 shadow-[0_12px_30px_rgba(0,0,0,0.5)] will-change-transform"
                style={{ transform: 'translateZ(0)' }}
            >
                {/* Subtle Edge Glow instead of heavy border */}
                <div className="absolute inset-0 rounded-[1.8rem] border border-white/5 pointer-events-none z-20" />
                {/* 1. Card WebP Image Layer */}
                <img
                    src={cardImage}
                    alt={mission.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-[1.05]"
                    draggable={false}
                />

                {/* 2. Soft Ambient Darkness on Hover for Contrast (ONLY if there is a claim button!) */}
                <motion.div
                    variants={{ idle: { opacity: 0 }, hover: { opacity: canClaim ? 1 : 0 } }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none"
                />

                {/* 3. Interactive Content Layer */}
                <div className="relative z-10 h-full flex flex-col justify-between p-0">
                    <div className="flex justify-end p-4">
                        {isClaimed ? (
                            <div className="flex items-center gap-1.5 text-emerald-800 font-black text-[10px] bg-emerald-100/90 px-3 py-1.5 rounded-full border border-emerald-200 shadow-md backdrop-blur-sm uppercase tracking-wider">
                                <CheckCircle size={12} strokeWidth={3} />
                                <span>Completo</span>
                            </div>
                        ) : canClaim ? (
                            <motion.button
                                onClick={() => onClaim(mission.instance_id)}
                                disabled={claiming}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                className="relative overflow-hidden flex items-center justify-center gap-1.5 focus:outline-none bg-gradient-to-br from-illa-pink to-rose-600 text-white text-[11px] font-black tracking-widest uppercase px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(229,1,125,0.5)] border border-white/30 transition-transform disabled:opacity-70 disabled:cursor-not-allowed group/btn"
                            >
                                <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out mix-blend-overlay" />
                                {claiming ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles size={13} fill="currentColor" className="animate-pulse" />
                                        Coletar
                                    </>
                                )}
                            </motion.button>
                        ) : null}
                    </div>
                </div>

                {/* Magical Light Beams (Subtle) */}
                <motion.div
                    variants={{ idle: { opacity: 0 }, hover: { opacity: 1 } }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 pointer-events-none mix-blend-overlay"
                    style={{
                        background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)'
                    }}
                />
            </motion.div>
        </motion.div>
    )
}
