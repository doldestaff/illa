'use client'

import { Star, Instagram } from 'lucide-react'

const testimonials = [
    { id: 1, name: 'Ana Clara', text: 'O melhor sorvete que já provei! O de ninho trufado é surreal.', role: 'Cliente Fã' },
    { id: 2, name: 'Pedro S.', text: 'Ambiente incrível e atendimento nota 10. Virei cliente fiel.', role: 'Local Guide' },
    { id: 3, name: 'Maria Eduarda', text: 'Minha filha ama os picolés da linha Kids. Diversão garantida!', role: 'Mamãe' },
]

export function SocialProof() {
    return (
        <section className="py-24 bg-illa-pink text-white overflow-hidden relative">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 w-20 h-20 rounded-full border-4 border-white transform rotate-12" />
                <div className="absolute bottom-20 right-20 w-32 h-32 bg-white rounded-full mix-blend-overlay blur-2xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="font-script text-4xl md:text-5xl mb-2">Quem prova, ama!</h2>
                        <p className="text-white/80 text-lg">Junte-se a milhares de apaixonados pela Illa.</p>
                    </div>

                    <a
                        href="https://instagram.com/illasorvetesoficial"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-illa-pink px-8 py-3 rounded-full font-bold hover:bg-illa-yellow hover:text-dark transition-colors shadow-lg flex items-center gap-2"
                    >
                        <Instagram size={20} />
                        Siga @illasorvetesoficial
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div key={t.id} className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                            <div className="flex gap-1 text-illa-yellow mb-4">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" strokeWidth={0} />)}
                            </div>
                            <p className="text-lg italic mb-6">&ldquo;{t.text}&rdquo;</p>
                            <div>
                                <strong className="block font-bold">{t.name}</strong>
                                <span className="text-sm opacity-60">{t.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
