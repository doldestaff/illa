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
  const audioCtxRef = useRef<AudioContext | null>(null)
  const buffersRef = useRef<Record<SoundKey, AudioBuffer | null>>({
    click: null, coinToast1: null, secondaryClick: null, coinToast2: null, missionComplete: null
  })
  const isEnabled = useRef(true)

  useEffect(() => {
    // Initialize Web Audio API to bypass iOS HTML5 Audio limitations (forced max volume, required unmuted dummy plays)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) {
      isEnabled.current = false
      return
    }

    const ctx = new AudioContextClass()
    audioCtxRef.current = ctx

    // Fetch and decode all sounds into memory buffers for zero-latency playback
    const loadSound = async (key: SoundKey, url: string) => {
      try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        buffersRef.current[key] = audioBuffer
      } catch (err) {
        console.warn(`Failed to load sound ${key}`, err)
      }
    }

    Object.entries(SOUND_FILES).forEach(([key, url]) => {
      loadSound(key as SoundKey, url)
    })

    // iOS Web Audio API unlock: resume the suspended context safely on first gesture
    const unlockAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
    }

    document.addEventListener('touchstart', unlockAudio, { capture: true, once: true })
    document.addEventListener('touchend', unlockAudio, { capture: true, once: true })
    document.addEventListener('click', unlockAudio, { capture: true, once: true })

    return () => {
      document.removeEventListener('touchstart', unlockAudio, true)
      document.removeEventListener('touchend', unlockAudio, true)
      document.removeEventListener('click', unlockAudio, true)
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  const playSound = useCallback((key: SoundKey, volume = 0.5) => {
    if (!isEnabled.current || !audioCtxRef.current || !buffersRef.current[key]) return

    const ctx = audioCtxRef.current
    
    // Safety resume check
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    try {
      const source = ctx.createBufferSource()
      source.buffer = buffersRef.current[key]

      const gainNode = ctx.createGain()
      gainNode.gain.value = volume

      source.connect(gainNode)
      gainNode.connect(ctx.destination)
      source.start(0)
    } catch (err) {
      console.debug('Failed to play sound via buffer', err)
    }
  }, [])

  // Action methods with customized volumes
  const playGlobalClick = useCallback(() => playSound('click', 0.5), [playSound])
  const playCoinToastShow = useCallback(() => playSound('coinToast1', 0.6), [playSound])
  const playSecondaryClick = useCallback(() => playSound('secondaryClick', 0.5), [playSound])
  const playCoinToastCelebration = useCallback(() => playSound('coinToast2', 0.7), [playSound])
  const playMissionComplete = useCallback(() => playSound('missionComplete', 0.7), [playSound])

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
