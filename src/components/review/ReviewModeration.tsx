// src/components/reviews/ReviewModeration.tsx

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Flag, CheckCircle, XCircle } from 'lucide-react';

const ReviewModeration = () => {
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFlaggedReviews();
  }, []);

  const fetchFlaggedReviews = async () => {
    try {
      const response = await fetch('/api/reviews?status=FLAGGED');
      if (!response.ok) throw new Error('Failed to fetch flagged reviews');
      const data = await response.json();
      setFlaggedReviews(data.reviews);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeration = async (reviewId: string, action: 'DISMISS' | 'REMOVE') => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) throw new Error('Failed to moderate review');
      await fetchFlaggedReviews();
      setSelectedReview(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading flagged reviews...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Review Moderation</h1>
      
      <div className="space-y-4">
        {flaggedReviews.map(review => (
          <Card key={review.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="warning">Flagged</Badge>
                  <span className="text-sm text-gray-500">
                    {review.flags.length} reports
                  </span>
                </div>
                
                <StarRating value={review.rating} onChange={() => {}} size="small" />
                <p className="mt-2">{review.content}</p>
                
                <div className="mt-4 text-sm text-gray-500">
                  By {review.reviewer.name} • For {review.reviewed.name}
                </div>
              </div>

              <Button onClick={() => setSelectedReview(review)}>
                Review Flags
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Flag Review Dialog */}
      <Dialog open={!!selectedReview} onClose={() => setSelectedReview(null)}>
        {selectedReview && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Review Flags</h3>
            
            <div className="space-y-4 mb-6">
              {selectedReview.flags.map((flag, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Reason for flagging:</p>
                  <p className="text-gray-600">{flag.reason}</p>
                  <div className="text-sm text-gray-500 mt-1">
                    Reported by {flag.reporter.name} • 
                    {new Date(flag.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => handleModeration(selectedReview.id, 'DISMISS')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Dismiss Flags
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleModeration(selectedReview.id, 'REMOVE')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Remove Review
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ReviewModeration;