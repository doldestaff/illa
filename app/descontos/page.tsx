import { createSupabaseServer } from '@/lib/supabaseServerClient'
import StoreView from '@/components/discounts/StoreView'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Loja de Descontos | ILLA Sorvetes',
    description: 'Troque suas moedas por descontos exclusivos em nossa loja.',
}

export const dynamic = 'force-dynamic'

export default async function DiscountsPage() {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch Offers (Public)
    const { data: offers, error: offersError } = await supabase.rpc('list_discount_offers')
    if (offersError) console.error('Error fetching offers:', offersError)

    let userPoints: number | null = null
    let redemptions: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any

    if (user) {
        // 2. Fetch User Points
        const { data: profile } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', user.id)
            .single()

        userPoints = profile?.points ?? 0

        // 3. Fetch User Redemptions
        const { data: history, error: historyError } = await supabase.rpc('list_my_discounts', { p_limit: 50 })
        if (historyError) console.error('Error fetching history:', historyError)
        redemptions = history ?? []
    }

    return (
        <StoreView
            offers={offers ?? []}
            userPoints={userPoints}
            initialRedemptions={redemptions}
        />
    )
}
