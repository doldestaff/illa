import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { endpoint } = await request.json()

        if (endpoint) {
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', user.id)
                .eq('endpoint', endpoint)
        }

        // Update prefs only if no subscriptions left? Or just let user toggle in UI.
        // For now, let's just delete the sub. The UI toggle handles the global check.

        return NextResponse.json({ success: true })
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
