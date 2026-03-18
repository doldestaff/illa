'use client'

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react'

// Define the sound keys mapped to explicit file paths
const SOUND_FILES = {
  click: '/audio/soundplastia/click-for-all-1.mp3',
  coinToast1: '/audio/soundplastia/coin-toast-1.mp3',
  secondaryClick: '/audio/soundplastia/secondary-click.mp3',
  coinToast2: '/audio/soundplastia/coin-toast-2.mp3',
  missionComplete: '/audio/soundplastia/mission-complete.mp3',
} as const

type SoundKey = keyof typeof SOUND_FILES

interface SoundSystemContextType {
  playGlobalClick: () => void
  playCoinToastShow: () => void
  playSecondaryClick: () => void
  playCoinToastCelebration: () => void
  playMissionComplete: () => void
}

const SoundSystemContext = createContext<SoundSystemContextType | null>(null)

export function useSoundSystem() {
  const context = useContext(SoundSystemContext)
  if (!context) {
    // If used outside provider, return silent mock functions to prevent crashes
    return {
      playGlobalClick: () => {},
      playCoinToastShow: () => {},
      playSecondaryClick: () => {},
      playCoinToastCelebration: () => {},
      playMissionComplete: () => {},
    }
  }
  return context
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const audioPools = useRef<Record<SoundKey, HTMLAudioElement[]>>({} as Record<SoundKey, HTMLAudioElement[]>)
  const isEnabled = useRef(true)
  const isUnlocked = useRef(false)

  // Initialize pool on mount
  useEffect(() => {
    // Preload audio objects for rapid playback
    const loadSound = (key: SoundKey, src: string) => {
      const pool: HTMLAudioElement[] = []
      // Keep a small pool of 3 audio objects per sound to allow overlapping plays
      for (let i = 0; i < 3; i++) {
        const audio = new Audio(src)
        audio.preload = 'auto'
        pool.push(audio)
      }
      return pool
    }

    try {
      audioPools.current = {
        click: loadSound('click', SOUND_FILES.click),
        coinToast1: loadSound('coinToast1', SOUND_FILES.coinToast1),
        secondaryClick: loadSound('secondaryClick', SOUND_FILES.secondaryClick),
        coinToast2: loadSound('coinToast2', SOUND_FILES.coinToast2),
        missionComplete: loadSound('missionComplete', SOUND_FILES.missionComplete),
      }
    } catch (error) {
      console.warn('Audio contextualization not supported or failed', error)
      isEnabled.current = false
    }

    // iOS Audio Unlock: On the first user interaction (touch/click),
    // play+pause all audio elements to "warm" them for future programmatic playback.
    // iOS WebKit requires at least one .play() call from a user gesture context.
    const unlockAudio = () => {
      if (isUnlocked.current) return
      isUnlocked.current = true

      Object.values(audioPools.current).forEach((pool) => {
        pool.forEach((audio) => {
          audio.muted = true
          audio.play().then(() => {
            audio.pause()
            audio.muted = false
            audio.currentTime = 0
          }).catch(() => {
            audio.muted = false
          })
        })
      })

      // Clean up — only need to unlock once
      document.removeEventListener('touchstart', unlockAudio, true)
      document.removeEventListener('click', unlockAudio, true)
    }

    document.addEventListener('touchstart', unlockAudio, { capture: true, once: true })
    document.addEventListener('click', unlockAudio, { capture: true, once: true })

    return () => {
      document.removeEventListener('touchstart', unlockAudio, true)
      document.removeEventListener('click', unlockAudio, true)
    }
  }, [])

  const playSound = useCallback((key: SoundKey) => {
    if (!isEnabled.current || typeof window === 'undefined') return
    const pool = audioPools.current[key]
    if (!pool) return

    // Find the first audio object that is mostly done playing or not playing
    const audio = pool.find(a => a.paused || a.ended || a.currentTime > 0.3) || pool[0]
    
    if (audio) {
      // Small reset to allow overlapping punchy sounds correctly
      // eslint-disable-next-line react-hooks/immutability -- Mutating external DOM Audio element, not React state
      audio.currentTime = 0
      audio.volume = 0.5 // Safe default volume for cinematic effects
      audio.play().catch((err) => {
        // Suppress "play() failed because the user didn't interact" errors
        console.debug('Audio play failed silently (expected on initial load)', err)
      })
    }
  }, [])

  // Action methods
  const playGlobalClick = useCallback(() => playSound('click'), [playSound])
  const playCoinToastShow = useCallback(() => playSound('coinToast1'), [playSound])
  const playSecondaryClick = useCallback(() => playSound('secondaryClick'), [playSound])
  const playCoinToastCelebration = useCallback(() => playSound('coinToast2'), [playSound])
  const playMissionComplete = useCallback(() => playSound('missionComplete'), [playSound])

  // Global Click Event Delegation
  useEffect(() => {
    if (!isEnabled.current) return

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if we are clicking a button or link
      const isInteractive = target.closest('button') || target.closest('a') || target.closest('[role="button"]')
      if (isInteractive) {
        // Play the subtle click sound
        playGlobalClick()
      }
    }

    // Attach to capture phase to ensure it triggers immediately
    document.addEventListener('click', handleGlobalClick, { capture: true })

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true })
    }
  }, [playGlobalClick])

  return (
    <SoundSystemContext.Provider
      value={{
        playGlobalClick,
        playCoinToastShow,
        playSecondaryClick,
        playCoinToastCelebration,
        playMissionComplete
      }}
    >
      {children}
    </SoundSystemContext.Provider>
  )
}
