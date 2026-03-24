'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Trophy, ChevronRight, Lock, Sparkles, Check, ArrowRight, CheckCircle2, Star } from 'lucide-react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { MissionInstance } from '@/lib/gamification-types'
import MissionCard, { resolveCardImage } from './MissionCard'

// Lazy load Modals to avoid initial JS execution cost on mobile dashboard
const MissionsModal = dynamic(() => import('./MissionsModal'), { ssr: false })
const MissionHowToPopup = dynamic(() => import('./MissionHowToPopup'), { ssr: false })
import GlobalCoin from '../ui/GlobalCoin'
import { useSoundSystem } from '@/components/providers/SoundProvider'

// PERF: Detect mobile once, avoid re-renders on resize
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => { setIsMobile(window.innerWidth < 768) }, [])
    return isMobile
}

// --- Animated Counter Helper ---
function AnimatedCounter({ value, duration = 1.5, delay = 0 }: { value: number, duration?: number, delay?: number }) {
    const nodeRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;

        node.textContent = '0';

        const timeout = setTimeout(() => {
            const controls = animate(0, value, {
                duration: duration,
                ease: "easeOut",
                onUpdate(v) {
                    node.textContent = Math.floor(v).toLocaleString('pt-BR');
                },
            });
            return () => controls.stop();
        }, delay * 1000);

        return () => clearTimeout(timeout);
    }, [value, duration, delay]);

    return <span ref={nodeRef}>0</span>;
}



interface Props {
    missions: MissionInstance[]
    onClaim: (instanceId: string, customReward?: { xp: number; points: number }) => Promise<{ success: boolean }>
    onInviteClick?: () => void
}

