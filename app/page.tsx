import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroScrollFrames } from '@/components/HeroScrollFrames'
// import { HeroFramePlaceholder } from '@/components/HeroFramePlaceholder' // Kept for reference if needed
import { LinktreeCards } from '@/components/LinktreeCards'
import { ProductsShowcase } from '@/components/ProductsShowcase'
import { SocialProof } from '@/components/SocialProof'
import { Locations } from '@/components/Locations'
import { GSAPRegistry } from '@/lib/gsap'

export default function Home() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <GSAPRegistry />
      <Navbar />

      <HeroScrollFrames />
      <LinktreeCards />
      <div id="products">
        <ProductsShowcase />
      </div>
      <SocialProof />
      <Locations />

      <Footer />
    </main>
  )
}
