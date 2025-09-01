"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';
import { HiOutlineMail } from 'react-icons/hi';
import { BsArrowRightShort } from 'react-icons/bs';

const Footer = () => {
  const categories = [
    { value: "Web Development", label: "Web Development" },
    { value: "AI", label: "AI" },
    { value: "Data Science", label: "Data Science" },
    { value: "Programming", label: "Programming" },
    { value: "Machine Learning", label: "Machine Learning" },
    { value: "Business", label: "Business" },
    { value: "Marketing", label: "Marketing" },
    { value: "Design", label: "Design" },
    { value: "Photography", label: "Photography" },
    { value: "Music", label: "Music" },
    { value: "Lifestyle", label: "Lifestyle" },
    { value: "Health & Fitness", label: "Health & Fitness" },
    { value: "Personal Development", label: "Personal Development" }
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Image 
                src="/logo-2.png" 
                alt="Edvora" 
                width={240} 
                height={80}
                className="h-16 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-8 max-w-md text-base leading-relaxed">
              Edvora is a premier online learning platform offering high-quality courses 
              designed to help you master new skills and advance your career.
            </p>
            
            <Link href="/auth" className="inline-flex items-center px-6 py-3 mb-8 text-base font-medium rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Get Started
              <BsArrowRightShort size={22} className="ml-2" />
            </Link>
            
            <div className="flex space-x-5">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <FaFacebook size={22} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <FaTwitter size={22} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <FaInstagram size={22} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <FaLinkedin size={22} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <FaYoutube size={22} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-6 text-white border-b border-gray-700 pb-2 inline-block">Edvora</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/courses" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Explore</span>
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">All Courses</span>
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Plans & Pricing</span>
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Teach on Edvora</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xl font-semibold mb-6 text-white border-b border-gray-700 pb-2 inline-block">Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <Link 
                  key={category.value}
                  href={`/courses?category=${encodeURIComponent(category.value)}`}
                  className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Edvora. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center space-x-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white mb-2 md:mb-0 transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white mb-2 md:mb-0 transition-colors duration-300">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-white mb-2 md:mb-0 transition-colors duration-300">
                Cookie Policy
              </Link>
              <Link href="/sitemap" className="hover:text-white transition-colors duration-300">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;