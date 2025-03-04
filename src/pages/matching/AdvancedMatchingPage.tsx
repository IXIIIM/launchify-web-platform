// src/pages/matching/AdvancedMatchingPage.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedMatchCard, MatchDetailsModal } from '@/components/matching/AdvancedMatchComponents';
import { Filters } from '@/components/matching/Filters';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdvancedMatchingPage = () => {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    industries: [],
    investmentRange: { min: 0, max: Infinity },
    teamSize: null,
    timeline: null,
    location: null,
    verificationLevel: null
  });

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [matches, filters]);

  const fetchMatches = async () => {
    try {
      const queryParams = new URLSearchParams({
        industries: filters.industries.join(','),
        investmentRange: JSON.stringify(filters.investmentRange),
        teamSize: filters.teamSize,
        timeline: filters.timeline,
        location: filters.location,
        verificationLevel: filters.verificationLevel
      });

      const response = await fetch(`/api/matching/potential?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...matches];

    // Apply each filter
    if (filters.industries.length > 0) {
      filtered = filtered.filter(match => 
        match.commonIndustries.some(industry => 
          filters.industries.includes(industry)
        )
      );
    }

    if (filters.investmentRange.min > 0 || filters.investmentRange.max < Infinity) {
      filtered = filtered.filter(match => {
        const amount = match.entrepreneurProfile?.desiredInvestment?.amount ||
                      match.funderProfile?.availableFunds;
        return amount >= filters.investmentRange.min && 
               amount <= filters.investmentRange.max;
      });
    }

    if (filters.teamSize) {
      filtered = filtered.filter(match => {
        const teamSize = match.entrepreneurProfile?.teamSize ||
                        match.funderProfile?.preferredTeamSize;
        return teamSize === filters.teamSize;
      });
    }

    if (filters.timeline) {
      filtered = filtered.filter(match => {
        const timeline = match.entrepreneurProfile?.timeline ||
                        match.funderProfile?.preferredTimeline;
        return timeline === filters.timeline;
      });
    }

    if (filters.location) {
      filtered = filtered.filter(match =>
        match.location === filters.location
      );
    }

    if (filters.verificationLevel) {
      filtered = filtered.filter(match =>
        match.verificationLevel === filters.verificationLevel
      );
    }

    setFilteredMatches(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleMatchSelect = (match) => {
    setSelectedMatch(match);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Find Your Perfect Match</h1>
        <button
          onClick={() => setFilters({})}
          className="text-blue-600 hover:text-blue-700"
        >
          Reset Filters
        </button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className="w-80 flex-shrink-0">
          <Filters
            filters={filters}
            onChange={handleFilterChange}
          />
        </div>

        {/* Matches Grid */}
        <div className="flex-1">
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              {filteredMatches.length} matches found
            </p>
            <select
              className="border rounded-lg px-3 py-2"
              onChange={(e) => {
                const sorted = [...filteredMatches].sort((a, b) => {
                  if (e.target.value === 'compatibility') {
                    return b.compatibilityScore - a.compatibilityScore;
                  }
                  // Add other sorting options
                  return 0;