import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { notification_ids, all } = await request.json()

        if (all) {
            const { error } = await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .is('read_at', null)

            if (error) throw error
        } else if (notification_ids && Array.isArray(notification_ids)) {
            const { error } = await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .in('id', notification_ids)

            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (error: any) {
        return NextResponse.json({ error: error.message || 'Error updating notifications' }, { status: 400 })
    }
}
