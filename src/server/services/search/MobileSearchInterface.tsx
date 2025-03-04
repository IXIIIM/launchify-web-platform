// src/components/search/MobileSearchInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchFilters {
  industries?: string[];
  businessType?: string;
  investmentAmount?: { min: number; max: number };
  yearsExperience?: number;
  verificationLevel?: string;
}

interface MobileSearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  initialQuery?: string;
  initialFilters?: SearchFilters;
  loading?: boolean;
  userType: 'entrepreneur' | 'funder';
}

const MobileSearchInterface: React.FC<MobileSearchInterfaceProps> = ({
  onSearch,
  initialQuery = '',
  initialFilters = {},
  loading = false,
  userType
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Industry options based on user type
  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 
    'Manufacturing', 'Education', 'Transportation', 'Food & Beverage',
    'Real Estate', 'Energy', 'Media & Entertainment'
  ];

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, filters);
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const toggleFilterSection = (section: string) => {
    setActiveFilter(activeFilter === section ? null : section);
  };

  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(key => {
      if (Array.isArray(filters[key])) {
        return filters[key].length > 0;
      }
      return filters[key] !== undefined && filters[key] !== null;
    }).length;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search for ${userType === 'entrepreneur' ? 'entrepreneurs' : 'funders'}...`}
            className="w-full py-3 pl-10 pr-24 text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <div className="absolute right-0 flex gap-1 pr-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 text-xs rounded-full ${
                getActiveFilterCount() > 0
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Filter size={16} />
              {getActiveFilterCount() > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {/* Filter panel */}
      {showFilters && (
        <div 
          ref={filterRef}
          className="mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>

          {/* Industries filter */}
          <div className="mb-4">
            <button
              onClick={() => toggleFilterSection('industries')}
              className="flex w-full items-center justify-between text-sm font-medium text-gray-700 mb-2"
            >
              <span>Industries</span>
              {activeFilter === 'industries' ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            
            {activeFilter === 'industries' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {industryOptions.map(industry => (
                  <label key={industry} className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={filters.industries?.includes(industry) || false}
                      onChange={(e) => {
                        const currentIndustries = filters.industries || [];
                        if (e.target.checked) {
                          updateFilter('industries', [...currentIndustries, industry]);
                        } else {
                          updateFilter(
                            'industries',
                            currentIndustries.filter(i => i !== industry)
                          );
                        }
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {industry}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Business Type filter (for entrepreneurs) */}
          {userType === 'entrepreneur' && (
            <div className="mb-4">
              <button
                onClick={() => toggleFilterSection('businessType')}
                className="flex w-full items-center justify-between text-sm font-medium text-gray-700 mb-2"
              >
                <span>Business Type</span>
                {activeFilter === 'businessType' ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
              
              {activeFilter === 'businessType' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['B2B', 'B2C'].map(type => (
                    <label key={type} className="flex items-center text-xs">
                      <input
                        type="radio"
                        name="businessType"
                        checked={filters.businessType === type}
                        onChange={() => updateFilter('businessType', type)}
                        className="mr-2 h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Investment Amount filter */}
          <div className="mb-4">
            <button
              onClick={() => toggleFilterSection('investmentAmount')}
              className="flex w-full items-center justify-between text-sm font-medium text-gray-700 mb-2"
            >
              <span>{userType === 'entrepreneur' ? 'Desired Investment' : 'Available Funds'}</span>
              {activeFilter === 'investmentAmount' ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            
            {activeFilter === 'investmentAmount' && (
              <div className="mt-2 space-y-4">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Minimum</label>
                  <select
                    value={filters.investmentAmount?.min || ''}
                    onChange={(e) => updateFilter('investmentAmount', {
                      ...filters.investmentAmount,
                      min: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="w-full p-2 text-xs border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="10000">$10,000</option>
                    <option value="50000">$50,000</option>
                    <option value="100000">$100,000</option>
                    <option value="500000">$500,000</option>
                    <option value="1000000">$1,000,000</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Maximum</label>
                  <select
                    value={filters.investmentAmount?.max || ''}
                    onChange={(e) => updateFilter('investmentAmount', {
                      ...filters.investmentAmount,
                      max: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="w-full p-2 text-xs border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="50000">$50,000</option>
                    <option value="100000">$100,000</option>
                    <option value="500000">$500,000</option>
                    <option value="1000000">$1,000,000</option>
                    <option value="5000000">$5,000,000</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Years Experience filter */}
          <div className="mb-4">
            <button
              onClick={() => toggleFilterSection('yearsExperience')}
              className="flex w-full items-center justify-between text-sm font-medium text-gray-700 mb-2"
            >
              <span>Years Experience</span>
              {activeFilter === 'yearsExperience' ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            
            {activeFilter === 'yearsExperience' && (
              <div className="mt-2">
                <select
                  value={filters.yearsExperience || ''}
                  onChange={(e) => updateFilter('yearsExperience', 
                    e.target.value ? Number(e.target.value) : undefined
                  )}
                  className="w-full p-2 text-xs border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any</option>
                  <option value="1">1+ years</option>
                  <option value="3">3+ years</option>
                  <option value="5">5+ years</option>
                  <option value="10">10+ years</option>
                  <option value="20">20+ years</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowFilters(false);
                onSearch(query, filters);
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileSearchInterface;