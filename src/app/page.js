import Image from "next/image";
import HeroSection from "./components/Heosection";
import ReviewsSection from "./components/ReviewsSection";
import TrustedCompanies from "./components/TrustedCompanies";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div>
    <HeroSection/>
    <TrustedCompanies/>
    <ReviewsSection/>
    <Footer/>
    </div>
  );
}
