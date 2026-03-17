'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Gift, Share2, Star, Crown, ArrowRight } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useSyncExternalStore } from 'react'

function subscribe() { return () => { } }
function useIsClientMounted() {
    return useSyncExternalStore(subscribe, () => true, () => false)
}

interface MissionHowTo {
    icon: React.ReactNode
    title: string
    instruction: string
    actionLabel: string
    actionRoute: string
    accentColor: string
}

const MISSION_HOWTO: Record<string, MissionHowTo> = {
    view_recipes: {
        icon: <Heart size={28} className="text-rose-400" />,
        title: 'Alquimia de Sabor',
        instruction: 'Entre no laboratório de sabores! Role o painel para baixo até a seção de Receitas e salve sua favorita clicando no ❤️',
        actionLabel: 'Ver Receitas',
        actionRoute: '/receitas',
        accentColor: 'rose',
    },
    recipes: {
        icon: <Heart size={28} className="text-rose-400" />,
        title: 'Alquimia de Sabor',
        instruction: 'Entre no laboratório de sabores! Role o painel para baixo até a seção de Receitas e salve sua favorita clicando no ❤️',
        actionLabel: 'Ver Receitas',
        actionRoute: '/receitas',
        accentColor: 'rose',
    },
    visit: {
        icon: <Gift size={28} className="text-amber-400" />,
        title: 'Colete um Drop!',
        instruction: 'Fique atento aos Drops que aparecem no seu Dashboard. Clique em "Reivindicar" quando um aparecer para ganhar recompensas extras!',
        actionLabel: 'Verificar Drops',
        actionRoute: '/members',
        accentColor: 'amber',
    },
    share_link: {
        icon: <Share2 size={28} className="text-sky-400" />,
        title: 'Convide um Amigo',
        instruction: 'O melhor sorvete fica melhor com amigos! Compartilhe seu link exclusivo e ganhe moedas por cada novo indicado.',
        actionLabel: 'Abrir Convites',
        actionRoute: '#invite',
        accentColor: 'sky',
    },
    share: {
        icon: <Share2 size={28} className="text-sky-400" />,
        title: 'Convide um Amigo',
        instruction: 'O melhor sorvete fica melhor com amigos! Compartilhe seu link exclusivo e ganhe moedas por cada novo indicado.',
        actionLabel: 'Abrir Convites',
        actionRoute: '#invite',
        accentColor: 'sky',
    },
    survey: {
        icon: <Star size={28} className="text-yellow-400" />,
        title: 'Deixe sua Avaliação',
        instruction: 'Vá até a Home, na seção "Quem prova, ama!" e deixe seu comentário com estrelas. Sua opinião vale recompensas!',
        actionLabel: 'Ir para Home',
        actionRoute: '/',
        accentColor: 'yellow',
    },
    view_exclusive: {
        icon: <Crown size={28} className="text-amber-300" />,
        title: 'Descubra seus Benefícios',
        instruction: 'Toque no seu cartão digital ILLA Exclusive para ver todos os benefícios VIP, incluindo sorvetes grátis e super descontos!',
        actionLabel: 'Ver Cartão VIP',
        actionRoute: '/members#vip',
        accentColor: 'amber',
    },
    profile: {
        icon: <Star size={28} className="text-emerald-400" />,
        title: 'Complete seu Perfil',
        instruction: 'Preencha todas as informações do seu perfil para ganhar recompensas e desbloquear funcionalidades exclusivas.',
        actionLabel: 'Editar Perfil',
        actionRoute: '/members/profile',
        accentColor: 'emerald',
    },
}

const DEFAULT_HOWTO: MissionHowTo = {
    icon: <Star size={28} className="text-white/60" />,
    title: 'Missão Especial',
    instruction: 'Complete os requisitos desta missão no painel ILLA para desbloquear recompensas exclusivas!',
    actionLabel: 'Entendido',
    actionRoute: '#',
    accentColor: 'white',
}

