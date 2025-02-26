// src/components/search/AdvancedSearch.tsx

import React, { useState } from 'react';
import { useSearch, SearchFilters } from '@/hooks/useSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const AdvancedSearch = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    results,
    isLoading,
    suggestions,
    popularSearches
  } = useSearch();

  const FilterContent = () => (
    <div className="space-y-6 p-4">
      {/* Industry Filter */}
      <div>
        <h3 className="font-semibold mb-2">Industries</h3>
        <div className="grid grid-cols-2 gap-2">
          {industries.map((industry) => (
            <label
              key={industry}
              className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                filters.industries.includes(industry)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <input
                type="checkbox"
                checked={filters.industries.includes(industry)}
                onChange={(e) => {
                  setFilters(prev => ({
                    ...prev,
                    industries: e.target.checked
                      ? [...prev.industries, industry]
                      : prev.industries.filter(i => i !== industry)
                  }));
                }}
                className="sr-only"
              />
              <span className="ml-2 text-sm">{industry}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Investment Range Filter */}
      <div>
        <h3 className="font-semibold mb-2">Investment Range</h3>
        <Slider
          defaultValue={[0, 1000000]}
          min={0}
          max={10000000}
          step={100000}
          value={filters.investmentRange}
          onValueChange={(value) => {
            setFilters(prev => ({
              ...prev,
              investmentRange: value as [number, number]
            }));
          }}
          className="mt-6"
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>${filters.investmentRange[0].toLocaleString()}</span>
          <span>${filters.investmentRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Experience Filter */}
      <div>
        <h3 className="font-semibold mb-2">Minimum Experience</h3>
        <Slider
          defaultValue={[0]}
          min={0}
          max={20}
          step={1}
          value={[filters.experienceYears]}
          onValueChange={([value]) => {
            setFilters(prev => ({
              ...prev,
              experienceYears: value
            }));
          }}
          className="mt-6"
        />
        <div className="mt-2 text-sm text-gray-600">
          {filters.experienceYears} years
        </div>
      </div>

      {/* Sort Controls */}
      <div>
        <h3 className="font-semibold mb-2">Sort By</h3>
        <div className="flex items-center space-x-4">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              sortBy: e.target.value as SearchFilters['sortBy']
            }))}
            className="flex-1 rounded-md border-gray-300"
          >
            <option value="relevance">Relevance</option>
            <option value="experience">Experience</option>
            <option value="investment">Investment Amount</option>
            <option value="verification">Verification Level</option>
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFilters(prev => ({
              ...prev,
              sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc'
            }))}
          >
            {filters.sortDirection === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isMobile && (
        <Button
          className="w-full mt-4"
          onClick={() => setIsFilterOpen(false)}
        >
          Apply Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by name, industry, or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-14 py-2"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1.5"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="h-5 w-5" />
            {Object.values(filters).some(value => 
              Array.isArray(value) ? value.length > 0 : Boolean(value)
            ) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
            )}
          </Button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Filters - Desktop */}
        {!isMobile && (
          <div className="w-64 shrink-0">
            <Card>
              <CardContent>
                <FilterContent />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-4">
                    {/* Result content as before */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters - Mobile Bottom Sheet */}
      {isMobile && (
        <BottomSheet
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          title="Filters"
        >
          <FilterContent />
        </BottomSheet>
      )}
    </div>
  );
};

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Education',
  'Real Estate',
  'Manufacturing',
  'Energy',
  'Transportation',
  'Agriculture',
  'Entertainment',
  'Food & Beverage'
];

export default AdvancedSearch;