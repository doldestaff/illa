import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase } = auth

    const { data: stats, error } = await supabase.rpc('admin_get_discount_stats')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(stats)
}
