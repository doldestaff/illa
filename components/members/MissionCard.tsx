/* eslint-disable @next/next/no-img-element */
'use client'

import { useRef, useCallback } from 'react'
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react'
import type { MissionInstance } from '@/lib/gamification-types'
import GlobalCoin from '@/components/ui/GlobalCoin'
import { useSoundSystem } from '@/components/providers/SoundProvider'

/**
 * TapOverlay — Zero-latency tap detection.
 *
 * Framer's onTap has gesture-discrimination delay (waits to decide if it's a pan vs tap).
 * This component uses native pointer events to fire the callback instantly
 * on pointerup if movement was < 8px, ensuring single-tap reliability on mobile carousels.
 */
function TapOverlay({ onTap }: { onTap: () => void }) {
    const downPos = useRef<{ x: number; y: number } | null>(null)

    const handleDown = useCallback((e: React.PointerEvent) => {
        downPos.current = { x: e.clientX, y: e.clientY }
    }, [])

    const handleUp = useCallback((e: React.PointerEvent) => {
        if (!downPos.current) return
        const dx = Math.abs(e.clientX - downPos.current.x)
        const dy = Math.abs(e.clientY - downPos.current.y)
        downPos.current = null
        // Only treat as tap if movement was minimal (not a swipe/scroll)
        if (dx < 8 && dy < 8) {
            onTap()
        }
    }, [onTap])

    return (
        <div
            className="absolute inset-0 z-[8] rounded-[1.8rem] cursor-pointer"
            onPointerDown={handleDown}
            onPointerUp={handleUp}
        />
    )
}

interface MissionCardProps {
    mission: MissionInstance
    isClaimed: boolean
    canClaim: boolean
    claiming: boolean
    onClaim: (id: string, customReward?: { xp: number; points: number }) => void
    onCardClick?: (mission: MissionInstance) => void
    colorTheme?: 'pink' | 'yellow' | 'white'
    rewards?: { xp: number; coins: number }
}

/**
 * Maps mission `kind` (or title keywords) to the correct WebP card image.
 * Falls back to a default card if no match is found.
 */
const CARD_IMAGE_MAP: Record<string, string> = {
    // By mission kind slug
    'share_link': '/mission-cards/compartilhar-link-1.webp',
    'view_exclusive': '/mission-cards/fan-exclusive-1.webp',
    'view_recipes': '/mission-cards/alquimia-de-sabor-1.webp',
    'visit': '/mission-cards/cacador-de-reliquias-1.webp',
    'survey': '/mission-cards/critico-gastromico-1.webp',
    'profile': '/mission-cards/compartilhar-link-1.webp', // Fallback for profile
}

/** Fallback title-based matching for missions without slugified `kind` */
export function resolveCardImage(mission: MissionInstance): string {
    // 1. Try exact kind match
    const byKind = CARD_IMAGE_MAP[mission.kind]
    if (byKind) return byKind

    // 2. Fuzzy match by title keywords
    const titleLower = (mission.title || '').toLowerCase()
    if (titleLower.includes('compartilhar') || titleLower.includes('link') || titleLower.includes('indicação') || titleLower.includes('indique'))
        return CARD_IMAGE_MAP['share_link']
    if (titleLower.includes('exclusiv') || titleLower.includes('cartão') || titleLower.includes('benefíc'))
        return CARD_IMAGE_MAP['view_exclusive']
    if (titleLower.includes('receita') || titleLower.includes('explorar') || titleLower.includes('alquimia'))
        return CARD_IMAGE_MAP['view_recipes']
    if (titleLower.includes('visita') || titleLower.includes('entrar') || titleLower.includes('caçador'))
        return CARD_IMAGE_MAP['visit']
    if (titleLower.includes('avalia') || titleLower.includes('crítico') || titleLower.includes('feedback') || titleLower.includes('self') || titleLower.includes('foto') || titleLower.includes('perfil'))
        return CARD_IMAGE_MAP['survey']

    // 3. Default fallback to something that is not recipes (e.g. exclusive or survey)
    return CARD_IMAGE_MAP['view_exclusive']
}

