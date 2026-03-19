import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client using the service_role key.
 * Bypasses RLS — use ONLY in server-side admin API routes
 * after verifying admin identity via requireAdmin().
 */
export function createSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceKey) {
        // Fallback: if service key is not set, log a warning
        // and return a regular client (will still be subject to RLS)
        console.warn('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY not set — admin mutations may fail due to RLS.')
        return createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
            auth: { persistSession: false }
        })
    }

    return createClient(url, serviceKey, {
        auth: { persistSession: false }
    })
}
