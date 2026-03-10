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
                        onClick={onClose}
                        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md"
                    />

                    {/* Popup */}
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="w-full max-w-[380px] pointer-events-auto relative overflow-hidden"
                        >
                            {/* Card Container Premium Gamified */}
                            <div className="relative rounded-[2.5rem] bg-[#0c0a09]/95 backdrop-blur-3xl border border-white/[0.08] shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden">

                                {/* Ambient Dark Glow Centralized */}
                                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-3/4 h-1/2 bg-gradient-to-b from-illa-pink/20 to-transparent blur-3xl opacity-50 pointer-events-none" />
                                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-amber-500/10 to-transparent blur-3xl opacity-40 pointer-events-none" />

                                {/* Top highlight border */}
                                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                                {/* Noise overlay */}
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-5 right-5 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 active:scale-95"
                                >
                                    <X size={16} />
                                </button>

                                {/* Content */}
                                <div className="relative z-10 px-8 pt-10 pb-8 flex flex-col items-center text-center">

                                    {/* Icon with glow matching accent */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.1, damping: 12, stiffness: 200 }}
                                        className="relative mb-6"
                                    >
                                        <div className="absolute inset-0 bg-white/10 blur-xl rounded-full scale-150" />
                                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative z-10 backdrop-blur-md`}>
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                                            {howTo.icon}
                                        </div>
                                    </motion.div>

                                    {/* Title */}
                                    <motion.h3
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-2 tracking-tight drop-shadow-sm"
                                    >
                                        {howTo.title}
                                    </motion.h3>

                                    {/* Mission-specific title */}
                                    {missionTitle && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4"
                                        >
                                            {missionTitle}
                                        </motion.p>
                                    )}

                                    {/* Instruction */}
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                        className="text-sm text-white/60 leading-relaxed mb-8 max-w-[280px]"
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
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black text-sm font-black tracking-widest uppercase shadow-[0_4px_20px_rgba(245,158,11,0.4)] border border-amber-300/30 flex items-center justify-center gap-2 transition-all hover:shadow-[0_8px_30px_rgba(245,158,11,0.6)] group"
                                    >
                                        {howTo.actionLabel}
                                        <ArrowRight size={16} strokeWidth={3} className="text-black/70 group-hover:translate-x-1 group-hover:text-black transition-all" />
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
