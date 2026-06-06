import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import SideAdColumns from "@/components/SideAdColumns";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <SideAdColumns>
      <HeroSection />
      <CategorySection />
      <FeaturedListings />
    </SideAdColumns>
    <Footer />
  </div>
);

export default Index;
