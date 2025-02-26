<<<<<<< HEAD
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Flag, Share2, Info } from 'lucide-react';
import { 
  SwipeableCard, 
  TouchButton, 
  TouchList, 
  TouchableOverlay,
  PullToRefresh 
} from '@/components/base/mobile';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Entrepreneur, Funder } from '@/types/user';

interface SearchResultsProps {
  results: (Entrepreneur | Funder)[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  onRefresh
}) => {
  const [selectedResult, setSelectedResult] = useState<Entrepreneur | Funder | null>(null);
  const [showActions, setShowActions] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleFlag = async (result: Entrepreneur | Funder) => {
    try {
      await fetch(`/api/users/${result.id}/flag`, { method: 'POST' });
      // Show success notification
    } catch (error) {
      console.error('Error flagging user:', error);
      // Show error notification
    }
    setShowActions(false);
  };

  const handleSave = async (result: Entrepreneur | Funder) => {
    try {
      await fetch(`/api/users/${result.id}/save`, { method: 'POST' });
      // Show success notification
    } catch (error) {
      console.error('Error saving user:', error);
      // Show error notification
    }
    setShowActions(false);
  };

  const handleShare = async (result: Entrepreneur | Funder) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: result.type === 'entrepreneur' 
            ? (result as Entrepreneur).projectName 
            : (result as Funder).name,
          text: 'Check out this profile on Launchify',
          url: `${window.location.origin}/profiles/${result.id}`
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Show error notification
        }
      }
    } else {
      // Fallback to copy link
      navigator.clipboard.writeText(`${window.location.origin}/profiles/${result.id}`);
      // Show success notification
    }
    setShowActions(false);
  };

  const ResultCard = ({ result }: { result: Entrepreneur | Funder }) => (
    <SwipeableCard
      onSwipeLeft={() => setShowActions(true)}
      onSwipeRight={() => handleSave(result)}
      leftAction={
        <div className="bg-red-500 text-white p-3 rounded-full">
          <Flag className="h-6 w-6" />
        </div>
      }
      rightAction={
        <div className="bg-yellow-500 text-white p-3 rounded-full">
          <Star className="h-6 w-6" />
        </div>
      }
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {result.type === 'entrepreneur'
                ? (result as Entrepreneur).projectName
                : (result as Funder).name}
            </h3>
            <p className="text-gray-600 text-sm">
              {result.type === 'entrepreneur' ? 'Entrepreneur' : 'Funder'}
            </p>
          </div>
          <TouchButton
            variant="ghost"
            size="small"
            icon={<Info className="h-5 w-5" />}
            onClick={() => setSelectedResult(result)}
            aria-label="View details"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(result.type === 'entrepreneur'
            ? (result as Entrepreneur).industries
            : (result as Funder).areasOfInterest
          ).map((industry) => (
            <span
              key={industry}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {industry}
            </span>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-baseline text-sm">
          <span className="text-gray-600">
            {result.yearsExperience} years experience
          </span>
          {result.type === 'entrepreneur' && (
            <span className="font-medium">
              Seeking: ${(result as Entrepreneur).desiredInvestment.amount.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </SwipeableCard>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-lg p-4 space-y-4"
          >
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
              <div className="h-6 w-24 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <PullToRefresh onRefresh={onRefresh}>
        <TouchList spacing="medium">
          {results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </TouchList>
      </PullToRefresh>

      {/* Result Details Modal */}
      <TouchableOverlay
        isOpen={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        position="bottom"
      >
        {selectedResult && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedResult.type === 'entrepreneur'
                    ? (selectedResult as Entrepreneur).projectName
                    : (selectedResult as Funder).name}
                </h2>
                <p className="text-gray-600">
                  {selectedResult.type === 'entrepreneur' ? 'Entrepreneur' : 'Funder'}
                </p>
              </div>
              <div className="flex gap-2">
                <TouchButton
                  variant="ghost"
                  size="small"
                  icon={<Share2 className="h-5 w-5" />}
                  onClick={() => handleShare(selectedResult)}
                  aria-label="Share profile"
                />
                <TouchButton
                  variant="ghost"
                  size="small"
                  icon={<Star className="h-5 w-5" />}
                  onClick={() => handleSave(selectedResult)}
                  aria-label="Save profile"
                />
              </div>
            </div>

            {/* Detailed profile information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Industries</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(selectedResult.type === 'entrepreneur'
                    ? (selectedResult as Entrepreneur).industries
                    : (selectedResult as Funder).areasOfInterest
                  ).map((industry) => (
                    <span
                      key={industry}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Experience</h3>
                <p className="mt-1 text-gray-600">
                  {selectedResult.yearsExperience} years in industry
                </p>
              </div>

              {selectedResult.type === 'entrepreneur' ? (
                <div>
                  <h3 className="font-medium text-gray-900">Investment Details</h3>
                  <div className="mt-1 space-y-1 text-gray-600">
                    <p>
                      Seeking: ${(selectedResult as Entrepreneur).desiredInvestment.amount.toLocaleString()}
                    </p>
                    <p>
                      Timeline: {(selectedResult as Entrepreneur).desiredInvestment.timeframe}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-medium text-gray-900">Investment Preferences</h3>
                  <div className="mt-1 space-y-1 text-gray-600">
                    <p>
                      Available Funds: ${(selectedResult as Funder).availableFunds.toLocaleString()}
                    </p>
                    <p>
                      Preferred Timeline: {(selectedResult as Funder).investmentPreferences.timeframe}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <TouchButton
                variant="secondary"
                fullWidth
                onClick={() => setSelectedResult(null)}
              >
                Close
              </TouchButton>
              <TouchButton
                variant="primary"
                fullWidth
                onClick={() => {
                  // Handle contact/connect action
                  setSelectedResult(null);
                }}
              >
                Connect
              </TouchButton>
            </div>
          </div>
        )}
      </TouchableOverlay>

      {/* Actions Bottom Sheet */}
      <TouchableOverlay
        isOpen={showActions}
        onClose={() => setShowActions(false)}
        position="bottom"
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>
          <TouchList spacing="small">
            <TouchButton
              variant="ghost"
              fullWidth
              icon={<Star className="h-5 w-5" />}
              onClick={() => selectedResult && handleSave(selectedResult)}
            >
              Save Profile
            </TouchButton>
            <TouchButton
              variant="ghost"
              fullWidth
              icon={<Share2 className="h-5 w-5" />}
              onClick={() => selectedResult && handleShare(selectedResult)}
            >
              Share Profile
            </TouchButton>
            <TouchButton
              variant="ghost"
              fullWidth
              icon={<Flag className="h-5 w-5" />}
              onClick={() => selectedResult && handleFlag(selectedResult)}
              className="text-red-600"
            >
              Report Profile
            </TouchButton>
          </TouchList>
        </div>
      </TouchableOverlay>
    </>
  );
};

export default SearchResults;
=======
// Content of mobile-optimized SearchResults.tsx as shown above
>>>>>>> feature/security-implementation
