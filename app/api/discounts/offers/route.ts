import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function GET() {
    const supabase = await createSupabaseServer()

    // Using RPC to list active offers securely
    const { data: offers, error } = await supabase.rpc('list_discount_offers')

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ offers })
}
