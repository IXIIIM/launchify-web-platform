// src/components/matching/MatchFeed.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';
import { Check, X, Star, Info } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import { TouchButton } from '@/components/base/mobile';
import { Entrepreneur, Funder } from '@/types/user';

interface MatchCardProps {
  match: Entrepreneur | Funder;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  index: number;
  totalCards: number;
}

const SWIPE_THRESHOLD = 100; // Minimum swipe distance to trigger action
const ROTATION_FACTOR = 0.5; // Controls card rotation during swipe

const MatchFeed = () => {
  const [matches, setMatches] = useState<(Entrepreneur | Funder)[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Entrepreneur | Funder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();

  // Load matches
  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/matches/potential');
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setMatches(prev => {
        // Filter out duplicates
        const existingIds = new Set(prev.map(m => m.id));
        const newMatches = data.filter(m => !existingIds.has(m.id));
        return [...prev, ...newMatches];
      });
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load potential matches',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= matches.length) return;
    
    const matchId = matches[currentIndex].id;
    setSwipeDirection(direction);

    try {
      const endpoint = direction === 'up' ? '/api/matches/super-like' : '/api/matches/swipe';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchId, 
          direction: direction === 'up' ? 'super' : direction 
        }),
      });

      if (!response.ok) throw new Error(`Failed to process ${direction === 'up' ? 'super like' : 'swipe'}`);

      const result = await response.json();
      
      // If it's a match, show notification
      if (result.isMatch) {
        const matchedUser = matches[currentIndex];
        const userName = matchedUser.type === 'entrepreneur' 
          ? (matchedUser as Entrepreneur).projectName 
          : (matchedUser as Funder).name;
          
        toast({
          title: direction === 'up' ? "Super Match! ⭐" : "It's a Match! 🎉",
          description: `You matched with ${userName}`,
          duration: 5000,
        });
        
        if (matchedUser) {
          setSelectedMatch(matchedUser);
        }
      }

      // Fetch more matches if running low
      if (matches.length - currentIndex < 3) {
        fetchMatches();
      }
    } catch (error) {
      console.error('Swipe error:', error);
      toast({
        title: 'Error',
        description: `Failed to process ${direction === 'up' ? 'super like' : 'swipe'}`,
        variant: 'destructive'
      });
    }

    // Reset direction and advance to next card
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  // Mobile touch gestures for card swipe
  const MatchCard: React.FC<MatchCardProps> = ({ match, onSwipe, index, totalCards }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(
      x,
      [-200, -100, 0, 100, 200],
      [0.5, 1, 1, 1, 0.5]
    );

    // Visual indicators for swipe direction
    const likeScale = useTransform(x, [0, 125], [0.8, 1.1]);
    const nopeScale = useTransform(x, [-125, 0], [1.1, 0.8]);
    const superScale = useTransform(y, [0, -125], [0.8, 1.1]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeX = info.offset.x;
      const swipeY = info.offset.y;
      
      // Detect swipe direction
      if (Math.abs(swipeX) > SWIPE_THRESHOLD && Math.abs(swipeX) > Math.abs(swipeY)) {
        const direction = swipeX > 0 ? 'right' : 'left';
        controls.start({
          x: swipeX > 0 ? 1000 : -1000,
          opacity: 0,
          transition: { duration: 0.4 }
        });
        onSwipe(direction);
      } else if (swipeY < -SWIPE_THRESHOLD && Math.abs(swipeY) > Math.abs(swipeX)) {
        // Super like (swipe up)
        controls.start({
          y: -1000,
          opacity: 0,
          transition: { duration: 0.4 }
        });
        onSwipe('up');
      } else {
        controls.start({ x: 0, y: 0, transition: { type: 'spring' } });
      }
    };

    // Calculate card positions
    const zIndex = totalCards - index;
    const scale = 1 - 0.05 * index;
    const y = 10 * index;

    return (
      <motion.div
        ref={cardRef}
        style={{
          x,
          y: y,
          rotate,
          opacity,
          zIndex,
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
        drag={isMobile ? true : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ scale, y }}
        whileTap={{ scale: scale * 0.98 }}
        className="touch-none"
      >
        <motion.div
          className="w-full h-full rounded-xl overflow-hidden bg-white shadow-lg"
          style={{ scale }}
        >
          {/* Profile Image */}
          <div className="relative h-3/4">
            <img
              src={match.photo}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            
            {/* Swipe Indicators */}
            <motion.div
              style={{ scale: likeScale }}
              className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full"
            >
              <Check className="w-8 h-8" />
            </motion.div>
            
            <motion.div
              style={{ scale: nopeScale }}
              className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded-full"
            >
              <X className="w-8 h-8" />
            </motion.div>
            
            <motion.div
              style={{ scale: superScale }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white p-3 rounded-full"
            >
              <Star className="w-10 h-10" />
            </motion.div>

            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <h2 className="text-2xl font-bold text-white">
                {match.type === 'entrepreneur'
                  ? (match as Entrepreneur).projectName
                  : (match as Funder).name}
              </h2>
              <div className="flex items-center space-x-2 mt-2">
                <span className="px-2 py-1 bg-white/20 rounded-full text-white text-sm">
                  {match.industries?.[0]}
                </span>
                {match.industries?.length > 1 && (
                  <span className="px-2 py-1 bg-white/20 rounded-full text-white text-sm">
                    +{match.industries.length - 1} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-4 h-1/4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">
                {match.yearsExperience} years experience
              </span>
              {match.type === 'entrepreneur' && (
                <span className="font-medium">
                  Seeking: ${(match as Entrepreneur).desiredInvestment.amount.toLocaleString()}
                </span>
              )}
            </div>
            <TouchButton
              variant="ghost"
              fullWidth
              icon={<Info className="w-4 h-4" />}
              onClick={() => setSelectedMatch(match)}
              className="mt-1"
            >
              View Details
            </TouchButton>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Swipe Action Buttons
  const SwipeActions = () => (
    <div className="flex justify-center space-x-6">
      <button
        onClick={() => handleSwipe('left')}
        className="p-4 bg-white shadow-md rounded-full text-red-500 hover:bg-red-50 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <button
        onClick={() => handleSwipe('up')}
        className="p-4 bg-white shadow-md rounded-full text-blue-500 hover:bg-blue-50 transition-colors"
      >
        <Star className="w-6 h-6" />
      </button>
      <button
        onClick={() => handleSwipe('right')}
        className="p-4 bg-white shadow-md rounded-full text-green-500 hover:bg-green-50 transition-colors"
      >
        <Check className="w-6 h-6" />
      </button>
    </div>
  );

  // Swipe Direction Indicators
  const SwipeIndicators = () => (
    <AnimatePresence>
      {swipeDirection && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
        >
          {swipeDirection === 'right' && (
            <div className="bg-green-500 text-white p-6 rounded-full">
              <Check className="w-16 h-16" />
            </div>
          )}
          {swipeDirection === 'left' && (
            <div className="bg-red-500 text-white p-6 rounded-full">
              <X className="w-16 h-16" />
            </div>
          )}
          {swipeDirection === 'up' && (
            <div className="bg-blue-500 text-white p-6 rounded-full">
              <Star className="w-16 h-16" />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isLoading && matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600">Finding potential matches...</p>
      </div>
    );
  }

  if (matches.length === 0 || currentIndex >= matches.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center px-4">
        <h3 className="text-xl font-semibold mb-2">No More Matches</h3>
        <p className="text-gray-600 max-w-md">
          We're looking for more matches that meet your criteria. Check back soon!
        </p>
        <TouchButton 
          onClick={fetchMatches}
          className="mt-6"
        >
          Refresh Matches
        </TouchButton>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="relative h-[600px] mb-6">
        {/* Current visible cards */}
        {matches.slice(currentIndex, currentIndex + 3).map((match, index) => (
          <MatchCard
            key={match.id}
            match={match}
            index={index}
            totalCards={Math.min(3, matches.length - currentIndex)}
            onSwipe={(direction) => handleSwipe(direction)}
          />
        ))}
        
        {/* Swipe direction indicator */}
        <SwipeIndicators />
      </div>

      {/* Action buttons */}
      <SwipeActions />

      {/* Match Details Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title="Profile Details"
      >
        {selectedMatch && (
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={selectedMatch.photo}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h3 className="text-xl font-bold">
                  {selectedMatch.type === 'entrepreneur'
                    ? (selectedMatch as Entrepreneur).projectName
                    : (selectedMatch as Funder).name}
                </h3>
                <p className="text-gray-600">
                  {selectedMatch.type === 'entrepreneur' ? 'Entrepreneur' : 'Funder'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Industries</h4>
              <div className="flex flex-wrap gap-2">
                {selectedMatch.industries?.map(industry => (
                  <span
                    key={industry}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>

            {selectedMatch.type === 'entrepreneur' ? (
              <>
                <div>
                  <h4 className="font-medium mb-1">Investment Details</h4>
                  <p className="text-gray-600">
                    Seeking ${(selectedMatch as Entrepreneur).desiredInvestment.amount.toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    Timeline: {(selectedMatch as Entrepreneur).desiredInvestment.timeframe}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Project Description</h4>
                  <p className="text-gray-600">
                    {(selectedMatch as Entrepreneur).description || "No description provided."}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h4 className="font-medium mb-1">Investment Preferences</h4>
                  <p className="text-gray-600">
                    Available Funds: ${(selectedMatch as Funder).availableFunds.toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    Preferred Timeline: {(selectedMatch as Funder).investmentPreferences.timeframe}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Investment Focus</h4>
                  <p className="text-gray-600">
                    {(selectedMatch as Funder).investmentFocus || "No investment focus specified."}
                  </p>
                </div>
              </>
            )}

            <div className="flex space-x-4 pt-4">
              <TouchButton
                variant="secondary"
                fullWidth
                onClick={() => setSelectedMatch(null)}
              >
                Close
              </TouchButton>
              <TouchButton
                variant="primary"
                fullWidth
                onClick={() => {
                  // Start a conversation with this match
                  toast({
                    title: "Message Sent",
                    description: "We'll notify you when they respond.",
                  });
                  setSelectedMatch(null);
                }}
              >
                Message
              </TouchButton>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default MatchFeed;