export default function MissionCard({ mission, isClaimed, canClaim, claiming, onClaim, onCardClick, rewards }: MissionCardProps) {
    const { playGlobalClick } = useSoundSystem()
    const cardImage = resolveCardImage(mission)
    const progressPercent = Math.min(100, Math.max(0, (mission.progress / mission.target) * 100))
    const isCompleted = progressPercent >= 100

    const cardRef = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={cardRef}
            className="flex flex-col w-full h-full gap-2 relative"
        >
            {/* PERF: Fully CSS accelerated rendering, no IntersectionObserver overhead anymore */}
            <div
                className={`relative w-full group ${isClaimed ? 'opacity-50 grayscale saturate-50' : ''}`}
                style={{ height: 'calc(100% - 16px)' }}
            >
                {/* 1. Atmospheric Glow — PERF: CSS-only opacity animation (compositor thread) */}
                {!cardImage.includes('-1') && (
                    <div
                        className="absolute inset-[-5%] bg-gradient-to-tr from-illa-pink/20 via-orange-500/10 to-rose-600/20 rounded-[3rem] pointer-events-none -z-20 blur-[30px] will-change-[opacity]"
                        style={{
                            animation: 'glow-pulse-soft 5s linear infinite',
                            transform: 'translateZ(0)',
                        }}
                    />
                )}

                {/* 2. Smoky Neon Effect (static — no JS animation needed) */}
                {!cardImage.includes('-1') && (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-illa-pink/20 rounded-[2rem] pointer-events-none -z-10 blur-[15px]" />
                )}

                {/* 3. The "Matter" — PERF: hover uses CSS transition instead of framer-motion variants */}
                <div
                    className="relative w-full h-full rounded-[1.8rem] bg-transparent will-change-transform transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-[5px] active:scale-105 active:-translate-y-[5px]"
                    style={{ transform: 'translateZ(0)' }}
                >
                    {/* Smoky Edge Glow instead of solid shape */}
                    {!cardImage.includes('-1') && (
                        <div className="absolute inset-0 rounded-[1.8rem] shadow-[inset_0_0_40px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(255,255,255,0.05)] border border-white/5 pointer-events-none z-20" />
                    )}
                    
                    {/* 1. Card WebP Image Layer */}
                    <img
                        src={cardImage}
                        alt={mission.title}
                        className={`absolute inset-0 w-full h-full transition-transform duration-[2s] z-[5] text-transparent ${
                            cardImage.includes('-1') 
                            ? 'object-contain scale-[1.90] -translate-y-4 group-hover:scale-[2.05]' 
                            : 'object-cover rounded-[1.8rem] group-hover:scale-[1.05]'
                        }`}
                        draggable={false}
                        loading="lazy"
                    />

                    {/* 2. Soft Ambient Darkness on Hover for Contrast */}
                    <div
                        className={`absolute inset-0 rounded-[1.8rem] overflow-hidden bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none transition-opacity duration-600 ${canClaim && !cardImage.includes('-1') ? 'group-hover:opacity-100 opacity-0' : 'opacity-0'}`}
                    />

                    {/* 2.5. Clickable Surface Overlay — native tap detection (zero Framer latency) */}
                    <TapOverlay onTap={() => {
                        if (!isClaimed && onCardClick) {
                            playGlobalClick()
                            onCardClick(mission)
                        }
                    }} />

                    {/* 3. Interactive Content Layer */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-0 pointer-events-none">
                        <div className="flex justify-end p-4">
                            {isClaimed ? (
                                <div className="flex items-center gap-1.5 text-emerald-800 font-black text-[10px] bg-emerald-100/90 px-3 py-1.5 rounded-full border border-emerald-200 shadow-md backdrop-blur-sm uppercase tracking-wider">
                                    <CheckCircle size={12} strokeWidth={3} />
                                    <span>Completo</span>
                                </div>
                            ) : canClaim ? (
                                <button
                                    onClick={() => {
                                        playGlobalClick()
                                        onClaim(mission.instance_id, rewards ? { xp: rewards.xp, points: rewards.coins } : undefined)
                                    }}
                                    disabled={claiming}
                                    className="pointer-events-auto relative overflow-hidden flex items-center justify-center gap-1.5 focus:outline-none bg-gradient-to-br from-illa-pink to-rose-600 text-white text-[11px] font-black tracking-widest uppercase px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(229,1,125,0.5)] border border-white/30 transition-transform duration-200 hover:scale-105 active:scale-[0.92] disabled:opacity-70 disabled:cursor-not-allowed group/btn"
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
                                </button>
                            ) : null}
                        </div>
                        {/* Floating Rewards Badge (Bottom Left) */}
                        {rewards && !isClaimed && (
                            <div className="absolute bottom-[52px] left-[32px] flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg z-20">
                                <span className="text-[10px] font-black tracking-wider text-amber-400">+{rewards.xp} XP</span>
                                <div className="w-[1px] h-3 bg-white/20" />
                                <div className="flex items-center gap-0.5 text-amber-200">
                                    <span className="text-[10px] font-black tracking-wider">+{rewards.coins}</span>
                                    <div className="scale-[0.6] origin-left -my-2 -mr-2">
                                        <GlobalCoin size="sm" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Magical Light Beams — PERF: CSS-only hover effect, no JS */}
                    {!cardImage.includes('-1') && (
                        <div
                            className="absolute inset-0 rounded-[1.8rem] overflow-hidden pointer-events-none mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-800"
                            style={{
                                background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)'
                            }}
                        />
                    )}
                </div>
            </div>

            {/* 4. Progress Bar Below Card — PERF: CSS animation instead of framer-motion */}
            <div className="w-full px-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Progresso</span>
                    <span className="text-[9px] font-bold text-white/70">{mission.progress} / {mission.target}</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 relative">
                    <div
                        className={`h-full rounded-full relative overflow-hidden transition-[width] duration-1000 ease-out ${isClaimed ? 'bg-emerald-500/50' : isCompleted ? 'bg-gradient-to-r from-illa-pink to-orange-400' : 'bg-white/40'}`}
                        style={{ width: `${progressPercent}%` }}
                    >
                        {/* PERF: CSS shimmer using transform-only (no JS loop) */}
                        {!isClaimed && progressPercent > 0 && progressPercent < 100 && (
                            <div className="css-shimmer" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
