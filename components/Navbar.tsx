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
        <nav
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                scrolled ? 'py-3 glass' : 'py-6 bg-transparent'
            )}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-[120px] h-[34px] md:w-[140px] md:h-[40px] transition-transform group-hover:scale-105">
                        <Image
                            src="/brand/logo.png"
                            alt="Illa Sorvetes"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="#products" className="text-dark hover:text-illa-pink font-medium transition-colors">
                        Produtos
                    </Link>
                    <Link href="#about" className="text-dark hover:text-illa-pink font-medium transition-colors">
                        Sobre Nós
                    </Link>
                    <Link href="#locations" className="text-dark hover:text-illa-pink font-medium transition-colors">
                        Lojas
                    </Link>
                    <Link
                        href="/pedido"
                        className="bg-illa-pink text-white px-6 py-2 rounded-full font-bold hover:bg-pink-600 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <ShoppingBag size={18} />
                        Pedir Agora
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button className="md:hidden text-dark p-2">
                    <Menu size={28} />
                </button>
            </div>
        </nav>
    )
}
