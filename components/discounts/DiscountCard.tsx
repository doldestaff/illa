'use client'

import { motion } from 'framer-motion'
import { CircleDollarSign } from 'lucide-react'
import Image from 'next/image'

interface DiscountOffer {
    id: string
    title: string
    percent: number
    cost_points: number
    image_path: string
}

interface DiscountCardProps {
    offer: DiscountOffer
    userPoints: number | null
    onRedeem: (offer: DiscountOffer) => void
    isRedeeming: boolean
}

export default function DiscountCard({ offer, userPoints, onRedeem, isRedeeming }: DiscountCardProps) {
    const canAfford = userPoints !== null && userPoints >= offer.cost_points

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="group relative bg-[#1a1a1a] rounded-[2rem] overflow-hidden border border-white/10 shadow-xl"
        >
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                    src={offer.image_path}
                    alt={offer.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-80" />

                {/* Badge */}
                <div className="absolute top-4 right-4 bg-illa-pink text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    {offer.percent}% OFF
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 relative">
                <h3 className="text-xl font-bold text-white mb-2">{offer.title}</h3>
                <div className="flex items-center gap-2 mb-6">
                    <div className="flex items-center gap-1.5 bg-[#FCD34D]/10 text-[#FCD34D] px-2.5 py-1 rounded-lg border border-[#FCD34D]/20">
                        <CircleDollarSign size={14} />
                        <span className="font-bold text-sm">{offer.cost_points} moedas</span>
                    </div>
                </div>

                <button
                    onClick={() => onRedeem(offer)}
                    disabled={!canAfford || isRedeeming}
                    className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${canAfford
                        ? 'bg-gradient-to-r from-illa-pink to-purple-600 text-white hover:shadow-lg hover:shadow-illa-pink/25 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                        }`}
                >
                    {isRedeeming ? 'Processando...' : canAfford ? 'TROCAR AGORA' : 'Saldo Insuficiente'}
                </button>
            </div>
        </motion.div>
    )
}
