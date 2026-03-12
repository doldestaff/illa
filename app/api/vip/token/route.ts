import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'
import type { ScannerQrPayload } from '@/lib/gamification-types'

export async function POST() {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { data: vipData, error: vipError } = await supabase.rpc('get_or_rotate_vip_token')
        if (vipError) throw vipError

        const { data: homeState, error: homeError } = await supabase.rpc('ensure_member_home_state')
        if (homeError) throw homeError

        const { data: discounts, error: discountsError } = await supabase.rpc('list_my_discounts', { p_limit: 50 })
        if (discountsError) throw discountsError

        const { data: inventory, error: inventoryError } = await supabase.rpc('get_member_inventory')
        if (inventoryError) throw inventoryError

        // Build the qr_payload
        const qr_payload: ScannerQrPayload = {
            code: vipData.short_code,
            exp: vipData.expires_at,
            profile: {
                id: homeState.profile.id,
                name: homeState.profile.full_name || 'Usuário',
                level: homeState.profile.level || 1,
                points: homeState.profile.points || 0,
                xp: homeState.profile.xp || 0
            },
            discounts: (discounts || [])
                .filter((d: any) => d.status === 'issued')
                .map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    percent: d.percent,
                    voucher: d.voucher_code
                })),
            sorvetes: (inventory?.sorvetes || [])
                .filter((s: any) => s.is_valid)
                .map((s: any) => ({
                    id: s.id,
                    voucher: s.voucher_code
                })),
            drops: (inventory?.drops || []).map((d: any) => ({
                id: d.id,
                title: d.title,
                type: d.reward_type,
                value: d.reward_value
            }))
        }

        return NextResponse.json({
            ...vipData,
            qr_payload
        })
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
