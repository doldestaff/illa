export interface SurpriseDropPreset {
    id: number
    title: string
    description: string
    category: 'coins' | 'xp' | 'loja' | 'item' | 'multiplier' | 'status'
    emoji: string
    reward_type: 'xp' | 'points' | 'custom'
    reward_value: number
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const SURPRISE_DROPS_CATALOG: SurpriseDropPreset[] = [
    // 💰 COINS (1-4)
    { id: 1, title: 'Chuva de Moedas', description: '+10 Moedas ILLA para sua próxima aventura.', category: 'coins', emoji: '💰', reward_type: 'points', reward_value: 10, rarity: 'common' },
    { id: 2, title: 'Baú de Casquinha', description: '+25 Moedas ILLA encontradas em um esconderijo crocante.', category: 'coins', emoji: '🧳', reward_type: 'points', reward_value: 25, rarity: 'rare' },
    { id: 3, title: 'Jackpot de Morango', description: '+50 Moedas ILLA (Raro!).', category: 'coins', emoji: '🍓', reward_type: 'points', reward_value: 50, rarity: 'epic' },
    { id: 4, title: 'Bolsa do Alquimista', description: '+15 Moedas ILLA para investir em novos sabores.', category: 'coins', emoji: '🧪', reward_type: 'points', reward_value: 15, rarity: 'common' },

    // ✨ XP (5-8)
    { id: 5, title: 'Boost Galático', description: '+200 XP para subir de nível instantaneamente.', category: 'xp', emoji: '🚀', reward_type: 'xp', reward_value: 200, rarity: 'rare' },
    { id: 6, title: 'Frasco de Neve', description: '+100 XP para congelar sua barra de progresso no topo.', category: 'xp', emoji: '❄️', reward_type: 'xp', reward_value: 100, rarity: 'common' },
    { id: 7, title: 'Estrela de Baunilha', description: '+350 XP (Drop Épico de reconhecimento).', category: 'xp', emoji: '⭐', reward_type: 'xp', reward_value: 350, rarity: 'epic' },
    { id: 8, title: 'Poeira Estelar', description: '+50 XP por scan consecutivo.', category: 'xp', emoji: '✨', reward_type: 'xp', reward_value: 50, rarity: 'common' },

    // 🍦 LOJA (9-12)
    { id: 9, title: 'Upgrade de Calda', description: 'Libera uma cobertura extra gratuita no seu próximo pedido.', category: 'loja', emoji: '🍫', reward_type: 'custom', reward_value: 0, rarity: 'rare' },
    { id: 10, title: 'Crocante Misterioso', description: 'Adicione qualquer "topping" seco sem custo.', category: 'loja', emoji: '🥜', reward_type: 'custom', reward_value: 0, rarity: 'common' },
    { id: 11, title: 'Upgrade de Tamanho', description: 'Transforme seu sorvete P em um M por conta da Illa.', category: 'loja', emoji: '📏', reward_type: 'custom', reward_value: 0, rarity: 'epic' },
    { id: 12, title: 'Degustação VIP', description: 'Direito a provar 3 sabores do "Menu Secreto" antes de escolher.', category: 'loja', emoji: '🍨', reward_type: 'custom', reward_value: 0, rarity: 'legendary' },

    // 🎁 ITEMS (13-16)
    { id: 13, title: 'Chave de Cristal', description: 'Desbloqueia uma missão oculta no dashboard por 24h.', category: 'item', emoji: '🔑', reward_type: 'custom', reward_value: 0, rarity: 'epic' },
    { id: 14, title: 'Ticket Dourado', description: 'Entrada garantida para o próximo evento exclusivo da Illa.', category: 'item', emoji: '🎫', reward_type: 'custom', reward_value: 0, rarity: 'legendary' },
    { id: 15, title: 'Cupom "Primeiro Date"', description: '15% de desconto para quem levar um acompanhante.', category: 'item', emoji: '💝', reward_type: 'custom', reward_value: 0, rarity: 'rare' },
    { id: 16, title: 'Emblema do Explorador', description: 'Item raro para o seu perfil de membro.', category: 'item', emoji: '🛡️', reward_type: 'custom', reward_value: 0, rarity: 'rare' },

    // ⚡ MULTIPLIERS (17-20)
    { id: 17, title: 'Escudo de Streak', description: 'Protege sua sequência de dias ativos se você esquecer de logar amanhã.', category: 'multiplier', emoji: '🛡️', reward_type: 'custom', reward_value: 0, rarity: 'epic' },
    { id: 18, title: 'Ímã de Moedas', description: 'Dobra todas as moedas ganhas nas próximas 3 missões.', category: 'multiplier', emoji: '🧲', reward_type: 'custom', reward_value: 0, rarity: 'legendary' },
    { id: 19, title: 'Raio Congelante', description: 'Para o cronômetro de uma missão difícil por 1 hora.', category: 'multiplier', emoji: '⚡', reward_type: 'custom', reward_value: 0, rarity: 'rare' },
    { id: 20, title: 'Poção de Carisma', description: 'Aumenta as chances de Drops Raros no próximo scan.', category: 'multiplier', emoji: '🧪', reward_type: 'custom', reward_value: 0, rarity: 'epic' },

    // 🌟 STATUS (21-22)
    { id: 21, title: 'Aura Neon', description: 'Seu avatar ganha um brilho rosa exclusivo no ranking por 7 dias.', category: 'status', emoji: '💗', reward_type: 'custom', reward_value: 0, rarity: 'legendary' },
    { id: 22, title: 'Título "Mestre do Gelato"', description: 'Desbloqueia esse título premium abaixo do seu nome no perfil.', category: 'status', emoji: '🏆', reward_type: 'custom', reward_value: 0, rarity: 'legendary' },
]

export const CATEGORY_LABELS: Record<SurpriseDropPreset['category'], { label: string; color: string }> = {
    coins: { label: 'Moedas', color: 'yellow' },
    xp: { label: 'Experiência', color: 'purple' },
    loja: { label: 'Loja', color: 'pink' },
    item: { label: 'Itens', color: 'blue' },
    multiplier: { label: 'Multiplicadores', color: 'cyan' },
    status: { label: 'Status', color: 'amber' },
}

export const RARITY_STYLES: Record<SurpriseDropPreset['rarity'], { label: string; bg: string; text: string; glow: string }> = {
    common: { label: 'Comum', bg: 'bg-gray-500/20', text: 'text-gray-300', glow: 'shadow-gray-500/20' },
    rare: { label: 'Raro', bg: 'bg-blue-500/20', text: 'text-blue-300', glow: 'shadow-blue-500/30' },
    epic: { label: 'Épico', bg: 'bg-purple-500/20', text: 'text-purple-300', glow: 'shadow-purple-500/30' },
    legendary: { label: 'Lendário', bg: 'bg-amber-500/20', text: 'text-amber-300', glow: 'shadow-amber-500/40' },
}
