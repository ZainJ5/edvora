"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';

const EmptyState = ({ clearAllFilters }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100"
    >
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-[#f0f2ff] rounded-full flex items-center justify-center mb-5">
          <FiSearch className="w-8 h-8 text-[#2c3180]" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">No courses found</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          We couldn't find any courses matching your criteria. Try adjusting your filters or search terms.
        </p>
        <button
          onClick={clearAllFilters}
          className="px-5 py-2.5 bg-[#2c3180] hover:bg-[#1a1e4e] text-white font-medium rounded-md transition-colors duration-200 shadow-sm"
        >
          Clear All Filters
        </button>
      </div>
    </motion.div>
  );
};

export default EmptyState;