"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const reviewsData = [
  {
    testimonial:
      "Edvora was rated the most popular online course or certification program for learning how to code according to StackOverflow's 2023 Developer survey.",
    name: "Stack Overflow",
    position: "Developer Survey Team",
    company: "Stack Overflow",
    avatarUrl: "/people/man-2.jpeg",
  },
  {
    testimonial:
      "Edvora was truly a game-changer and a great guide for me as we brought Dimensional to life.",
    name: "Alvin Lim",
    position: "Technical Co-Founder & CTO",
    company: "Dimensional",
    avatarUrl: "/people/women-2.jpeg",
  },
  {
    testimonial:
      "Edvora gives you the ability to be persistent. I learned exactly what I needed to know in the real world. It helped me sell myself to get a new role.",
    name: "William A. Wachlin",
    position: "Partner Account Manager",
    company: "Amazon Web Services",
    avatarUrl: "/people/man.jpeg",
  },
  {
    testimonial:
      "With Edvora Business employees were able to marry the two together, technology and consultant soft skills to help drive their careers forward.",
    name: "Ian Stevens",
    position: "Head of Capability Development (North America)",
    company: "Publicis Sapient",
    avatarUrl: "/people/women.jpeg",
  }
];

const ReviewsSection = () => {
  const scrollContainer = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(reviewsData.length);

  useEffect(() => {
    const calculateVisibleSlides = () => {
      if (scrollContainer.current) {
        const containerWidth = scrollContainer.current.clientWidth;
        const cardWidth = 400;
        const visibleSlides = Math.max(1, Math.floor(containerWidth / cardWidth));
        setTotalSlides(reviewsData.length - visibleSlides + 1);
      }
    };

    calculateVisibleSlides();
    window.addEventListener("resize", calculateVisibleSlides);
    return () => window.removeEventListener("resize", calculateVisibleSlides);
  }, []);

  const scroll = (direction) => {
    const container = scrollContainer.current;
    if (container) {
      const scrollAmount = 400;
      const newIndex =
        direction === "left"
          ? Math.max(0, currentIndex - 1)
          : Math.min(totalSlides - 1, currentIndex + 1);

      setCurrentIndex(newIndex);
      container.scrollTo({
        left: newIndex * scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleScrollEnd = () => {
    if (scrollContainer.current) {
      const newIndex = Math.round(scrollContainer.current.scrollLeft / 400);
      setCurrentIndex(newIndex);
    }
  };

  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-2"
        >
          Success Stories
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg md:text-xl text-gray-600 mb-10"
        >
          See how learners are transforming their careers with Edvora
        </motion.p>

        <div className="relative">
          {/* Left button */}
          <button
            onClick={() => scroll("left")}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg p-3 transition-all duration-300 hover:bg-blue-50 ${
              currentIndex === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-110"
            }`}
            aria-label="Scroll left"
            disabled={currentIndex === 0}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 19L8 12L15 5"
                stroke="#4B5563"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Cards */}
          <div
            ref={scrollContainer}
            className="flex overflow-x-auto gap-6 pb-8 snap-x scroll-smooth hide-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onScroll={() => setTimeout(handleScrollEnd, 100)}
          >
            {reviewsData.map((review, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="flex-none w-full sm:w-[400px] bg-white rounded-2xl shadow-lg p-6 border border-gray-100 snap-center transition-all duration-300 hover:shadow-2xl"
              >
                <div className="text-blue-500 text-5xl font-serif mb-6 opacity-50">❝</div>
                <p className="text-gray-800 text-lg leading-relaxed mb-8 font-light italic">
                  "{review.testimonial}"
                </p>
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 shadow-inner">
                      <img
                        src={review.avatarUrl}
                        alt={`${review.name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {review.name}
                    </h4>
                    {(review.position || review.company) && (
                      <p className="text-sm text-gray-600">
                        {review.position}
                        {review.position && review.company ? " at " : ""}
                        {review.company}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right button */}
          <button
            onClick={() => scroll("right")}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg p-3 transition-all duration-300 hover:bg-blue-50 ${
              currentIndex >= totalSlides - 1
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-110"
            }`}
            aria-label="Scroll right"
            disabled={currentIndex >= totalSlides - 1}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 5L16 12L9 19"
                stroke="#4B5563"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center mt-10 gap-3">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                scrollContainer.current.scrollTo({
                  left: idx * 400,
                  behavior: "smooth",
                });
              }}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? "w-6 h-2 bg-blue-500"
                  : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;