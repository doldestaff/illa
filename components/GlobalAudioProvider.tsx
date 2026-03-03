'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'

interface GlobalAudioContextType {
    isPlaying: boolean
    isMuted: boolean
    hasStarted: boolean
    play: () => void
    pause: () => void
    toggleMute: () => void
    stop: () => void
}

const GlobalAudioContext = createContext<GlobalAudioContextType | undefined>(undefined)

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Create the audio element once on mount
        const audio = new Audio('/music/dashboard-song.mp3')
        audio.loop = true
        audio.volume = 0.5 // Start at a comfortable volume
        audioRef.current = audio

        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)
        const handleEnded = () => setIsPlaying(false) // Should be caught by loop, but safe

        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
            audio.removeEventListener('ended', handleEnded)
            audio.pause()
            audio.src = '' // Clean up
        }
    }, [])

    // Sync state to audio element
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted
        }
    }, [isMuted])

    const play = () => {
        if (audioRef.current) {
            // Browsers often block auto-play without user interaction.
            // This will be triggered typically on dashboard render, which usually follows a click,
            // but we catch the promise just in case it's blocked.
            const playPromise = audioRef.current.play()
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setHasStarted(true)
                        setIsPlaying(true)
                    })
                    .catch((err) => {
                        console.warn('Audio autoplay failed. User interaction might be needed.', err)
                        setIsPlaying(false)
                    })
            } else {
                setHasStarted(true)
                setIsPlaying(true)
            }
        }
    }

    const pause = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
        }
    }

    const stop = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0 // Reset to beginning
            setIsPlaying(false)
            setHasStarted(false) // This drops the floating button from the home page
        }
    }

    const toggleMute = () => {
        setIsMuted((prev) => !prev)
    }

    return (
        <GlobalAudioContext.Provider
            value={{
                isPlaying,
                isMuted,
                hasStarted,
                play,
                pause,
                toggleMute,
                stop,
            }}
        >
            {children}
        </GlobalAudioContext.Provider>
    )
}

export function useGlobalAudio() {
    const context = useContext(GlobalAudioContext)
    if (context === undefined) {
        throw new Error('useGlobalAudio must be used within a GlobalAudioProvider')
    }
    return context
}
