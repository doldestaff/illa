'use client'

import { useEffect, useState } from 'react'
import { Activity, Users, Star, Gift, ShieldAlert, TrendingUp } from 'lucide-react'
import { AdminPageContainer, SectionHeader, StatCard } from './AdminShared'

interface PulseData {
    totalUsers: number
    newUsersToday: number
    pendingReviews: number
    activeDrops: number
    redemptionsToday: number
    riskAlerts: number
}

export default function AdminPulse() {
    const [data, setData] = useState<PulseData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPulseData()
        // Opcional: Auto-refresh a cada 30 segundos para "tempo real"
        const interval = setInterval(fetchPulseData, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchPulseData = async () => {
        try {
            const res = await fetch('/api/admin/pulse')
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (error) {
            console.error('Error fetching pulse:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <AdminPageContainer>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-illa-pink border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminPageContainer>
        )
    }

    if (!data) return null

    return (
        <AdminPageContainer>
            <SectionHeader 
                title="Pulso do Dia" 
                description="Visão em tempo real das métricas críticas da ILLA"
                icon={Activity}
                colorClass="text-illa-pink"
                action={
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        AO VIVO
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard 
                    title="Membros ILLA"
                    value={data.totalUsers}
                    icon={Users}
                    colorClass="text-blue-400"
                    trend={{ value: `${data.newUsersToday} hoje`, isPositive: true }}
                    subtitle="Usuários registrados no gamification"
                />
                
                <StatCard 
                    title="Avaliações Pendentes"
                    value={data.pendingReviews}
                    icon={Star}
                    colorClass="text-yellow-400"
                    bgClass={data.pendingReviews > 0 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-white/5"}
                    subtitle={data.pendingReviews > 0 ? "Requer aprovação manual" : "Tudo em dia"}
                />

                <StatCard 
                    title="Vouchers Hoje"
                    value={data.redemptionsToday}
                    icon={TrendingUp}
                    colorClass="text-emerald-400"
                    subtitle="Resgates feitos na loja física"
                />

                <StatCard 
                    title="Drops Ativos"
                    value={data.activeDrops}
                    icon={Gift}
                    colorClass="text-purple-400"
                    subtitle="Eventos rodando neste momento"
                />

                <StatCard 
                    title="Alertas de Risco"
                    value={data.riskAlerts}
                    icon={ShieldAlert}
                    colorClass="text-red-400"
                    bgClass={data.riskAlerts > 0 ? "bg-red-500/10 border-red-500/30" : "bg-white/5"}
                    subtitle={data.riskAlerts > 0 ? "Ação imediata necessária" : "Consumo dentro do limite"}
                />
            </div>

            {/* Placeholder para gráfico futuro ou avisos importantes */}
            <div className="mt-8 bg-gradient-to-r from-illa-pink/10 to-transparent p-6 rounded-2xl border border-illa-pink/20">
                <h3 className="text-white font-bold mb-2">Bem-vindo ao novo Painel Administrativo! 🚀</h3>
                <p className="text-sm text-white/60 text-balance">
                    O painel foi reorganizado para focar nas regras de negócio e limites financeiros da operação. 
                    Navegue pelas abas acima para gerenciar Recompensas, Moedas, Drops e Validação na Loja.
                </p>
            </div>
        </AdminPageContainer>
    )
}
