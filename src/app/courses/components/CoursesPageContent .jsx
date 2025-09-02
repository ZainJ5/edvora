"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSlidersH } from "react-icons/fa";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import Image from "next/image";
import FilterSidebar from "./FilterSidebar";
import MobileFilterDrawer from "./MobileFilterDrawer";
import CourseCard from "./CourseCard";
import EmptyState from "./EmptyState";

export default function CoursesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    level: searchParams.get("level") || "",
    search: searchParams.get("search") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    level: true,
    price: true,
  });

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
    { value: "Personal Development", label: "Personal Development" },
    { value: "Other", label: "Other" }
  ];

  const levels = [
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" }
  ];

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "popularity", label: "Most Popular" }
  ];

  const categoryColors = {
    "Web Development": "bg-blue-500",
    "Mobile Development": "bg-green-500",
    "AI": "bg-gray-500",
    "Data Science": "bg-purple-500",
    "Machine Learning": "bg-red-500",
    "Programming": "bg-teal-500",
    "Business": "bg-amber-500",
    "Marketing": "bg-pink-500",
    "Design": "bg-indigo-500",
    "Photography": "bg-sky-500",
    "Music": "bg-orange-500",
    "Lifestyle": "bg-lime-500",
    "Health & Fitness": "bg-rose-500",
    "Personal Development": "bg-cyan-500",
    "Other": "bg-gray-500"
  };

  const levelBadgeColors = {
    "Beginner": "bg-emerald-100 text-emerald-800",
    "Intermediate": "bg-blue-100 text-blue-800",
    "Advanced": "bg-purple-100 text-purple-800",
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.level) queryParams.append('level', filters.level);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
        if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
        if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
        
        router.push(`/courses?${queryParams.toString()}`, { scroll: false });
        
        const response = await fetch(`/api/courses?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err.message);
        toast.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [filters, router]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryClick = (category) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === category ? '' : category
    }));
  };

  const handleLevelClick = (level) => {
    setFilters(prev => ({
      ...prev,
      level: prev.level === level ? '' : level
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const clearAllFilters = () => {
    setFilters({
      category: '',
      level: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest'
    });
    toast.success('Filters cleared');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-4 border-[#2c3180] animate-spin"></div>
            <div className="absolute inset-0 flex items-center mx-auto justify-center">
              <Image
                src="/logo-1.png"
                alt="Edvora"
                width={32}
                height={32}
                className="rounded-md bg-white"
              />
            </div>
          </div>
          <p className="mt-4 text-[#2c3180] font-medium">Loading Courses...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 'medium',
          },
          success: {
            iconTheme: {
              primary: '#4CAF50',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#E53935',
              secondary: 'white',
            },
          },
        }}
      />

      <div className="bg-gray-50 text-black min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8">
          <MobileFilterDrawer 
            mobileFiltersOpen={mobileFiltersOpen}
            setMobileFiltersOpen={setMobileFiltersOpen}
            filters={filters}
            handleFilterChange={handleFilterChange}
            handleCategoryClick={handleCategoryClick}
            handleLevelClick={handleLevelClick}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            clearAllFilters={clearAllFilters}
            categories={categories}
            levels={levels}
          />

          <div className="py-8">
            <div className="flex items-baseline justify-between border-b border-gray-200 pb-6">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Explore Courses
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Discover top-quality courses to enhance your skills
                </p>
              </motion.div>

              <div className="flex items-center">
                <div className="relative inline-block text-left">
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="mr-2 border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-[#2c3180] focus:border-[#2c3180] bg-white"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="p-2 -m-2 ml-4 text-gray-400 hover:text-gray-500 sm:ml-6 lg:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <span className="sr-only">Filters</span>
                  <FaSlidersH className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <section className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-8 gap-y-6">
                <FilterSidebar
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                  handleCategoryClick={handleCategoryClick}
                  handleLevelClick={handleLevelClick}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  clearAllFilters={clearAllFilters}
                  categories={categories}
                  levels={levels}
                  handleSearchSubmit={handleSearchSubmit}
                />

                <div className="lg:col-span-3">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg bg-red-50 p-4 mb-6 border border-red-100"
                    >
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error loading courses</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                          </div>
                          <div className="mt-4">
                            <button
                              onClick={() => window.location.reload()}
                              className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">
                      {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
                    </p>
                    
                    <div className="lg:hidden">
                      <select
                        name="sortBy"
                        value={filters.sortBy}
                        onChange={handleFilterChange}
                        className="border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-[#2c3180] focus:border-[#2c3180]"
                      >
                        {sortOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {courses.length === 0 ? (
                    <EmptyState clearAllFilters={clearAllFilters} />
                  ) : (
                    <motion.div 
                      className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                      layout
                      transition={{ duration: 0.3 }}
                    >
                      {courses.map((course) => (
                        <CourseCard 
                          key={course._id}
                          course={course}
                          categoryColors={categoryColors}
                          levelBadgeColors={levelBadgeColors}
                        />
                      ))}
                    </motion.div>
                  )}

                  {courses.length > 0 && (
                    <div className="mt-8 flex justify-center">
                      <nav className="flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Previous
                          </button>
                          <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
                          <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                              <button className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20">
                                Previous
                              </button>
                              <button className="relative inline-flex items-center border border-gray-300 bg-[#235d96] px-4 py-2 text-sm font-medium text-white focus:z-20">
                                1
                              </button>
                              <button className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20">
                                2
                              </button>
                              <button className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20">
                                3
                              </button>
                              <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                                ...
                              </span>
                              <button className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20">
                                Next
                              </button>
                            </nav>
                          </div>
                        </div>
                      </nav>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}