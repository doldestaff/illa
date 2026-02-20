'use client'

import Link from 'next/link'
import { Menu, ShoppingBag, User, LogIn, IceCream, MapPin, Store, Info, Shield, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthModal } from './AuthModal'
import { AboutModal } from './AboutModal'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useLenis } from 'lenis/react'

function LoginParamListener({ onLoginParam }: { onLoginParam: () => void }) {
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        if (searchParams.get('login') === '1') {
            onLoginParam()
            const url = new URL(window.location.href)
            url.searchParams.delete('login')
            router.replace(url.pathname, { scroll: false })
        }
    }, [searchParams, onLoginParam, router])

    return null
}

function NavbarInner() {
    const [isOpen, setIsOpen] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const router = useRouter()

    // --- Lenis Scroll Lock Integration ---
    const lenis = useLenis()

    useEffect(() => {
        const supabase = createSupabaseBrowser()

        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            // Prevent background scrolling while menu is open (Lenis sync)
            if (lenis) lenis.stop()
        } else {
            document.body.style.overflow = ''
            // Resume background scrolling
            if (lenis) lenis.start()
        }
        return () => {
            document.body.style.overflow = ''
            if (lenis) lenis.start() // Safety reset
        }
    }, [isOpen, lenis])

    const externalLinks = {
        franchise: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias',
        aboutExternal: 'https://www.illasorvetes.com.br/quem-somos',
        whatsappOrder: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%AA%21+Vim+do+site+da+Illa%21&type=phone_number&app_absent=0',
        ifood: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04',
        maps: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8',
        instagram: 'https://www.instagram.com/illasorvetesoficial/',
        facebook: 'https://www.facebook.com/p/Illasorvetesoficial-100094697327857/'
    }

    const handleAuthClick = () => {
        if (user) {
            router.push('/members')
        } else {
            setShowAuthModal(true)
        }
    }

    // About Modal Logic
    const [isAboutOpen, setIsAboutOpen] = useState(false)

    useEffect(() => {
        const handleOpenAbout = () => setIsAboutOpen(true)
        window.addEventListener('open-about-modal', handleOpenAbout)
        return () => window.removeEventListener('open-about-modal', handleOpenAbout)
    }, [])

    return (
        <>
            <Suspense fallback={null}>
                <LoginParamListener onLoginParam={() => setShowAuthModal(true)} />
            </Suspense>

            <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300">
                <div
                    className="container mx-auto px-4 flex items-center justify-between pointer-events-auto"
                    style={{
                        paddingTop: 'max(1rem, env(safe-area-inset-top))',
                        paddingBottom: '1rem'
                    }}
                >
                    <Link href="/" className="flex items-center gap-3 group relative z-50">
                        <div className="relative w-[200px] h-[60px] md:w-[450px] md:h-[135px] transition-transform group-hover:scale-105 filter drop-shadow-md -ml-2">
                            <Image
                                src="/brand/logo.png"
                                alt="Illa Sorvetes"
                                fill
                                className="object-contain object-left"
                                sizes="120px"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={handleAuthClick}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-full",
                                "text-white font-bold tracking-wide text-sm",
                                "bg-white/10 backdrop-blur-md border border-white/20",
                                "hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95",
                                "transition-all shadow-lg"
                            )}
                        >
                            {user ? (
                                <>
                                    <User size={18} />
                                    MINHA CONTA
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    LOGIN
                                </>
                            )}
                        </button>

                        <a
                            href={externalLinks.ifood}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-illa-pink text-white px-6 py-2 rounded-full font-bold hover:bg-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:-translate-y-0.5"
                        >
                            <ShoppingBag size={18} />
                            Pedir Agora
                        </a>


                        <Link
                            href="/descontos"
                            className="bg-white/10 text-white p-2.5 rounded-full font-bold hover:bg-white/20 transition-all shadow-lg hover:shadow-xl flex items-center justify-center hover:-translate-y-0.5 border border-white/20"
                            title="Loja de Descontos"
                        >
                            <Tag size={18} />
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "md:hidden relative z-50 w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm",
                            isOpen
                                ? "bg-white text-illa-pink rotate-90 shadow-lg ring-2 ring-illa-pink/20"
                                : "bg-white/90 backdrop-blur-md text-dark hover:shadow-md hover:scale-105 active:scale-95"
                        )}
                        aria-label="Toggle Menu"
                    >
                        <div className="relative w-6 h-6">
                            <Menu
                                className={cn(
                                    "absolute inset-0 transition-all duration-300",
                                    isOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                                )}
                                size={24}
                            />
                            <div
                                className={cn(
                                    "absolute inset-0 flex items-center justify-center font-bold text-2xl transition-all duration-300",
                                    isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                                )}
                            >
                                ✕
                            </div>
                        </div>
                    </button>

                    {/* Mobile Menu Overlay */}
                    <div
                        className={cn(
                            "fixed inset-0 bg-white/95 backdrop-blur-xl z-40 flex flex-col transition-all duration-500 md:hidden",
                            isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible pointer-events-none -translate-y-4"
                        )}
                        style={{
                            paddingTop: 'max(5rem, env(safe-area-inset-top))',
                            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
                        }}
                    >
                        {/* Main Navigation Links (Center) */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 overflow-y-auto">
                            <Link
                                href="#products"
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "w-full bg-gray-50 hover:bg-white border border-transparent hover:border-illa-pink/20",
                                    "py-3 rounded-xl flex items-center justify-center gap-3",
                                    "text-lg font-bold text-dark transition-all duration-300 active:scale-95 shadow-sm"
                                )}
                            >
                                <IceCream size={20} className="text-illa-pink/80" />
                                Produtos
                            </Link>

                            <button
                                onClick={() => { setIsAboutOpen(true); setIsOpen(false); }}
                                className={cn(
                                    "w-full bg-gray-50 hover:bg-white border border-transparent hover:border-illa-pink/20",
                                    "py-3 rounded-xl flex items-center justify-center gap-3",
                                    "text-lg font-bold text-dark transition-all duration-300 active:scale-95 shadow-sm"
                                )}
                            >
                                <Info size={20} className="text-illa-pink/80" />
                                Quem Somos
                            </button>

                            <a
                                href={externalLinks.maps}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                    "w-full bg-gray-50 hover:bg-white border border-transparent hover:border-illa-pink/20",
                                    "py-3 rounded-xl flex items-center justify-center gap-3",
                                    "text-lg font-bold text-dark transition-all duration-300 active:scale-95 shadow-sm"
                                )}
                            >
                                <MapPin size={20} className="text-illa-pink/80" />
                                Lojas
                            </a>

                            <a
                                href={externalLinks.franchise}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                    "w-full bg-gray-50 hover:bg-white border border-transparent hover:border-illa-pink/20",
                                    "py-3 rounded-xl flex items-center justify-center gap-3",
                                    "text-lg font-bold text-dark transition-all duration-300 active:scale-95 shadow-sm"
                                )}
                            >
                                <Store size={20} className="text-illa-pink/80" />
                                Seja Franqueado
                            </a>
                        </div>

                        {/* Bottom Actions (Strategic Placement) */}
                        <div className="w-full px-6 pb-6 flex flex-col gap-3 bg-gradient-to-t from-white to-transparent pt-4">
                            {/* Login/account Button - Highly Clickable */}
                            <button
                                onClick={() => { setIsOpen(false); handleAuthClick(); }}
                                className={cn(
                                    "w-full py-3 rounded-xl font-bold text-base tracking-wide shadow-xl flex items-center justify-center gap-3 transition-all",
                                    "bg-white border-2 border-illa-pink text-illa-pink hover:bg-illa-pink hover:text-white",
                                    "active:scale-95 active:shadow-sm"
                                )}
                            >
                                <User size={20} className="" />
                                {user ? 'MINHA CONTA' : 'ACESSAR CONTA'}
                            </button>

                            <a
                                href={externalLinks.ifood}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full bg-illa-pink text-white py-3 rounded-xl font-black text-lg hover:bg-pink-600 shadow-lg shadow-pink-200/50 flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                <ShoppingBag size={20} />
                                PEDIR AGORA
                            </a>

                            <div className="flex justify-center gap-6 mt-2 opacity-60">
                                <a href={externalLinks.instagram} target="_blank" rel="noreferrer" className="text-dark hover:text-illa-pink transition-colors p-1">
                                    Instagram
                                </a>
                                <a href={externalLinks.facebook} target="_blank" rel="noreferrer" className="text-dark hover:text-illa-pink transition-colors p-1">
                                    Facebook
                                </a>
                            </div>

                            {/* Admin Access - Subtle */}
                            <div className="flex justify-center mt-1 pb-2">
                                <Link
                                    href="/admin"
                                    onClick={() => setIsOpen(false)}
                                    className="text-[10px] uppercase font-bold tracking-widest text-gray-300 hover:text-illa-pink transition-colors p-1 flex items-center gap-1.5"
                                >
                                    <Shield size={10} />
                                    Área Administrativa
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav >

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        </>
    )
}

export function Navbar() {
    return <NavbarInner />
}
