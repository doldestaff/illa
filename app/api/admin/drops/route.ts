import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

const ADMIN_TOKEN = '6c5e3a7b8f2d1e4a9c0b5d8f3e6a1b4c'

// Middleware helper to check admin token
const checkAuth = (req: Request) => {
    const token = req.headers.get('x-admin-token')
    return token === ADMIN_TOKEN
}

// GET: List all drops
export async function GET(request: Request) {
    if (!checkAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const supabase = supabaseServer
        const { data, error } = await supabase.rpc('admin_list_all_drops')

        if (error) {
            console.error('RPC Error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data || [])
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST: Create a new drop
export async function POST(request: Request) {
    if (!checkAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { title, description, reward_type, reward_value, duration_minutes } = await request.json()

        if (!title || !reward_value || !duration_minutes) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = supabaseServer
        const { data, error } = await supabase.rpc('admin_create_drop', {
            p_title: title,
            p_description: description || '',
            p_reward_type: reward_type || 'points',
            p_reward_value: Number(reward_value),
            p_duration_minutes: Number(duration_minutes)
        })

        if (error) {
            console.error('RPC Error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data)
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE: Remove a drop
export async function DELETE(request: Request) {
    if (!checkAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Drop ID required' }, { status: 400 })
        }

        const supabase = supabaseServer
        const { data, error } = await supabase.rpc('admin_delete_drop', {
            p_drop_id: id
        })

        if (error) {
            console.error('RPC Error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data)
    } /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
