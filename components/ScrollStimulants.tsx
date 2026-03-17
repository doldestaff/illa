'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useTransform, useSpring, MotionValue, AnimatePresence, useMotionValueEvent } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ScrollStimulantsProps {
    progress: MotionValue<number>
    isMobile: boolean
    isTablet?: boolean | null
}

export function ScrollStimulants({ progress, isMobile, isTablet }: ScrollStimulantsProps) {
    const [isIdle, setIsIdle] = useState(false)
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastProgressRef = useRef(0)

    // Spring-smoothed progress for the luminous bar
    const smoothProgress = useSpring(progress, { stiffness: 100, damping: 30, restDelta: 0.001 })
    
    // Side Bar animation values
    const barScaleY = useTransform(smoothProgress, [0, 1], [0, 1])
    const barOpacity = useTransform(progress, [0, 0.05, 0.95, 1], [0, 1, 1, 0])
    
    const [isMouseOverButtons, setIsMouseOverButtons] = useState(false)
    const [isPastHint, setIsPastHint] = useState(false)

    // Sync state for determining if "Descubra ILLA Deslize" has faded out
    useMotionValueEvent(progress, "change", (latest) => {
        setIsPastHint(latest > 0.1)
    })

    // Track mouse position to hide desktop toast when hovering near bottom buttons
    useEffect(() => {
        if (isMobile) return

        const handleMouseMove = (e: MouseEvent) => {
            // Screen area where the buttons usually appear (bottom 25%)
            const isNearBottom = e.clientY > window.innerHeight * 0.75
            setIsMouseOverButtons(isNearBottom)
        }
        
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [isMobile])

    // Idle detection logic
    useEffect(() => {
        const resetIdleTimer = () => {
            setIsIdle(false)
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
            
            // Only trigger idle warning if we are still in the Hero section (progress < 0.9)
            if (progress.get() < 0.9) {
                idleTimeoutRef.current = setTimeout(() => {
                    setIsIdle(true)
                }, 2000) // Reduced to 2.0 seconds of inactivity per request
            }
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
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
        }
    }, [progress])

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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-[20vh] left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex flex-col items-center gap-0"
                        >
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ 
                                        opacity: [0.1, 1, 0.1],
                                        y: [12, -12]
                                    }}
                                    transition={{ 
                                        duration: 1.5, 
                                        repeat: Infinity, 
                                        ease: "easeInOut",
                                        delay: i * 0.2
                                    }}
                                    className="-my-4"
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
            {/* Desktop Luminous Side Bar & Arrows Container */}
            <div className="absolute right-0 md:right-0 lg:right-[350px] top-[calc(35%+70px)] -translate-y-1/2 z-[100] pointer-events-none flex items-center gap-4 lg:gap-8">
                {/* Desktop Luminous Side Bar */}
                <motion.div 
                    style={{ opacity: barOpacity }}
                    className="relative h-[50vh] w-[16px] bg-white/20 rounded-full overflow-hidden shadow-[0_0_30px_rgba(255,202,40,0.4)] backdrop-blur-md border border-white/20"
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
                            className="flex flex-col items-center gap-0"
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

        </>
    )
}
