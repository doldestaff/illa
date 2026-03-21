import { NextResponse } from 'next/server'
import { requireAdmin, isRateLimited } from '@/lib/admin-auth'
import { createSupabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * POST /api/admin/grant-coins-kg
 * 
 * Called by illaScanner after scanning a VIP QR Code.
 * Receives the customer user_id and kg consumed.
 * Calculates coins based on admin_settings.coins_per_kg config.
 * Grants the coins to the user via admin_grant_currency RPC.
 */
export async function POST(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { user } = auth

    if (isRateLimited(`admin:grant-kg:${user.id}`, 30, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    try {
        const { target_user_id, kg_amount } = await request.json()

        if (!target_user_id || !kg_amount || kg_amount <= 0) {
            return NextResponse.json(
                { error: 'target_user_id e kg_amount (> 0) são obrigatórios.' },
                { status: 400 }
            )
        }

        const adminDb = createSupabaseAdmin()

        // 1. Fetch the coins_per_kg config
        const { data: configRow } = await adminDb
            .from('admin_settings')
            .select('value')
            .eq('key', 'coins_per_kg')
            .maybeSingle()

        const coinsPerKg = configRow?.value?.coins_per_kg ?? 100 // default: 100 coins per kg
        const totalCoins = Math.round(kg_amount * coinsPerKg)

        if (totalCoins <= 0) {
            return NextResponse.json({ error: 'Quantidade de moedas calculada é zero.' }, { status: 400 })
        }

        // 2. Grant coins via RPC
        const { data, error } = await adminDb.rpc('admin_grant_currency', {
            p_target_user_id: target_user_id,
            p_xp_amount: 0,
            p_points_amount: totalCoins,
            p_drops_amount: 0
        })

        if (error) {
            console.error('[grant-coins-kg] RPC Error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // 3. Send notification to user
        await adminDb.from('notifications').insert({
            user_id: target_user_id,
            title: 'Moedas Recebidas! 🪙',
            message: `Você ganhou +${totalCoins} moedas por consumir ${kg_amount.toFixed(3)}kg na loja!`,
            type: 'reward',
            read: false,
            data: { points: totalCoins, kg: kg_amount, source: 'scanner' }
        })

        return NextResponse.json({
            success: true,
            kg_amount,
            coins_per_kg: coinsPerKg,
            total_coins_granted: totalCoins,
            data
        })
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
