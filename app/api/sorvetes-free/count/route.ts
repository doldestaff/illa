import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function GET() {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Count sorvetes_free_redemptions for this user
    const { count, error } = await supabase
        .from('sorvetes_free_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sorvetes_count: count ?? 0 })
}
