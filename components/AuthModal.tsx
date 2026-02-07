'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Lock, User, ArrowRight, Github } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true)
    const [mounted, setMounted] = useState(false)

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

    if (!mounted) return null

    // Portal to render outside main DOM hierarchy
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
                                w-full max-w-md 
                                bg-white/80 backdrop-blur-2xl 
                                border border-white/40 
                                rounded-3xl shadow-2xl 
                                overflow-hidden
                                pointer-events-auto
                                relative
                            "
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-dark/50 hover:text-dark hover:bg-black/5 rounded-full transition-colors z-10"
                            >
                                <X size={20} />
                            </button>

                            {/* Header / Tabs */}
                            <div className="flex p-2 m-2 bg-gray-100/50 rounded-2xl relative">
                                <motion.div
                                    layoutId="active-tab"
                                    className="absolute inset-2 bg-white rounded-xl shadow-sm w-[calc(50%-8px)]"
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

                            {/* Content */}
                            <div className="p-8 pt-4">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-dark mb-2">
                                        {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                                    </h2>
                                    <p className="text-dark/60 text-sm">
                                        {isLogin
                                            ? 'Acesse sua conta para gerenciar seus pedidos.'
                                            : 'Junte-se a nós e aproveite ofertas exclusivas.'}
                                    </p>
                                </div>

                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    {!isLogin && (
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-illa-pink transition-colors" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Seu Nome"
                                                className="w-full bg-white/50 border border-gray-200 focus:border-illa-pink/50 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium placeholder:text-gray-400"
                                            />
                                        </div>
                                    )}

                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-illa-pink transition-colors" size={20} />
                                        <input
                                            type="email"
                                            placeholder="Seu E-mail"
                                            className="w-full bg-white/50 border border-gray-200 focus:border-illa-pink/50 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium placeholder:text-gray-400"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-illa-pink transition-colors" size={20} />
                                        <input
                                            type="password"
                                            placeholder="Sua Senha"
                                            className="w-full bg-white/50 border border-gray-200 focus:border-illa-pink/50 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium placeholder:text-gray-400"
                                        />
                                    </div>

                                    {isLogin && (
                                        <div className="flex justify-end">
                                            <a href="#" className="text-xs font-semibold text-gray-500 hover:text-illa-pink transition-colors">
                                                Esqueceu a senha?
                                            </a>
                                        </div>
                                    )}

                                    <button
                                        className="w-full bg-illa-pink text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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

                                <div className="mt-6 flex gap-3">
                                    <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 py-2.5 rounded-xl transition-all text-sm font-semibold text-dark/80">
                                        {/* Google Icon SVG */}
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" />
                                            <path fill="#EA4335" d="M12 4.63c1.69 0 3.26.58 4.54 1.8l3.29-3.29C17.96 1.18 15.24 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Google
                                    </button>
                                    <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 py-2.5 rounded-xl transition-all text-sm font-semibold text-dark/80">
                                        <Github size={20} className="text-gray-900" />
                                        GitHub
                                    </button>
                                </div>
                            </div>

                            {/* Footer/Decor */}
                            <div className="h-2 bg-gradient-to-r from-illa-purple via-illa-pink to-orange-400" />
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}
