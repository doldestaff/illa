import { LucideIcon } from 'lucide-react'

// ==========================================
// CARD DE ESTATÍSTICAS (PULso / Dashboard)
// ==========================================
interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: { value: string; isPositive: boolean }
    subtitle?: string
    colorClass?: string
    bgClass?: string
}

export function StatCard({ title, value, icon: Icon, trend, subtitle, colorClass = "text-white", bgClass = "bg-white/5" }: StatCardProps) {
    return (
        <div className={`p-6 rounded-2xl border border-white/10 ${bgClass} flex flex-col justify-between transition-all hover:border-white/20 relative overflow-hidden group`}>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-2 rounded-xl bg-black/20 ${colorClass}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${trend.isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {trend.isPositive ? '+' : ''}{trend.value}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-white/40">{title}</p>
                {subtitle && <p className="text-[10px] text-white/30 mt-1">{subtitle}</p>}
            </div>
            
            {/* Glow Effect */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all opacity-50" />
        </div>
    )
}

// ==========================================
// HEADER DE SEÇÃO
// ==========================================
interface SectionHeaderProps {
    title: string
    description?: string
    icon: LucideIcon
    colorClass?: string
    action?: React.ReactNode
}

export function SectionHeader({ title, description, icon: Icon, colorClass = "text-illa-pink", action }: SectionHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${colorClass}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    {description && <p className="text-xs text-white/40">{description}</p>}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}

// ==========================================
// CONTAINER DE PÁGINA
// ==========================================
export function AdminPageContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {children}
        </div>
    )
}
