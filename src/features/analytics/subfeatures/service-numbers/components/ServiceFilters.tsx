import React from 'react';

interface ServiceFiltersProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const CATEGORIES = [
  'All',
  'Hex IDs',
  'Emergency',
  'Banking',
  'Government',
  'Telecom',
  'Corporate',
  'Utility',
  'Unknown Hex'
];

export const ServiceFilters: React.FC<ServiceFiltersProps> = ({ activeCategory, setActiveCategory }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveCategory(cat)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border ${
            activeCategory === cat
              ? 'bg-[#a855f7]/20 border-[#a855f7] text-[#a855f7]'
              : 'bg-[#1a2332] border-[#2e3b4e] text-gray-400 hover:text-white hover:border-gray-500'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};
