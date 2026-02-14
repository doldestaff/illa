import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabaseServerClient'
import MembersDashboard from '@/components/members/MembersDashboard'
import type { MemberSnapshot } from '@/lib/gamification-types'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/?login=1')
    }

    // Call the RPC that builds the entire dashboard snapshot
    const { data: snapshot, error } = await supabase.rpc('ensure_member_home_state')

    if (error || !snapshot) {
        // Fallback: show minimal page if the RPC isn't yet deployed
        console.error('ensure_member_home_state error:', error?.message)
        redirect('/?login=1')
    }

    // Generate signed URL for avatar if exists
    let avatarUrl: string | null = null
    const avatarPath = (snapshot as MemberSnapshot).profile?.avatar_path
    if (avatarPath) {
        const { data: signed } = await supabase.storage
            .from('avatars')
            .createSignedUrl(avatarPath, 3600)
        avatarUrl = signed?.signedUrl ?? null
    }

    return (
        <MembersDashboard
            snapshot={snapshot as MemberSnapshot}
            avatarUrl={avatarUrl}
        />
    )
}
