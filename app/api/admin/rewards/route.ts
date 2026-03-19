import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabaseAdmin'

const getSupabaseAdmin = () => createSupabaseAdmin()

// GET all rewards (discount_offers)
export async function GET() {
    try {
        const supabaseAdmin = getSupabaseAdmin()
        const { data, error } = await supabaseAdmin
            .from('discount_offers')
            .select('*')
            .order('cost_points', { ascending: true })

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST create a new reward
export async function POST(req: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin()
        const body = await req.json()
        const { title, description, required_level, cost_points, estimated_cost_brl, max_per_week, max_per_month, validity_hours, current_stock, active } = body

        const { data, error } = await supabaseAdmin
            .from('discount_offers')
            .insert({
                title,
                description,
                required_level,
                cost_points,
                estimated_cost_brl,
                max_per_week,
                max_per_month,
                validity_hours,
                current_stock,
                active,
                used_count: 0
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT update a reward (e.g., toggle active, edit values)
export async function PUT(req: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin()
        const body = await req.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('discount_offers')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE a reward
export async function DELETE(req: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin()
        const url = new URL(req.url)
        const id = url.searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('discount_offers')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
