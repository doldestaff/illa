'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, PanInfo, Variants } from 'framer-motion'
import { X } from 'lucide-react'

interface ActionModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    themeColor?: string
    themeGradient?: string
    children: React.ReactNode
}

export default function ActionModal({ isOpen, onClose, title, themeGradient = "from-white to-gray-400", children }: ActionModalProps) {
    const [mounted, setMounted] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        setTimeout(() => setMounted(true), 0)
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        setTimeout(() => checkMobile(), 0)
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    // Drag end handler for mobile dismiss
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 100) {
            onClose()
        }
    }

    if (!mounted) return null

    const mobileVariants: Variants = {
        hidden: { y: '100%' },
        visible: { y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
        exit: { y: '100%', transition: { duration: 0.2 } }
    }

    const desktopVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.4, bounce: 0.3 } },
        exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md"
                    />

                    {/* Container - Bottom aligned on mobile, Center on desktop */}
                    <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:justify-center items-center pointer-events-none">

                        {/* Surprising Smoky Neon Glow (Behind Modal) */}
                        <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none flex justify-center items-center">

                            {/* Core Intense Neon Ember */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: [0, 0.9, 0.7], scale: [0.5, 1.3, 1] }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className={`absolute top-[5%] md:top-[10%] w-[120vw] md:w-[60vw] h-[40vh] ${themeGradient} rounded-[100%] blur-3xl opacity-70 mix-blend-screen will-change-transform transform-gpu saturate-200`}
                                style={{ backgroundImage: 'radial-gradient(ellipse at center, var(--tw-gradient-stops), transparent 70%)' }}
                            />

                            {/* Wide Smoky Aura (Breathing effect) */}
                            <motion.div
                                initial={{ opacity: 0, y: -50, scale: 0.8 }}
                                animate={{ opacity: [0, 0.6, 0.5], y: [-50, 0, -20], scale: [0.8, 1.5, 1.2] }}
                                transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
                                className={`absolute top-[-20%] w-[150vw] md:w-[120vw] h-[70vh] ${themeGradient} rounded-[100%] blur-[80px] opacity-50 mix-blend-screen will-change-transform transform-gpu saturate-150`}
                                style={{ backgroundImage: 'radial-gradient(ellipse at center, var(--tw-gradient-stops), transparent 70%)' }}
                            />

                            {/* Side Ambient Lights for Envelopment */}
                            <motion.div
                                initial={{ opacity: 0, x: -100 }}
                                animate={{ opacity: [0, 0.4, 0.2], x: [-100, 0, -50] }}
                                transition={{ duration: 4, ease: "easeInOut", delay: 0.2 }}
                                className={`absolute left-[-30%] top-[20%] w-[100vw] h-[60vh] ${themeGradient} rounded-[100%] blur-[60px] opacity-30 mix-blend-screen will-change-transform transform-gpu`}
                                style={{ backgroundImage: 'radial-gradient(ellipse at center, var(--tw-gradient-stops), transparent 70%)' }}
                            />
                            <motion.div
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: [0, 0.4, 0.2], x: [100, 0, 50] }}
                                transition={{ duration: 4, ease: "easeInOut", delay: 0.4 }}
                                className={`absolute right-[-30%] top-[10%] w-[100vw] h-[70vh] ${themeGradient} rounded-[100%] blur-[60px] opacity-30 mix-blend-screen will-change-transform transform-gpu`}
                                style={{ backgroundImage: 'radial-gradient(ellipse at center, var(--tw-gradient-stops), transparent 70%)' }}
                            />
                        </div>

                        <motion.div
                            variants={isMobile ? mobileVariants : desktopVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            drag={isMobile ? "y" : false}
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.05} // Resistance when dragging up
                            onDragEnd={handleDragEnd}
                            className={`
                                pointer-events-auto
                                w-full md:max-w-lg
                                bg-[#0f0f11] md:bg-[#121212]/90
                                md:backdrop-blur-xl
                                border-t border-x md:border border-white/10
                                rounded-t-[2rem] md:rounded-3xl
                                shadow-2xl shadow-black/50
                                flex flex-col
                                max-h-[90vh] md:max-h-[85vh]
                                overflow-hidden
                                relative
                            `}
                        >
                            {/* Theme Glow (Top Border) */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${themeGradient} opacity-50`} />

                            {/* Mobile Drag Handle */}
                            <div className="md:hidden w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none">
                                <div className="w-12 h-1.5 rounded-full bg-white/20" />
                            </div>

                            {/* Header */}
                            <div className="relative flex items-center justify-between md:justify-center px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                                <h3 className={`text-xl font-bold tracking-tight text-center ${themeGradient.includes('white') ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : `bg-clip-text text-transparent bg-gradient-to-r ${themeGradient}`}`}>
                                    {title}
                                </h3>

                                {/* Close Button (Larger touch target: 48px) */}
                                <button
                                    onClick={onClose}
                                    className="p-3 -mr-3 md:mr-0 md:absolute md:right-6 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 overflow-y-auto scrollbar-hide overscroll-contain flex flex-col items-center">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}
