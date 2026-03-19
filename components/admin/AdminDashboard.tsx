'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Minus, IceCream, RefreshCw, LogOut, BarChart3, Users, Target, CheckCircle, Droplet, Zap, Trash2, Clock, Gift, Search, MessageSquare, Eye, EyeOff, Star, Coins } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import GlobalCoin from '@/components/ui/GlobalCoin'
import AdminPulse from './AdminPulse'
import AdminRewards from './AdminRewards'
import AdminCoins from './AdminCoins'
import AdminDrops from './AdminDrops'
import AdminValidation from './AdminValidation'
import AdminFinancial from './AdminFinancial'
import AdminRiskLimiter from './AdminRiskLimiter'

interface UserSorvetes {
    id: string
    full_name: string | null
    email: string | null
    sorvetes_count: number
    xp: number
    points: number
    drops: number
}

interface AdminReview {
    id: string
    name: string
    role: string
    instagram: string
    text: string
    rating: number
    created_at: string
    user_id: string | null
    approved: boolean
}

interface UserMission {
    instance_id: string
    title: string
    reward_xp: number
    reward_points: number
    progress: number
    target: number
    completed: boolean
    claimed: boolean
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<UserSorvetes[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [view, setView] = useState<'table' | 'chart'>('table')

    // === TABS: Pulse | Sorvetes | Loja | Missões | Saldo | Drops | Reviews ===
    const [activeTab, setActiveTab] = useState<'pulse' | 'balance' | 'recompensas' | 'moedas' | 'drops' | 'validacao' | 'financeiro' | 'risco'>('pulse')

    // === DATA STATES ===
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [discountStats, setDiscountStats] = useState<any>(null)

    // === REVIEWS STATE ===
    const [reviews, setReviews] = useState<AdminReview[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [reviewsFilter, setReviewsFilter] = useState<'all' | 'visible' | 'hidden'>('all')
    const [reviewSearch, setReviewSearch] = useState('')
    const [togglingReview, setTogglingReview] = useState<string | null>(null)
    const [deletingReview, setDeletingReview] = useState<string | null>(null)

    const fetchReviews = useCallback(async () => {
        setReviewsLoading(true)
        try {
            const res = await fetch('/api/admin/reviews')
            if (res.ok) {
                const data = await res.json()
                setReviews(Array.isArray(data) ? data : [])
            }
        } catch { /* silent */ } finally {
            setReviewsLoading(false)
        }
    }, [])

    const handleToggleReview = async (id: string, currentApproved: boolean) => {
        setTogglingReview(id)
        try {
            const res = await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, approved: !currentApproved }),
            })
            if (res.ok) {
                setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: !currentApproved } : r))
            } else {
                const errData = await res.json().catch(() => ({}))
                console.error('Toggle review failed:', res.status, errData)
                alert(`Erro ao ${currentApproved ? 'ocultar' : 'revelar'} review: ${errData.error || res.statusText}`)
            }
        } catch (err) {
            console.error('Toggle review error:', err)
            alert('Erro de conexão ao alterar review.')
        } finally {
            setTogglingReview(null)
        }
    }

    const handleDeleteReview = async (id: string) => {
        if (!confirm('Excluir este comentário permanentemente?')) return
        setDeletingReview(id)
        try {
            const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setReviews(prev => prev.filter(r => r.id !== id))
            } else {
                const errData = await res.json().catch(() => ({}))
                console.error('Delete review failed:', res.status, errData)
                alert(`Erro ao excluir review: ${errData.error || res.statusText}`)
            }
        } catch (err) {
            console.error('Delete review error:', err)
            alert('Erro de conexão ao excluir review.')
        } finally {
            setDeletingReview(null)
        }
    }

    // === BALANCE STATE ===
    const [balanceForm, setBalanceForm] = useState({ xp: 0, points: 0, drops: 0 })
    const [updatingBalance, setUpdatingBalance] = useState(false)

    // === MISSIONS STATE ===
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [userMissions, setUserMissions] = useState<UserMission[]>([])
    const [missionsLoading, setMissionsLoading] = useState(false)
    const [newMission, setNewMission] = useState({ title: '', xp: 50, points: 20 })
    const [creatingMission, setCreatingMission] = useState(false)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/users')
            const data = await res.json()
            if (Array.isArray(data)) {
                setUsers(data)
            }
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleAction = async (userId: string, action: 'add' | 'subtract') => {
        setActionLoading(`${userId}-${action}`)
        try {
            await fetch('/api/admin/sorvetes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, action }),
            })
            await fetchUsers()
        } catch {
            // silent
        } finally {
            setActionLoading(null)
        }
    }

    const handleDropAction = async (userId: string, amount: number) => {
        const actionKey = `${userId}-drop-${amount > 0 ? 'add' : 'sub'}`
        setActionLoading(actionKey)
        try {
            await fetch('/api/admin/balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_user_id: userId,
                    xp_amount: 0,
                    points_amount: 0,
                    drops_amount: amount
                })
            })
            await fetchUsers()
        } catch (err) {
            console.error(err)
            alert('Erro ao atualizar drops')
        } finally {
            setActionLoading(null)
        }
    }

    const handleLogout = async () => {
        const supabase = createSupabaseBrowser()
        await supabase.auth.signOut()
        window.location.reload()
    }

    const maxSorvetes = Math.max(1, ...users.map((u) => u.sorvetes_count))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    // === SURPRISE DROPS STATE ===
    // eslint-disable-next-line @typescript-eslint/no-explicit-any



    // === FETCHERS ===
    // === LOJA FETCH ===
    

    

    // === MISSIONS LOGIC ===
    const fetchUserMissions = async (userId: string) => {
        setMissionsLoading(true)
        try {
            // NOTE: We rely on a hypothetical GET endpoint or we assume we can't fetch yet?
            // User asked to see what missions they did. 
            // Since we don't have a direct endpoint for this yet in the plan, I'll mock it or 
            // just implement the fetch logic if I add the route.
            // For now, let's assume I'll add GET to the same route I just made.
            const res = await fetch(`/api/admin/missions?user_id=${userId}`, {
                credentials: 'include'
            })
            if (res.ok) {
                const data = await res.json()
                setUserMissions(data)
            } else {
                setUserMissions([])
            }
        } catch {
            setUserMissions([])
        } finally {
            setMissionsLoading(false)
        }
    }

    const handleSelectUserForMissions = (userId: string) => {
        if (selectedUserId === userId) {
            setSelectedUserId(null)
            setUserMissions([])
        } else {
            setSelectedUserId(userId)
            fetchUserMissions(userId)
        }
    }

    const handleUpdateBalance = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUserId) return

        if (balanceForm.xp === 0 && balanceForm.points === 0 && balanceForm.drops === 0) {
            alert('Insira um valor de XP, Pontos ou Drops para adicionar/remover.')
            return
        }

        setUpdatingBalance(true)
        try {
            const res = await fetch('/api/admin/balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_user_id: selectedUserId,
                    xp_amount: Number(balanceForm.xp),
                    points_amount: Number(balanceForm.points),
                    drops_amount: Number(balanceForm.drops)
                }),
            })

            const data = await res.json()

            if (res.ok && data.success) {
                alert(`Saldo atualizado!\nNovo XP total: ${data.new_xp}\nNovos Pontos totais: ${data.new_points}\nNovos Drops totais: ${data.new_drops}`)
                setBalanceForm({ xp: 0, points: 0, drops: 0 })
                // Refresh user list to show updated totals if we were showing them
                fetchUsers()
            } else {
                alert(`Erro: ${data.error || 'Falha ao atualizar'}`)
            }
        } catch (err) {
            console.error(err)
            alert('Erro ao conectar com servidor')
        } finally {
            setUpdatingBalance(false)
        }
    }

    const handleCreateMission = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUserId) return

        setCreatingMission(true)
        try {
            const res = await fetch('/api/admin/missions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_user_id: selectedUserId,
                    title: newMission.title,
                    xp: Number(newMission.xp),
                    points: Number(newMission.points)
                }),
            })

            if (res.ok) {
                // Refresh missions list
                await fetchUserMissions(selectedUserId)
                setNewMission({ title: '', xp: 50, points: 20 }) // Reset form
                alert('Missão criada com sucesso!')
            } else {
                alert('Erro ao criar missão')
            }
        } catch (err) {
            console.error(err)
            alert('Erro ao criar missão')
        } finally {
            setCreatingMission(false)
        }
    }



    return (
        <div className="min-h-screen bg-[#0B0B0D] text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0B0B0D]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-illa-pink/20 flex items-center justify-center">
                            <IceCream size={20} className="text-illa-pink" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Painel Admin</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 text-[11px] font-bold tracking-wide">
                                <button
                                    onClick={() => setActiveTab('balance')}
                                    className={`uppercase transition-colors ${activeTab === 'balance' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Saldo & XP
                                </button>
                                <span className="text-white/20">|</span>
                                <button
                                    onClick={() => setActiveTab('recompensas')}
                                    className={`uppercase transition-colors ${activeTab === 'recompensas' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Recompensas
                                </button>
                                <span className="text-white/20">|</span>
                                <button
                                    onClick={() => setActiveTab('moedas')}
                                    className={`uppercase transition-colors ${activeTab === 'moedas' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Moedas
                                </button>
                                <span className="text-white/20">|</span>
                                <button
                                    onClick={() => setActiveTab('drops')}
                                    className={`uppercase transition-colors ${activeTab === 'drops' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Drops
                                </button>
                                <span className="text-white/20">|</span>
                                <button
                                    onClick={() => setActiveTab('validacao')}
                                    className={`uppercase transition-colors ${activeTab === 'validacao' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Validador QR
                                </button>
                                <span className="text-white/20">|</span>
                                <button
                                    onClick={() => setActiveTab('financeiro')}
                                    className={`uppercase transition-colors ${activeTab === 'financeiro' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Financeiro
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeTab === 'balance' && (
                            <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
                                <button
                                    onClick={() => setView('table')}
                                    className={`p-2 rounded-md transition-all ${view === 'table' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                                >
                                    <Users size={16} />
                                </button>
                                <button
                                    onClick={() => setView('chart')}
                                    className={`p-2 rounded-md transition-all ${view === 'chart' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                                >
                                    <BarChart3 size={16} />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (activeTab === 'balance') fetchUsers()
                            }}
                            title="Atualizar"
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <RefreshCw size={16} className={(loading || missionsLoading || reviewsLoading) ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={handleLogout}
                            title="Sair"
                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`mx-auto pb-6 ${activeTab === 'pulse' ? 'max-w-6xl px-4 py-8' : 'max-w-4xl px-4 py-6'}`}>

                {/* === PULSE VIEW === */}
                {activeTab === 'pulse' && (
                    <AdminPulse />
                )}

                {/* === BALANCE VIEW === */}
                {activeTab === 'balance' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white/5 rounded-3xl border border-white/10 p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -z-10" />

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-green-500/20 rounded-2xl text-green-400">
                                    <div className="relative">
                                        <GlobalCoin size="md" />
                                        <div className="absolute -top-1 -right-1">
                                            <Plus size={12} className="text-white bg-green-600 rounded-full p-0.5" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Gerenciamento de Saldo</h2>
                                    <p className="text-gray-400">Adicione ou remova XP e Moedas manualmente.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[450px] md:h-[600px]">
                                {/* User Selection List */}
                                <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-white/10 bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                        <h3 className="font-bold text-sm text-white">Selecionar Membro</h3>
                                        <input
                                            type="text"
                                            placeholder="Buscar..."
                                            className="w-full mt-2 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-green-500/50 transition-colors"
                                        />
                                    </div>
                                    <div className="divide-y divide-white/5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full px-1">
                                        {users.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => setSelectedUserId(u.id)}
                                                className={`w-full text-left p-4 hover:bg-white/5 transition-all flex items-center justify-between group ${selectedUserId === u.id ? 'bg-green-500/10 border-l-4 border-green-500' : 'border-l-4 border-transparent'}`}
                                            >
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-bold truncate ${selectedUserId === u.id ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                                                        {u.full_name || 'Usuário'}
                                                    </p>
                                                    <p className="text-[10px] text-white/40 truncate">{u.email}</p>
                                                </div>
                                                {selectedUserId === u.id && <CheckCircle size={16} className="text-green-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Area */}
                                <div className="md:col-span-2">
                                    {!selectedUserId ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 rounded-2xl bg-black/20 text-white/30">
                                            <Users size={48} className="mb-4 opacity-50" />
                                            <p className="text-lg font-medium">Selecione um membro ao lado</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 h-full flex flex-col">
                                            {/* Selected User Info */}
                                            <div className="bg-black/30 p-6 rounded-2xl border border-white/5">
                                                <h3 className="text-sm font-bold mb-4 text-white/60 uppercase tracking-wider flex items-center gap-2">
                                                    <Target size={14} /> Dados Atuais
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                        <div className="text-xs text-white/40 mb-1">XP Total</div>
                                                        <div className="text-2xl font-mono font-bold text-white">
                                                            {users.find(u => u.id === selectedUserId)?.sorvetes_count !== undefined
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                ? (users.find(u => u.id === selectedUserId) as any).xp || '0'
                                                                : '0'}
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                        <div className="text-xs text-white/40 mb-1">Moedas</div>
                                                        <div className="text-2xl font-mono font-bold text-[#FCD34D]">
                                                            {users.find(u => u.id === selectedUserId)?.sorvetes_count !== undefined
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                ? (users.find(u => u.id === selectedUserId) as any).points || '0'
                                                                : '0'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Edit Form */}
                                            <form onSubmit={handleUpdateBalance} className="bg-white/5 p-6 rounded-2xl border border-white/10 flex-1 flex flex-col justify-center space-y-8">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">XP (Adicionar/Remover)</label>
                                                        <div className="relative group/input">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 transition-transform group-focus-within/input:scale-110">
                                                                <Target size={18} />
                                                            </div>
                                                            <input
                                                                type="number"
                                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white text-lg font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                                                placeholder="0"
                                                                value={balanceForm.xp}
                                                                onChange={(e) => setBalanceForm({ ...balanceForm, xp: parseInt(e.target.value) || 0 })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Moedas (Adicionar/Remover)</label>
                                                        <div className="relative group/input">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400 transition-transform group-focus-within/input:scale-110">
                                                                <GlobalCoin size="sm" />
                                                            </div>
                                                            <input
                                                                type="number"
                                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white text-lg font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                                                                placeholder="0"
                                                                value={balanceForm.points}
                                                                onChange={(e) => setBalanceForm({ ...balanceForm, points: parseInt(e.target.value) || 0 })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-white/5">
                                                    <button
                                                        type="submit"
                                                        disabled={updatingBalance}
                                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                                                    >
                                                        {updatingBalance ? (
                                                            <span className="flex items-center gap-2">
                                                                <RefreshCw size={18} className="animate-spin" /> Processando...
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <CheckCircle size={20} />
                                                                Confirmar Atualização de Saldo
                                                            </>
                                                        )}
                                                    </button>
                                                    <p className="text-center text-[10px] text-white/20 mt-3">
                                                        Esta ação será registrada e o saldo atualizado imediatamente.
                                                    </p>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                
                {/* === RECOMPENSAS VIEW === */}
                {activeTab === 'recompensas' && <AdminRewards />}

                {/* === MOEDAS VIEW === */}
                {activeTab === 'moedas' && <AdminCoins />}

                {/* === DROPS VIEW === */}
                {activeTab === 'drops' && <AdminDrops />}

                {/* === VALIDACAO VIEW === */}
                {activeTab === 'validacao' && <AdminValidation />}

                {/* === FINANCEIRO VIEW === */}
                {activeTab === 'financeiro' && <AdminFinancial />}

                {/* === RISCO VIEW === */}
                {activeTab === 'risco' && <AdminRiskLimiter />}

                            </div>
        </div>
    )
}
