'use client'

import type { BirthdayState } from '@/lib/gamification-types'
import { Cake } from 'lucide-react'

interface Props {
    birthday: BirthdayState
}

export default function BirthdayModule({ birthday }: Props) {
    if (!birthday.active) return null

    const daysUntil = birthday.days_until ?? 0
    const isToday = daysUntil === 0
    const isBefore = daysUntil > 0
    const isAfter = daysUntil < 0

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-illa-pink/10 via-illa-yellow/10 to-white border-2 border-illa-yellow/30 p-5 shadow-lg shadow-yellow-100/30">
            {/* Festive glow */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-illa-yellow/20 rounded-full blur-3xl" />

            <div className="relative text-center">
                <Cake size={32} className="mx-auto text-illa-pink mb-2" />

                {isToday && (
                    <>
                        <h3 className="text-xl font-bold text-dark mb-1">
                            🎂 Feliz Aniversário! 🎉
                        </h3>
                        <p className="text-sm text-dark/60">
                            Aproveite seu dia especial! Confira as surpresas exclusivas de aniversariante.
                        </p>
                    </>
                )}

                {isBefore && (
                    <>
                        <h3 className="text-lg font-bold text-dark mb-1">
                            🎁 Seu aniversário está chegando!
                        </h3>
                        <p className="text-sm text-dark/60">
                            Faltam <span className="font-bold text-illa-pink">{daysUntil} dia{daysUntil !== 1 ? 's' : ''}</span> para o seu dia especial!
                        </p>
                    </>
                )}

                {isAfter && (
                    <>
                        <h3 className="text-lg font-bold text-dark mb-1">
                            🥳 Aniversário recente!
                        </h3>
                        <p className="text-sm text-dark/60">
                            Esperamos que tenha sido incrível! Ainda dá tempo de aproveitar as surpresas.
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
