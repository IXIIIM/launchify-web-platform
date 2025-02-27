import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { User } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface Match {
  id: string;
  profile: {
    name?: string;
    projectName?: string;
    photo?: string;
    industries: string[];
    yearsExperience: number;
  };
  compatibility: number;
  matchReasons: string[];
}

const SwipeInterface = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches/potential');
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError('Failed to load potential matches');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= matches.length) return;

    try {
      const response = await fetch('/api/matches/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: matches[currentIndex].id,
          direction
        })
      });

      if (!response.ok) throw new Error('Failed to process swipe');
      
      const result = await response.json();
      if (result.isMatch) {
        // Show match notification
        handleMatch(matches[currentIndex]);
      }

      setCurrentIndex(prev => prev + 1);

      // Fetch more matches if running low
      if (currentIndex >= matches.length - 3) {
        fetchMatches();
      }
    } catch (err) {
      setError('Failed to process swipe');
      console.error(err);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    if (Math.abs(info.offset.x) > swipeThreshold) {
      handleSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  const handleMatch = (match: Match) => {
    // Show match notification modal
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (currentIndex >= matches.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-xl font-semibold text-gray-600">
          No more matches available
        </div>
        <button
          onClick={fetchMatches}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Matches
        </button>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];

  return (
    <div className="w-full max-w-xl mx-auto h-[600px] relative">
      <AnimatePresence>
        <motion.div
          key={currentMatch.id}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 touch-none"
        >
          <Card className="w-full h-full overflow-hidden bg-white">
            <div className="relative h-2/3">
              {currentMatch.profile.photo ? (
                <img
                  src={currentMatch.profile.photo}
                  alt={currentMatch.profile.name || currentMatch.profile.projectName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <User className="w-32 h-32 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <h2 className="text-2xl font-bold text-white">
                  {currentMatch.profile.name || currentMatch.profile.projectName}
                </h2>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                    {currentMatch.compatibility}% Match
                  </span>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Why you might match</h3>
                  <ul className="space-y-2">
                    {currentMatch.matchReasons.map((reason, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Industries: </span>
                    <span className="text-gray-600">
                      {currentMatch.profile.industries.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Experience: </span>
                    <span className="text-gray-600">
                      {currentMatch.profile.yearsExperience} years
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
        <button
          onClick={() => handleSwipe('left')}
          className="p-4 bg-white rounded-full shadow-lg hover:bg-gray-50"
        >
          ✕
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
        >
          ✓
        </button>
      </div>
    </div>
  );
};

export default SwipeInterface;