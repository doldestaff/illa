'use client'

import { useState, useRef } from 'react'
import { MapPin, Clock, Phone, Navigation } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Store {
    id: string
    name: string
    address: string
    hours: string
    phone: string
    mapUrl: string
    embedSrc: string
}

const stores: Store[] = [
    {
        id: 'serraria',
        name: 'Illa Sorvetes – Serraria',
        address: 'Rua da Alegria, 123 – Serraria, Maceió/AL',
        hours: 'Seg–Sex 10h às 22h • Sáb–Dom 12h às 23h',
        phone: '+55 82 99999-9991',
        mapUrl: 'https://maps.app.goo.gl/example1', // Replace with real link
        // Using a generic Maceió center or specific coordinates if available. 
        // For now using a placeholder query that works with embed API if keyless or fallback.
        // Ideally this would be a specific place ID. 
        embedSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15699.646097223795!2d-35.733333!3d-9.666667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMzknNTguOCJTIDM1wrA0NCcwMC4wIlc!5e0!3m2!1sen!2sbr!4v1620000000000!5m2!1sen!2sbr'
    },
    {
        id: 'jatiuca',
        name: 'Illa Sorvetes – Jatiúca',
        address: 'Av. Jatiúca, 456 – Jatiúca, Maceió/AL',
        hours: 'Seg–Sex 10h às 22h • Sáb–Dom 12h às 23h',
        phone: '+55 82 99999-9992',
        mapUrl: 'https://maps.app.goo.gl/example2',
        embedSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3408.8!2d-35.705!3d-9.655!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMzknMTguMCJTIDM1wrA0MicxOC4wIlc!5e0!3m2!1sen!2sbr!4v1620000000000!5m2!1sen!2sbr'
    },
    {
        id: 'pontaverde',
        name: 'Illa Sorvetes – Ponta Verde',
        address: 'Rua da Praia, 789 – Ponta Verde, Maceió/AL',
        hours: 'Seg–Sex 10h às 22h • Sáb–Dom 12h às 23h',
        phone: '+55 82 99999-9993',
        mapUrl: 'https://maps.app.goo.gl/example3',
        embedSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3408.8!2d-35.7!3d-9.66!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMzknMzYuMCJTIDM1wrA0MicwMC4wIlc!5e0!3m2!1sen!2sbr!4v1620000000000!5m2!1sen!2sbr'
    }
]

export function StoreLocations() {
    const [activeStore, setActiveStore] = useState<Store>(stores[0])
    const [iframeKey, setIframeKey] = useState(0) // Force iframe reload

    const handleStoreClick = (store: Store) => {
        if (store.id === activeStore.id) return
        setActiveStore(store)
        setIframeKey(prev => prev + 1)
    }

    return (
        <section id="locations" className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
            {/* Background Element - Subtle Blob */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-illa-pink/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center lg:text-left"
                >
                    <h2 className="font-script text-6xl text-dark mb-4 drop-shadow-sm">Visite nossa loja</h2>
                    <p className="text-dark/60 text-xl font-light tracking-wide max-w-2xl">
                        Viva a experiência Illa de perto — sorvetes, vibes e momentos inesquecíveis.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* Store List */}
                    <div className="space-y-6">
                        {stores.map((store, index) => (
                            <motion.div
                                key={store.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleStoreClick(store)}
                                className={cn(
                                    "group relative p-8 rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden",
                                    activeStore.id === store.id
                                        ? "bg-white border-illa-pink/30 shadow-xl scale-[1.02]"
                                        : "bg-white/50 border-transparent hover:bg-white hover:border-illa-pink/10 hover:shadow-lg"
                                )}
                            >
                                {/* Active Indicator */}
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300",
                                    activeStore.id === store.id ? "bg-illa-pink" : "bg-transparent group-hover:bg-illa-pink/20"
                                )} />

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-3 rounded-full transition-colors duration-300",
                                            activeStore.id === store.id ? "bg-illa-pink text-white" : "bg-gray-100 text-gray-500 group-hover:text-illa-pink group-hover:bg-illa-pink/10"
                                        )}>
                                            <MapPin size={24} />
                                        </div>
                                        <h3 className="font-bold text-2xl text-dark">{store.name}</h3>
                                    </div>

                                    <div className="pl-[3.75rem] space-y-3 text-dark/70">
                                        <div className="flex items-start gap-2">
                                            <span className="mt-1 w-4 h-4 rounded-full bg-illa-yellow/20 flex items-center justify-center shrink-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-illa-yellow" />
                                            </span>
                                            {store.address}
                                        </div>

                                        <div className="flex gap-6 flex-wrap">
                                            <div className="flex items-center gap-2 text-sm text-dark/60 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                                <Clock size={14} />
                                                <span>{store.hours}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-dark/60 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                                <Phone size={14} />
                                                <span>{store.phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pl-[3.75rem] pt-2 flex gap-4">
                                        <button
                                            // This button triggers visual focus in this UI, effectively selecting the store
                                            className={cn(
                                                "text-sm font-bold flex items-center gap-2 transition-colors",
                                                activeStore.id === store.id ? "text-illa-pink" : "text-gray-400 group-hover:text-illa-pink"
                                            )}
                                        >
                                            <Navigation size={16} />
                                            Ver no Mapa
                                        </button>

                                        {/* External Link */}
                                        <a
                                            href={store.mapUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-bold flex items-center gap-2 text-gray-400 hover:text-illa-pink transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Abrir no Google Maps
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Map Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="lg:h-[700px] h-[400px] lg:sticky lg:top-24 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative bg-gray-100"
                    >
                        {/* Loading/Overlay State could go here */}

                        <iframe
                            key={iframeKey} // Force re-render on store change for smooth transition attempt or new source
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={activeStore.embedSrc}
                            className="w-full h-full grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                            title={`Mapa ${activeStore.name}`}
                        />

                        {/* Premium Flush Overlay Gradient */}
                        <div className="absolute inset-0 pointer-events-none border-[6px] border-white/20 rounded-[2.5rem] shadow-inner" />
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
