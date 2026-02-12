import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabaseServerClient'
import MembersClient from '@/components/MembersClient'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/?login=1')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, whatsapp, email, avatar_path')
        .eq('id', user.id)
        .single()

    // Generate signed URL for avatar if exists
    let avatarUrl: string | null = null
    if (profile?.avatar_path) {
        const { data: signed } = await supabase.storage
            .from('avatars')
            .createSignedUrl(profile.avatar_path, 3600)
        avatarUrl = signed?.signedUrl ?? null
    }

    return (
        <MembersClient
            user={{
                id: user.id,
                email: user.email ?? '',
                fullName: profile?.full_name ?? user.user_metadata?.full_name ?? '',
                whatsapp: profile?.whatsapp ?? '',
                avatarUrl,
            }}
        />
    )
}
