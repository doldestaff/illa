'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Coins, Play, Star, Sparkles, ChefHat, Camera, Upload, ImageIcon, User, Loader2, Video } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

interface RecipeMission {
    id: string
    title: string
    subtitle: string
    time: string
    difficulty: string
    ingredients: string[]
    steps: string[]
    checkin: string
    reward: number
}

const MISSIONS: RecipeMission[] = [
    {
        id: '1',
        title: 'Milkshake "Cinema de Pipoca"',
        subtitle: 'Fazer em dupla e brindar (sem álcool)',
        time: '7 min',
        difficulty: 'Fácil',
        ingredients: [
            '2 bolas de gelato de pipoca ILLA (ou baunilha + pipoca doce)',
            '200 ml leite (ou vegetal)',
            'Calda de chocolate/caramelo',
            'Pipoca pronta (de panela ou micro-ondas)'
        ],
        steps: [
            'Bata no liquidificador: sorvete + leite (bem pouco pra ficar grosso).',
            'Decore o copo com calda por dentro.',
            'Sirva e finalize com pipoca por cima.'
        ],
        checkin: 'postar foto do “bigode de calda” 😄',
        reward: 50
    },
    {
        id: '2',
        title: 'Affogato "Café Gelado + ILLA"',
        subtitle: 'Sobremesa chique em 2 minutos (perfeita pra date)',
        time: '3 min',
        difficulty: 'Fácil',
        ingredients: [
            '1 bola de sorvete ILLA (baunilha/chocolate/creme)',
            'Café forte (coado/espresso) ou café solúvel bem concentrado',
            'Chocolate ralado (opcional)'
        ],
        steps: [
            'Coloque a bola de ILLA no copo.',
            'Despeje o café quente por cima (só um “shot”).',
            'Finalize com raspas de chocolate.'
        ],
        checkin: 'avaliar no site: "#TeamAffogato ou #TeamMilkshake?"',
        reward: 50
    },
    {
        id: '3',
        title: 'Sanduíche de Sorvete "Cookie Smash"',
        subtitle: 'Fazer 4 mini-sanduíches e dividir com amigos',
        time: '10 min',
        difficulty: 'Fácil',
        ingredients: [
            'Cookies de mercado (tipo chocolate chip) ou biscoito recheado',
            'Sorvete ILLA (qualquer sabor)',
            'Granulado/confete/castanha triturada'
        ],
        steps: [
            'Coloque sorvete entre 2 cookies.',
            'Aperte levemente e passe as bordas no granulado.',
            'Leve 10 min ao freezer pra firmar.'
        ],
        checkin: 'foto "antes/depois da mordida"',
        reward: 75
    },
    {
        id: '4',
        title: '"Banana Split" Turbo em Casa',
        subtitle: 'Montar a taça mais bonita',
        time: '12 min',
        difficulty: 'Fácil',
        ingredients: [
            '1 banana',
            '3 bolas de sorvete ILLA (3 sabores diferentes)',
            'Calda (chocolate/morango/caramelo)',
            'Chantilly (opcional) + confeitos'
        ],
        steps: [
            'Corte a banana no meio (comprido) e coloque na taça.',
            'Adicione as 3 bolas, caldas e finalize.'
        ],
        checkin: '"foto de cima" estilo cardápio',
        reward: 100
    },
    {
        id: '5',
        title: 'Brownie de Caneca + Bola ILLA',
        subtitle: 'Sobremesa quente-frio em 1 caneca',
        time: '8 min',
        difficulty: 'Fácil',
        ingredients: [
            '2 colheres (sopa) de chocolate em pó',
            '2 colheres (sopa) açúcar',
            '2 colheres (sopa) farinha',
            '2 colheres (sopa) leite',
            '1 colher (sopa) óleo/manteiga',
            '1 bola de sorvete ILLA'
        ],
        steps: [
            'Misture tudo na caneca, sem o sorvete.',
            'Micro-ondas 60–90s (até firmar).',
            'Coloque a bola de ILLA por cima.'
        ],
        checkin: 'comentar "ponto perfeito: mais molhadinho ou mais firme?"',
        reward: 75
    },
    {
        id: '6',
        title: '"Float" de Guaraná (Refrigerante + ILLA)',
        subtitle: '1 litro vira 4 copos com cara de festa',
        time: '5 min',
        difficulty: 'Fácil',
        ingredients: [
            'Guaraná (ou soda limonada)',
            'Sorbet/frutado ILLA (ou creme/baunilha)',
            'Limão (opcional)'
        ],
        steps: [
            'Gelo no copo (opcional).',
            'Refrigerante até 2/3.',
            '1 bola de ILLA por cima (vai espumar bonito).'
        ],
        checkin: 'vídeo curto do "borbulhar"',
        reward: 50
    },
    {
        id: '7',
        title: 'Parfait de Açaí ILLA "Camadas"',
        subtitle: 'Montar camadas e escolher "topping oficial do casal"',
        time: '10 min',
        difficulty: 'Fácil',
        ingredients: [
            'Açaí ILLA',
            'Banana ou morango',
            'Granola',
            'Mel (opcional) ou leite condensado (opcional)'
        ],
        steps: [
            'Camada de açaí.',
            'Camada de fruta + granola.',
            'Repete e finaliza.'
        ],
        checkin: 'votar no topping favorito',
        reward: 75
    },
    {
        id: '8',
        title: '"Torta Gelada" de Biscoito',
        subtitle: 'Sobremesa de bandeja pra galera (Sem Forno)',
        time: '20 min + freezer',
        difficulty: 'Fácil',
        ingredients: [
            'Biscoito maisena',
            'Leite (pra molhar)',
            'Sorvete ILLA (pote)',
            'Chocolate derretido ou ganache pronta'
        ],
        steps: [
            'Faça camadas: biscoito molhado no leite → ILLA → biscoito → ILLA.',
            'Cubra com chocolate.',
            'Freezer 2 horas e corta em quadrados.'
        ],
        checkin: 'foto dos "quadradinhos perfeitos"',
        reward: 150
    },
    {
        id: '9',
        title: 'Picolé ILLA "DIP & CRUNCH"',
        subtitle: 'Transformar picolé em sobremesa premium',
        time: '15 min',
        difficulty: 'Fácil',
        ingredients: [
            'Picolés ILLA',
            'Chocolate em barra (derreter)',
            'Amendoim/castanha/biscoito triturado'
        ],
        steps: [
            'Derreta o chocolate (micro-ondas em intervalos).',
            'Mergulhe a ponta do picolé.',
            'Polvilhe o "crunch" e leve 5 min ao freezer.'
        ],
        checkin: '"qual crunch combina mais?"',
        reward: 100
    },
    {
        id: '10',
        title: 'Crepe de Banana (Frigideira) + ILLA',
        subtitle: 'Date vibe "cafeteria em casa"',
        time: '12 min',
        difficulty: 'Fácil',
        ingredients: [
            '1 banana amassada',
            '1 ovo',
            '2 colheres (sopa) aveia (ou farinha)',
            'Canela (opcional)',
            '1–2 bolas de sorvete ILLA'
        ],
        steps: [
            'Misture banana + ovo + aveia.',
            'Frigideira antiaderente 2–3 min cada lado.',
            'Sirva com ILLA por cima.'
        ],
        checkin: 'foto "corte ao meio" com o sorvete derretendo',
        reward: 100
    },
    {
        id: '11',
        title: '"Choco Gelado" Cremoso',
        subtitle: 'Bebida espessa estilo café/dessert (Sem Complicação)',
        time: '6 min',
        difficulty: 'Fácil',
        ingredients: [
            '2 bolas de ILLA sabor chocolate (ou creme + chocolate em pó)',
            '150 ml leite',
            '1 colher (sopa) chocolate em pó',
            'Gelo (opcional)'
        ],
        steps: [
            'Bata tudo até ficar liso e bem cremoso.',
            'Finalize com granulado ou raspas.'
        ],
        checkin: '"ficou mais milkshake ou mais chocolate?" 😄',
        reward: 50
    },
    {
        id: '12',
        title: 'Banoffee Express + ILLA',
        subtitle: 'Montar 2 taças lindas com ingredientes de mercado (A Sobremesa "Uau")',
        time: '15 min',
        difficulty: 'Fácil',
        ingredients: [
            'Banana',
            'Doce de leite (pote)',
            'Biscoito triturado (maisena ou amanteigado)',
            '2 bolas de sorvete ILLA (creme/baunilha/doce de leite)',
            'Canela (opcional)'
        ],
        steps: [
            'Fundo: biscoito triturado.',
            'Banana em rodelas + doce de leite.',
            'Bola de ILLA por cima e canela.'
        ],
        checkin: 'foto "camadas perfeitas" + nota de 0 a 10',
        reward: 150
    }
]

