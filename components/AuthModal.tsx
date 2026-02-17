'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Lock, User, ArrowRight, Phone, Instagram, Facebook, Loader2, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabaseClient'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const router = useRouter()

    // Form fields
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    // Reset state when modal opens/closes or tab changes
    useEffect(() => {
        setError('')
        setSuccess('')
        setLoading(false)
    }, [isOpen, isLogin])

    const resetForm = () => {
        setFullName('')
        setEmail('')
        setWhatsapp('')
        setPassword('')
        setConfirmPassword('')
        setError('')
        setSuccess('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        const supabase = createSupabaseBrowser()

        try {
            if (isLogin) {
                // --- LOGIN ---
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (signInError) {
                    setError(signInError.message === 'Invalid login credentials'
                        ? 'E-mail ou senha incorretos.'
                        : signInError.message)
                    return
                }
                resetForm()
                onClose()
                router.push('/members')
                router.refresh()
            } else {
                // --- SIGNUP ---
                if (password !== confirmPassword) {
                    setError('As senhas não coincidem.')
                    return
                }
                if (password.length < 6) {
                    setError('A senha deve ter pelo menos 6 caracteres.')
                    return
                }

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName },
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })

                if (signUpError) {
                    setError(signUpError.message)
                    return
                }

                // Upsert profile with whatsapp (if user session exists immediately)
                if (signUpData.user) {
                    await supabase
                        .from('profiles')
                        .upsert({
                            id: signUpData.user.id,
                            full_name: fullName,
                            whatsapp,
                            email,
                        })

                    // Check if email confirmation is required
                    if (signUpData.session) {
                        resetForm()
                        onClose()
                        router.push('/members')
                        router.refresh()
                    } else {
                        setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
                        resetForm()
                    }
                }
            }
        } catch {
            setError('Ocorreu um erro inesperado. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const handleOAuth = async (provider: 'google') => {
        setError('')
        const supabase = createSupabaseBrowser()
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (oauthError) {
            setError(oauthError.message)
        }
    }

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="
                                w-full max-w-md md:max-w-2xl
                                bg-white/90 backdrop-blur-2xl 
                                border border-white/40 
                                rounded-3xl shadow-2xl 
                                overflow-hidden
                                pointer-events-auto
                                relative
                                max-h-[90vh] overflow-y-auto
                                md:max-h-none md:overflow-visible md:h-auto
                            "
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-3 text-dark/50 hover:text-dark hover:bg-black/5 rounded-full transition-colors z-20"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex flex-col md:flex-row h-full">
                                <div className="w-full p-6 md:p-8">
                                    {/* Header / Tabs */}
                                    <div className="flex p-1.5 mb-8 bg-gray-100/50 rounded-2xl relative w-full">
                                        <motion.div
                                            layoutId="active-tab"
                                            className="absolute inset-1.5 bg-white rounded-xl shadow-sm w-[calc(50%-6px)]"
                                            initial={false}
                                            animate={{
                                                x: isLogin ? 0 : '100%'
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                        <button
                                            onClick={() => setIsLogin(true)}
                                            className={`flex-1 py-3 text-sm font-bold text-center relative z-10 transition-colors ${isLogin ? 'text-illa-pink' : 'text-gray-500'}`}
                                        >
                                            ENTRAR
                                        </button>
                                        <button
                                            onClick={() => setIsLogin(false)}
                                            className={`flex-1 py-3 text-sm font-bold text-center relative z-10 transition-colors ${!isLogin ? 'text-illa-pink' : 'text-gray-500'}`}
                                        >
                                            CADASTRAR
                                        </button>
                                    </div>

                                    <div className="text-center mb-8">
                                        <h2 className="text-3xl font-bold text-dark mb-2">
                                            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                                        </h2>
                                        <p className="text-dark/60 text-sm">
                                            {isLogin
                                                ? 'Acesse sua conta para gerenciar seus pedidos.'
                                                : 'Junte-se a nós e aproveite ofertas exclusivas.'}
                                        </p>
                                    </div>

                                    {/* Error / Success Messages */}
                                    {error && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium text-center">
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm font-medium text-center">
                                            {success}
                                        </div>
                                    )}

                                    <form className="space-y-4" onSubmit={handleSubmit}>
                                        {!isLogin && (
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-illa-pink transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="Seu Nome"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    required
                                                    className="w-full bg-white/50 border border-gray-200 focus:border-illa-pink/50 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium placeholder:text-gray-400"
                                                />
                                            </div>
                                        )}

                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-illa-pink transition-colors" size={20} />
                                            <input
                                                type="email"
                                                placeholder="Seu E-mail"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full bg-white/50 border border-gray-200 focus:border-illa-pink/50 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium placeholder:text-gray-400"
                                            />
                                        </div>

                                        {!isLogin && (
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-illa-pink transition-colors" size={20} />
                                                <input
                                                    type="tel"
                                                    placeholder="Seu Whatsapp"
                                                    value={whatsapp}
                                                    onChange={(e) => setWhatsapp(e.target.value)}
                                                    required
                                                    className="w-full bg-white/50 border border-gray-200 focus:border-illa-pink/50 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium placeholder:text-gray-400"
                                                />
                                            </div>
                                        )}

                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-illa-pink transition-colors" size={20} />
                                            <input
                                                type="password"
                                                placeholder="Sua Senha"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                className="w-full bg-white/50 border border-gray-200 focus:border-illa-pink/50 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium placeholder:text-gray-400"
                                            />
                                        </div>

                                        {!isLogin && (
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-illa-pink transition-colors" size={20} />
                                                <input
                                                    type="password"
                                                    placeholder="Confirmar senha"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    minLength={6}
                                                    className="w-full bg-white/50 border border-gray-200 focus:border-illa-pink/50 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium placeholder:text-gray-400"
                                                />
                                            </div>
                                        )}

                                        {isLogin && (
                                            <div className="flex justify-end">
                                                <a href="#" className="text-xs font-semibold text-gray-500 hover:text-illa-pink transition-colors">
                                                    Esqueceu a senha?
                                                </a>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-illa-pink text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                        >
                                            {loading ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    {isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
                                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    <div className="mt-8 relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs">
                                            <span className="bg-white px-2 text-gray-400 font-medium">Ou continue com</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-col md:flex-row gap-3">
                                        <button
                                            onClick={() => handleOAuth('google')}
                                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 py-2.5 rounded-xl transition-all text-sm font-semibold text-dark/80 group"
                                        >
                                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" />
                                                <path fill="#EA4335" d="M12 4.63c1.69 0 3.26.58 4.54 1.8l3.29-3.29C17.96 1.18 15.24 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Google
                                        </button>

                                        <button
                                            disabled
                                            title="Em breve"
                                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 py-2.5 rounded-xl transition-all text-sm font-semibold text-dark/30 cursor-not-allowed relative"
                                        >
                                            <Instagram size={20} className="text-[#E1306C]/40" />
                                            Instagram
                                            <span className="absolute -top-2 -right-1 bg-gray-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                                Em breve
                                            </span>
                                        </button>

                                        <button
                                            disabled
                                            title="Em breve"
                                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 py-2.5 rounded-xl transition-all text-sm font-semibold text-dark/30 cursor-not-allowed relative"
                                        >
                                            <Facebook size={20} className="text-[#1877F2]/40" />
                                            Facebook
                                            <span className="absolute -top-2 -right-1 bg-gray-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                                Em breve
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <div className="h-2 md:h-auto md:w-2 bg-gradient-to-r md:bg-gradient-to-b from-illa-purple via-illa-pink to-orange-400" />
                            </div>

                            {/* Footer Action */}
                            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-center">
                                <button
                                    onClick={() => {
                                        onClose()
                                        router.push('/descontos')
                                    }}
                                    className="flex items-center gap-2 text-sm font-bold text-illa-pink hover:text-pink-600 transition-colors"
                                >
                                    <Tag size={16} />
                                    CONHECER LOJA DE DESCONTOS
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}
