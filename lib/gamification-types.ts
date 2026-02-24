export interface MemberProfile {
    id: string
    full_name: string | null
    email: string | null
    avatar_path: string | null
    xp: number
    points: number
    drops: number
    streak_count: number
    level: number
    xp_into_level: number
    xp_for_next_level: number
    xp_to_next_level: number
    referral_code: string | null
    missing_fields: string[]
}

export interface MissionInstance {
    instance_id: string
    mission_id: string
    title: string
    description: string | null
    kind: string
    target: number
    reward_xp: number
    reward_points: number
    progress: number
    completed: boolean
    claimed: boolean
}

export interface ActiveDrop {
    id: string
    title: string
    description: string | null
    reward_type: 'xp' | 'points'
    reward_value: number
    ends_at: string
    already_claimed: boolean
}

export interface SurpriseDrop {
    id: string
    preset_id: number
    title: string
    description: string | null
    category: string
    emoji: string
    reward_type: string
    reward_value: number
    created_at: string
}

export interface SecretMenuItem {
    id: string
    title: string
    description: string | null
    image_url: string | null
    min_level: number
    required_badge_id: string | null
    drop_only: boolean
    unlocked: boolean
    unlock_reason: string | null
}

export interface RecipeItem {
    id: string
    title: string
    description: string | null
    tags: string[]
    image_url: string | null
    is_locked: boolean
    min_level: number
    saved: boolean
    favorited: boolean
    done: boolean
}

export interface LeaderboardEntry {
    user_id: string
    full_name: string | null
    avatar_path: string | null
    xp: number
}

export interface BirthdayState {
    active: boolean
    birth_date?: string
    days_until?: number
}

export interface VipPayload {
    short_code: string
    expires_at: string
    token_id: string
}

export interface MemberSnapshot {
    profile: MemberProfile
    missions: MissionInstance[]
    active_drop: ActiveDrop | null
    secret_menu: SecretMenuItem[]
    recipes: RecipeItem[]
    leaderboard: {
        top10: LeaderboardEntry[]
        user_position: number | null
    }
    referral_count: number
    drops_claimed_count: number
    sorvetes_free_count: number
    birthday: BirthdayState
}

export interface ClaimMissionResult {
    success: boolean
    xp: number
    points: number
    level: number
    xp_into_level: number
    xp_for_next_level: number
    xp_to_next_level: number
    reward_xp: number
    reward_points: number
}

export interface ClaimDropResult {
    success: boolean
    reward_type: string
    reward_value: number
    xp: number
    points: number
}

export interface CelebrationWindow {
    window_id: number
    reward_points: number
    window_end: string
    status: 'open' | 'cooldown'
}

export interface CelebrationClaimResult {
    success: boolean
    points: number
    reward_points: number
}

export interface SorvetesRedemption {
    success: boolean
    voucher_code: string
    expires_at: string
    cost: number
    new_points: number
}

export interface LedgerEntry {
    id: number
    created_at: string
    kind: string
    delta_xp: number
    delta_points: number
    source_id: string | null
    meta: Record<string, unknown>
}
