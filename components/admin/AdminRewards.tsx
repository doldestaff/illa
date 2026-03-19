'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Gift, RefreshCw, X, Play, Pause, Save, Coins } from 'lucide-react'

interface Reward {
    id: string
    title: string
    description: string
    required_level: number
    cost_points: number
    estimated_cost_brl: number
    max_per_week: number | null
    max_per_month: number | null
    validity_hours: number
    current_stock: number | null
    active: boolean
    used_count: number
}

export default function AdminRewards() {
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingReward, setEditingReward] = useState<Reward | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [toggling, setToggling] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        required_level: 0,
        cost_points: 100,
        estimated_cost_brl: 0.00,
        max_per_week: '',
        max_per_month: '',
        validity_hours: 168, // 7 days
        current_stock: '',
        active: true
    })

    const fetchRewards = async () => {
        try {
            const res = await fetch('/api/admin/rewards')
            if (!res.ok) throw new Error('Falha ao carregar recompensas')
            const data = await res.json()
            setRewards(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRewards()
    }, [])

    const openCreateForm = () => {
        setEditingReward(null)
        setFormData({
            title: '',
            description: '',
            required_level: 0,
            cost_points: 100,
            estimated_cost_brl: 0.00,
            max_per_week: '',
            max_per_month: '',
            validity_hours: 168,
            current_stock: '',
            active: true
        })
        setIsFormOpen(true)
    }

    const openEditForm = (reward: Reward) => {
        setEditingReward(reward)
        setFormData({
            title: reward.title,
            description: reward.description || '',
            required_level: reward.required_level,
            cost_points: reward.cost_points,
            estimated_cost_brl: reward.estimated_cost_brl || 0,
            max_per_week: reward.max_per_week?.toString() || '',
            max_per_month: reward.max_per_month?.toString() || '',
            validity_hours: reward.validity_hours || 168,
            current_stock: reward.current_stock?.toString() || '',
            active: reward.active
        })
        setIsFormOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            ...formData,
            max_per_week: formData.max_per_week ? parseInt(formData.max_per_week) : null,
            max_per_month: formData.max_per_month ? parseInt(formData.max_per_month) : null,
            current_stock: formData.current_stock ? parseInt(formData.current_stock) : null,
        }

        try {
            if (editingReward) {
                const res = await fetch('/api/admin/rewards', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingReward.id, ...payload })
                })
                if (!res.ok) throw new Error()
            } else {
                const res = await fetch('/api/admin/rewards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                if (!res.ok) throw new Error()
            }

            await fetchRewards()
            setIsFormOpen(false)
        } catch (err) {
            alert('Erro ao salvar recompensa')
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        setToggling(id)
        try {
            const res = await fetch('/api/admin/rewards', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, active: !currentActive })
            })
            if (!res.ok) throw new Error()
            setRewards(prev => prev.map(r => r.id === id ? { ...r, active: !currentActive } : r))
        } catch (err) {
            alert('Erro ao alterar status')
        } finally {
            setToggling(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta recompensa permanentemente?')) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/admin/rewards?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            setRewards(prev => prev.filter(r => r.id !== id))
        } catch (err) {
            alert('Erro ao excluir')
        } finally {
            setDeleting(null)
        }
    }

    const activeRewards = rewards.filter(r => r.active)
    const pausedRewards = rewards.filter(r => !r.active)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <RefreshCw size={24} className="animate-spin text-white/30" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                        <Gift size={20} className="text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Controle de Recompensas</h2>
                        <p className="text-sm text-white/40">Gerencie sorvetes e brindes disponíveis na loja</p>
                    </div>
                </div>
                <button
                    onClick={openCreateForm}
                    className="bg-white text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/90 transition-all shadow-lg"
                >
                    <Plus size={16} /> Nova Recompensa
                </button>
            </div>

            {/* Form Modal/Section */}
            {isFormOpen && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
                    <button
                        onClick={() => setIsFormOpen(false)}
                        className="absolute top-4 right-4 text-white/40 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        {editingReward ? <Edit2 size={18} className="text-pink-400" /> : <Plus size={18} className="text-pink-400" />}
                        {editingReward ? 'Editar Recompensa' : 'Criar Recompensa'}
                    </h3>

                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-white/40">Título do Cardápio</label>
                            <input
                                required
                                type="text"
                                placeholder="Ex: 2 Bolas na Casquinha"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-white/40">Descrição</label>
                            <input
                                type="text"
                                placeholder="Opcional. Ex: Sabores tradicionais apenas."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-white/40">Custo (Moedas ILLA)</label>
                            <input
                                required
                                type="number"
                                min="1"
                                value={formData.cost_points}
                                onChange={e => setFormData({ ...formData, cost_points: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500/50 text-yellow-100 font-bold"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-white/40">Custo Estimado Interno (R$)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.estimated_cost_brl}
                                onChange={e => setFormData({ ...formData, estimated_cost_brl: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500/50"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-white/40">Limite de resgates por SEMANA (Opcional)</label>
                            <input
                                type="number"
                                placeholder="Ilimitado"
                                value={formData.max_per_week}
                                onChange={e => setFormData({ ...formData, max_per_week: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-white/40">Validade do Voucher (Horas)</label>
                            <input
                                required
                                type="number"
                                min="1"
                                value={formData.validity_hours}
                                onChange={e => setFormData({ ...formData, validity_hours: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50"
                            />
                        </div>

                        <div className="md:col-span-2 pt-4 flex justify-end gap-3 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold text-sm transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm transition-all flex items-center gap-2"
                            >
                                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                Salvar Recompensa
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Rewards Lists */}
            <div className="space-y-8">
                {/* Active Rewards */}
                <div className="space-y-4">
                    <h3 className="font-bold text-white/60 flex items-center gap-2">
                        <Play size={16} className="text-emerald-400" /> Recompensas Ativas ({activeRewards.length})
                    </h3>
                    {activeRewards.length === 0 ? (
                        <div className="p-8 text-center text-white/30 border border-dashed border-white/10 rounded-2xl text-sm">
                            Nenhuma recompensa ativa.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeRewards.map(reward => <RewardCard key={reward.id} reward={reward} onEdit={() => openEditForm(reward)} onToggle={() => handleToggleActive(reward.id, reward.active)} onDelete={() => handleDelete(reward.id)} toggling={toggling === reward.id} deleting={deleting === reward.id} />)}
                        </div>
                    )}
                </div>

                {/* Paused Rewards */}
                {pausedRewards.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-white/60 flex items-center gap-2">
                            <Pause size={16} className="text-amber-400" /> Recompensas Pausadas ({pausedRewards.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                            {pausedRewards.map(reward => <RewardCard key={reward.id} reward={reward} onEdit={() => openEditForm(reward)} onToggle={() => handleToggleActive(reward.id, reward.active)} onDelete={() => handleDelete(reward.id)} toggling={toggling === reward.id} deleting={deleting === reward.id} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function RewardCard({ reward, onEdit, onToggle, onDelete, toggling, deleting }: { reward: Reward, onEdit: () => void, onToggle: () => void, onDelete: () => void, toggling: boolean, deleting: boolean }) {
    return (
        <div className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${reward.active ? 'bg-white/5 border-white/10 hover:border-pink-500/30' : 'bg-black/40 border-white/5 grayscale-[50%]'}`}>
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded-md text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
                        <Coins size={10} /> {reward.cost_points} Moedas
                    </div>
                    <div className="flex gap-1">
                        <button onClick={onEdit} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                            <Edit2 size={14} />
                        </button>
                    </div>
                </div>

                <h4 className="font-bold text-lg mb-1 leading-tight text-white">{reward.title}</h4>
                {reward.description && <p className="text-xs text-white/40 mb-3">{reward.description}</p>}

                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] tracking-wide text-white/50 bg-black/20 p-3 rounded-xl">
                    <div>
                        <span className="block font-bold mb-0.5 text-white/30">CUSTO EST.</span>
                        R$ {reward.estimated_cost_brl.toFixed(2)}
                    </div>
                    <div>
                        <span className="block font-bold mb-0.5 text-white/30">VALIDADE</span>
                        {reward.validity_hours}h
                    </div>
                    <div>
                        <span className="block font-bold mb-0.5 text-white/30">LIMITE/SEM.</span>
                        {reward.max_per_week ? reward.max_per_week : 'Sem limite'}
                    </div>
                    <div>
                        <span className="block font-bold mb-0.5 text-white/30">RESGATES</span>
                        {reward.used_count || 0}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button
                    onClick={onToggle}
                    disabled={toggling}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${reward.active ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}
                >
                    {toggling ? <RefreshCw size={14} className="animate-spin" /> : reward.active ? <Pause size={14} /> : <Play size={14} />}
                    {reward.active ? 'Pausar' : 'Ativar'}
                </button>
                <button
                    onClick={onDelete}
                    disabled={deleting}
                    className="px-3 py-2 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                >
                    {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
            </div>
        </div>
    )
}