import { useRouter } from 'next/navigation'
import { useSoundSystem } from '@/components/providers/SoundProvider'

interface Props {
    isOpen: boolean
    onClose: () => void
    missionKind: string | null
    missionTitle?: string
    onInviteClick?: () => void
}

export default function MissionHowToPopup({ isOpen, onClose, missionKind, missionTitle, onInviteClick }: Props) {
    const mounted = useIsClientMounted()
    const router = useRouter()
    const { playSecondaryClick } = useSoundSystem()

    if (!mounted) return null

    const howTo = missionKind ? (MISSION_HOWTO[missionKind] ?? DEFAULT_HOWTO) : DEFAULT_HOWTO

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            playSecondaryClick()
                            onClose()
                        }}
                        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md"
                    />

                    {/* Popup */}
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="w-full max-w-[380px] pointer-events-auto relative"
                        >
                            {/* Parchment Container */}
                            <div className="relative w-full min-h-[480px] flex flex-col items-center justify-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">

                                {/* Parchment Background Image */}
                                {/* eslint-disable-next-line @next/next/no-img-element -- Decorative parchment background */}
                                <img 
                                    src="/mission-cards/pergaminho.webp" 
                                    alt="Pergaminho" 
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[48%] w-[125%] h-[115%] md:w-[110%] md:h-[110%] object-fill -z-10 pointer-events-none"
                                />


                                {/* Content */}
                                <div className="relative z-10 w-full px-14 sm:px-20 pt-20 pb-16 flex flex-col items-center text-center mx-auto max-w-[320px] -translate-y-[20px]">

                                    {/* Icon with glow matching accent */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.1, damping: 12, stiffness: 200 }}
                                        className="relative mb-6"
                                    >
                                        <div className="absolute inset-0 bg-amber-900/10 blur-xl rounded-full scale-150" />
                                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200/50 border border-amber-900/10 flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.15)] relative z-10`}>
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                                            {howTo.icon}
                                        </div>
                                    </motion.div>

                                    {/* Title */}
                                    <motion.h3
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        className="text-[18px] sm:text-xl font-black text-amber-950 mb-2 tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)] leading-tight px-2"
                                    >
                                        {howTo.title}
                                    </motion.h3>

                                    {/* Mission-specific title */}
                                    {missionTitle && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-[10px] sm:text-xs font-black text-amber-900/80 uppercase tracking-widest mb-3 drop-shadow-[0_1px_0px_rgba(255,255,255,0.5)]"
                                        >
                                            {missionTitle}
                                        </motion.div>
                                    )}

                                    {/* Instruction */}
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                        className="text-[12px] sm:text-[14px] text-amber-950/90 font-medium leading-relaxed mb-8 max-w-[220px] sm:max-w-[240px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]"
                                    >
                                        {howTo.instruction}
                                    </motion.p>

                                    {/* Action Button */}
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => {
                                            if (howTo.actionRoute === '#invite' && onInviteClick) {
                                                onInviteClick()
                                                onClose()
                                            } else if (howTo.actionRoute?.startsWith('#')) {
                                                onClose()
                                                const el = document.getElementById(howTo.actionRoute.substring(1))
                                                if (el) el.scrollIntoView({ behavior: 'smooth' })
                                            } else {
                                                onClose()
                                                if (howTo.actionRoute !== '#') {
                                                    router.push(howTo.actionRoute)
                                                }
                                            }
                                        }}
                                        className="w-[90%] sm:w-full py-3 sm:py-4 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs sm:text-sm font-black tracking-widest uppercase shadow-[0_4px_15px_rgba(217,119,6,0.5)] border border-amber-400/30 flex items-center justify-center gap-2 transition-all hover:shadow-[0_6px_20px_rgba(217,119,6,0.6)] group"
                                    >
                                        {howTo.actionLabel}
                                        <ArrowRight size={16} strokeWidth={3} className="text-white/80 group-hover:translate-x-1 group-hover:text-white transition-all" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}
