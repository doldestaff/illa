'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Coins, Play, Sparkles, ChefHat, Camera, Upload, ImageIcon, User, Loader2, Video, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { createSupabaseBrowser } from '@/lib/supabaseClient'

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
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Milkshake "Super Pipoca"',
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
        id: '22222222-2222-2222-2222-222222222222',
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
        id: '33333333-3333-3333-3333-333333333333',
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
        id: '44444444-4444-4444-4444-444444444444',
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
        id: '55555555-5555-5555-5555-555555555555',
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
        id: '66666666-6666-6666-6666-666666666666',
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
        id: '77777777-7777-7777-7777-777777777777',
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
        id: '88888888-8888-8888-8888-888888888888',
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
        id: '99999999-9999-9999-9999-999999999999',
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
    const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set())
    const [activeTab, setActiveTab] = useState<'Todas' | 'Novas' | 'Favoritas'>('Todas')

    useScroll({ target: containerRef }) // initialized for side effects if any, or can be removed if not needed? Actually let me just leave it out

    // Load completed missions from Supabase on mount
    useEffect(() => {
        const supabase = createSupabaseBrowser()
        let cancelled = false

        async function loadProgress() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                // Fallback to localStorage for non-authenticated visitors
                const saved = localStorage.getItem('@Illa:RecipesCompleted')
                if (saved && !cancelled) {
                    const parsed: string[] = JSON.parse(saved)
                    setCompletedMissions(parsed)
                    const coins = parsed.reduce((acc, id) => {
                        const m = MISSIONS.find(m => m.id === id)
                        return acc + (m?.reward || 0)
                    }, 0)
                    setTotalCoins(coins)
                }
                return
            }

            // Load done recipes from the DB
            const { data: doneRows } = await supabase
                .from('user_recipes')
                .select('recipe_id')
                .eq('user_id', user.id)
                .eq('done', true)

            // Load current coins from profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('points')
                .eq('id', user.id)
                .single()

            if (!cancelled) {
                const ids = (doneRows ?? []).map(r => r.recipe_id)
                setCompletedMissions(ids)
                setTotalCoins(profile?.points ?? 0)
            }

            // Load saved/favorited recipes
            const { data: savedRows } = await supabase
                .from('user_recipes')
                .select('recipe_id')
                .eq('user_id', user.id)
                .eq('favorited', true)

            if (!cancelled && savedRows) {
                setSavedRecipes(new Set(savedRows.map(r => r.recipe_id)))
            }
        }

        loadProgress()
        return () => { cancelled = true }
    }, [])

    const handleSaveRecipe = async (missionId: string) => {
        const supabase = createSupabaseBrowser()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.info('Crie uma conta para salvar receitas e ganhar recompensas!', {
                icon: <Heart className="text-rose-400" />,
            })
            return
        }

        const isAlreadySaved = savedRecipes.has(missionId)

        // Use the toggle API to ensure it hits the same logic as the dashboard
        const res = await fetch('/api/recipes/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipe_id: missionId, field: 'favorited', value: !isAlreadySaved }),
        })
        const data = await res.json()

        if (!data.success) {
            toast.error('Erro ao favoritar receita.')
            return
        }

        const newSaved = new Set(savedRecipes)
        if (isAlreadySaved) {
            newSaved.delete(missionId)
            toast('Receita removida dos favoritos', { icon: '💔' })
        } else {
            newSaved.add(missionId)
            toast.success('Receita salva nos favoritos!', {
                icon: <Heart className="text-rose-400" fill="currentColor" />,
            })

            // Track mission progress for view_recipes
            fetch('/api/missions/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind: 'view_recipes' }),
            }).catch(() => { /* non-critical */ })
        }

        setSavedRecipes(newSaved)
    }

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
        const supabase = createSupabaseBrowser()

        try {
            const { data: { user } } = await supabase.auth.getUser()

            let proofUrl: string | null = null

            if (user) {
                // Upload to Supabase Storage
                const ext = file.name.split('.').pop() ?? 'jpg'
                const fileName = `${user.id}/${Date.now()}.${ext}`

                const { error: uploadError } = await supabase.storage
                    .from('recipe-proofs')
                    .upload(fileName, file, { upsert: false })

                if (uploadError) {
                    // Non-fatal: proceed with check-in even if storage fails
                    console.warn('[recipe-proofs] upload failed:', uploadError.message)
                } else {
                    proofUrl = supabase.storage
                        .from('recipe-proofs')
                        .getPublicUrl(fileName).data.publicUrl
                }

                // Call the server-side checkin endpoint
                const res = await fetch('/api/recipes/checkin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipe_id: mission.id,
                        proof_url: proofUrl,
                        reward: mission.reward,
                    }),
                })

                const json = await res.json()

                if (!res.ok) {
                    if (res.status === 409) {
                        toast.error('Essa receita já foi concluída!')
                        setUploading(false)
                        return
                    }
                    throw new Error(json.error ?? 'Erro ao registrar check-in')
                }

                // Sync new coin total from server response if available
                if (typeof json.new_points_total === 'number') {
                    setTotalCoins(json.new_points_total)
                }
            }

            handleComplete(mission, user != null)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro inesperado'
            toast.error(message)
        } finally {
            setUploading(false)
        }
    }

    const handleComplete = (mission: RecipeMission, fromServer = false) => {
        if (completedMissions.includes(mission.id)) return

        // Confetti effect
        const duration = 3 * 1000
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

        // Only update local coin total if the server didn't already return the new total
        if (!fromServer) {
            setTotalCoins(prev => prev + mission.reward)
            // Keep localStorage as fallback cache for non-authenticated users
            localStorage.setItem('@Illa:RecipesCompleted', JSON.stringify(newCompleted))
        }

        toast.success(`+${mission.reward} Moedas ILLA!`, {
            description: `Missão "${mission.title}" concluída com sucesso!`,
            icon: <Coins className="text-amber-400" />,
        })

        setActiveMission(null)
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30 font-sans pb-32">

            {/* Cinematic Background with Dynamic Vitral */}
            <div className="fixed inset-0 z-0 overflow-hidden bg-black">
                <Image
                    src="/receitas-ocultas/receitas-bg-mobile.webp"
                    alt="Receitas Ocultas Background"
                    fill
                    priority
                    className="object-cover opacity-60"
                    quality={100}
                />

                {/* Dynamic Vitral Overlay (Darkens when a mission is active) */}
                <motion.div
                    initial={false}
                    animate={{
                        backgroundColor: activeMission ? 'rgba(0, 0, 0, 0.92)' : 'rgba(5, 5, 5, 0.75)',
                        backdropFilter: activeMission ? 'blur(8px)' : 'blur(4px)'
                    }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute inset-0 z-10"
                />

                {/* Ambient Glows for Depth */}
                <div className="absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none z-20" />
                <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-20" />
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-[10px] md:text-xs font-bold mb-6 uppercase tracking-widest backdrop-blur-md"
                    >
                        <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                        Só para membros
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[2.75rem] leading-[1.1] sm:text-6xl lg:text-7xl font-black mb-6 tracking-tight flex flex-col md:block"
                    >
                        <span>Receitas Ocultas </span>
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

                    {/* Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center items-center gap-2 mt-8 flex-wrap"
                    >
                        {(['Todas', 'Novas', 'Favoritas'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-widest uppercase transition-all ${activeTab === tab ? 'bg-amber-500 text-black shadow-[0_4px_20px_rgba(245,158,11,0.4)] scale-105' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </motion.div>
                </div>

                {/* Grid of Missions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MISSIONS.filter(mission => {
                        if (activeTab === 'Todas') return true;
                        if (activeTab === 'Favoritas') return savedRecipes.has(mission.id);
                        if (activeTab === 'Novas') return !completedMissions.includes(mission.id);
                        return true;
                    }).map((mission, idx) => {
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
                                        <div className="flex items-center gap-2">
                                            {/* Save/Favorite Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleSaveRecipe(mission.id)
                                                }}
                                                className="p-2 rounded-full bg-white/5 hover:bg-rose-500/15 border border-white/5 transition-all group/heart"
                                                title={savedRecipes.has(mission.id) ? 'Remover dos favoritos' : 'Salvar receita'}
                                            >
                                                <Heart
                                                    size={16}
                                                    className={`transition-colors ${savedRecipes.has(mission.id) ? 'text-rose-400 fill-rose-400' : 'text-white/40 group-hover/heart:text-rose-400'}`}
                                                    fill={savedRecipes.has(mission.id) ? 'currentColor' : 'none'}
                                                />
                                            </button>
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase ${isCompleted ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                <Coins className="w-3 h-3" />
                                                {mission.reward}
                                            </div>
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
                                                        onClick={() => {
                                                            // Trigger file upload (Registre a Experiência) as the primary action
                                                            fileInputRef.current?.click()
                                                        }}
                                                        disabled={uploading}
                                                        className="flex-[2] py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        {uploading ? 'Enviando...' : 'Concluir & Ganhar'}
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
