'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useTransform, useSpring, MotionValue, AnimatePresence, useMotionValueEvent } from 'framer-motion'
import { ChevronDown, ChevronUp, User, LogIn, ShoppingBag, Tag } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabaseClient'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface ScrollStimulantsProps {
    progress: MotionValue<number>
    isMobile: boolean
    isTablet?: boolean | null
    isReleased?: boolean
}

export function ScrollStimulants({ progress, isMobile, isReleased }: ScrollStimulantsProps) {
    const [isIdle, setIsIdle] = useState(false)
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastProgressRef = useRef(0)
    const [user, setUser] = useState<SupabaseUser | null>(null)

    // Spring-smoothed progress for the luminous bar
    const smoothProgress = useSpring(progress, { stiffness: 100, damping: 30, restDelta: 0.001 })
    
    // Side Bar animation values
    const barScaleY = useTransform(smoothProgress, [0, 1], [0, 1])
    const barOpacity = useTransform(progress, [0, 0.05, 0.95, 1], [0, 1, 1, 0])
    


    useEffect(() => {
        const supabase = createSupabaseBrowser()
        supabase.auth.getUser().then(({ data }) => setUser(data.user))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
        return () => subscription.unsubscribe()
    }, [])

    // Sync state for determining if "Descubra ILLA Deslize" has faded out
    useMotionValueEvent(progress, "change", () => {
        // removed unused state
    })

    // Track mouse position to hide desktop toast when hovering near bottom buttons
    useEffect(() => {
        if (isMobile) return

        const handleMouseMove = () => {
            // removed unused state
        }
        
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [isMobile])

    // Idle detection logic
    useEffect(() => {
        if (isReleased) {
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
            return
        }

        if (isMobile) {
            // Mobile: Show arrows immediately at progress=0 (IDLE before first swipe)
            // AND 1 second after progress reaches 1 (end of animation → prompt to section 2)
            const unsubscribe = progress.on('change', (p) => {
                if (p < 0.001) {
                    // Back to start — show arrows again immediately
                    if (idleTimeoutRef.current) {
                        clearTimeout(idleTimeoutRef.current)
                        idleTimeoutRef.current = null
                    }
                    setIsIdle(true)
                } else if (p > 0.999) {
                    // End of animation — show arrows after 1 second
                    if (!idleTimeoutRef.current) {
                        idleTimeoutRef.current = setTimeout(() => {
                            setIsIdle(true)
                        }, 1000)
                    }
                } else {
                    // Mid-animation — hide arrows
                    if (idleTimeoutRef.current) {
                        clearTimeout(idleTimeoutRef.current)
                        idleTimeoutRef.current = null
                    }
                    setIsIdle(false)
                }
            })
            
            // Initial check — show immediately at start (IDLE state)
            const initialP = progress.get()
            if (initialP < 0.001) {
                idleTimeoutRef.current = setTimeout(() => {
                    setIsIdle(true)
                    idleTimeoutRef.current = null
                }, 0)
            } else if (initialP > 0.999) {
                if (!idleTimeoutRef.current) {
                    idleTimeoutRef.current = setTimeout(() => {
                        setIsIdle(true)
                    }, 1000)
                }
            } else {
                setIsIdle(false)
            }

            return () => {
                unsubscribe()
                if (idleTimeoutRef.current) {
                    clearTimeout(idleTimeoutRef.current)
                    idleTimeoutRef.current = null
                }
            }
        } else {
            // Desktop/Tablet: Show arrows after 2 seconds of inactivity anywhere
            const resetIdleTimer = () => {
                setIsIdle(false)
                if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
                
                idleTimeoutRef.current = setTimeout(() => {
                    setIsIdle(true)
                }, 2000) // 2.0 seconds of inactivity triggers the arrows
            }

            const unsubscribe = progress.on('change', (p) => {
                if (Math.abs(p - lastProgressRef.current) > 0.001) {
                    resetIdleTimer()
                }
                lastProgressRef.current = p
            })

            resetIdleTimer()

            return () => {
                unsubscribe()
                if (idleTimeoutRef.current) {
                    clearTimeout(idleTimeoutRef.current)
                    idleTimeoutRef.current = null
                }
            }
        }
    }, [progress, isReleased, isMobile])

    // Mobile synchronicity: wait for text to fade out between [0.05, 0.15], then fade the bar in.
    const mobileBarOpacity = useTransform(progress, [0, 0.1, 0.15, 0.95, 1], [0, 0, 1, 1, 0])
    const glowTipTop = useTransform(smoothProgress, [0, 1], ['0%', '100%'])

    if (isMobile) {
        return (
            <>
                {/* Mobile Synchronized Luminous Side Bar */}
                <motion.div 
                    style={{ opacity: mobileBarOpacity }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-[40vh] w-[8px] bg-white/20 rounded-full overflow-hidden pointer-events-none shadow-[0_0_20px_rgba(255,202,40,0.3)] backdrop-blur-sm border border-white/20"
                >
                    <motion.div 
                        style={{ scaleY: barScaleY, originY: 0 }}
                        className="w-full h-full bg-gradient-to-b from-illa-pink via-white to-illa-yellow shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                    />
                    
                    {/* Floating Glow Tip */}
                    <motion.div 
                        style={{ top: glowTipTop }}
                        className="absolute left-1/2 -translate-x-1/2 w-opacity-100 w-4 h-4 bg-white rounded-full blur-[6px] opacity-80"
                    />
                </motion.div>

                {/* Idle Warning Overlay - Mobile Swipe Up Arrows */}
                <AnimatePresence>
                    {isIdle && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 15 }}
                            className="absolute bottom-[calc(42vh-100px)] left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex flex-col items-center gap-0"
                        >
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ 
                                        opacity: [0.1, 1, 0.1],
                                        y: [15, -15]
                                    }}
                                    transition={{ 
                                        duration: 1.5, 
                                        repeat: Infinity, 
                                        ease: "easeInOut",
                                        delay: i * 0.2
                                    }}
                                    className="-my-4 scale-125"
                                >
                                    <ChevronUp 
                                        size={64} 
                                        strokeWidth={4}
                                        className="drop-shadow-[0_0_16px_rgba(229,1,125,1)]"
                                        style={{ color: i === 0 ? '#FFC107' : i === 1 ? '#FF8A65' : '#E5017D' }}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )
    }

    return (
        <>
            {/* Desktop & Tablet Luminous Side Bar & Arrows Container */}
            <div className="absolute inset-0 z-[100] pointer-events-none container mx-auto px-4">
                {/* Ghost duplicate of the Navbar's right side. Ensures PERFECT centering under Login/Minha Conta button */}
                <div className="absolute right-4 top-[calc(35%-30px)] -translate-y-1/2 hidden md:flex items-center gap-4">
                    
                    {/* Anchor point: Fake Login Button */}
                    <div className="relative invisible flex items-center gap-2 px-6 py-2 rounded-full border border-white/20 text-sm font-bold tracking-wide">
                        {user ? (
                            <>
                                <User size={18} />
                                MINHA CONTA
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                LOGIN
                            </>
                        )}

                        {/* VISIBLE SCROLLBAR PERFECTLY CENTERED IN THE INVISIBLE BUTTON */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 visible flex flex-col items-center pointer-events-none">
                            {/* Desktop Luminous Side Bar */}
                            <motion.div 
                                style={{ opacity: barOpacity }}
                                className="relative h-[40vh] w-[16px] bg-white/20 rounded-full overflow-hidden shadow-[0_0_30px_rgba(255,202,40,0.4)] backdrop-blur-md border border-white/20"
                            >
                                <motion.div 
                                    style={{ scaleY: barScaleY, originY: 0 }}
                                    className="w-full h-full bg-gradient-to-b from-illa-pink via-white to-illa-yellow shadow-[0_0_25px_rgba(255,255,255,0.9)]"
                                />
                                
                                {/* Floating Glow Tip */}
                                <motion.div 
                                    style={{ top: glowTipTop }}
                                    className="absolute left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full blur-[10px] opacity-90"
                                />
                            </motion.div>

                            {/* Idle Warning Overlay - Desktop Arrows */}
                            <AnimatePresence>
                                {isIdle && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="absolute left-full ml-4 md:ml-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0"
                                    >
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ 
                                                    opacity: [0.1, 1, 0.1],
                                                    y: [-12, 12]
                                                }}
                                                transition={{ 
                                                    duration: 1.5, 
                                                    repeat: Infinity, 
                                                    ease: "easeInOut",
                                                    delay: i * 0.2
                                                }}
                                                className="-my-4"
                                            >
                                                <ChevronDown 
                                                    size={64} 
                                                    strokeWidth={4}
                                                    className="drop-shadow-[0_0_16px_rgba(229,1,125,1)]"
                                                    style={{ color: i === 0 ? '#E5017D' : i === 1 ? '#FF8A65' : '#FFC107' }}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Fake invisible Pedir Agora button */}
                    <div className="invisible px-6 py-2 rounded-full font-bold flex items-center gap-2">
                        <ShoppingBag size={18} />
                        Pedir Agora
                    </div>

                    {/* Fake invisible Loja de Descontos button */}
                    <div className="invisible p-2.5 rounded-full border border-white/20 flex items-center justify-center">
                        <Tag size={18} />
                    </div>
                </div>
            </div>
        </>
    )
}
