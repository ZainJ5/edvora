"use client"

import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { FiChevronDown, FiChevronUp, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const FilterSidebar = ({
  filters,
  handleFilterChange,
  handleCategoryClick,
  handleLevelClick,
  expandedSections,
  toggleSection,
  clearAllFilters,
  categories,
  levels,
  handleSearchSubmit,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="hidden lg:block"
    >
      <form className="sticky top-6 space-y-6">
        {/* Search */}
        {/* <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Search Courses</h3>
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search courses..."
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2c3180] focus:border-[#2c3180] text-sm"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
          </form>
        </div> */}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
            <button 
              type="button"
              onClick={() => toggleSection('categories')}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              {expandedSections.categories ? 
                <FiChevronUp className="h-5 w-5" /> : 
                <FiChevronDown className="h-5 w-5" />
              }
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.categories && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-2 text-black custom-scrollbar">
                  {categories.map((category) => (
                    <div key={category.value} className="flex items-center">
                      <label 
                        className="flex items-center w-full cursor-pointer text-sm py-1.5 px-1 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filters.category === category.value}
                          onChange={() => handleCategoryClick(category.value)}
                          className="sr-only peer"
                        />
                        <span className={`h-5 w-5 flex-shrink-0 rounded border ${
                          filters.category === category.value 
                            ? 'bg-[#2c3180] border-[#2c3180] text-white' 
                            : 'border-gray-300 bg-white'
                        } flex items-center justify-center transition-colors`}>
                          {filters.category === category.value && <FiCheck className="h-3.5 w-3.5" />}
                        </span>
                        <span className="ml-3">{category.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white rounded-lg text-black shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Level</h3>
            <button 
              type="button"
              onClick={() => toggleSection('level')}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              {expandedSections.level ? 
                <FiChevronUp className="h-5 w-5" /> : 
                <FiChevronDown className="h-5 w-5" />
              }
            </button>
          </div>
          
          <AnimatePresence>
            {expandedSections.level && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2">
                  {levels.map((level) => (
                    <div key={level.value} className="flex items-center">
                      <label 
                        className="flex items-center w-full cursor-pointer text-sm py-1.5 px-1 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filters.level === level.value}
                          onChange={() => handleLevelClick(level.value)}
                          className="sr-only peer"
                        />
                        <span className={`h-5 w-5 flex-shrink-0 rounded border ${
                          filters.level === level.value 
                            ? 'bg-[#2c3180] border-[#2c3180] text-white' 
                            : 'border-gray-300 bg-white'
                        } flex items-center justify-center transition-colors`}>
                          {filters.level === level.value && <FiCheck className="h-3.5 w-3.5" />}
                        </span>
                        <span className="ml-3">{level.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Price Range</h3>
            <button 
              type="button"
              onClick={() => toggleSection('price')}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              {expandedSections.price ? 
                <FiChevronUp className="h-5 w-5" /> : 
                <FiChevronDown className="h-5 w-5" />
              }
            </button>
          </div>
          
          <AnimatePresence>
            {expandedSections.price && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Min Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          name="minPrice"
                          value={filters.minPrice}
                          onChange={handleFilterChange}
                          placeholder="0"
                          className="w-full border border-gray-300 pl-7 text-black pr-3 py-2 rounded-md text-sm focus:ring-[#2c3180] focus:border-[#2c3180]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Max Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          name="maxPrice"
                          value={filters.maxPrice}
                          onChange={handleFilterChange}
                          placeholder="1000"
                          className="w-full border border-gray-300 pl-7 pr-3 py-2 rounded-md text-black text-sm focus:ring-[#2c3180] focus:border-[#2c3180]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleFilterChange({
                          target: { name: 'minPrice', value: filters.minPrice || '0' }
                        });
                        handleFilterChange({
                          target: { name: 'maxPrice', value: filters.maxPrice || '1000' }
                        });
                      }}
                      className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded-md transition-colors"
                    >
                      Apply Price Filter
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6">
          <button 
            type="button"
            onClick={clearAllFilters}
            className="w-full py-2.5 px-4 bg-[#2c3180] hover:bg-[#1a1e4e] text-white font-medium rounded-md transition-colors duration-200 text-sm shadow-sm"
          >
            Clear All Filters
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default FilterSidebar;