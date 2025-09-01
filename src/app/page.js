import Image from "next/image";
import HeroSection from "./components/Heosection";
import ReviewsSection from "./components/ReviewsSection";
import TrustedCompanies from "./components/TrustedCompanies";
import Footer from "./components/Footer";
import AICourses from "./components/AICourses";
import WebDevelopmentCourses from "./components/WebDevelopmentCourses";

export default function Home() {
  return (
    <div>
    <HeroSection/>
    <AICourses/>
    <div className="p-4">
    <TrustedCompanies/>
    </div>
    <WebDevelopmentCourses/>
    <ReviewsSection/>
    <Footer/>
    </div>
  );
}
