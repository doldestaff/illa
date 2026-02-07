import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroFramePlaceholder } from '@/components/HeroFramePlaceholder'
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

      <HeroFramePlaceholder />
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
