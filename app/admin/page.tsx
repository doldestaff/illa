'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { Shield, Eye, EyeOff, Home } from 'lucide-react'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabaseClient'

export default function AdminPage() {
    const [isAuthed, setIsAuthed] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        let mounted = true

        async function verify() {
            const supabase = createSupabaseBrowser()
            const { data: { user } } = await supabase.auth.getUser()

            if (!mounted) return

            if (!user) {
                setChecking(false)
                return
            }

            setIsAuthed(true)

            // Check admin_users table
            const { data: adminRow } = await supabase
                .from('admin_users')
                .select('user_id')
                .eq('user_id', user.id)
                .maybeSingle()

            if (!mounted) return

            if (adminRow) {
                setIsAdmin(true)
            }
            setChecking(false)
        }

        verify()

        return () => {
            mounted = false
        }
    }, [])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Admin email whitelist
        const allowedAdminEmails = ['orkutpirata@gmail.com']
        if (!allowedAdminEmails.includes(email.toLowerCase())) {
            setError('Acesso não autorizado para este email.')
            setLoading(false)
            return
        }

        try {
            const supabase = createSupabaseBrowser()
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                setError('Credenciais inválidas')
                setLoading(false)
                return
            }

            // Re-check admin status after login
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError('Erro de autenticação')
                setLoading(false)
                return
            }

            const { data: adminRow } = await supabase
                .from('admin_users')
                .select('user_id')
                .eq('user_id', user.id)
                .maybeSingle()

            if (!adminRow) {
                setError('Acesso negado: você não é administrador')
                await supabase.auth.signOut()
                setLoading(false)
                return
            }

            setIsAuthed(true)
            setIsAdmin(true)
        } catch {
            setError('Erro inesperado')
        }
        setLoading(false)
    }

    if (checking) {
        return (
            <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-illa-pink border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (isAuthed && isAdmin) {
        return <AdminDashboard />
    }

    return (
        <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-illa-pink/20 rounded-full blur-[60px]" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-illa-yellow/10 rounded-full blur-[60px]" />

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                                <Shield size={28} className="text-illa-pink" />
                            </div>
                            <h1 className="text-xl font-bold text-white">Painel Admin</h1>
                            <p className="text-sm text-white/40 mt-1">ILLA Sorvetes</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">
                                    E-mail
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-illa-pink/50 focus:ring-1 focus:ring-illa-pink/30 transition-all"
                                    placeholder="admin@illasorvetes.com"
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">
                                    Senha
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-illa-pink/50 focus:ring-1 focus:ring-illa-pink/30 transition-all"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg py-2">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !email || !password}
                                className="w-full py-3 rounded-xl font-bold text-sm bg-illa-pink text-white hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-illa-pink/20"
                            >
                                {loading ? 'Verificando...' : 'Entrar'}
                            </button>
                        </form>
                    </div>
                </div>

                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 mt-6 py-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                    <Home size={16} />
                    <span>Voltar para Home</span>
                </Link>
            </div>
        </div>
    )
}
