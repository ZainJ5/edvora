'use client';
import React from 'react';

const TrustedCompanies = () => {
  const companies = [
    { name: 'volkswagen_logo', alt: 'Volkswagen' },
    { name: 'samsung_logo', alt: 'Samsung' },
    { name: 'cisco_logo', alt: 'Cisco' },
    { name: 'vimeo_logo', alt: 'Vimeo' },
    { name: 'procter_gamble_logo', alt: 'P&G' },
    { name: 'hewlett_packard_enterprise_logo', alt: 'Hewlett Packard Enterprise' },
    { name: 'citi_logo', alt: 'Citi' },
    { name: 'ericsson_logo', alt: 'Ericsson' }
  ];

  return (
    <div className="py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-gray-600 text-lg mb-8 font-normal">
          Trusted by over 12,000 companies and millions of learners around the world
        </h2>
        
        <div className="grid grid-cols-4 gap-8 items-center justify-items-center md:grid-cols-8 md:gap-12">
          {companies.map((company, index) => (
            <div 
              key={company.name} 
              className="flex items-center justify-center"
            >
              <img
                src={`/brands/${company.name}.svg`}
                alt={company.alt}
                className="h-8 w-auto  object-contain filter grayscale"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustedCompanies;