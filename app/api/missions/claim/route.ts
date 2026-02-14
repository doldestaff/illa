import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { mission_instance_id } = await request.json()
        if (!mission_instance_id) {
            return NextResponse.json({ error: 'mission_instance_id required' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('claim_mission_reward', {
            p_instance_id: mission_instance_id,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
