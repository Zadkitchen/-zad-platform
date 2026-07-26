import ContactSection from "../components/home/ContactSection";
import FeaturesSection from "../components/home/FeaturesSection";
import GallerySection from "../components/home/GallerySection";
import HeroSection from "../components/home/HeroSection";
import MenuSection from "../components/home/MenuSection";
import RevealSection from "../components/home/RevealSection";
import TestimonialsSection from "../components/home/TestimonialsSection";

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#070707] text-white">
      <HeroSection />

      <div id="menu-section">
        <RevealSection direction="up">
          <MenuSection />
        </RevealSection>
      </div>

      <RevealSection direction="right">
        <FeaturesSection />
      </RevealSection>

      <RevealSection direction="left">
        <TestimonialsSection />
      </RevealSection>

      <RevealSection direction="up">
        <GallerySection />
      </RevealSection>

      <RevealSection direction="up">
        <ContactSection />
      </RevealSection>
    </main>
  );
}