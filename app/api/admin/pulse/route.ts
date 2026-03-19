import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdmin } from '@/lib/supabaseAdmin'

// Previne caching para dados "ao vivo"
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const adminDb = createSupabaseAdmin()
    
    try {
        const today = new Date()
        const startOfDayPath = new Date(today.setHours(0,0,0,0)).toISOString()

        // 1. Total Users & New Users Today
        const { count: totalUsers } = await adminDb
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        const { count: newUsersToday } = await adminDb
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDayPath)

        // 2. Pending Reviews (approved = false)
        const { count: pendingReviews } = await adminDb
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('approved', false)

        // 3. Active Drops
        const { count: activeDrops } = await adminDb
            .from('active_drops')
            .select('*', { count: 'exact', head: true })
            .gt('ends_at', new Date().toISOString())

        // 4. Redemptions Today (sorvetes_free_redemptions + discount_redemptions)
        const { count: sorvetesToday } = await adminDb
            .from('sorvetes_free_redemptions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDayPath)
            
        const { count: discountsToday } = await adminDb
            .from('discount_redemptions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDayPath)
            
        const redemptionsToday = (sorvetesToday || 0) + (discountsToday || 0)

        // 5. Risk Alerts (Simples placeholder por enquanto até a fase 3 implementar o Risk Limiter)
        // Por exemplo, podemos chegar se foram distribuídas mais de 1000 moedas hoje
        const { data: recentLedger } = await adminDb
            .from('reward_ledger')
            .select('delta_points')
            .gte('created_at', startOfDayPath)
            .gt('delta_points', 0)
            
        const pointsDistributedToday = recentLedger?.reduce((sum, entry) => sum + (entry.delta_points || 0), 0) || 0
        const riskAlerts = pointsDistributedToday > 10000 ? 1 : 0 // Limite hardcoded temporário

        return NextResponse.json({
            totalUsers: totalUsers || 0,
            newUsersToday: newUsersToday || 0,
            pendingReviews: pendingReviews || 0,
            activeDrops: activeDrops || 0,
            redemptionsToday,
            riskAlerts
        })
    } catch (e) {
        console.error('Pulse check error:', e)
        return NextResponse.json({ error: 'Erro ao gerar pulse' }, { status: 500 })
    }
}
