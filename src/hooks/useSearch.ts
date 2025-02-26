<<<<<<< HEAD
// src/hooks/useSearch.ts
import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { Entrepreneur, Funder } from '@/types/user';

export interface SearchFilters {
  industries: string[];
  investmentRange: [number, number];
  experienceYears: number;
  verificationLevel: string[];
  sortBy: 'relevance' | 'experience' | 'investment' | 'verification';
  sortDirection: 'asc' | 'desc';
}

interface UseSearchProps {
  initialFilters?: Partial<SearchFilters>;
  debounceMs?: number;
}

interface UseSearchResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  results: (Entrepreneur | Funder)[];
  isLoading: boolean;
  error: string | null;
  suggestions: string[];
  popularSearches: string[];
  performSearch: () => Promise<void>;
}

export const useSearch = ({
  initialFilters = {},
  debounceMs = 300
}: UseSearchProps = {}): UseSearchResult => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    industries: [],
    investmentRange: [0, 1000000],
    experienceYears: 0,
    verificationLevel: [],
    sortBy: 'relevance',
    sortDirection: 'desc',
    ...initialFilters
  });
  const [results, setResults] = useState<(Entrepreneur | Funder)[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, debounceMs);

  // Fetch popular searches on mount
  useEffect(() => {
    fetchPopularSearches();
  }, []);

  // Update suggestions when search term changes
  useEffect(() => {
    if (debouncedSearch) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch]);

  // Perform search when debounced term or filters change
  useEffect(() => {
    if (debouncedSearch) {
      performSearch();
    }
  }, [debouncedSearch, filters]);

  const performSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: searchTerm,
          filters
        })
      });

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filters]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(
        `/api/search/suggestions?term=${encodeURIComponent(debouncedSearch)}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const fetchPopularSearches = async () => {
    try {
      const response = await fetch('/api/search/popular');
      if (!response.ok) throw new Error('Failed to fetch popular searches');
      const data = await response.json();
      setPopularSearches(data);
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      setPopularSearches([]);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    results,
    isLoading,
    error,
    suggestions,
    popularSearches,
    performSearch
  };
};

// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
=======
[Previous useSearch hook content...]
>>>>>>> feature/security-implementation
