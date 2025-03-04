import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Star, Flag, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Review {
  id: string;
  rating: number;
  categories: {
    communication: number;
    reliability: number;
    expertise: number;
    professionalism: number;
  };
  content?: string;
  reviewer: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
}

const ReviewList = ({ userId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reportDialog, setReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (reviewId: string, reason: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) throw new Error('Failed to report review');
      setReportDialog(false);
      setReportReason('');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to report review');
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading reviews...</div>;
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <Card key={review.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <StarRating value={review.rating} readOnly size="small" />
                <span className="text-sm text-gray-500">
                  by {review.reviewer.name}
                </span>
              </div>
              
              {review.content && (
                <p className="mt-2 text-gray-700">{review.content}</p>
              )}
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                {Object.entries(review.categories).map(([category, rating]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">{category}</span>
                    <StarRating value={rating} readOnly size="small" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedReview(review);
                  setReportDialog(true);
                }}
                className="p-2 text-gray-400 hover:text-red-500 rounded-full"
              >
                <Flag className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedReview(review)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-500">
            {new Date(review.createdAt).toLocaleDateString()}
          </div>
        </Card>
      ))}

      {/* Report Dialog */}
      <Dialog open={reportDialog} onOpenChange={() => setReportDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Review</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a reason...</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="spam">Spam or misleading</option>
              <option value="fake">Fake review</option>
              <option value="other">Other</option>
            </select>

            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={() => setReportDialog(false)}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedReview && handleReport(selectedReview.id, reportReason)}
                disabled={!reportReason}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-gray-400"
              >
                Report
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview && !reportDialog} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          {selectedReview && (
            <>
              <DialogHeader>
                <DialogTitle>Review Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{selectedReview.reviewer.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedReview.reviewer.type}
                    </p>
                  </div>
                  <StarRating value={selectedReview.rating} readOnly />
                </div>

                {selectedReview.content && (
                  <div>
                    <h4 className="font-medium mb-2">Review</h4>
                    <p className="text-gray-700">{selectedReview.content}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Category Ratings</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedReview.categories).map(([category, rating]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="capitalize">{category}</span>
                        <StarRating value={rating} readOnly size="small" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Posted on {new Date(selectedReview.createdAt).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewList;