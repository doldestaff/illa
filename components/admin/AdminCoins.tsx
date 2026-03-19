'use client'

import { useState, useEffect } from 'react'
import { Save, RefreshCw, HandCoins, Activity, TrendingUp, AlertTriangle } from 'lucide-react'

// Define exactly what the coins config looks like
interface CoinsConfig {
    brl_per_coin: number
}

// Define action rewards configuration
interface ActionRewards {
    daily_login: number
    level_up_base: number
    referral: number
    survey_completion: number
}

export default function AdminCoins() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [statsSimulated, setStatsSimulated] = useState({
        monthlyUsers: 1000,
        avgActionsPerUser: 15
    })

    const [coinsConfig, setCoinsConfig] = useState<CoinsConfig>({ brl_per_coin: 0.05 })
    const [actionRewards, setActionRewards] = useState<ActionRewards>({
        daily_login: 10,
        level_up_base: 50,
        referral: 100,
        survey_completion: 30
    })

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings')
            if (!res.ok) throw new Error('Falha ao carregar configurações')
            const data = await res.json()
            
            if (data.coins_config) {
                setCoinsConfig(data.coins_config)
            }
            if (data.action_rewards) {
                setActionRewards(data.action_rewards)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            // Save coins config
            await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'coins_config', value: coinsConfig })
            })

            // Save actions config
            await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'action_rewards', value: actionRewards })
            })

            alert('Configurações salvas com sucesso!')
        } catch (err) {
            alert('Erro ao salvar as configurações financeiras')
        } finally {
            setSaving(false)
        }
    }

    // Calculadora Automática
    const avgCoinsPerAction = (actionRewards.daily_login + actionRewards.survey_completion) / 2
    const totalCoinsMonthly = statsSimulated.monthlyUsers * statsSimulated.avgActionsPerUser * avgCoinsPerAction
    const estimatedCostBRL = totalCoinsMonthly * coinsConfig.brl_per_coin

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
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                        <HandCoins size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Controle Financeiro de Moedas</h2>
                        <p className="text-sm text-white/40">Defina o lastro da moeda e recompensas automáticas</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Column: Direct Configs */}
                <div className="md:col-span-7 space-y-6">
                    
                    {/* Lastro da Moeda */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
                        
                        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                            <TrendingUp size={18} className="text-yellow-400" />
                            Lastro da Moeda
                        </h3>
                        <p className="text-xs text-white/40 mb-6">Quanto custa para a loja cada moeda distribuída aos usuários?</p>
                        
                        <div className="space-y-2 max-w-sm">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                                1 Moeda ILLA = X Reais (Custo)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
                                <input
                                    required
                                    type="number"
                                    step="0.001"
                                    min="0.001"
                                    value={coinsConfig.brl_per_coin}
                                    onChange={e => setCoinsConfig({ ...coinsConfig, brl_per_coin: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xl font-black text-yellow-400 focus:outline-none focus:border-yellow-500/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Automação de Ganhos */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                            <Activity size={18} className="text-blue-400" />
                            Recompensas Automáticas
                        </h3>
                        <p className="text-xs text-white/40 mb-6">Ganhos em moedas por ações fixas na plataforma.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-white/40">Login Diário</label>
                                <input
                                    type="number"
                                    value={actionRewards.daily_login}
                                    onChange={e => setActionRewards({ ...actionRewards, daily_login: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-white/40">Completar Missão/Quiz</label>
                                <input
                                    type="number"
                                    value={actionRewards.survey_completion}
                                    onChange={e => setActionRewards({ ...actionRewards, survey_completion: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-white/40">Indicar Amigo (Referral)</label>
                                <input
                                    type="number"
                                    value={actionRewards.referral}
                                    onChange={e => setActionRewards({ ...actionRewards, referral: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-white/40">Subir de Nível (Base)</label>
                                <input
                                    type="number"
                                    value={actionRewards.level_up_base}
                                    onChange={e => setActionRewards({ ...actionRewards, level_up_base: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>
                    </div>
                    
                </div>

                {/* Right Column: Simulator & Actions */}
                <div className="md:col-span-5 space-y-6">
                    
                    {/* Preview / Risk Calculator */}
                    <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={18} className="text-orange-400" />
                            <h3 className="font-bold text-white">Calculadora de Risco Mensal</h3>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                <span className="text-xs text-white/60">Usuários Ativos / Mês</span>
                                <input
                                    type="number"
                                    value={statsSimulated.monthlyUsers}
                                    onChange={e => setStatsSimulated({ ...statsSimulated, monthlyUsers: parseInt(e.target.value) || 0 })}
                                    className="bg-black/50 border border-white/10 rounded-lg w-24 px-2 py-1 text-right text-sm font-bold focus:outline-none text-white"
                                />
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                <span className="text-xs text-white/60">Ações Médias / Usuário</span>
                                <input
                                    type="number"
                                    value={statsSimulated.avgActionsPerUser}
                                    onChange={e => setStatsSimulated({ ...statsSimulated, avgActionsPerUser: parseInt(e.target.value) || 0 })}
                                    className="bg-black/50 border border-white/10 rounded-lg w-24 px-2 py-1 text-right text-sm font-bold focus:outline-none text-white"
                                />
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Moedas Emitidas:</span>
                                <span className="font-black text-yellow-400 text-sm">{Math.round(totalCoinsMonthly).toLocaleString()} ILLA</span>
                            </div>
                            <div className="flex justify-between items-center bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl mt-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400/80">Risco / Custo Estimado:</span>
                                <span className="font-black text-orange-400 text-lg">R$ {estimatedCostBRL.toFixed(2)}</span>
                            </div>
                            <p className="text-[9px] text-white/30 text-center mt-2 leading-tight">
                                Isto é uma simulação para controle de passivo. Mostra quanto custaria se todos resgatassem hoje baseado no lastro.
                            </p>
                        </div>
                    </div>

                    {/* Save Action */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Gravando Lastro...' : 'Salvar Regras de Ouro'}
                    </button>

                </div>
            </form>
        </div>
    )
}
