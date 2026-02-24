'use client'

import { useState, useRef } from 'react'
import { User, Mail, Phone, Save, LogOut, ArrowLeft, Loader2, Check, Camera, Calendar, MapPin, Building, Map } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import ScrollBg from './MembersScrollBackground'

interface ProfileEditorProps {
    user: {
        id: string
        email: string
        fullName: string
        whatsapp: string
        avatarUrl: string | null
        birthDate: string | null
        address: string
        city: string
        state: string
    }
}

const MAX_FILE_SIZE = 3 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ProfileEditor({ user }: ProfileEditorProps) {
    const [fullName, setFullName] = useState(user.fullName)
    const [whatsapp, setWhatsapp] = useState(user.whatsapp)
    const [birthDate, setBirthDate] = useState(user.birthDate ?? '')
    const [address, setAddress] = useState(user.address)
    const [city, setCity] = useState(user.city)
    const [state, setState] = useState(user.state)
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [savingBirthDate, setSavingBirthDate] = useState(false)
    const [error, setError] = useState('')
    const fileRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Apenas JPG, PNG ou WebP são permitidos.')
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            setError('O arquivo deve ter no máximo 3 MB.')
            return
        }

        // Show instant local preview before uploading
        const localPreview = URL.createObjectURL(file)
        setAvatarUrl(localPreview)

        setUploading(true)
        setError('')

        const supabase = createSupabaseBrowser()
        const ext = file.name.split('.').pop() ?? 'png'
        const path = `${user.id}/avatar-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, file, { upsert: true, contentType: file.type })

        if (uploadError) {
            setError(`Erro no upload: ${uploadError.message}`)
            setAvatarUrl(user.avatarUrl) // revert preview on error
            setUploading(false)
            return
        }

        await supabase
            .from('profiles')
            .upsert({ id: user.id, avatar_path: path, email: user.email })

        const { data: signed } = await supabase.storage
            .from('avatars')
            .createSignedUrl(path, 3600)

        if (signed?.signedUrl) {
            // Revoke the temporary object url to avoid memory leak
            URL.revokeObjectURL(localPreview)
            setAvatarUrl(signed.signedUrl)
        }

        setUploading(false)
        if (fileRef.current) fileRef.current.value = ''
        router.refresh()
    }

    const handleSave = async () => {
        setSaving(true)
        setError('')
        setSaved(false)

        const supabase = createSupabaseBrowser()

        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: fullName,
                whatsapp,
                email: user.email,
                address,
                city,
                state,
            })

        if (updateError) {
            setError('Erro ao salvar. Tente novamente.')
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
        setSaving(false)
    }

    const handleBirthDateSave = async () => {
        if (!birthDate) return
        setSavingBirthDate(true)
        setError('')

        try {
            const res = await fetch('/api/profile/birth-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: birthDate }),
            })
            const data = await res.json()
            if (!data.success) {
                setError(data.error || 'Erro ao salvar data de nascimento.')
            }
        } catch {
            setError('Erro ao salvar data de nascimento.')
        }
        setSavingBirthDate(false)
    }

    const handleLogout = async () => {
        const supabase = createSupabaseBrowser()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <div className="min-h-screen relative overflow-x-hidden font-sans text-white selection:bg-illa-pink selection:text-white">

            {/* Background Layer - Dark Mode + Scroll Frames */}
            <div className="fixed inset-0 bg-[#0B0B0D] z-[-2]" />
            <ScrollBg />

            {/* Header - Dark Glass */}
            <div className="bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/members"
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-medium text-sm"
                    >
                        <ArrowLeft size={18} />
                        Voltar ao painel
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-white/5 px-4 py-2 rounded-xl transition-all font-semibold text-sm"
                    >
                        <LogOut size={16} />
                        Sair
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12 max-w-lg relative z-[2]">
                <div className="text-center mb-10">
                    {/* Avatar with Upload */}
                    <div className="relative inline-block group">
                        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/10 shadow-2xl shadow-black/50 mx-auto">
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt="Avatar"
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                    <User size={40} className="text-white/50" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-illa-pink text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform border-2 border-dashed border-[#0B0B0D]"
                        >
                            {uploading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Camera size={14} />
                            )}
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                    </div>

                    <h1 className="text-2xl font-bold text-white mt-4">
                        Editar Perfil 🍦
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Gerencie suas informações</p>
                </div>

                {/* Dark Glass Card */}
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    {/* Nome */}
                    <div>
                        <label className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 block">
                            Nome
                        </label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-illa-pink transition-colors" size={18} />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 focus:border-illa-pink/50 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium text-white placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 block">
                            E-mail
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 font-medium text-white/30 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 block">
                            WhatsApp
                        </label>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-illa-pink transition-colors" size={18} />
                            <input
                                type="tel"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="(00) 00000-0000"
                                className="w-full bg-white/5 border border-white/5 focus:border-illa-pink/50 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium text-white placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    {/* Endereço */}
                    <div>
                        <label className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 block">
                            Endereço
                        </label>
                        <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-illa-pink transition-colors" size={18} />
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Seu endereço completo"
                                className="w-full bg-white/5 border border-white/5 focus:border-illa-pink/50 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium text-white placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    {/* Cidade e Estado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 block">
                                Cidade
                            </label>
                            <div className="relative group">
                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-illa-pink transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Cidade"
                                    className="w-full bg-white/5 border border-white/5 focus:border-illa-pink/50 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium text-white placeholder:text-white/20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 block">
                                Estado
                            </label>
                            <div className="relative group">
                                <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-illa-pink transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    placeholder="UF (ex: AL)"
                                    className="w-full bg-white/5 border border-white/5 focus:border-illa-pink/50 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium text-white placeholder:text-white/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 block">
                            Data de nascimento
                        </label>
                        <div className="relative group flex gap-2">
                            <div className="relative flex-1">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-illa-pink transition-colors" size={18} />
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 focus:border-illa-pink/50 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium text-white [color-scheme:dark]"
                                />
                            </div>
                            <button
                                onClick={handleBirthDateSave}
                                disabled={!birthDate || savingBirthDate}
                                className="px-5 bg-illa-pink text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:shadow-lg hover:shadow-illa-pink/20 transition-all"
                            >
                                {savingBirthDate ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
                            </button>
                        </div>
                        <p className="text-[10px] text-white/20 mt-2">
                            A data de nascimento só pode ser alterada a cada 6 meses.
                        </p>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-illa-pink text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
                    >
                        {saving ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : saved ? (
                            <>
                                <Check size={20} />
                                Salvo com sucesso!
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Salvar alterações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
