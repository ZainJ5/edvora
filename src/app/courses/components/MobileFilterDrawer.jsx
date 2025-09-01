"use client"

import React from 'react';
import { FiChevronDown, FiChevronUp, FiX, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MobileFilterDrawer = ({
  mobileFiltersOpen,
  setMobileFiltersOpen,
  filters,
  handleFilterChange,
  handleCategoryClick,
  handleLevelClick,
  expandedSections,
  toggleSection,
  clearAllFilters,
  categories,
  levels,
}) => {
  return (
    <AnimatePresence>
      {mobileFiltersOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex z-40 lg:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-25"
          />
          
          <motion.div
            initial={{ transform: "translateX(-100%)" }}
            animate={{ transform: "translateX(0)" }}
            exit={{ transform: "translateX(-100%)" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative max-w-xs w-full bg-white shadow-xl pb-12 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 pt-5 pb-2 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <button
                type="button"
                className="-mr-2 w-10 h-10 p-2 flex items-center justify-center text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <FiX className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 px-4 h-full overflow-y-auto">
              <div className="border-b border-gray-200 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Categories</h3>
                  <button 
                    type="button"
                    onClick={() => toggleSection('categories')}
                    className="p-1 rounded-full hover:bg-gray-100"
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
                      <div className="space-y-2 mt-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {categories.map((category) => (
                          <div key={category.value} className="flex items-center">
                            <label 
                              className="flex items-center w-full cursor-pointer text-sm py-1.5 px-1 rounded-md hover:bg-gray-50"
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

              <div className="border-b border-gray-200 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Level</h3>
                  <button 
                    type="button"
                    onClick={() => toggleSection('level')}
                    className="p-1 rounded-full hover:bg-gray-100"
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
                      <div className="space-y-2 mt-2">
                        {levels.map((level) => (
                          <div key={level.value} className="flex items-center">
                            <label 
                              className="flex items-center w-full cursor-pointer text-sm py-1.5 px-1 rounded-md hover:bg-gray-50"
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

              <div className="border-b border-gray-200 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Price Range</h3>
                  <button 
                    type="button"
                    onClick={() => toggleSection('price')}
                    className="p-1 rounded-full hover:bg-gray-100"
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
                                className="w-full border border-gray-300 pl-7 pr-3 py-2 rounded-md text-sm focus:ring-[#2c3180] focus:border-[#2c3180]"
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
                                className="w-full border border-gray-300 pl-7 pr-3 py-2 rounded-md text-sm focus:ring-[#2c3180] focus:border-[#2c3180]"
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

              <div className="flex justify-center mt-8">
                <button 
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-[#2c3180] hover:bg-[#1a1e4e] text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileFilterDrawer;