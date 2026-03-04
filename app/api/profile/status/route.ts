import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

/**
 * GET /api/profile/status
 * Returns the current profile completion status (missing_fields).
 * Lightweight endpoint used by the dashboard to reactively hide the
 * "Complete seu perfil" CTA after the user saves their profile.
 */
export async function GET() {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_path, birth_date, whatsapp')
        .eq('id', user.id)
        .single()

    if (error || !profile) {
        return NextResponse.json({ missing_fields: [] })
    }

    const missing: string[] = []
    if (!profile.full_name || profile.full_name.trim() === '') missing.push('name')
    if (!profile.avatar_path || profile.avatar_path.trim() === '') missing.push('avatar')
    if (!profile.birth_date) missing.push('birthday')
    if (!profile.whatsapp || profile.whatsapp.trim() === '') missing.push('whatsapp')

    return NextResponse.json({ missing_fields: missing })
}