export default function ReceitasCinematicPage() {
    const [completedMissions, setCompletedMissions] = useState<string[]>([])
    const [totalCoins, setTotalCoins] = useState(0)
    const [activeMission, setActiveMission] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({ target: containerRef })
    const bgY1 = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
    const bgY2 = useTransform(scrollYProgress, [0, 1], ['0%', '-50%'])
    const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.2])

    // Efeito para carregar progresso inicial mockado ou local storage
    useEffect(() => {
        const saved = localStorage.getItem('@Illa:RecipesCompleted')
        if (saved) {
            const parsed = JSON.parse(saved)
            setCompletedMissions(parsed)
            const coins = parsed.reduce((acc: number, id: string) => {
                const mission = MISSIONS.find(m => m.id === id)
                return acc + (mission?.reward || 0)
            }, 0)
            setTotalCoins(coins)
        }
    }, [])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, mission: RecipeMission) => {
        const file = e.target.files?.[0]
        if (!file) return

        const isVideo = file.type.startsWith('video/')

        // Video Duration check
        if (isVideo) {
            const video = document.createElement('video')
            video.preload = 'metadata'

            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src)
                if (video.duration > 30) {
                    toast.error('O vídeo deve ter no máximo 30 segundos.')
                    if (fileInputRef.current) fileInputRef.current.value = ''
                    return
                }
                processUpload(file, mission)
            }
            video.src = URL.createObjectURL(file)
        } else {
            processUpload(file, mission)
        }
    }

    const processUpload = async (file: File, mission: RecipeMission) => {
        setUploading(true)

        // Simulating upload to Supabase Storage
        setTimeout(() => {
            setUploading(false)
            toast.success('Check-in registrado com sucesso!')
            handleComplete(mission)
        }, 2000)
    }

    const handleComplete = (mission: RecipeMission) => {
        if (completedMissions.includes(mission.id)) return

        // Confetti effect
        const duration = 3 * 1000
        // eslint-disable-next-line react-hooks/purity
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now()
            if (timeLeft <= 0) return clearInterval(interval)
            const particleCount = 50 * (timeLeft / duration)
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
        }, 250)

        const newCompleted = [...completedMissions, mission.id]
        setCompletedMissions(newCompleted)
        setTotalCoins(prev => prev + mission.reward)
        localStorage.setItem('@Illa:RecipesCompleted', JSON.stringify(newCompleted))

        toast.success(`+${mission.reward} Moedas ILLA!`, {
            description: `Missão "${mission.title}" concluída com sucesso!`,
            icon: <Coins className="text-amber-400" />
        })

        setActiveMission(null)
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30 font-sans pb-32">

            {/* Ultra-Cinematic Animated Luminous Background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030303]">
                {/* Deep Ambient Space */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,15,5,0.4)_0%,rgba(3,3,3,1)_100%)]" />

                {/* Floating Nebula / Aurora Orbs */}
                <motion.div
                    animate={{
                        transform: ['translate(0%, 0%) rotate(0deg) scale(1)', 'translate(5%, 10%) rotate(90deg) scale(1.15)', 'translate(-5%, 5%) rotate(180deg) scale(0.9)', 'translate(0%, 0%) rotate(360deg) scale(1)'],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-30%] left-[-20%] w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full bg-gradient-to-br from-pink-600/15 to-rose-900/10 blur-[100px] md:blur-[140px] mix-blend-screen"
                />

                <motion.div
                    animate={{
                        transform: ['translate(0%, 0%) rotate(0deg) scale(1)', 'translate(-10%, -10%) rotate(-90deg) scale(1.2)', 'translate(10%, -15%) rotate(-180deg) scale(1.05)', 'translate(0%, 0%) rotate(-360deg) scale(1)'],
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-20%] right-[-20%] w-[90vw] h-[90vw] md:w-[70vw] md:h-[70vw] rounded-full bg-gradient-to-tl from-amber-600/15 via-orange-500/10 to-transparent blur-[120px] md:blur-[160px] mix-blend-screen"
                />

                <motion.div
                    animate={{
                        transform: ['translate(0%, 0%) scale(1)', 'translate(15%, 15%) scale(1.3)', 'translate(-10%, 10%) scale(1.1)', 'translate(0%, 0%) scale(1)'],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[30%] left-[30%] w-[50vw] h-[50vw] md:w-[40vw] md:h-[40vw] rounded-full bg-amber-400/5 blur-[80px] md:blur-[120px] mix-blend-screen"
                />

                {/* Scroll-Responsive Depth Glow */}
                <motion.div
                    style={{ y: bgY1, opacity: scrollYProgress }}
                    className="absolute top-[10%] inset-x-0 mx-auto w-[80vw] h-[40vw] bg-pink-500/5 blur-[120px] rounded-full mix-blend-screen"
                />

                {/* Slow Cinematic Light Sweep (Scanline) */}
                <motion.div
                    animate={{ y: ['-10vh', '110vh'] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/10 to-transparent w-full blur-[2px]"
                />

                {/* Refined Noise Texture for Premium Grain */}
                <div className="absolute inset-0 opacity-[0.04] mix-blend-screen pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            </div>

            {/* Top Navigation */}
            <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
                <Link href="/members" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium tracking-wide">Voltar ao Dashboard</span>
                </Link>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-500 font-bold tracking-wider">{totalCoins} <span className="hidden md:inline">Moedas</span></span>
                    </div>
                    {/* Placeholder for Profile/Future Image */}
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative group">
                        <User className="w-4 h-4 text-white/40" />
                        <div className="absolute inset-0 bgGradient-to-br from-amber-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>

            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-20">

                {/* Hero Section */}
                <div className="text-center mb-16 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm font-medium mb-6 uppercase tracking-widest backdrop-blur-md"
                    >
                        <ChefHat className="w-4 h-4 text-amber-400" />
                        Cardápio Secreto.
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[2.75rem] leading-[1.1] sm:text-6xl lg:text-7xl font-black mb-6 tracking-tight flex flex-col md:block"
                    >
                        <span>Receitas Secretas </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 drop-shadow-[0_0_30px_rgba(251,191,36,0.2)]">da Illa</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto font-medium"
                    >
                        Complete missões deliciosas na sua própria casa, compartilhe sua experiência e ganhe moedas ILLA para trocar por prêmios.
                    </motion.p>
                </div>

                {/* Grid of Missions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MISSIONS.map((mission, idx) => {
                        const isCompleted = completedMissions.includes(mission.id)
                        const isActive = activeMission === mission.id

                        return (
                            <motion.div
                                key={mission.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + idx * 0.05 }}
                                className={`relative group rounded-[32px] overflow-hidden ${isActive ? 'md:col-span-2 lg:col-span-3 lg:row-span-2 z-30' : 'z-10'}`}
                            >
                                {/* Card Background / Hover state glow */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${isCompleted ? 'from-green-500/10 to-emerald-900/10 border-green-500/20' : 'from-white/5 to-white/[0.02] border-white/5'} border backdrop-blur-md rounded-[32px] transition-all duration-500`} />

                                {!isCompleted && (
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-amber-500/10 to-pink-500/5 transition-opacity duration-700 pointer-events-none" />
                                )}

                                <div className="relative p-6 md:p-8 flex flex-col h-full">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'}`}>
                                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Play className="w-4 h-4 ml-0.5" />}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Tempo: {mission.time}</div>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase ${isCompleted ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                            <Coins className="w-3 h-3" />
                                            {mission.reward}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-grow">
                                        <h3 className="text-2xl font-black text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-colors">
                                            {mission.title}
                                        </h3>
                                        <p className="text-white/50 text-sm font-medium leading-relaxed mb-6">
                                            {mission.subtitle}
                                        </p>
                                    </div>

                                    {/* Expanded State Content */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-8 pt-6 border-t border-white/10"
                                            >
                                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            Ingredientes
                                                        </h4>
                                                        <ul className="space-y-3">
                                                            {mission.ingredients.map((ing, i) => (
                                                                <li key={i} className="flex items-start gap-3 text-white/70 text-sm">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 flex-shrink-0" />
                                                                    <span>{ing}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-pink-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            Como Fazer
                                                        </h4>
                                                        <ul className="space-y-4">
                                                            {mission.steps.map((step, i) => (
                                                                <li key={i} className="flex gap-4 group/step">
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-white/40 text-xs font-bold group-hover/step:bg-pink-500/20 group-hover/step:text-pink-400 transition-colors flex-shrink-0">
                                                                        {i + 1}
                                                                    </div>
                                                                    <span className="text-white/70 text-sm mt-0.5 leading-relaxed">{step}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                {/* Check-in Section (Only if NOT completed) */}
                                                {!isCompleted && (
                                                    <>
                                                        {/* Image Upload Space (Cinematic Placeholder) */}
                                                        <input
                                                            type="file"
                                                            accept="image/*,video/mp4,video/quicktime"
                                                            className="hidden"
                                                            ref={fileInputRef}
                                                            onChange={(e) => handleFileChange(e, mission)}
                                                        />
                                                        <motion.div
                                                            onClick={() => !uploading && fileInputRef.current?.click()}
                                                            whileHover={{ scale: uploading ? 1 : 1.01 }}
                                                            whileTap={{ scale: uploading ? 1 : 0.99 }}
                                                            className={`w-full relative group/upload rounded-2xl p-1 overflow-hidden mt-8 ${uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                                        >
                                                            {/* Animated border glow on hover */}
                                                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-pink-500/0 opacity-0 group-hover/upload:opacity-100 transition-opacity duration-700 pointer-events-none" />

                                                            <div className="relative min-h-[224px] h-auto py-8 bg-white/5 hover:bg-white/[0.07] border border-dashed border-white/20 hover:border-amber-500/50 rounded-xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden">

                                                                {/* Subtle background glow */}
                                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full group-hover/upload:bg-amber-500/20 transition-colors duration-500" />

                                                                <div className="relative z-10 flex flex-col items-center text-center px-4">
                                                                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover/upload:scale-110 group-hover/upload:bg-amber-500/20 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                                                        {uploading ? (
                                                                            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                                                                        ) : (
                                                                            <Camera className="w-6 h-6 text-white/60 group-hover/upload:text-amber-400 transition-colors" />
                                                                        )}
                                                                    </div>
                                                                    <h5 className="text-lg font-bold text-white mb-2 group-hover/upload:text-amber-200 transition-colors">
                                                                        {uploading ? 'Enviando...' : 'Registre a Experiência'}
                                                                    </h5>
                                                                    {!uploading && (
                                                                        <>
                                                                            <p className="text-sm text-white/50 max-w-sm mb-4">
                                                                                Faça o upload de uma foto ou vídeo curto (até 30s) mostrando o resultado da sua receita para o Check-in
                                                                            </p>
                                                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-xs font-bold text-white uppercase tracking-widest group-hover/upload:bg-amber-500 group-hover/upload:text-[#050505] transition-all duration-300">
                                                                                <Upload className="w-3 h-3" /> Fazer Upload
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                <ImageIcon className="absolute -bottom-10 -right-10 w-40 h-40 text-white/[0.02] group-hover/upload:text-amber-500/[0.05] transition-colors duration-500 rotate-12" />
                                                                <Video className="absolute -top-10 -left-10 w-40 h-40 text-white/[0.02] group-hover/upload:text-pink-500/[0.05] transition-colors duration-500 -rotate-12" />
                                                            </div>
                                                        </motion.div>

                                                        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                                            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                                <Sparkles className="w-3 h-3" /> Check-in da Missão
                                                            </div>
                                                            <div className="text-white/80 text-sm font-medium">{mission.checkin}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Footer Actions */}
                                    <div className="mt-auto pt-6 flex gap-3">
                                        {/* State 1: Collapsed (Can be either incomplete or complete) */}
                                        {!isActive && (
                                            <button
                                                onClick={() => setActiveMission(mission.id)}
                                                className={`w-full py-3 rounded-full text-sm font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${isCompleted ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-white/10 hover:bg-white/15 text-white'}`}
                                            >
                                                {isCompleted ? (
                                                    <><CheckCircle2 className="w-4 h-4" /> Ver Receita Completa</>
                                                ) : (
                                                    'Ver Receita'
                                                )}
                                            </button>
                                        )}

                                        {/* State 2: Active / Opened */}
                                        {isActive && (
                                            <>
                                                <button
                                                    onClick={() => setActiveMission(null)}
                                                    className="flex-1 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-bold tracking-widest uppercase transition-colors"
                                                >
                                                    Fechar
                                                </button>
                                                {!isCompleted && (
                                                    <button
                                                        onClick={() => handleComplete(mission)}
                                                        className="flex-[2] py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
                                                    >
                                                        Concluir & Ganhar
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </main>
        </div>
    )
}
