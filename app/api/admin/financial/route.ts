import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { supabase } = auth

    try {
        // 1. Redemption stats (from redemption_logs)
        const { data: logs } = await supabase
            .from('redemption_logs')
            .select('id, voucher_type, validated_at')
            .order('validated_at', { ascending: false })

        const totalRedemptions = logs?.length ?? 0
        const discountRedemptions = logs?.filter(l => l.voucher_type === 'discount').length ?? 0
        const sorveteRedemptions = logs?.filter(l => l.voucher_type === 'sorvete').length ?? 0
        const dropRedemptions = logs?.filter(l => l.voucher_type === 'drop').length ?? 0

        // 2. Active rewards count
        const { count: activeRewards } = await supabase
            .from('discount_offers')
            .select('id', { count: 'exact', head: true })
            .eq('active', true)

        // 3. Total users
        const { data: usersData } = await supabase.rpc('admin_list_users_sorvetes')
        const totalUsers = usersData?.length ?? 0

        // 4. Coins config (for cost estimation)
        const { data: coinsConfig } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', 'coins_config')
            .maybeSingle()

        const brlPerCoin = coinsConfig?.value?.brl_per_coin ?? 0.05

        // 5. Total coins in circulation (sum of all user points)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalCoins = usersData?.reduce((sum: number, u: any) => sum + (u.points || 0), 0) ?? 0
        const estimatedCostBrl = totalCoins * brlPerCoin

        // 6. Redemptions last 7 days vs previous 7 days (for trend)
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

        const recentRedemptions = logs?.filter(l => new Date(l.validated_at) >= sevenDaysAgo).length ?? 0
        const previousRedemptions = logs?.filter(l => {
            const d = new Date(l.validated_at)
            return d >= fourteenDaysAgo && d < sevenDaysAgo
        }).length ?? 0

        // 7. Daily breakdown (last 7 days)
        const dailyBreakdown = []
        for (let i = 6; i >= 0; i--) {
            const day = new Date(now)
            day.setDate(day.getDate() - i)
            const dayStr = day.toISOString().split('T')[0]
            const dayRedemptions = logs?.filter(l => l.validated_at.startsWith(dayStr)).length ?? 0
            dailyBreakdown.push({
                date: dayStr,
                label: day.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
                count: dayRedemptions,
            })
        }

        return NextResponse.json({
            totalRedemptions,
            discountRedemptions,
            sorveteRedemptions,
            dropRedemptions,
            activeRewards: activeRewards ?? 0,
            totalUsers,
            totalCoins,
            brlPerCoin,
            estimatedCostBrl,
            recentRedemptions,
            previousRedemptions,
            dailyBreakdown,
        })
    } catch (err) {
        console.error('Financial API error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
