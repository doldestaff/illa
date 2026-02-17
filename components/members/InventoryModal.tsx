'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, IceCream, Zap, Clock, Calendar, Search } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'

interface InventoryItem {
    id: string
    title?: string // for drops
    voucher_code?: string // for sorvetes
    expires_at?: string
    claimed_at?: string
    created_at?: string
    reward_type?: string
    reward_value?: number
    is_valid?: boolean
}

interface InventoryData {
    sorvetes: InventoryItem[]
    drops: InventoryItem[]
}

interface Props {
    isOpen: boolean
    onClose: () => void
    initialTab?: 'sorvetes' | 'drops'
}

export default function InventoryModal({ isOpen, onClose, initialTab = 'sorvetes' }: Props) {
    const [activeTab, setActiveTab] = useState<'sorvetes' | 'drops'>(initialTab)
    const [data, setData] = useState<InventoryData>({ sorvetes: [], drops: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            fetchInventory()
        }
    }, [isOpen])

    useEffect(() => {
        setActiveTab(initialTab)
    }, [initialTab])

    const fetchInventory = async () => {
        setLoading(true)
        const supabase = createSupabaseBrowser()
        const { data: result, error } = await supabase.rpc('get_member_inventory')

        if (!error && result) {
            // result is { sorvetes: [], drops: [] }
            setData(result as InventoryData)
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl bg-[#0f0f11] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Search className="text-white/40" size={20} />
                            Seu Inventário
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-2 bg-black/20 gap-2">
                        <button
                            onClick={() => setActiveTab('sorvetes')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'sorvetes'
                                ? 'bg-illa-pink text-white shadow-lg shadow-illa-pink/20'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <IceCream size={16} />
                            Meus Sorvetes
                            <span className="bg-black/20 px-1.5 py-0.5 rounded-md text-[10px]">
                                {data.sorvetes.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('drops')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'drops'
                                ? 'bg-illa-yellow text-white shadow-lg shadow-illa-yellow/20'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Zap size={16} />
                            Histórico de Drops
                            <span className="bg-black/20 px-1.5 py-0.5 rounded-md text-[10px]">
                                {data.drops.length}
                            </span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-8 h-8 border-2 border-white/10 border-t-illa-pink rounded-full animate-spin" />
                                <p className="text-white/30 text-xs animate-pulse">Carregando inventário...</p>
                            </div>
                        ) : activeTab === 'sorvetes' ? (
                            // SORVETES LIST
                            <div className="space-y-3">
                                {data.sorvetes.length === 0 ? (
                                    <EmptyState
                                        icon={<IceCream size={48} />}
                                        title="Nenhum Sorvete Ainda"
                                        description="Resgate seus pontos por vouchers de sorvete na loja!"
                                    />
                                ) : (
                                    data.sorvetes.map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-illa-pink/20 flex items-center justify-center text-illa-pink">
                                                    <IceCream size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg tracking-wider font-mono">
                                                        {item.voucher_code}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                                                        <Calendar size={12} />
                                                        <span>Expira em: {new Date(item.expires_at!).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.is_valid
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    }`}>
                                                    {item.is_valid ? 'ATIVO' : 'EXPIRADO'}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        ) : (
                            // DROPS LIST
                            <div className="space-y-3">
                                {data.drops.length === 0 ? (
                                    <EmptyState
                                        icon={<Zap size={48} />}
                                        title="Nenhum Drop Encontrado"
                                        description="Fique atento aos alertas de Flash Drops!"
                                    />
                                ) : (
                                    data.drops.map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                    <Zap size={24} fill="currentColor" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white">
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                                                        <Clock size={12} />
                                                        <span>Resgatado em: {new Date(item.claimed_at!).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right pt-2 px-3 bg-black/20 rounded-lg">
                                                <span className="text-[10px] text-white/30 block uppercase font-bold">Recompensa</span>
                                                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-illa-yellow to-amber-500">
                                                    +{item.reward_value} {item.reward_type === 'points' ? 'Moedas' : 'XP'}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-white/40 max-w-xs">{description}</p>
        </div>
    )
}
