import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabaseAdmin'

// GET all admin settings
export async function GET() {
    try {
        const supabaseAdmin = createSupabaseAdmin()
        const { data, error } = await supabaseAdmin
            .from('admin_settings')
            .select('*')

        if (error) throw error

        // Convert array of {key, value} to a single object: { [key]: value }
        const settings = data.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, any>)

        return NextResponse.json(settings)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT up to date settings
export async function PUT(req: Request) {
    try {
        const supabaseAdmin = createSupabaseAdmin()
        const body = await req.json()
        const { key, value } = body

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Key and Value are required' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('admin_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
