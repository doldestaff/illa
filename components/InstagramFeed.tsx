'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Instagram, X, Heart, ExternalLink, Play } from 'lucide-react'

interface InstaPost {
    id: string
    imageUrl: string
    postUrl: string
    caption: string
    type: 'image' | 'reel'
    likes: number
}

const posts: InstaPost[] = [
    {
        id: '1',
        imageUrl: '/instagram/post-1.jpg',
        postUrl: 'https://www.instagram.com/reel/DVHGWxsmtcw/',
        caption: '🍦 Uma paleta de sabores! Do açaí ao maracujá, cada mordida é uma viagem. Venha descobrir o seu favorito! #IllaSorvetes #Gelato',
        type: 'reel',
        likes: 412,
    },
    {
        id: '2',
        imageUrl: '/instagram/post-2.jpg',
        postUrl: 'https://www.instagram.com/reel/DVHBTi-ji8V/',
        caption: '🤤 Casquinha recheada e colorida — pura alegria em cada mordida! Venha conferir no @illasorvetesoficial. #Sorvete #Maceió',
        type: 'reel',
        likes: 678,
    },
    {
        id: '3',
        imageUrl: '/instagram/post-3.jpg',
        postUrl: 'https://www.instagram.com/reel/DU_niVXjZy7/',
        caption: '✨ Momento Illa: sabor, sorriso e muito açaí! Qual é o seu combo favorito? Conta pra gente nos comentários 😍 #IllaExclusive',
        type: 'reel',
        likes: 1103,
    },
    {
        id: '4',
        imageUrl: '/instagram/post-4.jpg',
        postUrl: 'https://www.instagram.com/reel/DU-_BcGkX6U/',
        caption: '🍫 Nosso Sundae especial: brownie quente, sorvete e cobertura de chocolate! Só pra quem merece o melhor 💫 #Sundae #IllaSorvetes',
        type: 'reel',
        likes: 544,
    },
    {
        id: '5',
        imageUrl: '/instagram/post-5.jpg',
        postUrl: 'https://www.instagram.com/reel/DU9CyIyD7kP/',
        caption: '🏪 Nossa casa é o lugar onde momentos se transformam em memórias. Te esperamos aqui! 📍 Maceió/AL #IllaSorvetes #Sorveteria',
        type: 'reel',
        likes: 298,
    },
    {
        id: '6',
        imageUrl: '/instagram/post-6.jpg',
        postUrl: 'https://www.instagram.com/reel/DU6d-UZFCX6/',
        caption: '🍭 Picolés coloridos que alegram qualquer tarde! Da linha Kids pra toda a família. Venha se refrescar! #Picolé #IllaKids',
        type: 'reel',
        likes: 892,
    },
    {
        id: '7',
        imageUrl: '/instagram/post-7.jpg',
        postUrl: 'https://www.instagram.com/reel/DU0rPcxkUDA/',
        caption: '📸 Flat lay dos sonhos! Combinações perfeitas para a sua tarde de sorvete. Qual você escolheria? 🍦✨ #FoodPhotography #IllaSorvetes',
        type: 'reel',
        likes: 731,
    },
    {
        id: '8',
        imageUrl: '/instagram/post-8.jpg',
        postUrl: 'https://www.instagram.com/reel/DUqYEP3EUj1/',
        caption: '👨‍👩‍👧‍👦 Família unida... pelo sorvete! Venha criar memórias gostosas com quem você ama. A Illa é o lugar perfeito 🍦❤️ #FamilíaIlla',
        type: 'reel',
        likes: 1572,
    },
    {
        id: '9',
        imageUrl: '/instagram/post-9.jpg',
        postUrl: 'https://www.instagram.com/p/DUn_cbplFZU/?img_index=1',
        caption: '🔍 Textura perfeita, sabor irresistível. Cada colherada do nosso gelato é pura magia 🍦✨ #Gelato #IllaExclusive #Sorvete',
        type: 'image',
        likes: 949,
    },
]

// ─── PostTile ────────────────────────────────────────────────────────────────

function PostTile({ post, onClick, index }: { post: InstaPost; onClick: () => void; index: number }) {
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06, type: 'spring', bounce: 0.3 }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="relative aspect-square overflow-hidden rounded-2xl group cursor-pointer focus:outline-none focus:ring-4 focus:ring-illa-pink/50 bg-gray-900"
        >
            <Image
                src={post.imageUrl}
                alt={post.caption.slice(0, 60)}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 33vw, 25vw"
            />



            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-3 gap-1">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                    <Play size={16} className="text-white fill-white translate-x-0.5" />
                </div>
                <div className="flex items-center gap-1 text-white/90">
                    <Heart size={11} className="fill-white" />
                    <span className="text-[11px] font-bold">{post.likes.toLocaleString('pt-BR')}</span>
                </div>
            </div>
        </motion.button>
    )
}

