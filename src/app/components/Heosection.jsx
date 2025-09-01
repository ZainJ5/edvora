'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
// Remove this line that was causing the error
// import { useRouter } from 'next/router';

const HeroSection = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isSmallDevice, setIsSmallDevice] = useState(false);
  const initialHeightSet = useRef(false);
  // Remove this line that was causing the error
  // const router = useRouter();

  const banners = [
    {
      src: '/banner/banner-1.png',
      srcSmall: '/banner/banner-1-small-devices.png',
      alt: 'Banner 1',
      card: {
        title: 'Dream big',
        description: 'Find a course to help you reach where you want to go.',
        subtext: 'Starting at $9.99 through August 28.',
        buttonText: null
      }
    },
    {
      src: '/banner/banner-2.png',
      srcSmall: '/banner/banner-2-small-devices.png',
      alt: 'Banner 2',
      card: {
        title: "Master tomorrow's skills today",
        description: 'Power up your AI, career, and life skills with the most up-to-date, expert-led learning.',
        subtext: null,
        buttons: [
          { text: 'Learn AI', primary: true }
        ]
      }
    },
  ];

  useEffect(() => {
    const checkDeviceSize = () => {
      setIsSmallDevice(window.innerWidth <= 960 || window.innerHeight <= 520);
    };

    const setVH = () => {
      if (!initialHeightSet.current || window.innerWidth !== window.lastWidth) {
        window.lastWidth = window.innerWidth;
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        initialHeightSet.current = true;
      }
    };

    checkDeviceSize();
    setVH();
    
    const handleResize = () => {
      checkDeviceSize();
      setVH();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const goToPrevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const navigateToAICourses = () => {
    window.location.href = 'http://localhost:3000/courses?category=AI&sortBy=newest';
  };

  return (
    <div className="relative w-full overflow-hidden">
      <style jsx>{`
        /* Responsive hero container */
        .hero-container {
          /* Desktop styling */
          position: relative;
          height: 80vh;
          width: 100%;
          max-height: 800px;
        }
        
        /* Mobile styling - shorter height */
        @media (max-width: 767px) {
          .hero-container {
            height: 60vh;
            min-height: 400px;
            max-height: 600px;
          }
        }

        /* Extra small devices */
        @media (max-width: 480px) {
          .hero-container {
            height: 50vh;
            min-height: 300px;
          }
        }

        /* Small device override for 960x520 */
        @media (max-width: 960px) and (max-height: 520px) {
          .hero-container {
            height: 520px;
            width: 960px;
            max-width: 100vw;
          }
        }
        
        /* Banner image responsive styling */
        .banner-image {
          object-position: center center;
        }

        /* Control positioning adjustments */
        .slider-controls {
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 20;
        }

        /* Enhanced card styling with better shadows */
        .hero-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.4);
          max-width: 450px;
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.18);
          position: relative;
        }

        .hero-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(255, 255, 255, 0.05) 100%);
          border-radius: 16px;
          pointer-events: none;
        }

        .hero-card > * {
          position: relative;
          z-index: 1;
        }

        .hero-card h2 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 1rem;
          line-height: 1.2;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .hero-card p {
          font-size: 1.125rem;
          color: #4a5568;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .hero-card .subtext {
          font-size: 1rem;
          color: #718096;
          margin-bottom: 1.5rem;
        }

        .btn-primary {
          background: #0b4f8a;
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          box-shadow: 
            0 4px 14px 0 rgba(11, 79, 138, 0.3),
            0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .btn-primary:hover {
          background: #0a4272;
          transform: translateY(-2px);
          box-shadow: 
            0 6px 20px 0 rgba(11, 79, 138, 0.4),
            0 2px 6px 0 rgba(0, 0, 0, 0.15);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.9);
          color: #4a5568;
          border: 2px solid rgba(209, 213, 219, 0.8);
          padding: 0.875rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
        }

        .btn-secondary:hover {
          border-color: #0b4f8a;
          color: #0b4f8a;
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
        }

        /* Hide cards on small devices */
        @media (max-width: 960px) and (max-height: 520px) {
          .hero-card {
            display: none;
          }
        }

        @media (max-width: 767px) {
          .hero-card {
            display: none;
          }
        }

        /* Enhanced navigation controls for small devices */
        .nav-button {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .nav-button:hover {
          background: rgba(0, 0, 0, 0.6);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        /* Enhanced slider dots */
        .slider-dot {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div className="hero-container">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              currentBanner === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={isSmallDevice ? banner.srcSmall : banner.src}
              alt={banner.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="banner-image object-cover"
              quality={90}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20"></div>
            
            <div className="absolute inset-0 flex items-center justify-start z-15">
              <div className="hero-card ml-8 md:ml-16 lg:ml-20">
                <h2>{banner.card.title}</h2>
                <p>{banner.card.description}</p>
                {banner.card.subtext && (
                  <p className="subtext">{banner.card.subtext}</p>
                )}
                
                {banner.card.buttons && (
                  <div className="flex flex-col sm:flex-row w-full">
                    {banner.card.buttons.map((button, btnIndex) => (
                      <button
                        key={btnIndex}
                        className={button.primary ? 'btn-primary' : 'btn-secondary'}
                        onClick={navigateToAICourses}
                      >
                        {button.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={goToPrevBanner}
        className="nav-button absolute left-2 md:left-8 top-1/2 transform -translate-y-1/2 z-20 text-white rounded-full p-2 md:p-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Previous banner"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNextBanner}
        className="nav-button absolute right-2 md:right-8 top-1/2 transform -translate-y-1/2 z-20 text-white rounded-full p-2 md:p-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Next banner"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="slider-controls space-x-3">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`slider-dot w-2 h-2 rounded-full transition-all duration-300 ${
              currentBanner === index
                ? 'bg-white w-6 scale-110'
                : 'bg-white/60 hover:bg-white/80 hover:scale-105'
            }`}
            onClick={() => setCurrentBanner(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSection;