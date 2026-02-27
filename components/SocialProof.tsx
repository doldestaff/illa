'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Star, Instagram, Send, Loader2, User, Briefcase, AtSign } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

interface Review {
    id: string
    name: string
    role: string
    instagram: string
    text: string
    rating: number
    created_at: string
    user_id: string | null
}

function StarRating({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
    const [hover, setHover] = useState(0)

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
                <button
                    key={s}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onChange?.(s)}
                    onMouseEnter={() => interactive && setHover(s)}
                    onMouseLeave={() => interactive && setHover(0)}
                    className={`transition-transform ${interactive ? 'cursor-pointer hover:scale-125 active:scale-90' : 'cursor-default'}`}
                >
                    <Star
                        size={interactive ? 28 : 16}
                        fill={(hover || rating) >= s ? 'currentColor' : 'none'}
                        strokeWidth={1.5}
                        className={`${(hover || rating) >= s ? 'text-illa-yellow' : 'text-white/30'} transition-colors`}
                    />
                </button>
            ))}
        </div>
    )
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/15 transition-colors"
        >
            <div className="flex gap-1 text-illa-yellow mb-4">
                <StarRating rating={review.rating} />
            </div>
            <p className="text-lg italic mb-6">&ldquo;{review.text}&rdquo;</p>
            <div>
                <strong className="block font-bold">{review.name}</strong>
                {review.role && <span className="text-sm opacity-60">{review.role}</span>}
                {review.instagram && (
                    <a
                        href={`https://instagram.com/${review.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-white/40 hover:text-white/70 transition-colors mt-0.5"
                    >
                        @{review.instagram.replace('@', '')}
                    </a>
                )}
            </div>
        </motion.div>
    )
}

export function SocialProof() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    // Form state
    const [rating, setRating] = useState(0)
    const [text, setText] = useState('')
    const [name, setName] = useState('')
    const [role, setRole] = useState('')
    const [instagram, setInstagram] = useState('')
    const [formError, setFormError] = useState('')

    const scrollRef = useRef<HTMLDivElement>(null)

    // Fetch reviews
    const fetchReviews = useCallback(async () => {
        try {
            const res = await fetch('/api/reviews')
            if (res.ok) {
                const data = await res.json()
                setReviews(data)
            }
        } catch {
            /* silently fail */
        } finally {
            setLoading(false)
        }
    }, [])

    // Check auth + subscribe realtime
    useEffect(() => {
        fetchReviews()

        const supabase = createSupabaseBrowser()

        // Check session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id)
                setUserEmail(session.user.email || null)
            }
        })

        // Realtime subscription
        const channel = supabase
            .channel('reviews-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reviews',
                    filter: 'approved=eq.true',
                },
                (payload) => {
                    const newReview = payload.new as Review
                    setReviews(prev => {
                        if (prev.some(r => r.id === newReview.id)) return prev
                        return [newReview, ...prev]
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchReviews])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')

        if (rating === 0) {
            setFormError('Selecione uma nota de 1 a 5 estrelas.')
            return
        }
        if (!text.trim()) {
            setFormError('Escreva um comentário.')
            return
        }
        if (!name.trim()) {
            setFormError('Preencha seu nome.')
            return
        }

        setSubmitting(true)

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    role: role.trim(),
                    instagram: instagram.trim(),
                    text: text.trim(),
                    rating,
                    user_id: userId,
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                setFormError(err.error || 'Erro ao enviar.')
                return
            }

            // Success
            setSubmitted(true)
            setRating(0)
            setText('')
            setName('')
            setRole('')
            setInstagram('')
            setTimeout(() => setSubmitted(false), 5000)
        } catch {
            setFormError('Erro de conexão. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    const visibleReviews = reviews.slice(0, 3)
    const olderReviews = reviews.slice(3)

    return (
        <section className="py-24 bg-illa-pink text-white overflow-hidden relative">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 w-20 h-20 rounded-full border-4 border-white transform rotate-12" />
                <div className="absolute bottom-20 right-20 w-32 h-32 bg-white rounded-full mix-blend-overlay blur-2xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="font-script text-4xl md:text-5xl mb-2">Quem prova, ama!</h2>
                        <p className="text-white/80 text-lg">Junte-se a milhares de apaixonados pela Illa.</p>
                    </div>

                    <a
                        href="https://instagram.com/illasorvetesoficial"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-illa-pink px-8 py-3 rounded-full font-bold hover:bg-illa-yellow hover:text-dark transition-colors shadow-lg flex items-center gap-2"
                    >
                        <Instagram size={20} />
                        Siga @illasorvetesoficial
                    </a>
                </div>

                {/* Reviews Feed */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-white/50" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 text-white/50">
                        <p className="text-lg">Seja o primeiro a deixar sua avaliação! ⭐</p>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Reviews */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                            {visibleReviews.map((r, i) => (
                                <ReviewCard key={r.id} review={r} index={i} />
                            ))}
                        </div>

                        {/* Older Reviews - Scrollable */}
                        {olderReviews.length > 0 && (
                            <div
                                ref={scrollRef}
                                className="max-h-[400px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {olderReviews.map((r, i) => (
                                        <ReviewCard key={r.id} review={r} index={i + 3} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Review Form */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mt-16 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-8 md:p-10 max-w-2xl mx-auto"
                >
                    <h3 className="text-2xl font-bold text-center mb-2">Deixe sua avaliação</h3>
                    <p className="text-white/60 text-sm text-center mb-8">Sua opinião faz diferença para nós! ❤️</p>

                    <AnimatePresence mode="wait">
                        {submitted ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-8"
                            >
                                <div className="text-5xl mb-4">🎉</div>
                                <p className="text-xl font-bold">Obrigado pelo seu comentário!</p>
                                <p className="text-white/60 text-sm mt-2">Ele já está visível no feed acima.</p>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                {/* Stars */}
                                <div className="flex flex-col items-center gap-2">
                                    <label className="text-sm font-semibold text-white/70">Sua nota</label>
                                    <StarRating rating={rating} interactive onChange={setRating} />
                                </div>

                                {/* Comment */}
                                <div>
                                    <textarea
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        placeholder="O que achou da Illa? Conte sua experiência..."
                                        rows={3}
                                        maxLength={300}
                                        className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all resize-none text-sm"
                                    />
                                    <p className="text-right text-[10px] text-white/30 mt-1">{text.length}/300</p>
                                </div>

                                {/* Name + Profession Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Seu nome"
                                            maxLength={50}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                        <input
                                            type="text"
                                            value={role}
                                            onChange={e => setRole(e.target.value)}
                                            placeholder="Profissão (opcional)"
                                            maxLength={40}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Instagram */}
                                {!userId && (
                                    <div className="relative">
                                        <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                        <input
                                            type="text"
                                            value={instagram}
                                            onChange={e => setInstagram(e.target.value)}
                                            placeholder="@seuinstagram (opcional)"
                                            maxLength={40}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all text-sm"
                                        />
                                    </div>
                                )}

                                {/* Logged-in indicator */}
                                {userId && (
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        Logado como {userEmail || 'membro'} — Instagram será preenchido automaticamente.
                                    </div>
                                )}

                                {/* Error */}
                                {formError && (
                                    <p className="text-red-300 text-sm text-center font-medium bg-red-500/10 rounded-xl py-2 px-4">{formError}</p>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-white text-illa-pink font-bold py-4 rounded-2xl hover:bg-illa-yellow hover:text-dark transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Publicar avaliação
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    )
}
