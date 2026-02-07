'use client'

import { motion } from 'framer-motion'
import {
    Info,
    Store,
    Handshake,
    ShoppingBag,
    MapPin,
    Instagram,
    Facebook,
    IceCream
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BrandDecor } from './BrandDecor'

const cards = [
    {
        id: 1,
        title: 'Sobre Nós',
        description: 'Conheça nossa história e paixão.',
        icon: Info,
        href: '#about',
        color: 'bg-white',
        textColor: 'text-dark'
    },
    {
        id: 2,
        title: 'Seja um Franqueado',
        description: 'Leve a Illa para sua cidade.',
        icon: Store,
        href: '#franchise',
        color: 'bg-illa-pink',
        textColor: 'text-white'
    },
    {
        id: 3,
        title: 'Seja Parceiro',
        description: 'Revenda Illa no seu negócio.',
        icon: Handshake,
        href: '#partner',
        color: 'bg-white',
        textColor: 'text-dark'
    },
    {
        id: 4,
        title: 'Faça seu Pedido',
        description: 'Receba Illa em casa.',
        icon: ShoppingBag,
        href: '/pedido',
        color: 'bg-illa-yellow',
        textColor: 'text-dark'
    },
    {
        id: 5,
        title: 'Nossas Lojas',
        description: 'Encontre a Illa mais próxima.',
        icon: MapPin,
        href: '#locations',
        color: 'bg-white',
        textColor: 'text-dark'
    },
    {
        id: 6,
        title: 'Nossos Produtos',
        description: 'Descubra sabores incríveis.',
        icon: IceCream,
        href: '#products',
        color: 'bg-white',
        textColor: 'text-dark'
    },
    {
        id: 7,
        title: 'Instagram',
        description: '@illasorvetesoficial',
        icon: Instagram,
        href: 'https://instagram.com/illasorvetesoficial',
        external: true,
        color: 'bg-gradient-to-tr from-purple-500 to-pink-500',
        textColor: 'text-white'
    },
    {
        id: 8,
        title: 'Facebook',
        description: 'Acompanhe novidades.',
        icon: Facebook,
        href: 'https://facebook.com',
        external: true,
        color: 'bg-blue-600',
        textColor: 'text-white'
    }
]

export function LinktreeCards() {
    return (
        <section className="py-20 bg-soft-gray/30 relative overflow-hidden">
            {/* Decorative Blob */}
            {/* Decorative Blob */}
            <BrandDecor className="top-0 right-0 -translate-y-1/2 translate-x-1/4" size={500} speed={0.15} opacity={0.08} />

            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-script text-4xl md:text-5xl text-illa-pink mb-4">Explore o Mundo Illa</h2>
                    <p className="text-dark/60">Tudo o que você precisa a um clique de distância.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={card.href}
                                target={card.external ? '_blank' : undefined}
                                rel={card.external ? 'noopener noreferrer' : undefined}
                                className={cn(
                                    'block p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group h-full',
                                    card.color,
                                    card.textColor
                                )}
                            >
                                {/* Background Hover Effect */}
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 flex flex-col items-center text-center h-full justify-center gap-4">
                                    <div className={cn(
                                        "p-4 rounded-full transition-transform group-hover:scale-110 duration-300",
                                        card.textColor === 'text-white' ? 'bg-white/20' : 'bg-illa-pink/10 text-illa-pink'
                                    )}>
                                        <card.icon size={32} />
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-xl mb-1">{card.title}</h3>
                                        <p className={cn("text-sm opacity-80", card.textColor === 'text-white' ? 'text-white/90' : 'text-dark/60')}>
                                            {card.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
