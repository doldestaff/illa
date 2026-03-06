/* eslint-disable @next/next/no-img-element */
'use client'

import type { RecipeItem } from '@/lib/gamification-types'
import { BookOpen, Bookmark, Heart, CheckCircle, Lock } from 'lucide-react'

interface Props {
    recipes: RecipeItem[]
    userLevel: number
    onToggle: (recipeId: string, field: 'saved' | 'favorited' | 'done', value: boolean) => Promise<void>
}

export default function RecipesLibrary({ recipes, onToggle }: Props) {
    if (recipes.length === 0) return null

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                <BookOpen size={20} className="text-orange-400" />
                Receitas
            </h2>

            <div className="space-y-2.5">
                {recipes.map((recipe) => (
                    <div
                        key={recipe.id}
                        className={`relative rounded-2xl border bg-white/80 backdrop-blur-sm p-4 transition-all ${recipe.is_locked
                            ? 'border-gray-200/50 opacity-70'
                            : 'border-gray-200/60 hover:shadow-md'
                            }`}
                    >
                        {recipe.is_locked && (
                            <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-[1]">
                                <div className="text-center">
                                    <Lock size={18} className="mx-auto text-dark/30 mb-1" />
                                    <span className="text-[11px] font-semibold text-dark/40">
                                        Nível {recipe.min_level} necessário
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            {recipe.image_url ? (
                                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                    <img
                                        src={recipe.image_url}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-pink-50 flex items-center justify-center flex-shrink-0">
                                    <BookOpen size={20} className="text-orange-300" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-dark truncate">{recipe.title}</h3>
                                {recipe.description && (
                                    <p className="text-xs text-dark/50 mt-0.5 line-clamp-2">{recipe.description}</p>
                                )}

                                {/* Tags */}
                                {recipe.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {recipe.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-[10px] font-medium bg-illa-pink/10 text-illa-pink px-2 py-0.5 rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        {!recipe.is_locked && (
                            <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => onToggle(recipe.id, 'saved', !recipe.saved)}
                                    className={`p-2 rounded-xl transition-all ${recipe.saved
                                        ? 'bg-blue-50 text-blue-500'
                                        : 'text-gray-300 hover:text-blue-400 hover:bg-blue-50/50'
                                        }`}
                                    title="Salvar"
                                >
                                    <Bookmark size={16} fill={recipe.saved ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    onClick={() => onToggle(recipe.id, 'favorited', !recipe.favorited)}
                                    className={`p-2 rounded-xl transition-all ${recipe.favorited
                                        ? 'bg-red-50 text-red-500'
                                        : 'text-gray-300 hover:text-red-400 hover:bg-red-50/50'
                                        }`}
                                    title="Favoritar"
                                >
                                    <Heart size={16} fill={recipe.favorited ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    onClick={() => onToggle(recipe.id, 'done', !recipe.done)}
                                    className={`p-2 rounded-xl transition-all ${recipe.done
                                        ? 'bg-emerald-50 text-emerald-500'
                                        : 'text-gray-300 hover:text-emerald-400 hover:bg-emerald-50/50'
                                        }`}
                                    title="Feito"
                                >
                                    <CheckCircle size={16} fill={recipe.done ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
