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
        setMounted(true)
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
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
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
                    />

                    {/* Container - Bottom aligned on mobile, Center on desktop */}
                    <div className="fixed inset-0 z-[61] flex flex-col justify-end md:justify-center items-center pointer-events-none">

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
                                bg-[#121212]
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
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                                <h3 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${themeGradient} tracking-tight`}>
                                    {title}
                                </h3>

                                {/* Close Button (Larger touch target: 48px) */}
                                <button
                                    onClick={onClose}
                                    className="p-3 -mr-3 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 overflow-y-auto custom-scrollbar overscroll-contain">
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
