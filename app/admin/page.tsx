'use client'

import { useState, useEffect } from 'react'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { Shield, Eye, EyeOff, Home } from 'lucide-react'
import Link from 'next/link'

const ADMIN_TOKEN = '6c5e3a7b8f2d1e4a9c0b5d8f3e6a1b4c'

export default function AdminPage() {
    const [isAuthed, setIsAuthed] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = sessionStorage.getItem('admin_token')
            if (token === ADMIN_TOKEN) {
                setTimeout(() => setIsAuthed(true), 0)
            }
        }
    }, [])
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        setTimeout(() => {
            if (username === 'admin' && password === '1212') {
                sessionStorage.setItem('admin_token', ADMIN_TOKEN)
                setIsAuthed(true)
            } else {
                setError('Credenciais inválidas')
            }
            setLoading(false)
        }, 600)
    }

    if (isAuthed) {
        return <AdminDashboard token={ADMIN_TOKEN} />
    }

    return (
        <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Login Card */}
                <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
                    {/* Ambient glow */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-illa-pink/20 rounded-full blur-[60px]" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-illa-yellow/10 rounded-full blur-[60px]" />

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                                <Shield size={28} className="text-illa-pink" />
                            </div>
                            <h1 className="text-xl font-bold text-white">Painel Admin</h1>
                            <p className="text-sm text-white/40 mt-1">ILLA Sorvetes</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">
                                    Usuário
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-illa-pink/50 focus:ring-1 focus:ring-illa-pink/30 transition-all"
                                    placeholder="admin"
                                    autoComplete="username"
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
                                        placeholder="••••"
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
                                disabled={loading || !username || !password}
                                className="w-full py-3 rounded-xl font-bold text-sm bg-illa-pink text-white hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-illa-pink/20"
                            >
                                {loading ? 'Verificando...' : 'Entrar'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Back to Home */}
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
