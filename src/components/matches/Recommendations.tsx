import React, { useState, useEffect } from 'react';
import { RefreshCw, ThumbsUp, Eye, Flag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Recommendation {
  user: {
    id: string;
    name?: string;
    projectName?: string;
    photo?: string;
    industries: string[];
    yearsExperience: number;
  };
  score: number;
  reasons: string[];
}

const MatchRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/matches/recommendations');
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError('Failed to load recommendations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/matches/recommendations/refresh');
      if (!response.ok) throw new Error('Failed to refresh recommendations');
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError('Failed to refresh recommendations');
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleHide = async (userId: string) => {
    try {
      const response = await fetch('/api/matches/recommendations/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) throw new Error('Failed to hide recommendation');
      
      const { replacement } = await response.json();
      setRecommendations(prev => 
        prev.map(rec => rec.user.id === userId ? replacement : rec)
      );
    } catch (err) {
      setError('Failed to hide recommendation');
      console.error(err);
    }
  };

  const handleReport = async () => {
    if (!selectedRecommendation) return;

    try {
      const response = await fetch('/api/matches/recommendations/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedRecommendation.user.id,
          reason: reportReason
        })
      });

      if (!response.ok) throw new Error('Failed to report recommendation');
      
      const { replacement } = await response.json();
      setRecommendations(prev => 
        prev.map(rec => rec.user.id === selectedRecommendation.user.id ? replacement : rec)
      );
      
      setReportDialogOpen(false);
      setSelectedRecommendation(null);
      setReportReason('');
    } catch (err) {
      setError('Failed to report recommendation');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recommended Matches</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {recommendations.map((recommendation) => (
            <motion.div
              key={recommendation.user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader className="relative">
                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      onClick={() => handleHide(recommendation.user.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRecommendation(recommendation);
                        setReportDialogOpen(true);
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Profile Photo */}
                  <div className="relative w-24 h-24 mx-auto">
                    {recommendation.user.photo ? (
                      <img
                        src={recommendation.user.photo}
                        alt={recommendation.user.name || recommendation.user.projectName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                        <Eye className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2">
                      <ThumbsUp className="w-4 h-4" />
                    </div>
                  </div>

                  <CardTitle className="text-center mt-4">
                    {recommendation.user.name || recommendation.user.projectName}
                  </CardTitle>
                  <div className="text-center text-sm text-gray-500">
                    {recommendation.user.industries.join(' • ')}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Match Score */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Match Score</span>
                      <span className="text-sm font-bold text-blue-600">
                        {Math.round(recommendation.score)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 rounded-full h-2"
                        style={{ width: `${recommendation.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Reasons */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Why you might match</h4>
                    <ul className="space-y-1">
                      {recommendation.reasons.map((reason, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <span className="text-green-500 mr-2">✓</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Recommendation</DialogTitle>
            <DialogDescription>
              Please tell us why you want to report this recommendation
            </DialogDescription>
          </DialogHeader>

          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Select a reason...</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="spam">Spam or misleading</option>
            <option value="fake">Fake profile</option>
            <option value="other">Other</option>
          </select>

          <DialogFooter>
            <button
              onClick={() => setReportDialogOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleReport}
              disabled={!reportReason}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              Report
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchRecommendations;