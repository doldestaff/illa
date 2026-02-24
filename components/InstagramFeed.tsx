'use client'

import { useState, useCallback, useEffect } from 'react'
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

function PostTile({ post, onClick }: { post: InstaPost; onClick: () => void }) {
    return (
        <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            className="relative aspect-square overflow-hidden rounded-2xl group cursor-pointer focus:outline-none focus:ring-4 focus:ring-illa-pink/50 bg-gray-100"
        >
            <Image
                src={post.imageUrl}
                alt={post.caption.slice(0, 60)}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 33vw, 25vw"
            />

            {/* Reel badge */}
            {post.type === 'reel' && (
                <div className="absolute top-2.5 right-2.5 z-10">
                    <Play size={16} className="text-white drop-shadow-lg fill-white" />
                </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5">
                <Heart size={18} className="text-white fill-white drop-shadow" />
                <span className="text-white font-bold text-sm drop-shadow">{post.likes.toLocaleString('pt-BR')}</span>
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
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-[2rem] overflow-hidden shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
                    aria-label="Fechar"
                >
                    <X size={16} />
                </button>

                {/* Always show local thumbnail */}
                <div className="relative aspect-square shrink-0">
                    <Image
                        src={post.imageUrl}
                        alt={post.caption.slice(0, 60)}
                        fill
                        className="object-cover"
                        sizes="560px"
                    />

                    {/* Reel: Big centered play button that opens Instagram */}
                    {post.type === 'reel' ? (
                        <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                        >
                            {/* Play circle */}
                            <div className="w-[72px] h-[72px] rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all flex items-center justify-center shadow-2xl backdrop-blur-sm">
                                <Play size={32} className="text-illa-pink fill-illa-pink ml-1" />
                            </div>
                            <span className="mt-3 text-white text-sm font-bold tracking-wide bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
                                Assistir no Instagram
                            </span>
                        </a>
                    ) : (
                        /* Image: small bottom overlay link */
                        <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors whitespace-nowrap"
                        >
                            <Instagram size={12} /> Ver no Instagram
                        </a>
                    )}
                </div>

                {/* Content panel */}
                <div className="flex flex-col p-6 overflow-y-auto flex-1 min-h-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E1306C] via-[#C13584] to-[#833AB4] flex items-center justify-center shrink-0 shadow">
                            <Instagram size={17} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-dark leading-none">illasorvetesoficial</p>
                            <p className="text-xs text-dark/40 mt-0.5">Maceió, AL</p>
                        </div>
                    </div>

                    <p className="text-sm text-dark/80 leading-relaxed flex-1 mb-4">{post.caption}</p>

                    <div className="flex items-center gap-2 mb-5">
                        <Heart size={15} className="text-illa-pink fill-illa-pink" />
                        <span className="text-sm font-bold text-dark">{post.likes.toLocaleString('pt-BR')} curtidas</span>
                    </div>

                    <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E1306C] to-[#F77737] text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all text-sm"
                    >
                        <ExternalLink size={15} />
                        Ver no Instagram
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

    return (
        <section className="py-20 md:py-28 bg-gradient-to-b from-white via-rose-50/30 to-white overflow-hidden">
            <div className="container mx-auto px-4">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10"
                >
                    <div>
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-illa-pink to-orange-500 text-white text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-3 shadow-md shadow-illa-pink/20">
                            <Instagram size={13} />
                            Instagram
                        </div>
                        <h2 className="font-script text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-dark to-dark/80 pt-2 pb-1">
                            Siga a gente! 🍦
                        </h2>
                        <p className="text-dark/50 mt-1 text-base">
                            Os momentos mais gostosos estão lá:{' '}
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-illa-pink to-orange-500">@illasorvetesoficial</span>
                        </p>
                    </div>

                    <a
                        href="https://www.instagram.com/illasorvetesoficial/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-illa-pink to-orange-500 text-white font-bold px-6 py-3 rounded-full hover:shadow-xl hover:shadow-illa-pink/30 hover:scale-[1.03] transition-all text-sm shadow-md"
                    >
                        <Instagram size={16} />
                        Seguir no Instagram
                    </a>
                </motion.div>

                {/* Grid 3×3 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-3 gap-2 md:gap-3"
                >
                    {posts.map(post => (
                        <PostTile key={post.id} post={post} onClick={() => openPost(post)} />
                    ))}
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-8 text-center"
                >
                    <a
                        href="https://www.instagram.com/illasorvetesoficial/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-illa-pink/70 hover:text-orange-500 transition-colors"
                    >
                        Ver todos os posts
                        <ExternalLink size={14} />
                    </a>
                </motion.div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedPost && <PostModal post={selectedPost} onClose={closePost} />}
            </AnimatePresence>
        </section>
    )
}
