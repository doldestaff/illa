'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ScanLine, CheckCircle, XCircle, RefreshCw, Clock, Shield, AlertTriangle, Search, QrCode } from 'lucide-react'

interface ValidationLog {
  id: number
  admin_user_id: string
  customer_user_id: string
  voucher_code: string
  voucher_type: string
  validated_at: string
}

export default function AdminValidation() {
  const [voucherCode, setVoucherCode] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [voucherType, setVoucherType] = useState<'discount' | 'sorvete' | 'drop'>('discount')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; customerName?: string } | null>(null)
  const [logs, setLogs] = useState<ValidationLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [searchCode, setSearchCode] = useState('')

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res = await fetch('/api/admin/validation?limit=50')
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : [])
      }
    } catch { /* silent */ }
    finally { setLogsLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherCode.trim() || !customerId.trim()) return
    setValidating(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_code: voucherCode.trim(),
          customer_user_id: customerId.trim(),
          voucher_type: voucherType,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, message: 'Voucher validado com sucesso!', customerName: data.customer_name })
        setVoucherCode('')
        fetchLogs()
      } else if (res.status === 409) {
        setResult({ success: false, message: data.error || 'Voucher duplicado!' })
      } else {
        setResult({ success: false, message: data.error || 'Erro ao validar.' })
      }
    } catch {
      setResult({ success: false, message: 'Erro de conexao.' })
    } finally { setValidating(false) }
  }

  const cx = (...parts: string[]) => parts.filter(Boolean).join(' ')

  const typeLabels: Record<string, { label: string; color: string }> = {
    discount: { label: 'Desconto', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    sorvete: { label: 'Sorvete', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    drop: { label: 'Drop', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  }

  const filteredLogs = logs.filter(l => {
    if (!searchCode) return true
    return l.voucher_code.toLowerCase().includes(searchCode.toLowerCase()) ||
           l.customer_user_id.toLowerCase().includes(searchCode.toLowerCase())
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* === VALIDATION FORM === */}
        <div className="md:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:sticky md:top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <ScanLine size={20} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Validar Voucher</h2>
                <p className="text-xs text-white/40">Escaneie ou digite o codigo</p>
              </div>
            </div>

            <form onSubmit={handleValidate} className="space-y-4">
              {/* Voucher Code */}
              <div>
                <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Codigo do Voucher</label>
                <div className="relative">
                  <QrCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value)}
                    placeholder="Cole ou escaneie o codigo..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-colors font-mono"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Customer ID */}
              <div>
                <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">ID do Cliente</label>
                <input
                  type="text"
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  placeholder="ID do usuario (UUID)"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-colors font-mono"
                  required
                />
              </div>

              {/* Voucher Type */}
              <div>
                <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['discount', 'sorvete', 'drop'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVoucherType(t)}
                      className={cx('py-2.5 rounded-xl text-xs font-bold border transition-all text-center', voucherType === t ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5')}
                    >
                      {typeLabels[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={validating || !voucherCode.trim() || !customerId.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {validating ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
                {validating ? 'Validando...' : 'Validar Agora'}
              </button>

              {/* Result Feedback */}
              {result && (
                <div className={cx('p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300', result.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20')}>
                  {result.success ? <CheckCircle size={20} className="text-emerald-400 mt-0.5 shrink-0" /> : <XCircle size={20} className="text-red-400 mt-0.5 shrink-0" />}
                  <div>
                    <div className={cx('font-bold text-sm', result.success ? 'text-emerald-300' : 'text-red-300')}>{result.message}</div>
                    {result.customerName && <div className="text-xs text-white/50 mt-1">Cliente: {result.customerName}</div>}
                  </div>
                </div>
              )}
            </form>

            {/* Security Note */}
            <div className="mt-6 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-300/70 leading-relaxed">
                Cada voucher so pode ser validado uma vez. Tentativas duplicadas serao rejeitadas automaticamente.
              </p>
            </div>
          </div>
        </div>

        {/* === VALIDATION HISTORY === */}
        <div className="md:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-4 md:p-5 border-b border-white/10 bg-white/5 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Clock size={16} className="text-emerald-400" />
                  Historico de Validacoes
                </h3>
                <button onClick={fetchLogs} disabled={logsLoading} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                  <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} />
                  Atualizar
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="text"
                  value={searchCode}
                  onChange={e => setSearchCode(e.target.value)}
                  placeholder="Buscar por codigo ou ID do cliente..."
                  className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredLogs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-white/20">
                  <ScanLine size={40} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma validacao encontrada.</p>
                  <p className="text-xs mt-1">Valide o primeiro voucher para iniciar o historico.</p>
                </div>
              )}

              {filteredLogs.length > 0 && (
                <div className="divide-y divide-white/5">
                  {filteredLogs.map(log => {
                    const typeMeta = typeLabels[log.voucher_type] || typeLabels.discount
                    const date = new Date(log.validated_at)
                    return (
                      <div key={log.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <CheckCircle size={16} className="text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold font-mono truncate">{log.voucher_code}</div>
                              <div className="text-[10px] text-white/40 truncate">Cliente: {log.customer_user_id.slice(0, 8)}...</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cx('text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border', typeMeta.color)}>
                              {typeMeta.label}
                            </span>
                            <div className="text-right">
                              <div className="text-[10px] text-white/50">{date.toLocaleDateString('pt-BR')}</div>
                              <div className="text-[10px] text-white/30">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Stats Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-black text-white">{logs.length}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-green-400">{logs.filter(l => l.voucher_type === 'discount').length}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Descontos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-pink-400">{logs.filter(l => l.voucher_type === 'sorvete').length}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Sorvetes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}