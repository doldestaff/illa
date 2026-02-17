import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

// Simple Admin Token (matches the one in other admin routes)
const ADMIN_TOKEN = '6c5e3a7b8f2d1e4a9c0b5d8f3e6a1b4c'

export async function POST(request: Request) {
    const token = request.headers.get('x-admin-token')
    if (token !== ADMIN_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { target_user_id, xp_amount, points_amount } = await request.json()

        if (!target_user_id) {
            return NextResponse.json({ error: 'target_user_id is required' }, { status: 400 })
        }

        const supabase = supabaseServer

        const { data, error } = await supabase.rpc('admin_grant_currency', {
            p_target_user_id: target_user_id,
            p_xp_amount: Number(xp_amount) || 0,
            p_points_amount: Number(points_amount) || 0
        })

        if (error) {
            console.error('RPC Error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data)

    } catch (err: any) {
        console.error('Server Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
