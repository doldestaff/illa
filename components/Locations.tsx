'use client'

import { MapPin, Clock, Phone } from 'lucide-react'

export function Locations() {
    return (
        <section id="locations" className="py-24 bg-white relative">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-12 items-center">

                    {/* Info */}
                    <div className="lg:w-1/2 space-y-8">
                        <h2 className="font-script text-5xl text-dark">Visite nossa loja</h2>
                        <p className="text-dark/60 text-lg">
                            Venha viver a experiência Illa de perto. Um ambiente preparado para você relaxar e curtir o melhor sorvete da cidade.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-illa-pink/10 p-3 rounded-full text-illa-pink">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-dark">Endereço</h3>
                                    <p className="text-dark/60">Rua dos Sorvetes, 123 - Centro<br />Cidade - UF, 12345-000</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-illa-yellow/20 p-3 rounded-full text-dark">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-dark">Horário</h3>
                                    <p className="text-dark/60">Segunda a Sexta: 10h às 22h<br />Sábado e Domingo: 12h às 23h</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-soft-gray p-3 rounded-full text-dark">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-dark">Contato</h3>
                                    <p className="text-dark/60">(11) 99999-9999<br />ola@illasorvetes.com.br</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Placeholder */}
                    <div className="lg:w-1/2 w-full h-[400px] bg-soft-gray rounded-[2rem] overflow-hidden relative group">
                        {/* Visual Map Placeholder */}
                        <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=-23.550520,-46.633308&zoom=14&size=600x400&sensor=false&key=YOUR_API_KEY_HERE')] bg-cover bg-center grayscale opacity-50 group-hover:grayscale-0 transition-all duration-500" />

                        {/* Fallback pattern if no internet/api */}
                        <div className="absolute inset-0 bg-illa-pink/5 flex items-center justify-center">
                            <span className="bg-white px-6 py-3 rounded-full shadow-lg font-bold text-dark flex items-center gap-2">
                                <MapPin className="text-illa-pink" />
                                Ver no Mapa
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
