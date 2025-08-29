import Image from "next/image";
import HeroSection from "./components/Heosection";
import ReviewsSection from "./components/ReviewsSection";
import TrustedCompanies from "./components/TrustedCompanies";

export default function Home() {
  return (
    <div>
    <HeroSection/>
    <ReviewsSection/>
    <TrustedCompanies/>
    </div>
  );
}
