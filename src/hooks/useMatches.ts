import { useState, useEffect, useCallback } from 'react';
import matchingService, { Match, MatchFilters } from '../services/MatchingService';

interface UseMatchesReturn {
  matches: Match[];
  loading: boolean;
  error: Error | null;
  recommendations: Match[];
  recommendationsLoading: boolean;
  activeMatch: Match | null;
  filters: MatchFilters;
  setFilters: (filters: MatchFilters) => void;
  acceptMatch: (matchId: string) => Promise<void>;
  rejectMatch: (matchId: string) => Promise<void>;
  proposeMatch: (userId: string, notes?: string) => Promise<void>;
  viewMatch: (matchId: string) => Promise<void>;
  clearActiveMatch: () => void;
  refreshMatches: () => Promise<void>;
}

export const useMatches = (): UseMatchesReturn => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [recommendations, setRecommendations] = useState<Match[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState<boolean>(true);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [filters, setFilters] = useState<MatchFilters>({
    status: 'all',
    sortBy: 'score',
    sortDirection: 'desc',
  });

  // Fetch matches based on current filters
  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await matchingService.getMatches(filters);
      setMatches(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch match recommendations
  const fetchRecommendations = useCallback(async () => {
    try {
      setRecommendationsLoading(true);
      const data = await matchingService.getMatchRecommendations(3);
      setRecommendations(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchMatches();
    fetchRecommendations();
  }, [fetchMatches, fetchRecommendations]);

  // Accept a match
  const acceptMatch = async (matchId: string) => {
    try {
      const updatedMatch = await matchingService.acceptMatch(matchId);
      
      // Update matches list
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === matchId ? updatedMatch : match
        )
      );
      
      // Update active match if it's the one being accepted
      if (activeMatch && activeMatch.id === matchId) {
        setActiveMatch(updatedMatch);
      }
    } catch (err) {
      console.error(`Error accepting match ${matchId}:`, err);
      throw err;
    }
  };

  // Reject a match
  const rejectMatch = async (matchId: string) => {
    try {
      const updatedMatch = await matchingService.rejectMatch(matchId);
      
      // Update matches list
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === matchId ? updatedMatch : match
        )
      );
      
      // Update active match if it's the one being rejected
      if (activeMatch && activeMatch.id === matchId) {
        setActiveMatch(updatedMatch);
      }
    } catch (err) {
      console.error(`Error rejecting match ${matchId}:`, err);
      throw err;
    }
  };

  // Propose a new match
  const proposeMatch = async (userId: string, notes?: string) => {
    try {
      const newMatch = await matchingService.proposeMatch(userId, notes);
      
      // Add the new match to the list
      setMatches(prevMatches => [newMatch, ...prevMatches]);
      
      // Set as active match
      setActiveMatch(newMatch);
    } catch (err) {
      console.error(`Error proposing match with user ${userId}:`, err);
      throw err;
    }
  };

  // View a specific match
  const viewMatch = async (matchId: string) => {
    try {
      const match = await matchingService.getMatchById(matchId);
      if (match) {
        setActiveMatch(match);
      } else {
        console.error(`Match ${matchId} not found`);
      }
    } catch (err) {
      console.error(`Error viewing match ${matchId}:`, err);
      throw err;
    }
  };

  // Clear the active match
  const clearActiveMatch = () => {
    setActiveMatch(null);
  };

  // Refresh matches data
  const refreshMatches = async () => {
    await fetchMatches();
    await fetchRecommendations();
  };

  return {
    matches,
    loading,
    error,
    recommendations,
    recommendationsLoading,
    activeMatch,
    filters,
    setFilters,
    acceptMatch,
    rejectMatch,
    proposeMatch,
    viewMatch,
    clearActiveMatch,
    refreshMatches,
  };
};

export default useMatches; 