// ─── PostModal ───────────────────────────────────────────────────────────────

function PostModal({ post, onClose }: { post: InstaPost; onClose: () => void }) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 24 }}
                transition={{ type: 'spring', bounce: 0.35, duration: 0.45 }}
                onClick={e => e.stopPropagation()}
                className="relative bg-white rounded-[2.2rem] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] w-full max-w-sm max-h-[88vh] flex flex-col"
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3.5 right-3.5 z-30 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition-colors backdrop-blur-sm border border-white/20"
                    aria-label="Fechar"
                >
                    <X size={15} />
                </button>

                {/* Thumbnail */}
                <div className="relative aspect-[4/4.5] shrink-0">
                    <Image src={post.imageUrl} alt={post.caption.slice(0, 60)} fill className="object-cover" sizes="440px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                        <Heart size={14} className="text-white fill-white drop-shadow" />
                        <span className="text-white font-bold text-sm drop-shadow">{post.likes.toLocaleString('pt-BR')}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col p-5 overflow-y-auto flex-1 min-h-0">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E1306C] via-[#C13584] to-[#F77737] flex items-center justify-center shrink-0 shadow">
                            <Instagram size={15} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-gray-900 leading-none">illasorvetesoficial</p>
                            <p className="text-xs text-gray-400 mt-0.5">Maceió, AL</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-5 flex-1">{post.caption}</p>
                    <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E1306C] via-[#C13584] to-[#F77737] text-white font-bold py-3.5 rounded-2xl hover:shadow-lg hover:shadow-pink-300/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                    >
                        {post.type === 'reel' ? <Play size={15} className="fill-white" /> : <ExternalLink size={15} />}
                        {post.type === 'reel' ? 'Assistir o Reel' : 'Ver no Instagram'}
                    </a>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function InstagramFeed() {
    const [selectedPost, setSelectedPost] = useState<InstaPost | null>(null)
    const openPost = useCallback((post: InstaPost) => setSelectedPost(post), [])
    const closePost = useCallback(() => setSelectedPost(null), [])
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const v = videoRef.current
        if (v) {
            v.muted = true
            v.play().catch(() => { })
        }
    }, [])

    return (
        <section className="relative py-24 md:py-32 overflow-hidden isolate">

            {/* ── Background video ── */}
            <video
                ref={videoRef}
                src="/instagram/reels/mobile/insta-3.mp4"
                loop
                muted
                playsInline
                autoPlay
                className="absolute inset-0 w-full h-full object-cover z-0 scale-105"
                aria-hidden
            />

            {/* ── Dark gradient overlay over video ── */}
            <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/70 via-black/55 to-black/80" />

            {/* ── Subtle pink glow accent ── */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-illa-pink/20 blur-[100px] z-[2] pointer-events-none" />

            {/* ── Content ── */}
            <div className="relative z-[3] container mx-auto px-4 md:px-6 max-w-lg">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ type: 'spring', bounce: 0.25 }}
                    className="mb-8"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-black uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full mb-4 shadow">
                        <Instagram size={12} />
                        Instagram
                    </div>

                    <h2 className="font-script text-4xl md:text-5xl text-white leading-tight mb-2 drop-shadow-xl">
                        Siga a gente!
                    </h2>
                    <p className="text-white/60 text-sm mb-5">
                        Os momentos mais gostosos estão lá:{' '}
                        <span className="font-bold text-illa-pink">@illasorvetesoficial</span>
                    </p>

                    <a
                        href="https://www.instagram.com/illasorvetesoficial/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-illa-pink to-orange-500 text-white font-bold px-6 py-3 rounded-full hover:shadow-xl hover:shadow-illa-pink/40 hover:scale-[1.04] active:scale-[0.98] transition-all text-sm shadow-lg shadow-illa-pink/30"
                    >
                        <Instagram size={16} />
                        Seguir no Instagram
                    </a>
                </motion.div>

                {/* Grid 3×3 */}
                <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                    {posts.map((post, i) => (
                        <PostTile key={post.id} post={post} onClick={() => openPost(post)} index={i} />
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    className="mt-6 text-center"
                >
                    <a
                        href="https://www.instagram.com/illasorvetesoficial/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors"
                    >
                        Ver todos os posts
                        <ExternalLink size={13} />
                    </a>
                </motion.div>
            </div>

            <AnimatePresence>
                {selectedPost && <PostModal post={selectedPost} onClose={closePost} />}
            </AnimatePresence>
        </section>
    )
}
