'use client'

import { User, Target, Store, ChevronRight } from 'lucide-react'


const actions = [
    {
        id: 'invite',
        label: 'Indique e Ganhe',
        icon: User,
        color: 'from-white via-gray-100 to-gray-300',
        iconColor: 'text-zinc-900',
    },
    {
        id: 'scanner',
        label: 'Scanner',
        icon: Target,
        color: 'from-illa-pink to-rose-500',
    },
    {
        id: 'sorvetes',
        label: 'Picolés e Sorvetes Free',
        icon: Store,
        color: 'from-amber-400 to-orange-500',
    }
]

interface Props {
    onAction: (actionId: string) => void
}

export default function DashboardActionGrid({ onAction }: Props) {
    return (
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
            {actions.map((action, i) => (
                /* PERF: CSS animation with stagger delay instead of framer-motion whileInView */
                <div
                    key={action.id}
                    className={`anim-fade-in-up anim-delay-${i + 1}`}
                >
                    <button
                        onClick={() => onAction(action.id)}
                        className="w-full group relative flex flex-col items-center justify-center p-4 h-28 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        {/* Shimmer Light effect — PERF: CSS-only shimmer (no JS animation loop) */}
                        <div
                            className="css-shimmer"
                            style={{ animationDelay: `${1.5 + i * 0.5}s` }}
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
                </div>
            ))}
        </div>
    )
}
