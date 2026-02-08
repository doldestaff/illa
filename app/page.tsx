import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroScrollFrames } from '@/components/HeroScrollFrames'
// import { HeroFramePlaceholder } from '@/components/HeroFramePlaceholder' // Kept for reference if needed
// import { LinktreeCards } from '@/components/LinktreeCards' // Replaced by ParallaxButtonsSection
// import { ParallaxButtonsSection } from '@/components/ParallaxButtonsSection'
import { PinnedButtonsParallax } from '@/components/PinnedButtonsParallax'
import { ProductsShowcase } from '@/components/ProductsShowcase'
import { SocialProof } from '@/components/SocialProof'
import { StoreLocations } from '@/components/StoreLocations'
import { GSAPRegistry } from '@/lib/gsap'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <GSAPRegistry />
      <Navbar />

      <HeroScrollFrames />
      {/* <ParallaxButtonsSection /> */}
      <PinnedButtonsParallax />
      <div id="products">
        <ProductsShowcase />
      </div>
      <SocialProof />
      <StoreLocations />

      <Footer />
    </main>
  )
}