export default function DailyMissions({ missions: initialMissions, onClaim, onInviteClick }: Props) {
    const isMobile = useIsMobile()
    const missions = initialMissions
        .filter((m) => m.kind !== 'profile' && !m.title.toLowerCase().includes('self'))
        .filter((mission, index, self) => index === self.findIndex((m) => resolveCardImage(m) === resolveCardImage(mission)))
        .slice(0, 5)

    const [claimingId, setClaimingId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showPopup, setShowPopup] = useState(false)
    const [claimedReward, setClaimedReward] = useState<{ xp: number; coins: number }>({ xp: 0, coins: 0 })
    const [claimedIds, setClaimedIds] = useState<Set<string>>(
        new Set(missions.filter((m) => m.claimed).map((m) => m.instance_id))
    )

    const [missionRewards] = useState(() => {
        const rewards: Record<string, { xp: number, coins: number }> = {}
        missions.forEach(m => {
            rewards[m.instance_id] = {
                xp: Math.floor(Math.random() * (200 - 50 + 1)) + 50,
                coins: Math.floor(Math.random() * (20 - 5 + 1)) + 5
            }
        })
        return rewards
    })

    const completedCount = missions.filter((m) => m.completed).length
    const totalCount = missions.length
    const allCompleted = totalCount > 0 && completedCount === totalCount

    const [howToMission, setHowToMission] = useState<MissionInstance | null>(null)

    const { playMissionComplete, playCoinToastShow, playCoinToastCelebration } = useSoundSystem()

    const handleClaim = useCallback(async (instanceId: string, customReward?: { xp: number; points: number }) => {
        setClaimingId(instanceId)
        try {
            const reward = customReward || missionRewards[instanceId] || { xp: 50, coins: 5 }
            const rewardCoins = 'coins' in reward ? reward.coins : ('points' in reward ? reward.points : 0);
            setClaimedReward({ xp: reward.xp, coins: rewardCoins })

            const result = await onClaim(instanceId, customReward)
            if (result.success) {
                setClaimedIds((prev) => new Set([...prev, instanceId]))
                setShowPopup(true)
                
                playMissionComplete()
                setTimeout(() => { playCoinToastShow() }, 400)
                setTimeout(() => { playCoinToastCelebration() }, 1200)
                setTimeout(() => setShowPopup(false), 4500)
            }
        } catch (err) {
            console.error('Claim failed:', err)
        } finally {
            setClaimingId(null)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Sound functions are stable refs from context
    }, [onClaim, missionRewards])

    if (missions.length === 0) return null

    // Sort completed and claimed to the end
    const sortedMissions = [...missions].sort((a, b) => {
        const aCompleted = a.progress >= a.target || a.claimed || claimedIds.has(a.instance_id)
        const bCompleted = b.progress >= b.target || b.claimed || claimedIds.has(b.instance_id)

        if (!aCompleted && bCompleted) return -1
        if (aCompleted && !bCompleted) return 1
        return 0
    })

    // Desktop: duplicated list for CSS marquee 50% loop
    const marqueeMissions = [...sortedMissions, ...sortedMissions]

    // Shared card renderer
    const renderCard = (mission: MissionInstance, index: number, keyPrefix: string) => {
        const isClaimed = claimedIds.has(mission.instance_id) || mission.claimed
        const isCompleted = mission.progress >= mission.target
        const canClaim = isCompleted && !isClaimed

        return (
            <div
                key={`${keyPrefix}-${mission.instance_id}-${index}`}
                className={isMobile
                    ? "w-[280px] h-[180px] shrink-0"
                    : "marquee-item w-[300px] sm:w-[340px] md:w-[380px] h-[220px] shrink-0 relative"
                }
            >
                <MissionCard
                    mission={mission}
                    isClaimed={isClaimed}
                    canClaim={canClaim}
                    claiming={claimingId === mission.instance_id}
                    onClaim={handleClaim}
                    onCardClick={(m) => setHowToMission(m)}
                    rewards={missionRewards[mission.instance_id]}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col pt-4 pb-2 relative overflow-visible overflow-x-clip">
            {/* Header - Interactive & Cinematic */}
            <div
                onClick={() => setIsModalOpen(true)}
                className="relative z-10 flex items-center justify-between cursor-pointer group select-none px-4 md:px-0 mb-3"
            >
                <div className="flex items-center gap-3 relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="w-12 h-12 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300">
                            {/* eslint-disable-next-line @next/next/no-img-element -- Decorative game icon */}
                            <img 
                                src="/mission-cards/missions-icon.webp" 
                                alt="Missions Target" 
                                className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] text-transparent" 
                                draggable={false}
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-tight">
                            Missões do Dia
                            <ArrowRight size={20} className="text-illa-pink opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </h2>
                        <p className="text-xs font-medium text-white/60 group-hover:text-white/80 transition-colors uppercase tracking-widest mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                            Ver todas as missões
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="px-4 py-2 rounded-full border mobile-no-blur backdrop-blur-md bg-[#25252a]/60 border-white/10 text-white/70 shadow-inner group-hover:border-white/20 transition-all duration-300">
                        <span className="text-sm font-bold tracking-wider">{sortedMissions.filter(m => m.progress >= m.target).length} <span className="opacity-50">/</span> {sortedMissions.length}</span>
                    </div>
                </div>
            </div>

            {/* ─── MOBILE: Native horizontal scroll (zero touch conflict) ─── */}
            {isMobile ? (
                <div className="relative w-full py-4">
                    {/* Edge fades */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0c] to-transparent z-20 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0c] to-transparent z-20 pointer-events-none" />

                    <div className="mobile-missions-scroll">
                        {sortedMissions.map((mission, index) => renderCard(mission, index, 'mobile'))}
                    </div>
                </div>
            ) : (
                /* ─── DESKTOP: CSS-only marquee (GPU compositor, no JS animation) ─── */
                <div className="relative group/mural w-full max-w-[100vw] py-4 -my-[140px] pointer-events-auto">
                    {/* Edge fades */}
                    <div className="absolute left-0 top-[140px] bottom-[140px] w-24 bg-gradient-to-r from-[#0a0a0c] to-transparent z-20 pointer-events-none" />
                    <div className="absolute right-0 top-[140px] bottom-[140px] w-24 bg-gradient-to-l from-[#0a0a0c] to-transparent z-20 pointer-events-none" />

                    <div className="flex py-[140px] overflow-hidden">
                        <div
                            className="marquee-track group-hover/mural:[animation-play-state:paused] flex gap-6 px-4"
                            style={{ '--marquee-duration': `${sortedMissions.length * 10}s` } as React.CSSProperties}
                        >
                            {marqueeMissions.map((mission, index) => renderCard(mission, index, 'marquee'))}
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Call to Action for Missions Panel */}
            <div className="px-4 -mt-5 relative z-20 pointer-events-none">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group flex w-full md:w-auto md:mx-auto items-center justify-center gap-2 py-2 px-6 transition-all duration-300 relative pointer-events-auto"
                >
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-white/50 group-hover:text-white transition-all duration-300 drop-shadow-md">
                        Abrir Mural de Missões
                    </span>
                    <ArrowRight size={16} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-transform duration-300 ease-out" strokeWidth={2.5} />
                </button>
            </div>

            {/* All Completed Bonus State */}
            {allCompleted && (
                <div className="bg-[#0f0f11] md:bg-white/5 md:backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl shadow-emerald-500/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Dia Perfeito!</p>
                            <p className="text-xs text-white/80">Você completou todas as missões hoje.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Full List Modal */}
            <MissionsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                missions={missions}
                claimingId={claimingId}
                claimedIds={claimedIds}
                onClaim={handleClaim}
                missionRewards={missionRewards}
                onCardClick={(m) => setHowToMission(m)}
                onInviteClick={onInviteClick}
            />

            {/* Mission Completion Centered Popup */}
            <AnimatePresence>
                {showPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.8, y: 30, opacity: 0, filter: 'blur(10px)' }}
                            transition={{ type: 'spring', bounce: 0.5, duration: 0.7 }}
                            className="relative flex items-center justify-center max-w-[380px] w-[92vw] text-center"
                        >
                            {/* Gamified Star Bursts Particle Effect */}
                            {[
                                { emoji: '✨', x: -90, y: -80, delay: 0.1, size: 24, rot: 15 },
                                { emoji: '🌟', x: 100, y: -65, delay: 0.2, size: 20, rot: -20 },
                                { emoji: '💫', x: -100, y: 40, delay: 0.25, size: 22, rot: 10 },
                                { emoji: '✨', x: 110, y: 45, delay: 0.3, size: 18, rot: -10 },
                                { emoji: '🔥', x: -50, y: -110, delay: 0.15, size: 18, rot: 5 },
                                { emoji: '💛', x: 65, y: -100, delay: 0.22, size: 16, rot: -5 },
                                { emoji: '🎉', x: -85, y: 95, delay: 0.35, size: 24, rot: 20 },
                                { emoji: '🎊', x: 85, y: 95, delay: 0.28, size: 22, rot: -15 },
                            ].map((s, i) => (
                                <motion.span
                                    key={`burst-${i}`}
                                    initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                                    animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.4, 1, 0.8], x: s.x, y: s.y, rotate: s.rot }}
                                    transition={{ duration: 2, delay: s.delay, ease: 'easeOut', times: [0, 0.2, 0.7, 1] }}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-30 drop-shadow-md"
                                    style={{ fontSize: s.size }}
                                >
                                    {s.emoji}
                                </motion.span>
                            ))}

                            {/* Background Shape dictates the total size */}
                            <div className="relative w-full z-0 pointer-events-none drop-shadow-[0_20px_50px_rgba(229,1,125,0.25)] flex items-center justify-center overflow-visible">
                                {/* eslint-disable-next-line @next/next/no-img-element -- Decorative background shape */}
                                <img src="/mission-complete.webp" alt="Background shape" className="w-[110%] max-w-none h-auto object-contain scale-110" />
                            </div>

                            {/* Safe Area constraint for content - shifting stack up */}
                            <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center pt-[12%] pb-[20%] px-[12%] gap-1 sm:gap-1.5">
                                {/* Animated Background Rays (Localized to safe area) */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-[15%] z-[-1] pointer-events-none opacity-30 select-none rounded-[2rem] overflow-hidden mix-blend-overlay"
                                    style={{
                                        background: 'conic-gradient(from 0deg, transparent 0%, rgba(229,1,125,0.4) 20%, transparent 40%, rgba(255,255,255,0.4) 60%, transparent 80%, rgba(229,1,125,0.4) 100%)'
                                    }}
                                />

                                <motion.div
                                    initial={{ scale: 0, rotate: 0 }}
                                    animate={{ scale: [0, 1.2, 1], rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-gradient-to-tr from-amber-300 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.6)] relative z-20 border-2 border-white/40"
                                >
                                    <CheckCircle2 className="text-orange-950" size={32} strokeWidth={3} />
                                </motion.div>

                                <div className="relative z-10 w-full mt-1 mb-1">
                                    <motion.h3
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-[20px] sm:text-[24px] leading-tight font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 uppercase tracking-tight drop-shadow-md"
                                    >
                                        Missão<br />Concluída!
                                    </motion.h3>
                                </div>

                                {/* Rewards Box */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                    className="w-full flex-col flex items-stretch gap-1.5 sm:gap-2 relative z-10"
                                >
                                    {/* XP Row */}
                                    {claimedReward.xp > 0 && (
                                        <div className="flex items-center justify-between bg-white/[0.04] border border-white/10 p-2 sm:p-2.5 rounded-xl">
                                            <div className="flex items-center gap-1.5">
                                                <div className="bg-amber-500/20 text-amber-400 p-1 rounded-full">
                                                    <Star size={12} fill="currentColor" />
                                                </div>
                                                <span className="font-bold text-[9px] sm:text-[10px] text-white/70 uppercase tracking-widest leading-none mt-0.5">Experiência</span>
                                            </div>
                                            <div className="text-sm sm:text-base font-black text-white flex items-baseline gap-0.5">
                                                <span className="text-amber-400 text-xs">+</span>
                                                <AnimatedCounter value={claimedReward.xp} duration={2} delay={0.4} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Coins Row */}
                                    {claimedReward.coins > 0 && (
                                        <div className="flex items-center justify-between bg-white/[0.04] border border-white/10 p-2 sm:p-2.5 rounded-xl">
                                            <div className="flex items-center gap-1.5">
                                                <div className="shrink-0 -ml-0.5">
                                                    <GlobalCoin size="sm" />
                                                </div>
                                                <span className="font-bold text-[9px] sm:text-[10px] text-white/70 uppercase tracking-widest leading-none mt-0.5">Moedas ILLA</span>
                                            </div>
                                            <div className="text-sm sm:text-base font-black text-white flex items-baseline gap-0.5">
                                                <span className="text-amber-400 text-xs">+</span>
                                                <AnimatedCounter value={claimedReward.coins} duration={2} delay={0.8} />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mission How-To Popup */}
            <MissionHowToPopup
                isOpen={!!howToMission}
                onClose={() => setHowToMission(null)}
                missionKind={howToMission?.kind ?? null}
                missionTitle={howToMission?.title}
                onInviteClick={onInviteClick}
            />
        </div>
    )
}
