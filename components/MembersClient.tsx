'use client'

import { useState, useRef } from 'react'
import { User, Mail, Phone, Save, LogOut, ArrowLeft, Loader2, Check, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { NotificationBell } from './notifications/NotificationBell'

interface MembersClientProps {
    user: {
        id: string
        email: string
        fullName: string
        whatsapp: string
        avatarUrl: string | null
    }
}

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function MembersClient({ user }: MembersClientProps) {
    const [fullName, setFullName] = useState(user.fullName)
    const [whatsapp, setWhatsapp] = useState(user.whatsapp)
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const fileRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    /* -------- Avatar Upload -------- */
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
            setUploading(false)
            return
        }

        // Update profile
        await supabase
            .from('profiles')
            .upsert({ id: user.id, avatar_path: path, email: user.email })

        // Get signed URL
        const { data: signed } = await supabase.storage
            .from('avatars')
            .createSignedUrl(path, 3600)

        if (signed?.signedUrl) {
            setAvatarUrl(signed.signedUrl)
        }

        setUploading(false)
        // Reset file input
        if (fileRef.current) fileRef.current.value = ''
    }

    /* -------- Save Profile -------- */
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
            })

        if (updateError) {
            setError('Erro ao salvar. Tente novamente.')
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
        setSaving(false)
    }

    /* -------- Logout -------- */
    const handleLogout = async () => {
        const supabase = createSupabaseBrowser()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-pink-50/30 to-white relative overflow-x-hidden">
            {/* Header */}
            <div className="bg-white/70 backdrop-blur-xl border-b border-gray-100/60 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-dark/60 hover:text-dark transition-colors font-medium text-sm"
                    >
                        <ArrowLeft size={18} />
                        Voltar ao site
                    </Link>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-all font-semibold text-sm"
                        >
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12 max-w-lg relative z-[2]">
                <div className="text-center mb-10">
                    {/* Avatar with Upload */}
                    <div className="relative inline-block group">
                        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-xl shadow-pink-500/15 mx-auto">
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
                                <div className="w-full h-full bg-gradient-to-br from-illa-pink to-orange-400 flex items-center justify-center">
                                    <User size={40} className="text-white" />
                                </div>
                            )}
                        </div>
                        {/* Upload overlay */}
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-illa-pink text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform border-2 border-white"
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

                    <h1 className="text-2xl font-bold text-dark mt-4">
                        Olá, {fullName || 'Membro'}! 🍦
                    </h1>
                    <p className="text-dark/50 text-sm mt-1">Gerencie suas informações</p>
                </div>

                {/* Profile Card — glass morphism */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl shadow-gray-200/40 p-6 md:p-8 space-y-5">
                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    {/* Nome */}
                    <div>
                        <label className="text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1.5 block">
                            Nome
                        </label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-illa-pink transition-colors" size={18} />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-white/60 border border-gray-200 focus:border-illa-pink/50 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium text-dark"
                            />
                        </div>
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1.5 block">
                            E-mail
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full bg-gray-100/60 border border-gray-200 rounded-xl py-3 pl-11 pr-4 font-medium text-dark/40 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label className="text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1.5 block">
                            WhatsApp
                        </label>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-illa-pink transition-colors" size={18} />
                            <input
                                type="tel"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="(00) 00000-0000"
                                className="w-full bg-white/60 border border-gray-200 focus:border-illa-pink/50 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-4 focus:ring-illa-pink/10 transition-all font-medium text-dark placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-illa-pink text-white font-bold py-3.5 rounded-xl shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : saved ? (
                            <>
                                <Check size={18} />
                                Salvo!
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Salvar alterações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div >
    )
}
