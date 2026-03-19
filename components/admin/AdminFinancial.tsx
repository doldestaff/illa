'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Users, Gift, Coins, BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface FinancialData {
  totalRedemptions: number
  discountRedemptions: number
  sorveteRedemptions: number
  dropRedemptions: number
  activeRewards: number
  totalUsers: number
  totalCoins: number
  brlPerCoin: number
  estimatedCostBrl: number
  recentRedemptions: number
  previousRedemptions: number
  dailyBreakdown: { date: string; label: string; count: number }[]
}

export default function AdminFinancial() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/financial')
      if (res.ok) setData(await res.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const cx = (...parts: string[]) => parts.filter(Boolean).join(' ')

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-white/30">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    )
  }

  const trend = data.previousRedemptions > 0
    ? Math.round(((data.recentRedemptions - data.previousRedemptions) / data.previousRedemptions) * 100)
    : data.recentRedemptions > 0 ? 100 : 0
  const trendUp = trend >= 0
  const maxDaily = Math.max(...data.dailyBreakdown.map(d => d.count), 1)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <BarChart3 size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Dashboard Financeiro</h2>
            <p className="text-xs text-white/40">Metricas e estimativa de custos</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Redemptions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Resgates</span>
          </div>
          <div className="text-2xl font-black">{data.totalRedemptions}</div>
          <div className={cx('flex items-center gap-1 text-[10px] font-bold mt-1', trendUp ? 'text-emerald-400' : 'text-red-400')}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}% vs semana anterior
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Active Rewards */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={14} className="text-pink-400" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Recomp. Ativas</span>
          </div>
          <div className="text-2xl font-black">{data.activeRewards}</div>
          <div className="text-[10px] text-white/30 mt-1">ofertas disponiveis</div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Total Users */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-blue-400" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Usuarios</span>
          </div>
          <div className="text-2xl font-black">{data.totalUsers}</div>
          <div className="text-[10px] text-white/30 mt-1">membros ativos</div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Cost Estimation */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-4 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300/60 uppercase tracking-wider">Custo Est.</span>
          </div>
          <div className="text-2xl font-black text-amber-300">R$ {data.estimatedCostBrl.toFixed(2)}</div>
          <div className="text-[10px] text-amber-300/40 mt-1">{data.totalCoins} moedas x R$ {data.brlPerCoin.toFixed(2)}</div>
        </div>
      </div>

      {/* Chart + Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Daily Chart */}
        <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp size={14} /> Resgates Ultimos 7 Dias
          </h3>
          <div className="flex items-end gap-2 h-[180px]">
            {data.dailyBreakdown.map((day, idx) => {
              const heightPct = maxDaily > 0 ? (day.count / maxDaily) * 100 : 0
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-white/60">{day.count}</span>
                  <div className="w-full rounded-t-lg bg-violet-500/20 border border-violet-500/10 transition-all hover:bg-violet-500/30" style={{ height: Math.max(heightPct, 4) + '%' }} />
                  <span className="text-[9px] text-white/30 truncate w-full text-center">{day.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Breakdown by Type */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Coins size={14} /> Por Tipo
          </h3>
          <div className="space-y-4">
            {/* Descontos */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-green-300">Descontos</span>
                <span className="text-xs font-mono text-white/60">{data.discountRedemptions}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style={{ width: (data.totalRedemptions > 0 ? (data.discountRedemptions / data.totalRedemptions) * 100 : 0) + '%' }} />
              </div>
            </div>

            {/* Sorvetes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-pink-300">Sorvetes</span>
                <span className="text-xs font-mono text-white/60">{data.sorveteRedemptions}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all" style={{ width: (data.totalRedemptions > 0 ? (data.sorveteRedemptions / data.totalRedemptions) * 100 : 0) + '%' }} />
              </div>
            </div>

            {/* Drops */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-300">Drops</span>
                <span className="text-xs font-mono text-white/60">{data.dropRedemptions}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all" style={{ width: (data.totalRedemptions > 0 ? (data.dropRedemptions / data.totalRedemptions) * 100 : 0) + '%' }} />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Total Geral</span>
              <span className="text-lg font-black">{data.totalRedemptions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className={cx('rounded-2xl border p-5 flex items-center gap-4', trendUp ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15')}>
        <div className={cx('w-12 h-12 rounded-xl flex items-center justify-center', trendUp ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
          {trendUp ? <TrendingUp size={24} className="text-emerald-400" /> : <TrendingDown size={24} className="text-red-400" />}
        </div>
        <div>
          <div className="font-bold text-sm">
            {trendUp ? 'Crescimento' : 'Queda'} de {Math.abs(trend)}% nos ultimos 7 dias
          </div>
          <div className="text-xs text-white/40">
            {data.recentRedemptions} resgates esta semana vs {data.previousRedemptions} semana anterior
          </div>
        </div>
      </div>
    </div>
  )
}