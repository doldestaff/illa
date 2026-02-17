import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

const ADMIN_TOKEN = '6c5e3a7b8f2d1e4a9c0b5d8f3e6a1b4c' // static token for admin:1212

export async function GET(request: Request) {
    const token = request.headers.get('x-admin-token')
    if (token !== ADMIN_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createSupabaseServer()

    // Use RPC to get all users with sorvetes count (bypasses RLS via SECURITY DEFINER)
    const { data, error } = await supabase.rpc('admin_list_users_sorvetes')

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
}
