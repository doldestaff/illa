'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Instagram, Facebook, MapPin, Mail, Phone, ArrowRight } from 'lucide-react'

const externalLinks = {
    franchise: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias',
    aboutExternal: 'https://www.illasorvetes.com.br/quem-somos',
    maps: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8',
    instagram: 'https://www.instagram.com/illasorvetesoficial/',
    facebook: 'https://www.facebook.com/p/Illasorvetesoficial-100094697327857/'
}

export function Footer() {
    const router = useRouter()

    return (
        <footer className="bg-dark text-white pt-24 pb-12 relative overflow-hidden">
            {/* Background Pattern Overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: "url('/brand/pattern.png')", backgroundSize: "150px" }} />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">

                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="relative w-48 h-16">
                            <Image
                                src="/brand/logo.png" // Assuming logo.png is suitable for dark bg, otherwise might need a white version or filter
                                alt="Illa Sorvetes"
                                fill
                                className="object-contain object-left filter brightness-0 invert"
                            />
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed max-w-xs font-medium">
                            Sorvetes artesanais feitos com paixão para tornar seu dia mais doce e divertido. A verdadeira experiência do sabor.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href={externalLinks.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/5 p-3 rounded-full hover:bg-illa-pink hover:text-white transition-all hover:scale-110 active:scale-95 group"
                                aria-label="Instagram"
                            >
                                <Instagram size={20} className="text-white/80 group-hover:text-white" />
                            </a>
                            <a
                                href={externalLinks.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/5 p-3 rounded-full hover:bg-illa-pink hover:text-white transition-all hover:scale-110 active:scale-95 group"
                                aria-label="Facebook"
                            >
                                <Facebook size={20} className="text-white/80 group-hover:text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Links Column */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-illa-yellow text-lg tracking-wide uppercase text-sm">Explorar</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="#products" className="text-white/70 hover:text-white hover:translate-x-1 transition-all inline-block">
                                    Nossos Produtos
                                </Link>
                            </li>
                            <li>
                                <a href={externalLinks.franchise} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white hover:translate-x-1 transition-all inline-block">
                                    Seja um Franqueado
                                </a>
                            </li>
                            <li>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-about-modal'))}
                                    className="text-white/70 hover:text-white hover:translate-x-1 transition-all inline-block text-left"
                                >
                                    Quem Somos
                                </button>
                            </li>
                            <li>
                                <a href={externalLinks.maps} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white hover:translate-x-1 transition-all inline-block">
                                    Nossas Lojas
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-illa-yellow text-lg tracking-wide uppercase text-sm">Contato</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-white/70 hover:text-white transition-colors group">
                                <MapPin size={20} className="text-illa-pink mt-1 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="text-sm">Rua L, 04 Qd B Lote 02,<br />Serraria, Maceió - AL, 57046-090</span>
                            </li>
                            <li className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                                <Mail size={20} className="text-illa-pink shrink-0 group-hover:scale-110 transition-transform" />
                                <a href="mailto:contato@illasorvetes.com.br" className="text-sm">contato@illasorvetes.com.br</a>
                            </li>
                            <li className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                                <Phone size={20} className="text-illa-pink shrink-0 group-hover:scale-110 transition-transform" />
                                <a href="tel:+558287286990" className="text-sm">+55 82 8728-6990</a>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter / CTA Column (Optional addition for "premium" feel) */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-illa-yellow text-lg tracking-wide uppercase text-sm">Novidades</h4>
                        <p className="text-white/60 text-sm mb-4">
                            Cadastre-se na nossa plataforma para receber ofertas exclusivas e acompanhar seus pedidos.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => router.push('?login=1')}
                                className="w-full flex items-center justify-center gap-2 bg-illa-pink text-white font-bold py-3.5 px-6 rounded-xl hover:bg-white hover:text-illa-pink transition-all text-sm uppercase tracking-wider shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 active:scale-95 group"
                            >
                                Cadastre-se
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer Bottom */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                    <p className="text-white/30 text-xs">
                        © {new Date().getFullYear()} Illa Sorvetes. Todos os direitos reservados.
                    </p>
                    <div className="flex gap-6 text-white/30 text-xs">
                        <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
                        <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
