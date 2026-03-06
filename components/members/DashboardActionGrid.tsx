'use client'

import { motion } from 'framer-motion'
import { User, Target, Store, ChevronRight } from 'lucide-react'


const actions = [
    {
        id: 'invite',
        label: 'Indique e Ganhe',
        icon: User,
        color: 'from-white via-gray-100 to-gray-300',
        iconColor: 'text-zinc-900',
        delay: 0,
    },
    {
        id: 'scanner',
        label: 'Scanner', // was Missões
        icon: Target,
        color: 'from-illa-pink to-rose-500',
        delay: 0.1,
    },
    {
        id: 'sorvetes',
        label: 'Picolés e Sorvetes Free', // was Loja
        icon: Store,
        color: 'from-amber-400 to-orange-500',
        delay: 0.2,
    }
]

interface Props {
    onAction: (actionId: string) => void
}

export default function DashboardActionGrid({ onAction }: Props) {
    return (
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
            {actions.map((action, i) => (
                <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: action.delay, duration: 0.4 }}
                >
                    <button
                        onClick={() => onAction(action.id)}
                        className="w-full group relative flex flex-col items-center justify-center p-4 h-28 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        {/* Shimmer Light effect — deferred start to avoid competing with initial paint */}
                        <motion.div
                            initial={{ backgroundPosition: '-200% 0' }}
                            animate={{ backgroundPosition: '200% 0' }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 1.5 + (i * 0.5), repeatDelay: 1 + (i * 0.5) }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                            style={{ backgroundSize: '200% 100%' }}
                        />

                        {/* Hover Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

                        {/* Icon Container */}
                        <div className={`w-10 h-10 mb-3 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                            <action.icon size={20} className={action.iconColor || "text-white"} />
                        </div>

                        {/* Label */}
                        <span className="text-xs font-bold text-white/90 text-center tracking-wide group-hover:text-white transition-colors leading-tight relative z-10">
                            {action.label}
                        </span>

                        {/* Arrow indicator (subtle) */}
                        <div className="absolute top-2 right-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 relative z-10">
                            <ChevronRight size={12} className="text-white/50" />
                        </div>
                    </button>
                </motion.div>
            ))}
        </div>
    )
}
