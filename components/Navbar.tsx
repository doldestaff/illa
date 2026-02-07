'use client'

import Link from 'next/link'
import { Menu, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export function Navbar() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
            <div className="container mx-auto px-4 py-6 flex items-center justify-between pointer-events-auto">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-[120px] h-[34px] md:w-[140px] md:h-[40px] transition-transform group-hover:scale-105 filter drop-shadow-md">
                        <Image
                            src="/brand/logo.png"
                            alt="Illa Sorvetes"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </Link>

                {/* Desktop Links - Floating Pills */}
                <div className="hidden md:flex items-center gap-4">
                    <Link href="#products" className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-full text-dark font-semibold hover:bg-white hover:text-illa-pink transition-all shadow-sm hover:shadow-md">
                        Produtos
                    </Link>
                    <Link href="#about" className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-full text-dark font-semibold hover:bg-white hover:text-illa-pink transition-all shadow-sm hover:shadow-md">
                        Sobre Nós
                    </Link>
                    <Link href="#locations" className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-full text-dark font-semibold hover:bg-white hover:text-illa-pink transition-all shadow-sm hover:shadow-md">
                        Lojas
                    </Link>
                    <Link
                        href="/pedido"
                        className="bg-illa-pink text-white px-6 py-2 rounded-full font-bold hover:bg-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:-translate-y-0.5"
                    >
                        <ShoppingBag size={18} />
                        Pedir Agora
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button className="md:hidden bg-white/90 backdrop-blur-md p-3 rounded-full text-dark shadow-sm hover:shadow-md">
                    <Menu size={24} />
                </button>
            </div>
        </nav>
    )
}
