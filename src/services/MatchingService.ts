import axios from 'axios';

// Types for matching
export interface MatchScore {
  overall: number;
  industryFit: number;
  roleFit: number;
  investmentFit: number;
  locationFit: number;
  experienceFit: number;
}

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  matchedUser: {
    id: string;
    name: string;
    role: string;
    industry: string;
    location: string;
    profileImage?: string;
    verificationLevel: number;
  };
  score: MatchScore;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  initiatedBy: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  notes?: string;
}

export interface MatchFilters {
  status?: 'pending' | 'accepted' | 'rejected' | 'expired' | 'all';
  minScore?: number;
  industry?: string;
  role?: string;
  sortBy?: 'score' | 'date' | 'activity';
  sortDirection?: 'asc' | 'desc';
}

// Mock data for development
const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    userId: 'current-user',
    matchedUserId: 'u1',
    matchedUser: {
      id: 'u1',
      name: 'Sarah Chen',
      role: 'Investor',
      industry: 'Technology',
      location: 'San Francisco, CA',
      profileImage: '/avatars/sarah.jpg',
      verificationLevel: 3,
    },
    score: {
      overall: 92,
      industryFit: 95,
      roleFit: 100,
      investmentFit: 85,
      locationFit: 100,
      experienceFit: 80,
    },
    status: 'pending',
    initiatedBy: 'u1',
    createdAt: '2023-06-15T10:30:00Z',
    expiresAt: '2023-06-22T10:30:00Z',
    lastActivity: '2023-06-15T10:30:00Z',
  },
  {
    id: 'm2',
    userId: 'current-user',
    matchedUserId: 'u2',
    matchedUser: {
      id: 'u2',
      name: 'Michael Rodriguez',
      role: 'Mentor',
      industry: 'Finance',
      location: 'New York, NY',
      profileImage: '/avatars/michael.jpg',
      verificationLevel: 2,
    },
    score: {
      overall: 85,
      industryFit: 80,
      roleFit: 90,
      investmentFit: 70,
      locationFit: 90,
      experienceFit: 95,
    },
    status: 'accepted',
    initiatedBy: 'current-user',
    createdAt: '2023-06-10T14:20:00Z',
    expiresAt: '2023-06-17T14:20:00Z',
    lastActivity: '2023-06-12T09:45:00Z',
  },
  {
    id: 'm3',
    userId: 'current-user',
    matchedUserId: 'u3',
    matchedUser: {
      id: 'u3',
      name: 'Emily Johnson',
      role: 'Advisor',
      industry: 'Healthcare',
      location: 'Boston, MA',
      profileImage: '/avatars/emily.jpg',
      verificationLevel: 2,
    },
    score: {
      overall: 78,
      industryFit: 70,
      roleFit: 85,
      investmentFit: 80,
      locationFit: 75,
      experienceFit: 80,
    },
    status: 'rejected',
    initiatedBy: 'current-user',
    createdAt: '2023-06-05T11:15:00Z',
    expiresAt: '2023-06-12T11:15:00Z',
    lastActivity: '2023-06-07T16:30:00Z',
  },
  {
    id: 'm4',
    userId: 'current-user',
    matchedUserId: 'u4',
    matchedUser: {
      id: 'u4',
      name: 'David Kim',
      role: 'Investor',
      industry: 'Real Estate',
      location: 'Chicago, IL',
      profileImage: '/avatars/david.jpg',
      verificationLevel: 3,
    },
    score: {
      overall: 65,
      industryFit: 60,
      roleFit: 90,
      investmentFit: 75,
      locationFit: 50,
      experienceFit: 50,
    },
    status: 'expired',
    initiatedBy: 'u4',
    createdAt: '2023-05-20T09:00:00Z',
    expiresAt: '2023-05-27T09:00:00Z',
    lastActivity: '2023-05-20T09:00:00Z',
  },
  {
    id: 'm5',
    userId: 'current-user',
    matchedUserId: 'u5',
    matchedUser: {
      id: 'u5',
      name: 'Jessica Martinez',
      role: 'Entrepreneur',
      industry: 'Technology',
      location: 'Austin, TX',
      profileImage: '/avatars/jessica.jpg',
      verificationLevel: 1,
    },
    score: {
      overall: 88,
      industryFit: 95,
      roleFit: 75,
      investmentFit: 90,
      locationFit: 85,
      experienceFit: 95,
    },
    status: 'accepted',
    initiatedBy: 'u5',
    createdAt: '2023-06-01T15:45:00Z',
    expiresAt: '2023-06-08T15:45:00Z',
    lastActivity: '2023-06-14T11:20:00Z',
  },
];

