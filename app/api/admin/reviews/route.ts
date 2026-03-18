import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

// GET — all reviews including hidden ones
export async function GET(req: NextRequest) {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { supabase } = auth
    const { data, error } = await supabase
        .from('reviews')
        .select('id, name, role, instagram, text, rating, created_at, user_id, approved')
        .order('created_at', { ascending: false })
        .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// PATCH — toggle visibility (approved: true | false)
export async function PATCH(req: NextRequest) {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { id, approved } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { supabase } = auth
    const { error } = await supabase
        .from('reviews')
        .update({ approved })
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}

// DELETE — permanently remove
export async function DELETE(req: NextRequest) {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { supabase } = auth
    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
