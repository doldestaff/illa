'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Shield, AlertTriangle, Pause, Play, RefreshCw, TrendingUp, Settings, Lock, Unlock, Activity } from 'lucide-react'

interface RiskConfig {
  max_coins_per_week: number
  max_rewards_per_day: number
  max_drops_per_day: number
  paused: boolean
}

const DEFAULT_CONFIG: RiskConfig = {
  max_coins_per_week: 10000,
  max_rewards_per_day: 100,
  max_drops_per_day: 50,
  paused: false,
}

export default function AdminRiskLimiter() {
  const [config, setConfig] = useState<RiskConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.risk_limiter) {
          setConfig({ ...DEFAULT_CONFIG, ...data.risk_limiter })
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'risk_limiter', value: config }),
      })
      if (res.ok) {
        setDirty(false)
        alert('Configuracoes de risco salvas!')
      } else { alert('Erro ao salvar.') }
    } catch { alert('Erro de conexao.') }
    finally { setSaving(false) }
  }

  const togglePause = async () => {
    const newConfig = { ...config, paused: !config.paused }
    setConfig(newConfig)
    setSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'risk_limiter', value: newConfig }),
      })
    } catch { /* silent */ }
    finally { setSaving(false) }
  }

  const updateField = (field: keyof RiskConfig, value: number) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  const cx = (...parts: string[]) => parts.filter(Boolean).join(' ')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/30">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', config.paused ? 'bg-red-500/20' : 'bg-emerald-500/20')}>
            <Shield size={20} className={config.paused ? 'text-red-400' : 'text-emerald-400'} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Limitador de Risco</h2>
            <p className="text-xs text-white/40">Controles de seguranca e limites operacionais</p>
          </div>
        </div>
        <button onClick={fetchConfig} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Emergency Pause */}
      <div className={cx('rounded-2xl border p-5 transition-all', config.paused ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/5 border-emerald-500/15')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cx('w-14 h-14 rounded-xl flex items-center justify-center', config.paused ? 'bg-red-500/20' : 'bg-emerald-500/20')}>
              {config.paused ? <Pause size={28} className="text-red-400" /> : <Play size={28} className="text-emerald-400" />}
            </div>
            <div>
              <div className="font-bold text-lg">{config.paused ? 'Sistema PAUSADO' : 'Sistema ATIVO'}</div>
              <p className="text-xs text-white/40">
                {config.paused
                  ? 'Todas as recompensas, drops e resgates estao temporariamente bloqueados.'
                  : 'O sistema esta operando normalmente dentro dos limites configurados.'
                }
              </p>
            </div>
          </div>
          <button
            onClick={togglePause}
            disabled={saving}
            className={cx('px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg', config.paused ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30')}
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : config.paused ? <Play size={16} /> : <Pause size={16} />}
            {config.paused ? 'Reativar' : 'Pausar Tudo'}
          </button>
        </div>
      </div>

      {/* Paused Warning */}
      {config.paused && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
          <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-sm text-red-300">Modo de Emergencia Ativo</div>
            <p className="text-xs text-red-300/60 mt-1">
              Nenhuma recompensa, drop ou resgate pode ser processado enquanto o sistema estiver pausado. Clique em "Reativar" para voltar ao normal.
            </p>
          </div>
        </div>
      )}

      {/* Limit Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Max Coins per Week */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Activity size={16} className="text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold">Moedas / Semana</div>
              <div className="text-[10px] text-white/40">Limite maximo semanal</div>
            </div>
          </div>
          <input
            type="number"
            value={config.max_coins_per_week}
            onChange={e => updateField('max_coins_per_week', Number(e.target.value))}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:border-amber-500/50 focus:outline-none transition-colors text-center"
          />
          <div className="mt-3 grid grid-cols-3 gap-1">
            {[5000, 10000, 25000].map(v => (
              <button key={v} type="button" onClick={() => updateField('max_coins_per_week', v)} className={cx('py-1.5 rounded-lg text-[10px] font-bold border transition-all', config.max_coins_per_week === v ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5')}>
                {(v / 1000) + 'k'}
              </button>
            ))}
          </div>
        </div>

        {/* Max Rewards per Day */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Settings size={16} className="text-pink-400" />
            </div>
            <div>
              <div className="text-sm font-bold">Recompensas / Dia</div>
              <div className="text-[10px] text-white/40">Limite diario de resgates</div>
            </div>
          </div>
          <input
            type="number"
            value={config.max_rewards_per_day}
            onChange={e => updateField('max_rewards_per_day', Number(e.target.value))}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:border-pink-500/50 focus:outline-none transition-colors text-center"
          />
          <div className="mt-3 grid grid-cols-3 gap-1">
            {[50, 100, 500].map(v => (
              <button key={v} type="button" onClick={() => updateField('max_rewards_per_day', v)} className={cx('py-1.5 rounded-lg text-[10px] font-bold border transition-all', config.max_rewards_per_day === v ? 'bg-pink-500/20 border-pink-500/40 text-pink-300' : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5')}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Max Drops per Day */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <TrendingUp size={16} className="text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-bold">Drops / Dia</div>
              <div className="text-[10px] text-white/40">Limite diario de drops</div>
            </div>
          </div>
          <input
            type="number"
            value={config.max_drops_per_day}
            onChange={e => updateField('max_drops_per_day', Number(e.target.value))}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:border-blue-500/50 focus:outline-none transition-colors text-center"
          />
          <div className="mt-3 grid grid-cols-3 gap-1">
            {[20, 50, 200].map(v => (
              <button key={v} type="button" onClick={() => updateField('max_drops_per_day', v)} className={cx('py-1.5 rounded-lg text-[10px] font-bold border transition-all', config.max_drops_per_day === v ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5')}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      {dirty && (
        <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
            {saving ? 'Salvando...' : 'Salvar Limites'}
          </button>
        </div>
      )}

      {/* Security Status */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lock size={14} /> Status de Seguranca
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
            <Unlock size={16} className="text-emerald-400" />
            <div>
              <div className="text-xs font-bold">Prevencao de Duplicidade</div>
              <div className="text-[10px] text-white/40">Vouchers so podem ser validados uma vez</div>
            </div>
            <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">ATIVO</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
            <Shield size={16} className="text-emerald-400" />
            <div>
              <div className="text-xs font-bold">Rate Limiting</div>
              <div className="text-[10px] text-white/40">Protecao contra abuso de requisicoes</div>
            </div>
            <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">ATIVO</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
            <Lock size={16} className="text-emerald-400" />
            <div>
              <div className="text-xs font-bold">Admin Auth</div>
              <div className="text-[10px] text-white/40">Autenticacao obrigatoria para operacoes</div>
            </div>
            <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">ATIVO</span>
          </div>
          <div className={cx('flex items-center gap-3 p-3 rounded-xl bg-black/20 border', config.paused ? 'border-red-500/20' : 'border-white/5')}>
            {config.paused ? <Pause size={16} className="text-red-400" /> : <Activity size={16} className="text-emerald-400" />}
            <div>
              <div className="text-xs font-bold">Sistema Operacional</div>
              <div className="text-[10px] text-white/40">Status geral do sistema de recompensas</div>
            </div>
            <span className={cx('ml-auto text-[10px] font-bold px-2 py-1 rounded-full border', config.paused ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20')}>
              {config.paused ? 'PAUSADO' : 'ATIVO'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}