'use client'

import { motion } from 'framer-motion'

export default function IllaAmbientBackground() {
    return (
        <div className="fixed inset-0 w-full h-full bg-[#050505] overflow-hidden -z-10">
            {/* Deep Ambient Base */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-black/80" />

            {/* Moving Orbs */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-illa-pink/20 rounded-full blur-[120px] mix-blend-screen"
            />

            <motion.div
                animate={{
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.5, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-illa-yellow/15 rounded-full blur-[140px] mix-blend-screen"
            />

            <motion.div
                animate={{
                    x: [0, 50, -50, 0],
                    y: [0, 100, -50, 0],
                    opacity: [0.1, 0.3, 0.1]
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
                className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-purple-500/10 rounded-full blur-[100px] mix-blend-overlay"
            />

            {/* Mesh Grid Overlay (Subtle Tech Feel) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)] opacity-20 pointer-events-none" />

            {/* Vignette - Cinematic Focus */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_120%)] pointer-events-none" />
        </div>
    )
}
