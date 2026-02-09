'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Facebook, MapPin, Mail, Phone } from 'lucide-react'

const externalLinks = {
    franchise: 'https://wa.me/5582997755961?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20as%20franquias',
    aboutExternal: 'https://www.illasorvetes.com.br/quem-somos',
    maps: 'https://maps.app.goo.gl/cUzZ9QYTDXnjqyWU8',
    instagram: 'https://www.instagram.com/illasorvetesoficial/',
    facebook: 'https://www.facebook.com/p/Illasorvetesoficial-100094697327857/'
}

export function Footer() {
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
                                <a href={externalLinks.aboutExternal} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white hover:translate-x-1 transition-all inline-block">
                                    Quem Somos
                                </a>
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
                                <span className="text-sm">Rua dos Sorvetes, 123<br />Centro, Maceió - AL</span>
                            </li>
                            <li className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                                <Mail size={20} className="text-illa-pink shrink-0 group-hover:scale-110 transition-transform" />
                                <a href="mailto:ola@illasorvetes.com.br" className="text-sm">ola@illasorvetes.com.br</a>
                            </li>
                            <li className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                                <Phone size={20} className="text-illa-pink shrink-0 group-hover:scale-110 transition-transform" />
                                <a href="tel:+558299999999" className="text-sm">+55 82 9999-9999</a>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter / CTA Column (Optional addition for "premium" feel) */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-illa-yellow text-lg tracking-wide uppercase text-sm">Novidades</h4>
                        <p className="text-white/60 text-sm mb-4">
                            Cadastre-se para receber novidades e ofertas exclusivas.
                        </p>
                        <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Seu melhor e-mail"
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-illa-pink/50 transition-colors"
                            />
                            <button className="bg-illa-pink text-white font-bold py-3 px-6 rounded-lg hover:bg-white hover:text-illa-pink transition-all text-sm uppercase tracking-wider shadow-lg hover:shadow-illa-pink/20">
                                Inscrever-se
                            </button>
                        </form>
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
