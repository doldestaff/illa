import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdmin } from '@/lib/supabaseAdmin'

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

    if (error) {
        console.error('[admin/reviews] GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
}

// PATCH — toggle visibility (approved: true | false)
export async function PATCH(req: NextRequest) {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { id, approved } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Use admin client to bypass RLS for mutations
    console.log(`[admin/reviews] PATCH: Attempting to set approved=${approved} for id=${id}`)
    const adminDb = createSupabaseAdmin()
    const { error, data } = await adminDb
        .from('reviews')
        .update({ approved })
        .eq('id', id)
        .select() // Need .select() to ensure the row is returned / verified

    if (error) {
        console.error('[admin/reviews] PATCH error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
        console.warn(`[admin/reviews] PATCH warning: Row with id=${id} not found or RLS blocked update (using generic client?)`)
        return NextResponse.json({ error: 'Review não encontrado ou permissão negada.' }, { status: 403 })
    }

    console.log(`[admin/reviews] PATCH success for id=${id}`)
    return NextResponse.json({ success: true })
}

// DELETE — permanently remove
export async function DELETE(req: NextRequest) {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Use admin client to bypass RLS for mutations
    console.log(`[admin/reviews] DELETE: Attempting to delete id=${id}`)
    const adminDb = createSupabaseAdmin()
    const { error, data } = await adminDb
        .from('reviews')
        .delete()
        .eq('id', id)
        .select()

    if (error) {
        console.error('[admin/reviews] DELETE error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
        console.warn(`[admin/reviews] DELETE warning: Row with id=${id} not found or RLS blocked delete (using generic client?)`)
        return NextResponse.json({ error: 'Review não encontrado ou permissão negada.' }, { status: 403 })
    }

    console.log(`[admin/reviews] DELETE success for id=${id}`)
    return NextResponse.json({ success: true })
}
