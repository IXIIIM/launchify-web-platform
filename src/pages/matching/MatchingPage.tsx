// src/pages/matching/MatchingPage.tsx

import React, { useState, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Card, PageHeader } from './layout-components';
import { Star, X, Check, Briefcase, Users, Clock } from 'lucide-react';

const MatchingPage = () => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPotentialMatches();
  }, []);

  const fetchPotentialMatches = async () => {
    try {
      const response = await fetch('/api/matches/potential');
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setPotentialMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load potential matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentMatch = potentialMatches[currentIndex];
    
    try {
      const response = await fetch('/api/matches/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: currentMatch.id,
          direction
        }),
      });

      if (!response.ok) throw new Error('Failed to process swipe');
      
      const result = await response.json();
      if (result.isMatch) {
        // Show match notification
        // You could trigger a modal or toast here
      }

      // Move to next match
      setCurrentIndex(prev => prev + 1);

      // If running low on matches, fetch more
      if (currentIndex >= potentialMatches.length - 3) {
        fetchPotentialMatches();
      }
    } catch (error) {
      console.error('Swipe error:', error);
      setError('Failed to process your response');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  const currentMatch = potentialMatches[currentIndex];

  if (!currentMatch) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">No More Matches</h3>
        <p className="text-gray-600">
          We're looking for more matches that meet your criteria.
          Check back soon!
        </p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Find Your Match" 
        description="Swipe right to connect, left to pass"
      />

      <div className="max-w-xl mx-auto">
        <motion.div
          className="relative h-[600px] w-full bg-white rounded-lg shadow-lg overflow-hidden"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (Math.abs(info.offset.x) > 100) {
              handleSwipe(info.offset.x > 0 ? 'right' : 'left');
            }
          }}
        >
          {/* Profile Image */}
          <div className="h-2/3 bg-gray-200">
            <img
              src={currentMatch.user.photo}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Profile Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white">
            <h2 className="text-2xl font-bold mb-2">
              {currentMatch.user.type === 'entrepreneur'
                ? currentMatch.user.projectName
                : currentMatch.user.name}
            </h2>

            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Briefcase className="w-4 h-4 mr-1" />
                {currentMatch.user.yearsExperience} years experience
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                {currentMatch.user.type}
              </div>
            </div>

            {/* Match Reasons */}
            <div className="space-y-2">
              {currentMatch.matchReason.map((reason, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 text-yellow-400 mr-2" />
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={() => handleSwipe('left')}
              className="p-4 bg-white rounded-full shadow-lg hover:bg-gray-50"
            >
              <X className="w-6 h-6 text-red-500" />
            </button>
            <button
              onClick={() => handleSwipe('right')}
              className="p-4 bg-white rounded-full shadow-lg hover:bg-gray-50"
            >
              <Check className="w-6 h-6 text-green-500" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MatchingPage;