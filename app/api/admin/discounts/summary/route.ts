import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServerClient'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const supabase = await createSupabaseServer()

    // 1. Check Admin Auth (from headers or session)
    // Assuming x-admin-token or similar, OR authenticated user check.
    // The previous summary said: "Admin API routes protected by a static x-admin-token header."
    const token = request.headers.get('x-admin-token')
    const adminSecret = process.env.ADMIN_SECRET_TOKEN || '1212' // Fallback based on previous conversations

    if (token !== adminSecret) {
        // Also check if it's a logged-in session attempting access?
        // But AdminDashboard likely uses this token.
        // Let's stick to the convention used in other admin routes.
        // If no token, return 401.
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch Stats
    const { data: stats, error } = await supabase.rpc('admin_get_discount_stats')

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(stats)
}
