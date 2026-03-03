'use client'

import { useState } from 'react'
import { MapPin, Clock, Phone, Navigation, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Store {
    id: string
    name: string
    shortName: string
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
        shortName: 'Serraria',
        address: 'Av. Menino Marcelo, 9731 Galpão F – Serraria, Maceió/AL',
        hours: 'Seg–Sex 10h às 22h • Sáb–Dom 12h às 23h',
        phone: '+55 82 3436-7444',
        mapUrl: 'https://maps.app.goo.gl/BiDtkzuWzPgv7c876',
        embedSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31470.559890717093!2d-35.73687366044919!3d-9.610763499999992!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x701461352daac6b%3A0x532a5a67ef76620d!2sIlla%20Sorvetes!5e0!3m2!1spt-BR!2sbr!4v1771864551744!5m2!1spt-BR!2sbr'
    },
    {
        id: 'jatiuca',
        name: 'Illa Sorvetes – Jatiúca',
        shortName: 'Jatiúca',
        address: 'Av. Alm. Álvaro Calheiros, 6 – Jatiúca, Maceió/AL',
        hours: 'Seg–Sex 10h às 22h • Sáb–Dom 12h às 23h',
        phone: '+55 82 99334-7941',
        mapUrl: 'https://maps.app.goo.gl/MfZJxYPshKbrTCSZA',
        embedSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1966.7161145348566!2d-35.701390300000014!3d-9.644059200000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x70145b805fa4ab1%3A0x5afdda9656f06c2e!2sIlla%20Sorvetes%20Praia!5e0!3m2!1spt-BR!2sbr!4v1771864621888!5m2!1spt-BR!2sbr'
    },
    {
        id: 'pontaverde',
        name: 'Illa Sorvetes – Ponta Verde',
        shortName: 'Ponta Verde',
        address: 'Rua Domingos Lordsleen, 352 – Ponta da Terra, Maceió/AL',
        hours: 'Seg–Sex 10h às 22h • Sáb–Dom 12h às 23h',
        phone: '+55 82 99999-9973',
        mapUrl: 'https://maps.app.goo.gl/TE7gCrqemUacEi4',
        embedSrc: 'https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d3933.155564798134!2d-35.7196018!3d-9.6677462!3m2!1i1024!2i768!4f13.1!3m2!1m1!2s!5e0!3m2!1spt-BR!2sbr!4v1771864789369!5m2!1spt-BR!2sbr'
    }
]

function MapEmbed({ store, className }: { store: Store; className?: string }) {
    return (
        <div className={cn("relative w-full overflow-hidden bg-gray-100", className)}>
            <iframe
                key={store.id}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={store.embedSrc}
                className="w-full h-full"
                title={`Mapa ${store.name}`}
            />
            {/* Inner border glow */}
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-inner ring-1 ring-white/20" />
        </div>
    )
}

export function StoreLocations() {
    const [activeStore, setActiveStore] = useState<Store>(stores[0])

    return (
        <section id="locations" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
            {/* Background blob */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-illa-pink/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-10 md:mb-16 text-center lg:text-left"
                >
                    <h2 className="font-script text-5xl md:text-6xl text-dark mb-3 drop-shadow-sm">Visite nossa loja</h2>
                    <p className="text-dark/60 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto lg:mx-0">
                        Viva a experiência Illa de perto — sorvetes, vibes e momentos inesquecíveis.
                    </p>
                </motion.div>

                {/* ─────────────────────────────────────────── */}
                {/* MOBILE LAYOUT                              */}
                {/* ─────────────────────────────────────────── */}
                <div className="md:hidden space-y-4">

                    {/* Map — dominant focal point */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="w-full h-[300px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStore.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full h-full"
                            >
                                <MapEmbed store={activeStore} className="h-full rounded-3xl" />
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                    {/* Store pill tabs — thumb zone */}
                    <div className="flex gap-2 justify-center px-1">
                        {stores.map((store) => (
                            <button
                                key={store.id}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setActiveStore(store)
                                }}
                                className={cn(
                                    "flex-1 py-2.5 px-3 rounded-full text-sm font-bold transition-all duration-250 border",
                                    activeStore.id === store.id
                                        ? "bg-illa-pink text-white border-illa-pink shadow-md shadow-pink-200/50"
                                        : "bg-white text-dark/50 border-gray-200 hover:border-illa-pink/30"
                                )}
                            >
                                {store.shortName}
                            </button>
                        ))}
                    </div>

                    {/* Info card — active store details */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeStore.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="bg-white rounded-3xl border border-gray-100 shadow-lg p-5 space-y-4"
                        >
                            {/* Store name */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-illa-pink flex items-center justify-center shrink-0">
                                    <MapPin size={18} className="text-white" />
                                </div>
                                <h3 className="font-bold text-xl text-dark leading-tight">{activeStore.name}</h3>
                            </div>

                            {/* Details */}
                            <div className="space-y-2.5 pl-[52px]">
                                <div className="flex items-start gap-2 text-dark/70 text-sm">
                                    <span className="mt-1 w-3.5 h-3.5 rounded-full bg-illa-yellow/30 flex items-center justify-center shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-illa-yellow" />
                                    </span>
                                    <span>{activeStore.address}</span>
                                </div>

                                <div className="flex items-center gap-2 text-dark/60 text-sm">
                                    <Clock size={13} className="shrink-0 text-dark/40" />
                                    <span>{activeStore.hours}</span>
                                </div>

                                <div className="flex items-center gap-2 text-dark/60 text-sm">
                                    <Phone size={13} className="shrink-0 text-dark/40" />
                                    <span>{activeStore.phone}</span>
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex gap-3 pl-[52px]">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(activeStore.mapUrl, '_blank', 'noopener,noreferrer')
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-illa-pink text-white text-sm font-bold shadow-sm hover:shadow-md transition-all"
                                >
                                    <Navigation size={14} />
                                    Ver no Mapa
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(activeStore.mapUrl, '_blank', 'noopener,noreferrer')
                                    }}
                                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-gray-200 text-dark/60 text-sm font-bold hover:border-illa-pink/30 hover:text-illa-pink transition-all"
                                >
                                    <ExternalLink size={14} />
                                    Maps
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ─────────────────────────────────────────── */}
                {/* DESKTOP LAYOUT (unchanged)                 */}
                {/* ─────────────────────────────────────────── */}
                <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* Store List */}
                    <div className="space-y-6">
                        {stores.map((store, index) => (
                            <motion.div
                                key={store.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setActiveStore(store)}
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
                                            <span>{store.address}</span>
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
                                            className={cn(
                                                "text-sm font-bold flex items-center gap-2 transition-colors",
                                                activeStore.id === store.id ? "text-illa-pink" : "text-gray-400 group-hover:text-illa-pink"
                                            )}
                                        >
                                            <Navigation size={16} />
                                            Ver no Mapa
                                        </button>
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
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStore.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full h-full"
                            >
                                <MapEmbed store={activeStore} className="h-full" />
                            </motion.div>
                        </AnimatePresence>
                        <div className="absolute inset-0 pointer-events-none border-[6px] border-white/20 rounded-[2.5rem] shadow-inner" />
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
