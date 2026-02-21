'use client'

import type { SecretMenuItem } from '@/lib/gamification-types'
import { Lock, Sparkles, Eye } from 'lucide-react'

interface Props {
    items: SecretMenuItem[]
}

export default function SecretMenu({ items }: Props) {
    if (items.length === 0) return null

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                <Sparkles size={20} className="text-illa-yellow" />
                Menu Secreto
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`relative rounded-2xl border p-4 transition-all ${item.unlocked
                            ? 'bg-white/80 border-illa-yellow/30 shadow-sm hover:shadow-md'
                            : 'bg-gray-100/60 border-gray-200/50'
                            }`}
                    >
                        {!item.unlocked && (
                            <div className="absolute inset-0 rounded-2xl backdrop-blur-[2px] bg-white/30 flex flex-col items-center justify-center z-[1]">
                                <Lock size={20} className="text-dark/30 mb-1" />
                                <span className="text-[10px] font-semibold text-dark/40 text-center px-2 leading-tight">
                                    {item.unlock_reason}
                                </span>
                            </div>
                        )}

                        <div className={item.unlocked ? '' : 'blur-[3px] select-none'}>
                            {item.image_url ? (
                                <div className="w-full h-16 rounded-xl bg-[#0f0f11] md:bg-gray-200/50 overflow-hidden mb-2">
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-16 rounded-xl bg-gradient-to-br from-illa-pink/10 to-illa-yellow/10 flex items-center justify-center mb-2">
                                    <Eye size={20} className="text-dark/20" />
                                </div>
                            )}
                            <h3 className="text-xs font-bold text-dark truncate">{item.title}</h3>
                            {item.description && (
                                <p className="text-[10px] text-dark/40 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                        </div>

                        {item.unlocked && (
                            <div className="absolute top-2 right-2">
                                <Sparkles size={12} className="text-illa-yellow" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
