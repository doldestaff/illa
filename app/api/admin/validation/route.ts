import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdmin } from '@/lib/supabaseAdmin'

// GET — List recent validation logs
export async function GET(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase } = auth

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const { data, error } = await supabase
        .from('redemption_logs')
        .select('*')
        .order('validated_at', { ascending: false })
        .limit(limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
}

// POST — Validate and CONSUME a voucher (scan QR code)
export async function POST(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase, user } = auth

    try {
        const { voucher_code, customer_user_id, voucher_type } = await request.json()

        if (!voucher_code || !customer_user_id || !voucher_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check for duplicate validation (same voucher_code)
        const { data: existing } = await supabase
            .from('redemption_logs')
            .select('id')
            .eq('voucher_code', voucher_code)
            .maybeSingle()

        if (existing) {
            return NextResponse.json(
                { error: 'Este voucher já foi validado anteriormente.', duplicate: true },
                { status: 409 }
            )
        }

        // Verify the customer exists
        const { data: customer } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', customer_user_id)
            .maybeSingle()

        if (!customer) {
            return NextResponse.json(
                { error: 'Cliente não encontrado.' },
                { status: 404 }
            )
        }

        // Use admin client to bypass RLS for mutations
        const adminDb = createSupabaseAdmin()

        // === MARK THE VOUCHER AS USED ===
        // Try discount_redemptions first (voucher_type = 'discount')
        if (voucher_type === 'discount') {
            const { error: updateErr } = await adminDb
                .from('discount_redemptions')
                .update({ status: 'used' })
                .eq('voucher_code', voucher_code)
                .eq('user_id', customer_user_id)

            if (updateErr) {
                console.error('[validation] Failed to mark discount as used:', updateErr)
                return NextResponse.json({ error: 'Falha ao consumir voucher de desconto.' }, { status: 500 })
            }
        }

        // Try sorvetes_free_redemptions (voucher_type = 'sorvete')
        if (voucher_type === 'sorvete') {
            const { error: updateErr } = await adminDb
                .from('sorvetes_free_redemptions')
                .update({ is_valid: false })
                .eq('voucher_code', voucher_code)
                .eq('user_id', customer_user_id)

            if (updateErr) {
                console.error('[validation] Failed to mark sorvete as used:', updateErr)
                return NextResponse.json({ error: 'Falha ao consumir voucher de sorvete.' }, { status: 500 })
            }
        }

        // Log the validation
        const { data: log, error: logError } = await adminDb
            .from('redemption_logs')
            .insert({
                admin_user_id: user.id,
                customer_user_id,
                voucher_code,
                voucher_type,
            })
            .select()
            .single()

        if (logError) {
            return NextResponse.json({ error: logError.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            log,
            customer_name: customer.full_name,
        })
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
