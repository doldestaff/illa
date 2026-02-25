import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroScrollFrames } from '@/components/HeroScrollFrames'
import { GSAPRegistry } from '@/lib/gsap'
import dynamic from 'next/dynamic'

// Perf: Defer heavy 3D and media components until Hero is fully loaded and thread is idle
const PinnedButtonsParallax = dynamic(() => import('@/components/PinnedButtonsParallax').then(mod => mod.PinnedButtonsParallax))
const ProductsShowcase = dynamic(() => import('@/components/ProductsShowcase').then(mod => mod.ProductsShowcase))
const SocialProof = dynamic(() => import('@/components/SocialProof').then(mod => mod.SocialProof))
const StoreLocations = dynamic(() => import('@/components/StoreLocations').then(mod => mod.StoreLocations))
const InstagramFeed = dynamic(() => import('@/components/InstagramFeed').then(mod => mod.InstagramFeed))

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <GSAPRegistry />
      <Navbar />

      <HeroScrollFrames />

      {/* Sections below the hero */}
      <div>
        <PinnedButtonsParallax />
        <div id="products">
          <ProductsShowcase />
        </div>
        <SocialProof />
        <InstagramFeed />
        <StoreLocations />
      </div>

      <Footer />
    </main>
  )
}
