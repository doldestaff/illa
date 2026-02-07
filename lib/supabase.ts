import { createClient } from '@supabase/supabase-js'

// Environment variables are accessed safely to prevent build crashes if missing,
// but functionality will be limited strictly for this 'placeholder' setup.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)
