import React, { useState, useEffect } from 'react';
import { User, MessageCircle, Calendar, Briefcase, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Match {
  id: string;
  profile: {
    name?: string;
    projectName?: string;
    photo?: string;
    industries: string[];
    yearsExperience: number;
    businessType?: 'B2B' | 'B2C';
    desiredInvestment?: {
      amount: number;
      timeframe: string;
    };
  };
  compatibility: number;
  matchReasons: string[];
  matchedAt: string;
  status: 'pending' | 'active' | 'declined';
  lastMessage?: {
    content: string;
    timestamp: string;
  };
}

const MatchList = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches');
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError('Failed to load matches');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (matchId: string) => {
    // Navigate to chat with this match
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          All Matches
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Pending
        </button>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {filteredMatches.map(match => (
          <Card
            key={match.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedMatch(match)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                {match.profile.photo ? (
                  <img
                    src={match.profile.photo}
                    alt={match.profile.name || match.profile.projectName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="font-semibold">
                    {match.profile.name || match.profile.projectName}
                  </h3>
                  <div className="text-sm text-gray-600">
                    {match.profile.industries.join(', ')}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {match.compatibility}% Match
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm ${
                    match.status === 'active' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(match.matchedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Match Details Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMatch && (
            <>
              <DialogHeader>
                <DialogTitle>Match Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center space-x-4">
                  {selectedMatch.profile.photo ? (
                    <img
                      src={selectedMatch.profile.photo}
                      alt={selectedMatch.profile.name || selectedMatch.profile.projectName}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedMatch.profile.name || selectedMatch.profile.projectName}
                    </h2>
                    <div className="text-gray-600">
                      {selectedMatch.profile.industries.join(', ')}
                    </div>
                    <div className="mt-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {selectedMatch.compatibility}% Match
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span>Matched on {new Date(selectedMatch.matchedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5 text-gray-500" />
                      <span>{selectedMatch.profile.yearsExperience} years experience</span>
                    </div>
                    {selectedMatch.profile.businessType && (
                      <div className="flex items-center space-x-2">
                        <Award className="w-5 h-5 text-gray-500" />
                        <span>{selectedMatch.profile.businessType}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Why you matched</h3>
                    <ul className="space-y-2">
                      {selectedMatch.matchReasons.map((reason, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <span className="text-green-500 mr-2">✓</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleStartChat(selectedMatch.id)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Start Chat
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchList;