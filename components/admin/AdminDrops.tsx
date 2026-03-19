'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Droplet, Gift, RefreshCw, Zap, Coins, Clock, Search, Trash2, Users } from 'lucide-react'
import GlobalCoin from '@/components/ui/GlobalCoin'
import { SURPRISE_DROPS_CATALOG, CATEGORY_LABELS, RARITY_STYLES } from '@/lib/surprise-drops-catalog'

interface UserDropTarget {
  id: string
  full_name: string | null
  email: string | null
}

export default function AdminDrops() {
  const [dropsSubTab, setDropsSubTab] = useState<'eventos' | 'surpresa'>('eventos')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dropsList, setDropsList] = useState<any[]>([])
  const [creatingDrop, setCreatingDrop] = useState(false)
  const [newDrop, setNewDrop] = useState({
    title: '',
    description: '',
    reward_type: 'points',
    reward_value: 50,
    duration_minutes: 60,
  })

  const [users, setUsers] = useState<UserDropTarget[]>([])
  const [surpriseTargetUser, setSurpriseTargetUser] = useState<string | null>(null)
  const [surpriseSearch, setSurpriseSearch] = useState('')
  const [activatingSurprise, setActivatingSurprise] = useState<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [surpriseHistory, setSurpriseHistory] = useState<any[]>([])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (Array.isArray(data)) setUsers(data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchDrops = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/drops')
      if (res.ok) {
        const data = await res.json()
        setDropsList(data)
      }
    } catch (err) { console.error(err) }
  }, [])

  const fetchSurpriseHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/surprise-drops')
      if (res.ok) {
        const data = await res.json()
        setSurpriseHistory(Array.isArray(data) ? data : [])
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchDrops()
    fetchSurpriseHistory()
  }, [fetchUsers, fetchDrops, fetchSurpriseHistory])

  const handleCreateDrop = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingDrop(true)
    try {
      const res = await fetch('/api/admin/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDrop),
      })
      if (res.ok) {
        alert('Drop criado com sucesso!')
        setNewDrop({ title: '', description: '', reward_type: 'points', reward_value: 50, duration_minutes: 60 })
        fetchDrops()
      } else { alert('Erro ao criar drop') }
    } catch (err) { console.error(err) }
    finally { setCreatingDrop(false) }
  }

  const handleDeleteDrop = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este drop?')) return
    try {
      const res = await fetch("`/api/admin/drops?id=${id}`", { method: 'DELETE' })
      if (res.ok) fetchDrops()
    } catch (err) { console.error(err) }
  }

  const handleActivateSurprise = async (presetId: number) => {
    if (!surpriseTargetUser) return alert('Selecione um usu\u00e1rio primeiro!')
    const preset = SURPRISE_DROPS_CATALOG.find(p => p.id === presetId)
    if (!preset) return
    setActivatingSurprise(presetId)
    try {
      const res = await fetch('/api/admin/surprise-drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: surpriseTargetUser,
          preset_id: preset.id,
          title: preset.title,
          description: preset.description,
          category: preset.category,
          emoji: preset.emoji,
          reward_type: preset.reward_type,
          reward_value: preset.reward_value,
        }),
      })
      if (res.ok) {
        alert("`\uD83C\uDF81 \"${preset.title}\" ativado com sucesso!`")
        fetchSurpriseHistory()
      } else { alert('Erro ao ativar drop surpresa.') }
    } catch { alert('Erro de conex\u00e3o.') }
    finally { setActivatingSurprise(null) }
  }

  // Helper to build conditional classNames
  const cx = (...parts: string[]) => parts.filter(Boolean).join(' ')

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sub-Tab Toggle */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
        <button
          onClick={() => setDropsSubTab('eventos')}
          className={cx('px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2', dropsSubTab === 'eventos' ? 'bg-blue-500/20 text-blue-300 shadow-sm' : 'text-white/40 hover:text-white/60')}
        >
          <Droplet size={14} /> Eventos
        </button>
        <button
          onClick={() => { setDropsSubTab('surpresa'); fetchSurpriseHistory() }}
          className={cx('px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2', dropsSubTab === 'surpresa' ? 'bg-amber-500/20 text-amber-300 shadow-sm' : 'text-white/40 hover:text-white/60')}
        >
          <Gift size={14} /> Surpresa
        </button>
      </div>

      {dropsSubTab === 'eventos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Create Drop Form */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 md:sticky md:top-24">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Droplet size={18} className="text-blue-400" />
                </div>
                <h2 className="text-lg font-bold">Lan\u00e7ar Novo Drop</h2>
              </div>

              <form onSubmit={handleCreateDrop} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">T\u00edtulo do Evento</label>
                  <input type="text" value={newDrop.title} onChange={e => setNewDrop({ ...newDrop, title: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors" placeholder="Ex: Flash Sale de Ver\u00e3o" required />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Descri\u00e7\u00e3o (Opcional)</label>
                  <textarea value={newDrop.description} onChange={e => setNewDrop({ ...newDrop, description: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors resize-none h-24" placeholder="Detalhes do evento..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Tipo de Recompensa</label>
                    <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/10">
                      <button type="button" onClick={() => setNewDrop({ ...newDrop, reward_type: 'xp' })} className={cx('flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1', newDrop.reward_type === 'xp' ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-white/40 hover:text-white/60')}>
                        <Zap size={12} /> XP
                      </button>
                      <button type="button" onClick={() => setNewDrop({ ...newDrop, reward_type: 'points' })} className={cx('flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1', newDrop.reward_type === 'points' ? 'bg-yellow-500/20 text-yellow-300 shadow-sm' : 'text-white/40 hover:text-white/60')}>
                        <Coins size={12} /> Moedas
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Valor</label>
                    <input type="number" value={newDrop.reward_value} onChange={e => setNewDrop({ ...newDrop, reward_value: Number(e.target.value) })} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-[9px] text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Dura\u00e7\u00e3o</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[30, 60, 360, 1440].map(mins => (
                      <button key={mins} type="button" onClick={() => setNewDrop({ ...newDrop, duration_minutes: mins })} className={cx('py-2 rounded-lg text-[10px] font-bold border transition-all', newDrop.duration_minutes === mins ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5')}>
                        {mins < 60 ? mins + 'm' : (mins / 60) + 'h'}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="number" value={newDrop.duration_minutes} onChange={e => setNewDrop({ ...newDrop, duration_minutes: Number(e.target.value) })} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors" />
                  </div>
                </div>

                <button type="submit" disabled={creatingDrop || !newDrop.title} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {creatingDrop ? <RefreshCw size={16} className="animate-spin" /> : <Droplet size={16} />}
                  {creatingDrop ? 'Criando...' : 'Lan\u00e7ar Drop Agora'}
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
                  Drops Ativos &amp; Recentes
                </h3>
                <button onClick={fetchDrops} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Atualizar Lista</button>
              </div>

              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {dropsList.map((drop: any) => {
                  const isActive = new Date(drop.ends_at) > new Date()
                  const remaining = Math.max(0, Math.ceil((new Date(drop.ends_at).getTime() - Date.now()) / 60000))
                  return (
                    <div key={drop.id} className={cx('group relative rounded-2xl border p-5 transition-all w-full flex flex-col justify-between', isActive ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-blue-500/20 hover:border-blue-500/40' : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100')}>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className={cx('px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider', isActive ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-gray-500/20 text-gray-400 border border-gray-500/20')}>
                            {isActive ? 'ATIVO AGORA' : 'ENCERRADO'}
                          </div>
                          <button onClick={() => handleDeleteDrop(drop.id)} className="text-white/20 hover:text-red-400 transition-colors p-1" title="Excluir Drop">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <h4 className="font-bold text-lg leading-tight mb-1">{drop.title}</h4>
                        <p className="text-xs text-white/50 line-clamp-2 h-8">{drop.description || 'Sem descri\u00e7\u00e3o'}</p>
                        <div className="mt-4 flex items-center gap-3">
                          <div className={cx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border', drop.reward_type === 'xp' ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]')}>
                            {drop.reward_type === 'xp' ? <Zap size={14} /> : <GlobalCoin size="sm" />}
                            <span className="font-bold text-sm">+{drop.reward_value}</span>
                          </div>
                          <div className="text-[10px] text-white/40 flex items-center gap-1">
                            <Clock size={12} />
                            {isActive ? 'Encerra em ' + remaining + ' min' : 'Encerrado em ' + new Date(drop.ends_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/20 transition-all" />}
                    </div>
                  )
                })}

                {dropsList.length === 0 && (
                  <div className="col-span-full py-12 text-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center">
                    <Droplet size={32} className="mb-3 opacity-20" />
                    <p className="text-sm font-medium">Nenhum evento de drop encontrado.</p>
                    <p className="text-xs mt-1">Crie o primeiro drop para come\u00e7ar!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === SURPRESA === */}
      {dropsSubTab === 'surpresa' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* User Selector */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users size={16} /> Selecionar Usu\u00e1rio
            </h3>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="text" value={surpriseSearch} onChange={e => setSurpriseSearch(e.target.value)} placeholder="Buscar por nome ou email..." className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-amber-500/50 focus:outline-none transition-colors" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
              {users.filter(u => { const q = surpriseSearch.toLowerCase(); return !q || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) }).map(u => (
                <button key={u.id} onClick={() => setSurpriseTargetUser(u.id)} className={cx('flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm', surpriseTargetUser === u.id ? 'bg-amber-500/20 border-amber-500/40 text-amber-200' : 'bg-white/5 border-white/5 text-white/70 hover:border-white/20')}>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{(u.full_name || '?')[0].toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate text-xs">{u.full_name || 'Sem nome'}</div>
                    <div className="text-[10px] text-white/40 truncate">{u.email || u.id.slice(0, 8)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Presets Catalog */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Gift size={16} className="text-amber-400" /> Cat\u00e1logo de Drops Surpresa
            </h3>
            {!surpriseTargetUser && (
              <div className="text-center py-8 text-white/30 text-sm border-2 border-dashed border-white/10 rounded-xl mb-4">Selecione um usu\u00e1rio acima para ativar drops.</div>
            )}
            {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => {
              const presets = SURPRISE_DROPS_CATALOG.filter(p => p.category === catKey)
              if (presets.length === 0) return null
              return (
                <div key={catKey} className="mb-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">{catMeta.label}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {presets.map(preset => {
                      const rarity = RARITY_STYLES[preset.rarity]
                      return (
                        <div key={preset.id} className={cx('relative group rounded-2xl border p-4 transition-all border-white/10 hover:border-white/20', rarity.bg)}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{preset.emoji}</span>
                              <div>
                                <div className="font-bold text-sm leading-tight">{preset.title}</div>
                                <span className={cx('text-[9px] font-black uppercase tracking-widest', rarity.text)}>{rarity.label}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-white/50 mb-3 leading-relaxed">{preset.description}</p>
                          <div className="flex items-center justify-between">
                            {preset.reward_value > 0 && (
                              <span className={cx('text-xs font-bold', preset.reward_type === 'xp' ? 'text-purple-300' : 'text-yellow-300')}>
                                +{preset.reward_value} {preset.reward_type === 'xp' ? 'XP' : 'Moedas'}
                              </span>
                            )}
                            {preset.reward_value === 0 && <span className="text-xs text-white/30">Benef\u00edcio Especial</span>}
                            <button onClick={() => handleActivateSurprise(preset.id)} disabled={!surpriseTargetUser || activatingSurprise === preset.id} className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5">
                              {activatingSurprise === preset.id ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                              Ativar
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* History */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock size={16} /> Hist\u00f3rico Recente
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {surpriseHistory.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{h.emoji}</span>
                    <div>
                      <div className="text-sm font-bold">{h.title}</div>
                      <div className="text-[10px] text-white/40">Para: {h.user_name}</div>
                    </div>
                  </div>
                  <span className={cx('text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border', h.seen ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')}>
                    {h.seen ? 'Visto' : 'Pendente'}
                  </span>
                </div>
              ))}
              {surpriseHistory.length === 0 && (
                <div className="text-center py-8 text-white/20 text-sm">Nenhum drop surpresa enviado ainda.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}