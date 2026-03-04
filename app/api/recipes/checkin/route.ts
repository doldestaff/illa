import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'
import { isRateLimited } from '@/lib/admin-auth'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: max 50 recipe check-ins per minute (generous limit for legitimate use)
    if (isRateLimited(`checkin:recipe:${user.id}`, 50, 60_000)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    try {
        const { recipe_id, proof_url, reward } = await request.json()

        if (!recipe_id || typeof reward !== 'number') {
            return NextResponse.json({ error: 'recipe_id and reward are required' }, { status: 400 })
        }

        // Verify the recipe was not already completed to prevent double claiming
        const { data: existing } = await supabase
            .from('user_recipes')
            .select('done')
            .eq('user_id', user.id)
            .eq('recipe_id', recipe_id)
            .single()

        if (existing?.done) {
            return NextResponse.json({ error: 'Recipe already completed' }, { status: 409 })
        }

        // Mark recipe as done and save proof URL
        const { error: upsertError } = await supabase
            .from('user_recipes')
            .upsert(
                {
                    user_id: user.id,
                    recipe_id,
                    done: true,
                    proof_url: proof_url ?? null,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,recipe_id' }
            )

        if (upsertError) {
            return NextResponse.json({ error: upsertError.message }, { status: 400 })
        }

        // Credit coins automatically (Approach 1: Auto-approval)
        const { error: pointsError } = await supabase.rpc('add_points', {
            p_user_id: user.id,
            p_amount: reward,
        })

        if (pointsError) {
            // Log but don't block — the check-in was recorded, moedas can be reconciled
            console.error('[checkin] add_points RPC failed:', pointsError.message)
        }

        // Fetch updated points total so the front-end can sync immediately
        const { data: profile } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            success: true,
            reward,
            new_points_total: profile?.points ?? null,
        })
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
