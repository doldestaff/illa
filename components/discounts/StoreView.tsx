'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, History, Tag, LogIn, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import DiscountCard from './DiscountCard'
import RedeemModal from './RedeemModal'
import { useRouter } from 'next/navigation'

interface DiscountOffer {
    id: string
    title: string
    percent: number
    cost_points: number
    image_path: string
}

interface Redemption {
    id: number
    voucher_code: string
    status: string
    title: string
    image_path: string
    percent: number
    expires_at: string
    created_at: string
}

interface Props {
    offers: DiscountOffer[]
    userPoints: number | null
    initialRedemptions: Redemption[]
}

export default function StoreView({ offers, userPoints, initialRedemptions }: Props) {
    const [points, setPoints] = useState(userPoints)
    const [redemptions, setRedemptions] = useState(initialRedemptions)
    const [selectedOffer, setSelectedOffer] = useState<DiscountOffer | null>(null)
    const [isRedeeming, setIsRedeeming] = useState(false)
    const [redemptionResult, setRedemptionResult] = useState<{ voucher_code: string, expires_at: string, remaining_points: number } | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const router = useRouter()

    const handleOfferClick = (offer: DiscountOffer) => {
        if (points === null) {
            router.push('/?login=1')
            return
        }
        setSelectedOffer(offer)
        setIsModalOpen(true)
        setRedemptionResult(null)
    }

    const handleConfirmRedeem = async () => {
        if (!selectedOffer || points === null) return

        setIsRedeeming(true)
        try {
            const res = await fetch('/api/discounts/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offer_id: selectedOffer.id })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Erro ao resgatar')

            // Success
            setRedemptionResult(data)
            setPoints(data.remaining_points)

            // Add to history optimistically
            const newRedemption: Redemption = {
                id: Date.now(), // temp id
                voucher_code: data.voucher_code,
                status: 'issued',
                title: selectedOffer.title,
                image_path: selectedOffer.image_path,
                percent: selectedOffer.percent,
                expires_at: data.expires_at,
                created_at: new Date().toISOString()
            }
            setRedemptions([newRedemption, ...redemptions])

        } catch (err) {
            alert('Falha no resgate: ' + (err as Error).message)
            setIsModalOpen(false)
        } finally {
            setIsRedeeming(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-illa-pink selection:text-white pb-20">
            {/* Header / Hero */}
            <div className="relative pt-24 pb-12 px-6 overflow-hidden">
                {/* Ambient Background for Header */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] opacity-50" />
                    <div className="absolute top-20 left-20 w-[300px] h-[300px] bg-pink-600/20 rounded-full blur-[80px] opacity-40" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                </div>

                {/* Back Button */}
                <Link
                    href="/members"
                    className="absolute top-8 left-6 md:left-12 p-3 bg-white/5 border border-white/10 rounded-full text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 transition-all z-50 backdrop-blur-md group"
                    title="Voltar para Dashboard"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </Link>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
                                <Sparkles size={12} className="text-amber-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Exclusive Rewards</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 drop-shadow-2xl">
                                <span className="text-white">Loja de </span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-illa-pink via-purple-400 to-indigo-400 animate-gradient-x">
                                    Descontos
                                </span>
                            </h1>
                            <p className="text-white/60 max-w-lg text-lg leading-relaxed font-medium">
                                Troque suas moedas por descontos reais.
                                <br />
                                <span className="text-white/40 text-sm">Ofertas renovadas mensalmente para membros VIP.</span>
                            </p>
                        </div>

                        {/* Balance Card - Premium & Consistent */}
                        {points !== null ? (
                            <div className="bg-black/40 border border-white/10 rounded-3xl p-6 flex items-center gap-5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-50" />

                                <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] shadow-[0_4px_12px_rgba(245,158,11,0.4)] border border-[#FCD34D]/50 group-hover:scale-110 transition-transform duration-500">
                                    <span className="text-[#78350F] font-black text-2xl leading-none pt-1">$</span>
                                </div>

                                <div className="relative z-10">
                                    <p className="text-[10px] text-[#FCD34D] uppercase tracking-[0.2em] font-bold mb-1">Seu Saldo</p>
                                    <p className="text-4xl font-black text-white tabular-nums tracking-tight drop-shadow-lg">
                                        {points.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/?login=1"
                                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md transition-colors"
                            >
                                <div className="bg-white/10 p-2 rounded-full">
                                    <LogIn className="text-white" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Faça Login</p>
                                    <p className="text-xs text-white/40">para ver seu saldo</p>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Offers Grid */}
            <div className="max-w-7xl mx-auto px-6 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {offers.map((offer) => (
                        <DiscountCard
                            key={offer.id}
                            offer={offer}
                            userPoints={points}
                            onRedeem={handleOfferClick}
                            isRedeeming={isRedeeming}
                        />
                    ))}
                </div>
            </div>

            {/* My History */}
            {points !== null && redemptions.length > 0 && (
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-2 mb-6 text-white/40 uppercase tracking-widest font-bold text-sm">
                        <History size={16} />
                        <h2>Meus Resgates</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {redemptions.map((redemption) => (
                            <div key={redemption.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 hover:bg-white/10 transition-colors">
                                <div className="w-16 h-16 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
                                    <span className="text-xl font-bold text-illa-pink">-{redemption.percent}%</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white truncate">{redemption.title}</h4>
                                    <code className="block text-emerald-400 font-mono text-sm my-1">{redemption.voucher_code}</code>
                                    <p className="text-xs text-white/30">Expira em {new Date(redemption.expires_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            <RedeemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                offer={selectedOffer}
                userPoints={points || 0}
                onConfirm={handleConfirmRedeem}
                isRedeeming={isRedeeming}
                redemptionResult={redemptionResult}
            />
        </div>
    )
}
