
import { createSupabaseServer } from '@/lib/supabaseServerClient'
import { NextResponse } from 'next/server'

// Recreated file
export async function GET() {
    const supabase = await createSupabaseServer()

    try {
        const { data: drop } = await supabase
            .from('drops')
            .select('*')
            .eq('is_active', true)
            .lte('starts_at', new Date().toISOString())
            .gt('ends_at', new Date().toISOString())
            .order('starts_at', { ascending: false })
            .limit(1)
            .single()

        return NextResponse.json({ drop: drop || null })
    } catch (error) {
        console.error('Error fetching active drop:', error)
        return NextResponse.json({ drop: null }, { status: 500 })
    }
}
