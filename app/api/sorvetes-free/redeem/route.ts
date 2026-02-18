import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'
import { sendNotification } from '@/lib/notifications'

export async function POST() {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { data, error } = await supabase.rpc('redeem_sorvetes_free')

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Fire Notification
        await sendNotification({
            userId: user.id,
            title: 'Parabéns! Sorvete Grátis! 🍦',
            body: 'Você completou o cartão fidelidade. Aproveite!',
            kind: 'sorvetes_free',
            priority: 3,
            supabase
        })

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
