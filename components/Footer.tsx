import Link from 'next/link'
import { Instagram, Facebook, MapPin } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-dark text-white py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* Brand */}
                    <div className="space-y-4">
                        <h3 className="font-script text-3xl text-illa-pink">Illa Sorvetes</h3>
                        <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                            Sorvetes artesanais feitos com paixão para tornar seu dia mais doce e divertido.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-illa-yellow text-lg">Explorar</h4>
                        <ul className="space-y-2 text-white/80">
                            <li><Link href="#products" className="hover:text-illa-pink transition-colors">Nossos Produtos</Link></li>
                            <li><Link href="#franchise" className="hover:text-illa-pink transition-colors">Seja um Franqueado</Link></li>
                            <li><Link href="#about" className="hover:text-illa-pink transition-colors">Quem Somos</Link></li>
                            <li><Link href="#locations" className="hover:text-illa-pink transition-colors">Nossas Lojas</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-illa-yellow text-lg">Contato</h4>
                        <ul className="space-y-2 text-white/80">
                            <li className="flex items-start gap-2">
                                <MapPin size={18} className="text-illa-pink mt-1 shrink-0" />
                                <span>Rua dos Sorvetes, 123<br />Centro, Cidade - UF</span>
                            </li>
                            <li>ola@illasorvetes.com.br</li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-illa-yellow text-lg">Siga a Illa</h4>
                        <div className="flex gap-4">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-full hover:bg-illa-pink hover:text-white transition-all">
                                <Instagram size={20} />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-full hover:bg-illa-pink hover:text-white transition-all">
                                <Facebook size={20} />
                            </a>
                        </div>
                    </div>

                </div>

                <div className="mt-16 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
                    © {new Date().getFullYear()} Illa Sorvetes. Todos os direitos reservados.
                </div>
            </div>
        </footer>
    )
}
