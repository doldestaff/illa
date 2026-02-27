import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
    const supabase = supabaseServer

    const { data, error } = await supabase
        .from('reviews')
        .select('id, name, role, instagram, text, rating, created_at, user_id')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
    const supabase = supabaseServer
    const body = await req.json()

    const { name, role, instagram, text, rating, user_id } = body

    if (!name || !text || !rating || rating < 1 || rating > 5) {
        return NextResponse.json(
            { error: 'Nome, comentário e nota (1-5) são obrigatórios.' },
            { status: 400 }
        )
    }

    const { data, error } = await supabase
        .from('reviews')
        .insert({
            name: name.trim(),
            role: (role || '').trim(),
            instagram: (instagram || '').trim(),
            text: text.trim(),
            rating: Math.round(rating),
            user_id: user_id || null,
            approved: true,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}
