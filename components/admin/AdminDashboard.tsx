'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Minus, IceCream, RefreshCw, LogOut, BarChart3, Users, Target, CheckCircle, XCircle, Coins, Droplet, Zap, Trash2, Clock } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'

interface UserSorvetes {
    id: string
    full_name: string | null
    email: string | null
    sorvetes_count: number
    xp: number
    points: number
    drops: number
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

    // === TABS: Sorvetes | Loja | Missões | Saldo | Drops ===
    const [activeTab, setActiveTab] = useState<'sorvetes' | 'loja' | 'missoes' | 'balance' | 'drops'>('sorvetes')

    // === DATA STATES ===
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [discountStats, setDiscountStats] = useState<any>(null)

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
    const [dropsList, setDropsList] = useState<any[]>([])
    const [creatingDrop, setCreatingDrop] = useState(false)
    const [newDrop, setNewDrop] = useState({
        title: '',
        description: '',
        reward_type: 'points',
        reward_value: 50,
        duration_minutes: 60
    })

    // === FETCHERS ===
    // === LOJA FETCH ===
    const fetchDiscountStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/discounts/summary')
            const data = await res.json()
            setDiscountStats(data)
        } catch {
            // silent
        }
    }, [])

    useEffect(() => {
        if (activeTab === 'loja') {
            fetchDiscountStats()
        }
    }, [activeTab, fetchDiscountStats])

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

    const fetchDrops = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/drops')
            if (res.ok) {
                const data = await res.json()
                setDropsList(data)
            }
        } catch (err) {
            console.error(err)
        }
    }, [])

    const handleCreateDrop = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreatingDrop(true)
        try {
            const res = await fetch('/api/admin/drops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDrop)
            })
            if (res.ok) {
                alert('Drop criado com sucesso!')
                setNewDrop({ title: '', description: '', reward_type: 'points', reward_value: 50, duration_minutes: 60 })
                fetchDrops()
            } else {
                alert('Erro ao criar drop')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setCreatingDrop(false)
        }
    }

    const handleDeleteDrop = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este drop?')) return
        try {
            const res = await fetch(`/api/admin/drops?id=${id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                fetchDrops()
            }
        } catch (err) {
            console.error(err)
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
                                    onClick={() => setActiveTab('sorvetes')}
                                    className={`uppercase transition-colors ${activeTab === 'sorvetes' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Sorvetes
                                </button>
                                <span className="text-white/20">|</span>
                                <button
                                    onClick={() => setActiveTab('loja')}
                                    className={`uppercase transition-colors ${activeTab === 'loja' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Loja
                                </button>
                                <span className="text-white/20">|</span>
                                <button
                                    onClick={() => setActiveTab('missoes')}
                                    className={`uppercase transition-colors ${activeTab === 'missoes' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Missões
                                </button>
                                <span className="text-white/20">|</span>
                                <button
                                    onClick={() => setActiveTab('balance')}
                                    className={`uppercase transition-colors ${activeTab === 'balance' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Saldo
                                </button>
                                <span className="text-white/20">|</span>
                                <button
                                    onClick={() => setActiveTab('drops')}
                                    className={`uppercase transition-colors ${activeTab === 'drops' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Drops
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeTab === 'sorvetes' && (
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
                                if (activeTab === 'sorvetes') fetchUsers()
                                else if (activeTab === 'loja') fetchDiscountStats()
                                else if (activeTab === 'missoes' && selectedUserId) fetchUserMissions(selectedUserId)
                                else if (activeTab === 'drops') fetchDrops()
                            }}
                            title="Atualizar"
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <RefreshCw size={16} className={(loading || missionsLoading) ? 'animate-spin' : ''} />
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
            <div className="max-w-4xl mx-auto px-4 py-6">

                {/* === SORVETES VIEW === */}
                {activeTab === 'sorvetes' && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Usuários</div>
                                <div className="text-2xl font-black tabular-nums">{users.length}</div>
                            </div>
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Total Sorvetes</div>
                                <div className="text-2xl font-black tabular-nums text-illa-pink">
                                    {users.reduce((sum, u) => sum + u.sorvetes_count, 0)}
                                </div>
                            </div>
                        </div>

                        {loading && users.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCw size={24} className="animate-spin text-white/30" />
                            </div>
                        ) : view === 'table' ? (
                            <div className="space-y-2">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                                    >
                                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                                            <div className="font-bold text-sm truncate">
                                                {user.full_name || 'Sem nome'}
                                            </div>
                                            <div className="text-[11px] text-white/40 truncate">
                                                {user.email || user.id.slice(0, 8)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                            {/* Drops Quick Edit */}
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 group/drops hover:bg-blue-500/20 transition-colors">
                                                <div className="flex items-center gap-1.5 mr-1">
                                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                        <Droplet size={10} className="text-blue-400" />
                                                    </div>
                                                    <span className="text-sm font-black tabular-nums text-blue-400 min-w-[1.5ch] text-center">
                                                        {user.drops || 0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <button
                                                        onClick={() => handleDropAction(user.id, -1)}
                                                        disabled={actionLoading === `${user.id}-drop-sub` || (user.drops || 0) <= 0}
                                                        className="w-6 h-6 rounded-md bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90 flex items-center justify-center"
                                                    >
                                                        <Minus size={10} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDropAction(user.id, 1)}
                                                        disabled={actionLoading === `${user.id}-drop-add`}
                                                        className="w-6 h-6 rounded-md bg-white/5 hover:bg-blue-500/20 text-white/40 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90 flex items-center justify-center"
                                                    >
                                                        <Plus size={10} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-illa-pink/10 border border-illa-pink/20">
                                                <IceCream size={14} className="text-illa-pink" />
                                                <span className="text-lg font-black tabular-nums text-illa-pink">
                                                    {user.sorvetes_count}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleAction(user.id, 'subtract')}
                                                    disabled={actionLoading === `${user.id}-subtract` || user.sorvetes_count === 0}
                                                    className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 flex items-center justify-center"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(user.id, 'add')}
                                                    disabled={actionLoading === `${user.id}-add`}
                                                    className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 flex items-center justify-center"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <div className="text-center py-16 text-white/30 text-sm">
                                        Nenhum usuário encontrado
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                                <h2 className="text-sm font-bold text-white/60 mb-6 uppercase tracking-wider">
                                    Sorvetes por Usuário
                                </h2>
                                <div className="space-y-3">
                                    {users
                                        .sort((a, b) => b.sorvetes_count - a.sorvetes_count)
                                        .map((user) => (
                                            <div key={user.id} className="flex items-center gap-3">
                                                <div className="w-28 text-xs font-medium text-white/60 truncate text-right shrink-0">
                                                    {user.full_name || user.email?.split('@')[0] || '???'}
                                                </div>
                                                <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-illa-pink to-illa-yellow rounded-lg transition-all duration-700 ease-out relative"
                                                        style={{
                                                            width: `${Math.max(2, (user.sorvetes_count / maxSorvetes) * 100)}%`,
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/10 animate-[shimmer_2s_infinite] skew-x-12" />
                                                    </div>
                                                </div>
                                                <div className="w-8 text-sm font-black tabular-nums text-right">
                                                    {user.sorvetes_count}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* === LOJA VIEW === */}
                {activeTab === 'loja' && discountStats && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Total Resgatado</div>
                                <div className="text-2xl font-black tabular-nums">{discountStats.total_redeemed}</div>
                            </div>
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Pontos Gastos</div>
                                <div className="text-2xl font-black tabular-nums text-[#FCD34D]">{discountStats.total_points_spent}</div>
                            </div>
                            <div className="col-span-2 md:col-span-1 rounded-2xl bg-white/5 border border-white/10 p-4">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Mais Popular</div>
                                <div className="text-lg font-bold truncate text-emerald-400">{discountStats.popular_offer}</div>
                            </div>
                        </div>

                        {/* Ranking Table */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/10 bg-white/5">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <BarChart3 size={16} className="text-illa-pink" />
                                    Ranking de Gastos
                                </h3>
                            </div>
                            <div className="divide-y divide-white/5">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {discountStats.ranking.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-[#FCD34D] text-black' :
                                                i === 1 ? 'bg-gray-300 text-black' :
                                                    i === 2 ? 'bg-orange-700 text-white' :
                                                        'bg-white/10 text-white/50'
                                                }`}>
                                                {i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold truncate">{item.full_name || 'Sem nome'}</div>
                                                <div className="text-[10px] text-white/40 truncate">{item.email}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-[#FCD34D] tabular-nums">-{item.points_spent}</div>
                                            <div className="text-[10px] text-white/40">{item.redemptions_count} resgates</div>
                                        </div>
                                    </div>
                                ))}
                                {discountStats.ranking.length === 0 && (
                                    <div className="p-8 text-center text-white/30 text-sm">
                                        Nenhum resgate registrado ainda.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* === BALANCE VIEW === */}
                {activeTab === 'balance' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white/5 rounded-3xl border border-white/10 p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -z-10" />

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-green-500/20 rounded-2xl text-green-400">
                                    <div className="relative">
                                        <Coins size={32} />
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
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
                                    <div className="divide-y divide-white/5 overflow-y-auto flex-1">
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
                                                                <Coins size={18} />
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

                {/* === MISSÕES VIEW === */}
                {activeTab === 'missoes' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* User List for Selection */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
                                <div className="p-4 border-b border-white/10 bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                    <h3 className="font-bold text-sm text-white">Selecionar Usuário</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleSelectUserForMissions(u.id)}
                                            className={`w-full text-left p-4 hover:bg-white/5 transition-all flex items-center justify-between group ${selectedUserId === u.id ? 'bg-illa-pink/20 border-l-4 border-illa-pink' : 'border-l-4 border-transparent'}`}
                                        >
                                            <div className="min-w-0">
                                                <p className={`text-sm font-bold truncate ${selectedUserId === u.id ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                                                    {u.full_name || 'Usuário'}
                                                </p>
                                                <p className="text-[10px] text-white/40 truncate">{u.email}</p>
                                            </div>
                                            {selectedUserId === u.id && <CheckCircle size={16} className="text-illa-pink" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions & List Area */}
                            <div className="md:col-span-2 space-y-4">
                                {!selectedUserId ? (
                                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl text-white/30">
                                        <Target size={48} className="mb-4 opacity-50" />
                                        <p className="text-sm">Selecione um usuário para gerenciar missões</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Creator Form */}
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                            <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                                                <Plus size={16} className="text-illa-pink" />
                                                Criar Nova Missão
                                            </h3>
                                            <form onSubmit={handleCreateMission} className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Título da Missão</label>
                                                    <input
                                                        type="text"
                                                        value={newMission.title}
                                                        onChange={e => setNewMission({ ...newMission, title: e.target.value })}
                                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-illa-pink/50 focus:outline-none"
                                                        placeholder="Ex: Experimente o novo sabor..."
                                                        required
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Recompensa (XP)</label>
                                                        <input
                                                            type="number"
                                                            value={newMission.xp}
                                                            onChange={e => setNewMission({ ...newMission, xp: Number(e.target.value) })}
                                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-illa-pink/50 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Recompensa (Moedas)</label>
                                                        <input
                                                            type="number"
                                                            value={newMission.points}
                                                            onChange={e => setNewMission({ ...newMission, points: Number(e.target.value) })}
                                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-illa-pink/50 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={creatingMission || !newMission.title}
                                                    className="w-full bg-illa-pink hover:bg-pink-600 text-white font-bold py-2 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {creatingMission ? 'Criando...' : 'Atribuir Missão'}
                                                </button>
                                            </form>
                                        </div>

                                        {/* Missions List */}
                                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                                <h3 className="font-bold text-sm text-white">Missões do Usuário</h3>
                                                {missionsLoading && <RefreshCw size={14} className="animate-spin text-white/40" />}
                                            </div>
                                            <div className="divide-y divide-white/5">
                                                {userMissions.map(m => (
                                                    <div key={m.instance_id} className="p-4 flex items-center justify-between hover:bg-white/5">
                                                        <div>
                                                            <p className={`text-sm font-bold ${m.completed ? 'text-emerald-400 line-through opacity-60' : 'text-white'}`}>
                                                                {m.title}
                                                            </p>
                                                            <div className="flex gap-2 text-[10px] mt-1">
                                                                <span className="text-purple-300">+{m.reward_xp} XP</span>
                                                                <span className="text-yellow-300">+{m.reward_points} Moedas</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {m.completed ? (
                                                                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">
                                                                    CONCLUÍDO
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold bg-white/5 text-white/40 px-2 py-1 rounded-full">
                                                                    PENDENTE
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {userMissions.length === 0 && !missionsLoading && (
                                                    <div className="p-8 text-center text-white/30 text-sm">
                                                        Nenhuma missão encontrada para hoje.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* === DROPS VIEW === */}
                {activeTab === 'drops' && (
                    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            {/* Create Drop Form */}
                            <div className="md:col-span-1 space-y-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 md:sticky md:top-24">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Droplet size={18} className="text-blue-400" />
                                        </div>
                                        <h2 className="text-lg font-bold">Lançar Novo Drop</h2>
                                    </div>

                                    <form onSubmit={handleCreateDrop} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Título do Evento</label>
                                            <input
                                                type="text"
                                                value={newDrop.title}
                                                onChange={e => setNewDrop({ ...newDrop, title: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors"
                                                placeholder="Ex: Flash Sale de Verão"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Descrição (Opcional)</label>
                                            <textarea
                                                value={newDrop.description}
                                                onChange={e => setNewDrop({ ...newDrop, description: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors resize-none h-24"
                                                placeholder="Detalhes do evento..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Tipo de Recompensa</label>
                                                <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/10">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewDrop({ ...newDrop, reward_type: 'xp' })}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${newDrop.reward_type === 'xp' ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                                                    >
                                                        <Zap size={12} /> XP
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewDrop({ ...newDrop, reward_type: 'points' })}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${newDrop.reward_type === 'points' ? 'bg-yellow-500/20 text-yellow-300 shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                                                    >
                                                        <Coins size={12} /> Moedas
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Valor</label>
                                                <input
                                                    type="number"
                                                    value={newDrop.reward_value}
                                                    onChange={e => setNewDrop({ ...newDrop, reward_value: Number(e.target.value) })}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-[9px] text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Duração</label>
                                            <div className="grid grid-cols-4 gap-2 mb-2">
                                                {[30, 60, 360, 1440].map(mins => (
                                                    <button
                                                        key={mins}
                                                        type="button"
                                                        onClick={() => setNewDrop({ ...newDrop, duration_minutes: mins })}
                                                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${newDrop.duration_minutes === mins ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5'}`}
                                                    >
                                                        {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="relative">
                                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                                <input
                                                    type="number"
                                                    value={newDrop.duration_minutes}
                                                    onChange={e => setNewDrop({ ...newDrop, duration_minutes: Number(e.target.value) })}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={creatingDrop || !newDrop.title}
                                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {creatingDrop ? <RefreshCw size={16} className="animate-spin" /> : <Droplet size={16} />}
                                            {creatingDrop ? 'Criando...' : 'Lançar Drop Agora'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Active Drops List */}
                            <div className="md:col-span-2">
                                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden min-h-[600px] flex flex-col">
                                    <div className="p-4 md:p-6 border-b border-white/10 bg-white/5 sticky top-0 z-10 backdrop-blur-md flex justify-between items-center">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <Zap size={18} className="text-yellow-400" />
                                            Drops Ativos & Recentes
                                        </h3>
                                        <button onClick={fetchDrops} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                                            Atualizar Lista
                                        </button>
                                    </div>

                                    <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                                            dropsList.map((drop: any) => {
                                                const isActive = new Date(drop.ends_at) > new Date()
                                                return (
                                                    <div key={drop.id} className={`group relative rounded-2xl border p-5 transition-all w-full flex flex-col justify-between ${isActive ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-blue-500/20 hover:border-blue-500/40' : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'}`}>
                                                        <div>
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${isActive ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-gray-500/20 text-gray-400 border border-gray-500/20'}`}>
                                                                    {isActive ? 'ATIVO AGORA' : 'ENCERRADO'}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteDrop(drop.id)}
                                                                    className="text-white/20 hover:text-red-400 transition-colors p-1"
                                                                    title="Excluir Drop"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>

                                                            <h4 className="font-bold text-lg leading-tight mb-1">{drop.title}</h4>
                                                            <p className="text-xs text-white/50 line-clamp-2 h-8">{drop.description || 'Sem descrição'}</p>

                                                            <div className="mt-4 flex items-center gap-3">
                                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${drop.reward_type === 'xp' ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'}`}>
                                                                    {drop.reward_type === 'xp' ? <Zap size={14} /> : <Coins size={14} />}
                                                                    <span className="font-bold text-sm">+{drop.reward_value}</span>
                                                                </div>
                                                                <div className="text-[10px] text-white/40 flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    {isActive
                                                                        ? `Encerra em ${Math.max(0, Math.ceil((new Date(drop.ends_at).getTime() - new Date().getTime()) / (1000 * 60)))} min`
                                                                        : `Encerrado em ${new Date(drop.ends_at).toLocaleDateString()}`
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Decorative Elements */}
                                                        {isActive && (
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/20 transition-all" />
                                                        )}
                                                    </div>
                                                )
                                            })}

                                        {dropsList.length === 0 && (
                                            <div className="col-span-full py-12 text-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center">
                                                <Droplet size={32} className="mb-3 opacity-20" />
                                                <p className="text-sm font-medium">Nenhum evento de drop encontrado.</p>
                                                <p className="text-xs mt-1">Crie o primeiro drop para começar!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                )}
            </div>
        </div >
    )
}
