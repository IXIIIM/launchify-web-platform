import React, { useState } from 'react';
import { Star, Flag, ThumbsUp, AlertCircle } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface ReviewData {
  rating: number;
  categories: {
    communication: number;
    reliability: number;
    expertise: number;
    professionalism: number;
  };
  content?: string;
}

const ReviewForm = ({ onSubmit, onCancel }) => {
  const [reviewData, setReviewData] = useState<ReviewData>({
    rating: 0,
    categories: {
      communication: 0,
      reliability: 0,
      expertise: 0,
      professionalism: 0
    }
  });
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reviewData.rating === 0) {
      setError('Please provide an overall rating');
      return;
    }

    const hasEmptyCategory = Object.values(reviewData.categories).some(v => v === 0);
    if (hasEmptyCategory) {
      setError('Please rate all categories');
      return;
    }

    onSubmit({ ...reviewData, content });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">{error}</Alert>
      )}

      {/* Overall Rating */}
      <div>
        <label className="block font-medium mb-2">Overall Rating</label>
        <StarRating
          value={reviewData.rating}
          onChange={rating => setReviewData(prev => ({ ...prev, rating }))}
        />
      </div>

      {/* Category Ratings */}
      <div className="space-y-4">
        <label className="block font-medium">Category Ratings</label>
        {Object.entries(reviewData.categories).map(([category, value]) => (
          <div key={category} className="flex items-center justify-between">
            <span className="capitalize">{category}</span>
            <StarRating
              value={value}
              onChange={rating => setReviewData(prev => ({
                ...prev,
                categories: {
                  ...prev.categories,
                  [category]: rating
                }
              }))}
            />
          </div>
        ))}
      </div>

      {/* Review Content */}
      <div>
        <label className="block font-medium mb-2">Comments (Optional)</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full rounded-md border-gray-300 h-32"
          placeholder="Share your experience..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Submit Review
        </Button>
      </div>
    </form>
  );
};

const StarRating = ({ value, onChange, size = 'default' }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`focus:outline-none ${
            size === 'small' ? 'p-1' : 'p-2'
          }`}
        >
          <Star
            className={`${
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${size === 'small' ? 'w-4 h-4' : 'w-6 h-6'}`}
          />
        </button>
      ))}
    </div>
  );
};

export default ReviewForm;