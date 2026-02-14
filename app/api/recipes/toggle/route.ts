import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { recipe_id, field, value } = await request.json()
        if (!recipe_id || !field || typeof value !== 'boolean') {
            return NextResponse.json({ error: 'recipe_id, field, and boolean value required' }, { status: 400 })
        }

        if (!['saved', 'favorited', 'done'].includes(field)) {
            return NextResponse.json({ error: 'field must be saved, favorited, or done' }, { status: 400 })
        }

        const { error } = await supabase
            .from('user_recipes')
            .upsert(
                {
                    user_id: user.id,
                    recipe_id,
                    [field]: value,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,recipe_id' }
            )

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
