'use client'

import Link from 'next/link'
import { Menu, ShoppingBag, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AuthModal } from './AuthModal'

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)

    // Scroll Lock for Mobile Menu
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    // Links Config
    const externalLinks = {
        franchise: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias',
        aboutExternal: 'https://www.illasorvetes.com.br/quem-somos',
        whatsappOrder: 'https://api.whatsapp.com/send/?phone=558287286990&text=Oi%C3%AA%21+Vim+do+site+da+Illa%21&type=phone_number&app_absent=0',
        ifood: 'https://www.ifood.com.br/delivery/maceio-al/illa-sorvetes---sorveteria-serraria-serraria/403679e8-d45f-4f93-8fc9-c5e0e6f2dd04',
        maps: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8',
        instagram: 'https://www.instagram.com/illasorvetesoficial/',
        facebook: 'https://www.facebook.com/p/Illasorvetesoficial-100094697327857/'
    }

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300">
                <div
                    className="container mx-auto px-4 flex items-center justify-between pointer-events-auto"
                    style={{
                        paddingTop: 'max(1rem, env(safe-area-inset-top))',
                        paddingBottom: '1rem'
                    }}
                >
                    <Link href="/" className="flex items-center gap-3 group relative z-50">
                        {/* Logo increased but constrained for mobile safety */}
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

                    {/* Desktop Actions - Simplified */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-full",
                                "text-white font-bold tracking-wide text-sm",
                                "bg-white/10 backdrop-blur-md border border-white/20",
                                "hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95",
                                "transition-all shadow-lg"
                            )}
                        >
                            <User size={18} />
                            LOGIN
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
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden bg-white/90 backdrop-blur-md p-3 rounded-full text-dark shadow-sm hover:shadow-md relative z-50"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Mobile Menu Overlay */}
                    <div
                        className={cn(
                            "fixed inset-0 bg-white z-40 flex flex-col items-center justify-center gap-6 transition-all duration-300 md:hidden",
                            isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                        )}
                    >
                        <Link href="#products" onClick={() => setIsOpen(false)} className="text-2xl font-bold text-dark hover:text-illa-pink">
                            Produtos
                        </Link>
                        <a href={externalLinks.aboutExternal} target="_blank" rel="noreferrer" className="text-2xl font-bold text-dark hover:text-illa-pink">
                            Quem Somos
                        </a>
                        <a href={externalLinks.maps} target="_blank" rel="noreferrer" className="text-2xl font-bold text-dark hover:text-illa-pink">
                            Lojas
                        </a>
                        <a href={externalLinks.franchise} target="_blank" rel="noreferrer" className="text-2xl font-bold text-dark hover:text-illa-pink">
                            Seja um Franqueado
                        </a>

                        <button
                            onClick={() => { setIsOpen(false); setShowAuthModal(true); }}
                            className="flex items-center gap-2 text-2xl font-bold text-dark hover:text-illa-pink"
                        >
                            <User size={24} />
                            Minha Conta
                        </button>

                        <div className="flex gap-4 mt-8">
                            <a href={externalLinks.instagram} target="_blank" rel="noreferrer" className="text-dark hover:text-illa-pink">Instagram</a>
                            <a href={externalLinks.facebook} target="_blank" rel="noreferrer" className="text-dark hover:text-illa-pink">Facebook</a>
                        </div>
                        <a
                            href={externalLinks.ifood}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 bg-illa-pink text-white px-8 py-3 rounded-full font-bold text-xl hover:bg-pink-600 shadow-lg"
                        >
                            Pedir Agora
                        </a>
                    </div>
                </div>
            </nav>

            {/* Auth Modal */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </>
    )
}
