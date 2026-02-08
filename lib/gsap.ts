'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect } from 'react'

export function GSAPRegistry() {
    useLayoutEffect(() => {
        gsap.registerPlugin(ScrollTrigger)
        // Set defaults for better performance/behavior
        ScrollTrigger.defaults({
            markers: false
        })
    }, [])

    return null
}