class MatchingService {
  // Get all matches for the current user
  async getMatches(filters: MatchFilters = {}): Promise<Match[]> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.get('/api/matches', { params: filters });
      // return response.data;
      
      // For development, use mock data with filtering
      let filteredMatches = [...MOCK_MATCHES];
      
      // Apply filters
      if (filters.status && filters.status !== 'all') {
        filteredMatches = filteredMatches.filter(match => match.status === filters.status);
      }
      
      if (filters.minScore) {
        filteredMatches = filteredMatches.filter(match => match.score.overall >= filters.minScore!);
      }
      
      if (filters.industry) {
        filteredMatches = filteredMatches.filter(match => match.matchedUser.industry === filters.industry);
      }
      
      if (filters.role) {
        filteredMatches = filteredMatches.filter(match => match.matchedUser.role === filters.role);
      }
      
      // Apply sorting
      const sortBy = filters.sortBy || 'score';
      const sortDirection = filters.sortDirection || 'desc';
      
      filteredMatches.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'score':
            comparison = a.score.overall - b.score.overall;
            break;
          case 'date':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'activity':
            comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
      
      return filteredMatches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }
  
  // Get a specific match by ID
  async getMatchById(matchId: string): Promise<Match | null> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.get(`/api/matches/${matchId}`);
      // return response.data;
      
      // For development, use mock data
      const match = MOCK_MATCHES.find(m => m.id === matchId);
      return match || null;
    } catch (error) {
      console.error(`Error fetching match ${matchId}:`, error);
      throw error;
    }
  }
  
  // Accept a match
  async acceptMatch(matchId: string): Promise<Match> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.post(`/api/matches/${matchId}/accept`);
      // return response.data;
      
      // For development, update mock data
      const matchIndex = MOCK_MATCHES.findIndex(m => m.id === matchId);
      if (matchIndex === -1) {
        throw new Error(`Match ${matchId} not found`);
      }
      
      const updatedMatch = {
        ...MOCK_MATCHES[matchIndex],
        status: 'accepted' as const,
        lastActivity: new Date().toISOString(),
      };
      
      MOCK_MATCHES[matchIndex] = updatedMatch;
      return updatedMatch;
    } catch (error) {
      console.error(`Error accepting match ${matchId}:`, error);
      throw error;
    }
  }
  
  // Reject a match
  async rejectMatch(matchId: string): Promise<Match> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.post(`/api/matches/${matchId}/reject`);
      // return response.data;
      
      // For development, update mock data
      const matchIndex = MOCK_MATCHES.findIndex(m => m.id === matchId);
      if (matchIndex === -1) {
        throw new Error(`Match ${matchId} not found`);
      }
      
      const updatedMatch = {
        ...MOCK_MATCHES[matchIndex],
        status: 'rejected' as const,
        lastActivity: new Date().toISOString(),
      };
      
      MOCK_MATCHES[matchIndex] = updatedMatch;
      return updatedMatch;
    } catch (error) {
      console.error(`Error rejecting match ${matchId}:`, error);
      throw error;
    }
  }
  
  // Propose a new match with a user
  async proposeMatch(userId: string, notes?: string): Promise<Match> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.post('/api/matches', { userId, notes });
      // return response.data;
      
      // For development, create a mock match
      const newMatch: Match = {
        id: `m${MOCK_MATCHES.length + 1}`,
        userId: 'current-user',
        matchedUserId: userId,
        matchedUser: {
          id: userId,
          name: 'New Match User',
          role: 'Entrepreneur',
          industry: 'Technology',
          location: 'Remote',
          verificationLevel: 1,
        },
        score: {
          overall: 75,
          industryFit: 80,
          roleFit: 70,
          investmentFit: 75,
          locationFit: 65,
          experienceFit: 85,
        },
        status: 'pending',
        initiatedBy: 'current-user',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        lastActivity: new Date().toISOString(),
        notes,
      };
      
      MOCK_MATCHES.push(newMatch);
      return newMatch;
    } catch (error) {
      console.error(`Error proposing match with user ${userId}:`, error);
      throw error;
    }
  }
  
  // Get match recommendations based on user profile and preferences
  async getMatchRecommendations(limit: number = 5): Promise<Match[]> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.get('/api/matches/recommendations', { params: { limit } });
      // return response.data;
      
      // For development, return top matches that aren't already matched
      const pendingOrAccepted = MOCK_MATCHES.filter(
        m => m.status === 'pending' || m.status === 'accepted'
      ).map(m => m.matchedUserId);
      
      // In a real app, this would fetch potential matches from the server
      // For now, we'll create some mock recommendations
      const recommendations: Match[] = [
        {
          id: 'rec1',
          userId: 'current-user',
          matchedUserId: 'rec-u1',
          matchedUser: {
            id: 'rec-u1',
            name: 'Thomas Wright',
            role: 'Investor',
            industry: 'Technology',
            location: 'Seattle, WA',
            profileImage: '/avatars/thomas.jpg',
            verificationLevel: 3,
          },
          score: {
            overall: 91,
            industryFit: 95,
            roleFit: 90,
            investmentFit: 95,
            locationFit: 80,
            experienceFit: 95,
          },
          status: 'pending',
          initiatedBy: 'system',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date().toISOString(),
        },
        {
          id: 'rec2',
          userId: 'current-user',
          matchedUserId: 'rec-u2',
          matchedUser: {
            id: 'rec-u2',
            name: 'Olivia Parker',
            role: 'Advisor',
            industry: 'Finance',
            location: 'Chicago, IL',
            profileImage: '/avatars/olivia.jpg',
            verificationLevel: 2,
          },
          score: {
            overall: 87,
            industryFit: 80,
            roleFit: 95,
            investmentFit: 85,
            locationFit: 85,
            experienceFit: 90,
          },
          status: 'pending',
          initiatedBy: 'system',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date().toISOString(),
        },
        {
          id: 'rec3',
          userId: 'current-user',
          matchedUserId: 'rec-u3',
          matchedUser: {
            id: 'rec-u3',
            name: 'Robert Lee',
            role: 'Mentor',
            industry: 'Healthcare',
            location: 'Boston, MA',
            profileImage: '/avatars/robert.jpg',
            verificationLevel: 3,
          },
          score: {
            overall: 84,
            industryFit: 75,
            roleFit: 90,
            investmentFit: 80,
            locationFit: 85,
            experienceFit: 90,
          },
          status: 'pending',
          initiatedBy: 'system',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date().toISOString(),
        },
      ];
      
      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error fetching match recommendations:', error);
      throw error;
    }
  }
  
  // Calculate match score between two users
  calculateMatchScore(
    userProfile: any,
    otherUserProfile: any,
    userPreferences: any,
    otherUserPreferences: any
  ): MatchScore {
    // In a real app, this would be a complex algorithm
    // For now, we'll implement a simplified version
    
    // Industry fit (30%)
    const userIndustries = userProfile.interests || [];
    const otherUserIndustries = otherUserProfile.industry ? [otherUserProfile.industry] : [];
    const industryMatches = userIndustries.filter(i => otherUserIndustries.includes(i)).length;
    const industryFit = Math.min(100, (industryMatches / Math.max(1, userIndustries.length)) * 100);
    
    // Role fit (25%)
    const userRoles = userPreferences?.matching?.interestedInRoles || [];
    const otherUserRole = otherUserProfile.role;
    const roleFit = userRoles.includes(otherUserRole) ? 100 : 50;
    
    // Investment fit (20%)
    // This would compare investment ranges, deal types, etc.
    const investmentFit = 80; // Simplified for this example
    
    // Location fit (15%)
    const locationPreference = userPreferences?.matching?.locationPreference || 'anywhere';
    let locationFit = 100;
    
    if (locationPreference === 'local' && userProfile.location !== otherUserProfile.location) {
      locationFit = 50;
    } else if (locationPreference === 'regional') {
      // Simplified check - in a real app would check country/region
      locationFit = userProfile.location.split(',')[1] === otherUserProfile.location.split(',')[1] ? 100 : 70;
    }
    
    // Experience fit (10%)
    const experienceLevels = userPreferences?.matching?.experienceLevel || [];
    // Simplified - in a real app would map experience years to levels
    const experienceFit = experienceLevels.includes('expert') ? 90 : 80;
    
    // Calculate overall score with weights
    const overall = Math.round(
      (industryFit * 0.3) +
      (roleFit * 0.25) +
      (investmentFit * 0.2) +
      (locationFit * 0.15) +
      (experienceFit * 0.1)
    );
    
    return {
      overall,
      industryFit,
      roleFit,
      investmentFit,
      locationFit,
      experienceFit,
    };
  }
}

export const matchingService = new MatchingService();
export default matchingService; 