"use client"


import React, { useRef } from 'react';
// import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/outline';


const reviewsData = [
  {
    testimonial: "Edvora was rated the most popular online course or certification program for learning how to code according to StackOverflow's 2023 Developer survey.",
    name: "StackOverflow",
    position: "",
    company: "",
    avatarUrl: "/people/man-2.jpeg",
    linkText: "View Web Development courses"
  },
  {
    testimonial: "Edvora was truly a game-changer and a great guide for me as we brought Dimensional to life.",
    name: "Alvin Lim",
    position: "Technical Co-Founder, CTO",
    company: "Dimensional",
    avatarUrl: "/people/women-2.jpeg",
    linkText: "View this iOS & Swift course"
  },
  {
    testimonial: "Edvora gives you the ability to be persistent. I learned exactly what I needed to know in the real world. It helped me sell myself to get a new role.",
    name: "William A. Wachlin",
    position: "Partner Account Manager",
    company: "Amazon Web Services",
    avatarUrl: "/people/man.jpeg",
    linkText: "View this AWS course"
  },
  {
    testimonial: "With Edvora Business employees were able to marry the two together, technology and consultant soft skills to help drive their careers forward.",
    name: "Ian Stevens",
    position: "Head of Capability Development, North America",
    company: "Publicis Sapient",
    avatarUrl: "/people/women.jpeg",
    linkText: "Read full story"
  }
];

const ReviewsSection = () => {
  const scrollContainer = useRef(null);

  const scroll = (direction) => {
    const container = scrollContainer.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="py-12 px-4 md:px-8 bg-white">
      <h2 className="text-3xl md:text-4xl font-extrabold font-inter text-gray-900 mb-10">
        See what others are achieving through learning
      </h2>
      
      <div className="relative">
        <button 
          onClick={() => scroll('left')} 
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full shadow-lg p-2 hidden md:block"
          aria-label="Scroll left"
        >
          {/* <ChevronLeftIcon className="h-6 w-6 text-gray-700" /> */}
        </button>
        
        <div 
          ref={scrollContainer}
          className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide snap-x scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reviewsData.map((review, index) => (
            <div 
              key={index} 
              className="flex-none w-full sm:w-[400px] bg-white rounded-lg shadow-md p-6 border border-gray-100 snap-start"
            >
              <div className="text-gray-400 text-4xl font-serif mb-4">❝</div>
              <p className="text-gray-800 mb-6">{review.testimonial}</p>
              <div className="flex items-center mb-4">
                <img 
                  src={review.avatarUrl} 
                  alt={`${review.name}'s profile`}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{review.name}</h4>
                  <p className="text-sm text-gray-600">{review.position} at {review.company}</p>
                </div>
              </div>
              <a 
                href={review.link} 
                className="text-blue-600 font-semibold text-sm flex items-center hover:text-blue-800 transition-colors"
              >
                {review.linkText}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => scroll('right')} 
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full shadow-lg p-2 hidden md:block"
          aria-label="Scroll right"
        >
          {/* <ChevronRightIcon className="h-6 w-6 text-gray-700" /> */}
        </button>
      </div>
    </div>
  );
};

export default ReviewsSection;