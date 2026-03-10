import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export async function GET() {
    const supabase = await createSupabaseServer()
    // ensure_member_home_state runs as SECURITY DEFINER
    const { data: snapshot, error } = await supabase.rpc('ensure_member_home_state')
    return NextResponse.json({ snapshot, error })
}
