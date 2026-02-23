import { IceCream } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlobalCoinProps {
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    animate?: boolean
}

export default function GlobalCoin({ className, size = 'md', animate = false }: GlobalCoinProps) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    }

    const iconSizes = {
        sm: 10,
        md: 14,
        lg: 20,
        xl: 28
    }

    return (
        <motion.div
            {...(animate ? {
                animate: {
                    rotateY: [0, 180, 360],
                    y: [-2, 2, -2]
                },
                transition: {
                    rotateY: { repeat: Infinity, duration: 4, ease: "linear" },
                    y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                }
            } : {})}
            className={cn(
                "relative flex items-center justify-center rounded-full bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] shadow-[0_2px_8px_rgba(245,158,11,0.4)] border border-[#FCD34D]/50",
                sizeClasses[size],
                className
            )}
        >
            {/* Top highlight to simulate metallic volume */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30 rounded-t-full pointer-events-none" />

            {/* Carved IceCream Icon */}
            <IceCream
                size={iconSizes[size]}
                strokeWidth={3}
                className="relative z-10 text-[#78350F]/90"
                style={{
                    filter: 'drop-shadow(0px 1px 0px rgba(255, 255, 255, 0.4)) drop-shadow(0px -1px 0px rgba(0, 0, 0, 0.2))'
                }}
            />

            {/* Subtle inner shadow for coin rim */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_6px_-2px_rgba(255,255,255,0.6),inset_0_-4px_6px_-2px_rgba(0,0,0,0.1)] pointer-events-none" />
        </motion.div>
    )
}
