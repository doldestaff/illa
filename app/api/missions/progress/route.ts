import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

/**
 * POST /api/missions/progress
 * Body: { kind: string }
 *
 * Increments progress on the current day's mission instance
 * matching the given kind. If progress reaches target, marks completed.
 */
export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { kind } = await request.json()

    if (!kind || typeof kind !== 'string') {
        return NextResponse.json(
            { error: 'kind is required' },
            { status: 400 }
        )
    }

    const periodKey = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Find the mission instance for this kind + today
    const { data: instances, error: fetchError } = await supabase
        .from('mission_instances')
        .select('id, progress, mission_id, completed_at, missions!inner(target, kind)')
        .eq('user_id', user.id)
        .eq('period_key', periodKey)
        .eq('missions.kind', kind)
        .is('completed_at', null)

    if (fetchError || !instances || instances.length === 0) {
        return NextResponse.json({ updated: false, reason: 'no_matching_mission' })
    }

    const instance = instances[0]
    const target = (instance as any).missions?.target ?? 1
    const newProgress = Math.min(instance.progress + 1, target)
    const isNowComplete = newProgress >= target

    const { error: updateError } = await supabase
        .from('mission_instances')
        .update({
            progress: newProgress,
            ...(isNowComplete ? { completed_at: new Date().toISOString() } : {}),
        })
        .eq('id', instance.id)

    if (updateError) {
        return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
        )
    }

    return NextResponse.json({
        updated: true,
        progress: newProgress,
        target,
        completed: isNowComplete,
    })
}
