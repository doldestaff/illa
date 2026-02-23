import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase } = auth

    const { data, error } = await supabase.rpc('admin_list_users_sorvetes')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
}
